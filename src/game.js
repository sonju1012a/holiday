// ===================================================================
// 게임 로직 — 준비 6단계 → 진설 5열(1열부터 순서 강제) → 완성
// ===================================================================
import * as THREE from 'three';
import { RULES, SETUP_STEPS, MODES, TABLE_TOP_Y, TABLE_CENTER_Z } from './data.js';
import { buildModel } from './models.js';
import { iconFor } from './icons.js';

const SNAP_DIST = 0.55; // 슬롯 흡착 판정 거리

export class Game {
  constructor(world, ui, shop, sfx) {
    this.world = world;
    this.ui = ui;
    this.shop = shop;
    this.sfx = sfx;

    this.phase = 'intro';          // intro | setup | food | done
    this.setupIdx = 0;
    this.rowIdx = 0;
    this.score = 0;
    this.placedCount = 0;
    this.wrongCounts = {};         // itemId -> 오답 횟수
    this.selectedId = null;

    this.ghost = null;
    this.ghostValid = false;
    this.zoneMarker = null;
    this.slotMarkers = new Map();  // itemId -> ring mesh
    this.filled = new Set();
    this.tweens = [];
    this.camTween = null;

    this.raycaster = new THREE.Raycaster();
    this.pointerNdc = new THREE.Vector2();
    this.movePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.hitPoint = new THREE.Vector3();

    this.mode = MODES.trad;
    this.rows = this.mode.rows;
    this.placedIds = new Set();   // 배치 완료한 음식 id
    this.tabooCaught = 0;         // 금기 음식을 잘못 고른 횟수

    this._bindPointer();
    world.setTick((dt) => this._tick(dt));
  }

  // ================= 입력 =================
  _bindPointer() {
    const el = this.world.renderer.domElement;
    let downX = 0, downY = 0;
    const setNdc = (e) => {
      this.pointerNdc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    };
    // 터치 기기는 hover(pointermove)가 없으므로 down/up 시점에도 반드시 좌표 갱신
    el.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; setNdc(e); });
    el.addEventListener('pointerup', (e) => {
      setNdc(e);
      // 탭(이동 10px 미만)만 배치로 처리 — 드래그는 카메라 회전
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 10) this._onClick();
    });
    el.addEventListener('pointermove', setNdc);
  }

  _raycastPlane() {
    this.raycaster.setFromCamera(this.pointerNdc, this.world.camera);
    return this.raycaster.ray.intersectPlane(this.movePlane, this.hitPoint) ? this.hitPoint : null;
  }

  // ================= 시작/단계 전환 =================
  start(modeKey = 'trad') {
    this.mode = MODES[modeKey] || MODES.trad;
    this.rows = this.mode.rows;
    // 음식(진짜 제수) + 금기 함정 카드를 열 순서대로 트레이에 배열
    this.foodItems = this.rows.flatMap((r) => r.items.map((it) => ({ ...it, row: r.row, z: r.z })));
    this.trayItems = this.rows.flatMap((r) => [
      ...r.items.map((it) => ({ ...it, row: r.row })),
      ...(r.taboos || []).map((t) => ({ ...t, row: r.row, taboo: true })),
    ]);
    this.totalFood = this.foodItems.length;
    this.maxScore = SETUP_STEPS.length * 50 + this.totalFood * 100;
    this.ui.buildStepper(this.rows);
    this.phase = 'setup';
    this.setupIdx = 0;
    this._beginSetupStep();
  }

  _beginSetupStep() {
    const step = SETUP_STEPS[this.setupIdx];
    this.ui.setStep(`setup:${step.id}`);
    this.ui.setStageLabel(`준비 ${this.setupIdx + 1}/${SETUP_STEPS.length} · ${step.name}`);
    this.ui.banner(step.guide);
    this.ui.trayHint('빛나는 자리를 눌러 놓아주세요');
    this.ui.renderTray([{ id: step.id, name: step.name, emoji: step.emoji, icon: iconFor(step.model), sub: '준비물' }], () => {});
    this.ui.markSelected(step.id);

    // 이동 평면 + 존 마커
    if (step.id === 'jibang') {
      this.movePlane.set(new THREE.Vector3(0, 0, 1), 2.5); // z = -2.5 수직면
      this._makeZoneMarker(step, true);
      this._tweenCam([0, 2.3, 1.6], [0, 1.5, -2.6]);
    } else if (step.id === 'chotdae') {
      this.movePlane.set(new THREE.Vector3(0, 1, 0), -TABLE_TOP_Y);
      this._makeZoneMarker(step, false);
      this._tweenCam([0, 4.0, 4.8], [0, 0.85, -0.8]);
    } else {
      this.movePlane.set(new THREE.Vector3(0, 1, 0), 0);
      this._makeZoneMarker(step, false);
      this._tweenCam([0, 4.6, 6.6], [0, 0.85, -0.7]);
    }

    // 고스트 생성
    this._setGhost(buildModel(step.model));
    this.sfx.select();
  }

  _beginFoodPhase() {
    this.phase = 'food';
    this.rowIdx = 0;
    this.movePlane.set(new THREE.Vector3(0, 1, 0), -TABLE_TOP_Y);
    this.ui.renderTray(
      this.trayItems.map((it) => ({ ...it, icon: it.taboo ? null : iconFor(it.model) })),
      (id) => this._onTraySelect(id)
    );
    this._beginRow();
  }

  _beginRow() {
    const row = this.rows[this.rowIdx];
    this.ui.setStep(`row:${row.row}`);
    this.ui.banner(row.guide, row.rules);
    this.ui.trayHint(this.mode.free
      ? `${row.row}열 음식을 골라 빈 자리 아무 곳에나 놓으세요 (배치 자유!)`
      : `${row.row}열 음식을 골라 상 위의 빛나는 자리에 놓으세요 (${row.row}열부터 차례대로!)`);
    this._updateTrayLocks();
    this._makeSlotMarkers(row);
    this.shop.recommend(row.shopKey || `row${row.row}`);
    const rowZ = TABLE_CENTER_Z + row.z;
    this._tweenCam([0, 3.6 + row.row * 0.12, rowZ + 3.9], [0, TABLE_TOP_Y, rowZ]);
    this.selectedId = null;
    this.ui.markSelected(null);
    this._clearGhost();
  }

  _updateTrayLocks() {
    const row = this.rows[this.rowIdx];
    this.trayItems.forEach((it) => {
      const card = this.ui.cards[it.id];
      if (!card || card.classList.contains('placed')) return;
      card.classList.toggle('locked', it.row !== row.row);
    });
  }

  _onTraySelect(id) {
    if (this.phase !== 'food') return;
    const item = this.trayItems.find((i) => i.id === id);
    if (!item || this.placedIds.has(id)) return;
    const row = this.rows[this.rowIdx];
    if (item.row !== row.row) {
      this.sfx.wrong();
      this.ui.shakeCard(id);
      this.ui.eduToast('아직이에요!', `지금은 ${row.row}열 차례입니다. 열 순서대로 정성껏 올려요.`);
      return;
    }
    // 금기 음식 함정!
    if (item.taboo) {
      this.tabooCaught += 1;
      this.score = Math.max(0, this.score - 30);
      this.ui.setScore(this.score);
      this.sfx.wrong();
      this.ui.shakeCard(id);
      this.ui.eduToast(`🚫 ${item.name}은(는) 올리면 안 돼요! -30점`, item.desc);
      this.ui.markTaboo(id);
      return;
    }
    this.selectedId = id;
    this.ui.markSelected(id);
    this.sfx.select();
    this._setGhost(buildModel(item.model));
  }

  // ================= 클릭 처리 =================
  _onClick() {
    if (this.phase === 'setup') this._trySetupPlace();
    else if (this.phase === 'food') this._tryFoodPlace();
  }

  _trySetupPlace() {
    if (!this.ghost) return;
    const step = SETUP_STEPS[this.setupIdx];
    const p = this._raycastPlane();
    if (!p) return;
    const target = new THREE.Vector3(...step.pos);
    const dist = step.id === 'jibang'
      ? Math.hypot(p.x - target.x, p.y - target.y)
      : Math.hypot(p.x - target.x, p.z - target.z);
    if (dist > step.zone) {
      this.sfx.wrong();
      this.ui.banner(step.guide + '<br/><b>빛나는 자리</b>를 눌러 주세요!');
      return;
    }
    // 배치 확정
    this._clearGhost();
    this._removeZoneMarker();
    const model = buildModel(step.model);
    model.position.set(...step.pos);
    this.world.scene.add(model);
    if (model.userData.tick) this.world.registerAnimatable(model);
    this._popIn(model);
    this.sfx.place();
    this.score += 50;
    this.ui.setScore(this.score);
    this.ui.eduToast(step.edu.title, step.edu.body);
    this.shop.recommend(step.shop);

    this.setupIdx += 1;
    if (this.setupIdx < SETUP_STEPS.length) {
      setTimeout(() => this._beginSetupStep(), 600);
    } else {
      setTimeout(() => this._beginFoodPhase(), 800);
    }
  }

  _tryFoodPlace() {
    if (!this.selectedId || !this.ghost) return;
    const p = this._raycastPlane();
    if (!p) return;
    const row = this.rows[this.rowIdx];
    // 가장 가까운 빈 슬롯 찾기
    let best = null, bestD = SNAP_DIST;
    row.items.forEach((slot) => {
      if (this.filled.has(slot.id)) return;
      const sx = slot.x, sz = TABLE_CENTER_Z + row.z;
      const d = Math.hypot(p.x - sx, p.z - sz);
      if (d < bestD) { best = slot; bestD = d; }
    });
    if (!best) return; // 슬롯 밖 클릭은 무시 (카메라 조작일 수 있음)

    const selected = this.foodItems.find((i) => i.id === this.selectedId);
    // 자유 배치 모드(성균관·간편)에서는 같은 열이면 어느 빈 자리든 정답
    if (!this.mode.free && best.id !== this.selectedId) {
      // 오답
      this.wrongCounts[this.selectedId] = (this.wrongCounts[this.selectedId] || 0) + 1;
      this.sfx.wrong();
      this._flashSlot(best.id);
      const ruleNames = row.rules.map((k) => RULES[k].name).join(', ');
      this.ui.eduToast(
        `그 자리는 ${best.name} 자리예요!`,
        `${selected.desc} (참고: ${ruleNames})`
      );
      return;
    }

    // 정답 배치
    const wrong = this.wrongCounts[this.selectedId] || 0;
    const gained = Math.max(100 - wrong * 20, 20);
    this.score += gained;
    this.placedCount += 1;
    this.filled.add(best.id);
    this.placedIds.add(this.selectedId);
    this.ui.setScore(this.score);
    this.ui.markPlaced(this.selectedId);
    this._removeSlotMarker(best.id);
    this._clearGhost();
    this.selectedId = null;

    const model = buildModel(selected.model);
    model.position.set(best.x, TABLE_TOP_Y, TABLE_CENTER_Z + row.z);
    this.world.scene.add(model);
    this._popIn(model);
    wrong === 0 ? this.sfx.correct() : this.sfx.place();
    this.ui.eduToast(`${selected.name} — 정답! +${gained}점`, selected.desc);
    this.ui.setStageLabel(`진설 ${this.placedCount}/${this.totalFood} · ${row.row}열`);

    // 열 완료 체크
    const rowDone = row.items.every((s) => this.filled.has(s.id));
    if (rowDone) {
      this.rowIdx += 1;
      if (this.rowIdx < this.rows.length) {
        this.sfx.rowClear();
        setTimeout(() => this._beginRow(), 900);
      } else {
        setTimeout(() => this._complete(), 1000);
      }
    }
  }

  // ================= 완성 =================
  _complete() {
    this.phase = 'done';
    this.ui.finishStepper();
    this.ui.setStageLabel('차례상 완성!');
    this.ui.clearTray();
    this.ui.trayHint('');
    this.$hideBanner();
    this.sfx.fanfare();
    this.world.controls.autoRotate = true;
    this.world.controls.autoRotateSpeed = 0.7;
    this._tweenCam([0, 4.8, 6.2], [0, 0.9, -0.9]);

    const wrongTotal = Object.values(this.wrongCounts).reduce((a, b) => a + b, 0);
    const ratio = this.score / this.maxScore;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : 1;
    const tabooLine = this.tabooCaught > 0
      ? `금기 음식 실수: ${this.tabooCaught}회 — 복숭아·팥·매운 양념·마늘은 기억해요!`
      : '금기 음식을 하나도 올리지 않았어요. 훌륭해요! 👏';
    const summary = `
      <b>오늘 배운 것 — ${this.mode.label}</b><br/>
      ${this.mode.summary}<br/>
      <span style="color:#8a7050">틀린 횟수: ${wrongTotal}회 · ${tabooLine}</span>`;

    this.shop.fillGiftSet(); // 쇼핑 미참여 시 선물세트 추천
    setTimeout(() => {
      this.ui.showComplete({ score: this.score, maxScore: this.maxScore, summary, stars });
    }, 1600);
  }

  $hideBanner() { document.getElementById('guide-banner').classList.add('hidden'); }

  // ================= 고스트 / 마커 =================
  _setGhost(model) {
    this._clearGhost();
    model.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.transparent = true;
        o.material.opacity = 0.55;
        o.material.depthWrite = false;
        o.castShadow = false;
      }
    });
    this.ghost = model;
    this.world.scene.add(model);
  }
  _clearGhost() {
    if (this.ghost) { this.world.scene.remove(this.ghost); this.ghost = null; }
  }

  _makeZoneMarker(step, vertical) {
    this._removeZoneMarker();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(step.zone * 0.55, step.zone * 0.62, 48),
      new THREE.MeshBasicMaterial({ color: 0xffd070, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    if (vertical) {
      ring.position.set(step.pos[0], step.pos[1], step.pos[2] + 0.08);
    } else {
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(step.pos[0], (step.pos[1] || 0) + 0.015, step.pos[2]);
      if (step.id === 'chotdae') ring.position.y = TABLE_TOP_Y + 0.015;
    }
    ring.userData.pulse = true;
    this.zoneMarker = ring;
    this.world.scene.add(ring);
  }
  _removeZoneMarker() {
    if (this.zoneMarker) { this.world.scene.remove(this.zoneMarker); this.zoneMarker = null; }
  }

  _makeSlotMarkers(row) {
    this._clearSlotMarkers();
    row.items.forEach((slot) => {
      if (this.filled.has(slot.id)) return;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.19, 0.24, 36),
        new THREE.MeshBasicMaterial({ color: 0xffd070, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(slot.x, TABLE_TOP_Y + 0.012, TABLE_CENTER_Z + row.z);
      ring.userData.pulse = true;
      this.slotMarkers.set(slot.id, ring);
      this.world.scene.add(ring);
    });
  }
  _removeSlotMarker(id) {
    const m = this.slotMarkers.get(id);
    if (m) { this.world.scene.remove(m); this.slotMarkers.delete(id); }
  }
  _clearSlotMarkers() {
    this.slotMarkers.forEach((m) => this.world.scene.remove(m));
    this.slotMarkers.clear();
  }
  _flashSlot(id) {
    const m = this.slotMarkers.get(id);
    if (!m) return;
    m.material.color.set(0xe04030);
    setTimeout(() => m.material.color.set(0xffd070), 500);
  }

  // ================= 애니메이션 =================
  _popIn(obj) {
    obj.scale.setScalar(0.5);
    const targetY = obj.position.y;
    obj.position.y = targetY + 0.35;
    this.tweens.push({ obj, targetY, t: 0, dur: 0.32 });
  }

  _tweenCam(camPos, target, dur = 1.1) {
    // 세로 화면(모바일)에서는 상이 다 보이도록 카메라를 뒤로 당김
    const aspect = window.innerWidth / window.innerHeight;
    const toPos = new THREE.Vector3(...camPos);
    const toTarget = new THREE.Vector3(...target);
    if (aspect < 0.9) {
      const k = Math.min(1.55, 1 + (0.9 - aspect) * 0.95);
      toPos.sub(toTarget).multiplyScalar(k).add(toTarget);
    }
    this.camTween = {
      fromPos: this.world.camera.position.clone(),
      toPos,
      fromTarget: this.world.controls.target.clone(),
      toTarget,
      t: 0, dur,
    };
  }

  _tick(dt) {
    const t = performance.now() / 1000;
    // 고스트 따라다니기
    if (this.ghost) {
      const p = this._raycastPlane();
      if (p) {
        if (this.phase === 'setup' && SETUP_STEPS[this.setupIdx]?.id === 'jibang') {
          this.ghost.position.set(p.x, p.y, -2.52);
        } else {
          this.ghost.position.set(p.x, -this.movePlane.constant, p.z);
        }
      }
    }
    // 마커 펄스
    const pulse = 0.8 + Math.sin(t * 4.2) * 0.2;
    if (this.zoneMarker) { this.zoneMarker.scale.setScalar(pulse); this.zoneMarker.material.opacity = 0.5 + Math.sin(t * 4.2) * 0.3; }
    this.slotMarkers.forEach((m) => { m.scale.setScalar(pulse); m.material.opacity = 0.45 + Math.sin(t * 4.2) * 0.28; });

    // 배치 팝 트윈
    this.tweens = this.tweens.filter((tw) => {
      tw.t += dt;
      const k = Math.min(tw.t / tw.dur, 1);
      const e = 1 - Math.pow(1 - k, 3);
      tw.obj.scale.setScalar(0.5 + 0.5 * e);
      tw.obj.position.y = tw.targetY + 0.35 * (1 - e);
      return k < 1;
    });

    // 카메라 트윈
    if (this.camTween) {
      const c = this.camTween;
      c.t += dt;
      const k = Math.min(c.t / c.dur, 1);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this.world.camera.position.lerpVectors(c.fromPos, c.toPos, e);
      this.world.controls.target.lerpVectors(c.fromTarget, c.toTarget, e);
      if (k >= 1) this.camTween = null;
    }
  }
}
