// ===================================================================
// 게임 로직 — 준비 6단계 → 진설 5열(1열부터 순서 강제) → 완성
// ===================================================================
import * as THREE from 'three';
import { RULES, SETUP_STEPS, MODES, TABLE_TOP_Y, TABLE_CENTER_Z } from './data.js';
import { buildModel } from './models.js';
import { iconFor } from './icons.js';
import { makeTextSprite, spawnSparkles, stepSparkles, scorePop } from './fx.js';
import ITEMS from './shop-links.json';

const SNAP_DIST = 0.55; // 슬롯 흡착 판정 거리
const BEST_KEY = (modeKey) => `charye_best_${modeKey}`;

/** 모드별 최고 기록 { score, stars } (localStorage) */
export function loadBest(modeKey) {
  try { return JSON.parse(localStorage.getItem(BEST_KEY(modeKey))) || null; } catch (_) { return null; }
}
function saveBest(modeKey, rec) {
  try { localStorage.setItem(BEST_KEY(modeKey), JSON.stringify(rec)); } catch (_) { /* 프라이빗 모드 등 */ }
}

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
    this.particles = [];           // 반짝이 파티클
    this.rowHighlight = null;      // 현재 진설 중인 열 강조 띠
    this.dirLabels = [];           // 西/東 방향 라벨
    this.answerLabels = [];        // '정답 보기' 3D 라벨 [{sprite, ttl}]
    this.snapTarget = null;        // 고스트가 흡착된 슬롯/존 (마커 강조용)
    this.doneT = 0;                // 완성 후 카메라 스웨이 시간

    this.raycaster = new THREE.Raycaster();
    this.pointerNdc = new THREE.Vector2();
    this.movePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.hitPoint = new THREE.Vector3();

    this.mode = MODES.trad;
    this.rows = this.mode.rows;
    this.setupSteps = this.mode.setupSteps || SETUP_STEPS;
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
    // 완성 화면에서 사용자가 직접 돌려보기 시작하면 자동 스웨이를 멈춤
    this.userGrabbed = false;
    this.world.controls.addEventListener('start', () => { if (this.phase === 'done') this.userGrabbed = true; });
  }

  _raycastPlane() {
    this.raycaster.setFromCamera(this.pointerNdc, this.world.camera);
    return this.raycaster.ray.intersectPlane(this.movePlane, this.hitPoint) ? this.hitPoint : null;
  }

  // ================= 시작/단계 전환 =================
  start(modeKey = 'trad') {
    this.mode = MODES[modeKey] || MODES.trad;
    this.rows = this.mode.rows;
    this.setupSteps = this.mode.setupSteps || SETUP_STEPS;
    // 음식(진짜 제수) + 금기 함정 카드를 열 순서대로 트레이에 배열 — 내용은 shop-links.json에서 조회
    this.trayItems = this.rows.flatMap((r) => [
      ...r.items.map((id) => ({ ...ITEMS[id], id, row: r.row, z: r.z })),
      ...(r.taboos || []).map((id) => ({ ...ITEMS[id], id, row: r.row, z: r.z, taboo: true })),
    ]);
    this.totalFood = this.rows.reduce((sum, r) => sum + r.slots.length, 0);
    this.maxScore = this.setupSteps.length * 50 + this.totalFood * 100;
    this.ui.buildStepper(this.rows, this.setupSteps);
    this.ui.buildIngredientsModal(this.rows);
    this.phase = 'setup';
    this.setupIdx = 0;
    this._beginSetupStep();
  }

  _beginSetupStep() {
    const step = this.setupSteps[this.setupIdx];
    this.ui.setStep(`setup:${step.id}`);
    this.ui.setStageLabel(`준비 ${this.setupIdx + 1}/${this.setupSteps.length} · ${step.name}`);
    this.ui.banner(step.guide);
    this.ui.trayHint('빛나는 자리를 눌러 놓아주세요');
    this.ui.renderTray([{ id: step.id, name: step.name, emoji: step.emoji, icon: iconFor(step.model), sub: '준비물' }], () => {});
    this.ui.markSelected(step.id);

    // 이동 평면 + 존 마커
    if (step.id.startsWith('jibang')) {
      this.movePlane.set(new THREE.Vector3(0, 0, 1), 2.5); // z = -2.5 수직면
      this._makeZoneMarker(step, true);
      this._tweenCam([0, 2.3, 1.6], [0, 1.5, -2.6]);
    } else if (step.id === 'chotdae' || step.id === 'wipae') {
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
      this.trayItems.map((it) => ({
        ...it,
        icon: it.taboo ? null : iconFor(it.model),
        // 함정 카드에 "금기!"라고 써 있으면 함정이 아니므로 트레이에서는 숨김 (설명은 고른 뒤 토스트로)
        sub: it.taboo && it.sub === '금기!' ? '' : it.sub,
      })),
      (id) => this._onTraySelect(id)
    );
    if (!this.mode.free) this._showDirectionLabels();
    this._beginRow();
  }

  /** 상 양 끝에 西(왼쪽)·東(오른쪽) 라벨 — 방향 규칙(반서갱동·어동육서 등)을 보며 배치할 수 있게 */
  _showDirectionLabels() {
    this._clearDirectionLabels();
    const y = TABLE_TOP_Y + 0.42;
    const west = makeTextSprite('◀ 西 서쪽', { scale: 0.3, fg: '#fdf6e3', bg: 'rgba(30,18,8,0.82)', border: 'rgba(255,216,160,0.6)' });
    const east = makeTextSprite('東 동쪽 ▶', { scale: 0.3, fg: '#fdf6e3', bg: 'rgba(30,18,8,0.82)', border: 'rgba(255,216,160,0.6)' });
    west.position.set(-3.95, y, TABLE_CENTER_Z);
    east.position.set(3.95, y, TABLE_CENTER_Z);
    this.dirLabels = [west, east];
    this.dirLabels.forEach((s) => this.world.scene.add(s));
  }
  _clearDirectionLabels() {
    this.dirLabels.forEach((s) => this.world.scene.remove(s));
    this.dirLabels = [];
  }

  /** 지금 진설 중인 열을 상판 위에 은은한 띠로 표시 */
  _setRowHighlight(row) {
    if (!this.rowHighlight) {
      this.rowHighlight = new THREE.Mesh(
        new THREE.PlaneGeometry(6.6, 0.5),
        new THREE.MeshBasicMaterial({ color: 0xffd070, transparent: true, opacity: 0.1, depthWrite: false })
      );
      this.rowHighlight.rotation.x = -Math.PI / 2;
      this.world.scene.add(this.rowHighlight);
    }
    this.rowHighlight.position.set(0, TABLE_TOP_Y + 0.006, TABLE_CENTER_Z + row.z);
  }
  _clearRowHighlight() {
    if (this.rowHighlight) { this.world.scene.remove(this.rowHighlight); this.rowHighlight = null; }
  }

  _beginRow() {
    const row = this.rows[this.rowIdx];
    this.ui.setStep(`row:${row.row}`);
    this.ui.banner(row.guide, row.rules);
    this.ui.trayHint(this.mode.free
      ? `${row.row}열 음식을 골라 빈 자리 아무 곳에나 놓으세요 (배치 자유!)`
      : `${row.row}열 음식을 골라 상 위의 빛나는 자리에 놓으세요 (${row.row}열부터 차례대로!)`);
    this.ui.setSkipVisible(true);
    this.ui.setAnswerVisible(true);
    this._updateTrayLocks();
    this._makeSlotMarkers(row);
    this._setRowHighlight(row);
    this._clearAnswerLabels();
    const rowZ = TABLE_CENTER_Z + row.z;
    this._tweenCam([0, 3.6 + row.row * 0.12, rowZ + 3.9], [0, TABLE_TOP_Y, rowZ]);
    this.selectedId = null;
    this.ui.markSelected(null);
    this._clearGhost();
    // 트레이는 모든 열의 카드를 한 줄로 담고 있어 길다 — 지금 열의 첫 카드로 스크롤
    const first = this.trayItems.find((it) => it.row === row.row && !this.placedIds.has(it.id));
    if (first) this.ui.scrollTrayTo(first.id);
  }

  _updateTrayLocks() {
    const row = this.rows[this.rowIdx];
    this.trayItems.forEach((it) => {
      const card = this.ui.cards[it.id];
      if (!card || card.classList.contains('placed')) return;
      const slotTaken = !this.mode.free && !it.taboo && it.slot && this.filled.has(it.slot);
      const otherRow = it.row !== row.row;
      card.classList.toggle('locked', otherRow || slotTaken);
      // 다른 열 카드는 몇 열 것인지 표시해 두어 "왜 안 눌리지?"를 없앰
      const baseSub = it.taboo && it.sub === '금기!' ? '' : (it.sub || '');
      this.ui.setCardSub(it.id, otherRow ? `${it.row}열` : baseSub);
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
    // 대체 음식(같은 자리를 가리키는 다른 후보) 중 이미 다른 음식으로 채워진 경우
    if (!this.mode.free && item.slot && this.filled.has(item.slot)) {
      this.sfx.wrong();
      this.ui.shakeCard(id);
      this.ui.eduToast('이미 채워진 자리예요', '다른 음식으로 이미 채웠어요. 이 열의 다른 빈 자리를 찾아보세요.');
      return;
    }
    this.selectedId = id;
    this.ui.markSelected(id);
    this.sfx.select();
    this._setGhost(buildModel(item.model));
    this.shop.recommend(item.id);
  }

  // ================= 클릭 처리 =================
  _onClick() {
    if (this.phase === 'setup') this._trySetupPlace();
    else if (this.phase === 'food') this._tryFoodPlace();
  }

  _trySetupPlace() {
    if (!this.ghost) return;
    const step = this.setupSteps[this.setupIdx];
    const p = this._raycastPlane();
    if (!p) return;
    const target = new THREE.Vector3(...step.pos);
    const dist = step.id.startsWith('jibang')
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
    this.snapTarget = null;
    const model = buildModel(step.model);
    model.position.set(...step.pos);
    this.world.scene.add(model);
    if (model.userData.tick) this.world.registerAnimatable(model);
    this._popIn(model);
    this.sfx.place();
    this.score += 50;
    this.ui.setScore(this.score);
    const fxPos = new THREE.Vector3(...step.pos);
    if (step.id === 'byeongpung') fxPos.y += 1.2;
    else if (step.id === 'sang') fxPos.y = TABLE_TOP_Y;
    else if (step.id === 'hyangno') fxPos.y = 0.5;
    this.particles.push(...spawnSparkles(this.world.scene, fxPos, 16));
    scorePop(this.world.camera, fxPos, '+50');
    this.ui.eduToast(step.edu.title, step.edu.body);
    this.shop.recommend(step.shop);

    this.setupIdx += 1;
    if (this.setupIdx < this.setupSteps.length) {
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
    row.slots.forEach((slot) => {
      if (this.filled.has(slot.id)) return;
      const sx = slot.x, sz = TABLE_CENTER_Z + row.z;
      const d = Math.hypot(p.x - sx, p.z - sz);
      if (d < bestD) { best = slot; bestD = d; }
    });
    if (!best) return; // 슬롯 밖 클릭은 무시 (카메라 조작일 수 있음)

    const selected = this.trayItems.find((i) => i.id === this.selectedId);
    // 자유 배치 모드(성균관·간편)에서는 같은 열이면 어느 빈 자리든 정답
    if (!this.mode.free && selected.slot !== best.id) {
      // 오답
      this.wrongCounts[this.selectedId] = (this.wrongCounts[this.selectedId] || 0) + 1;
      this.sfx.wrong();
      this._flashSlot(best.id);
      this._shakeGhost();
      const ruleNames = row.rules.map((k) => RULES[k].name).join(', ');
      this.ui.eduToast(
        `그 자리는 ${best.name} 자리예요!`,
        `${selected.desc} (참고: ${ruleNames})`
      );
      scorePop(this.world.camera, new THREE.Vector3(best.x, TABLE_TOP_Y + 0.2, TABLE_CENTER_Z + row.z), '다시!', 'bad');
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
    this.snapTarget = null;
    this.selectedId = null;

    const model = buildModel(selected.model);
    model.position.set(best.x, TABLE_TOP_Y, TABLE_CENTER_Z + row.z);
    this.world.scene.add(model);
    this._popIn(model);
    wrong === 0 ? this.sfx.correct() : this.sfx.place();
    this.particles.push(...spawnSparkles(this.world.scene, model.position, wrong === 0 ? 14 : 8));
    scorePop(this.world.camera, new THREE.Vector3(best.x, TABLE_TOP_Y + 0.25, TABLE_CENTER_Z + row.z), `+${gained}`);
    this.ui.eduToast(`${selected.name} — 정답! +${gained}점`, selected.desc);
    this.ui.setStageLabel(`진설 ${this.placedCount}/${this.totalFood} · ${row.row}열`);
    this._updateTrayLocks();

    // 열 완료 체크
    const rowDone = row.slots.every((s) => this.filled.has(s.id));
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

  /** 현재 열의 남은 빈 슬롯을 모두 자동으로 채우고 다음 열로 넘어감 (건너뛰기 버튼) */
  skipRow() {
    if (this.phase !== 'food') return;
    const row = this.rows[this.rowIdx];
    this._clearGhost();
    this.selectedId = null;
    this.ui.markSelected(null);

    row.slots.forEach((slot) => {
      if (this.filled.has(slot.id)) return;
      const candidate = this.trayItems.find((it) =>
        it.row === row.row && !it.taboo && !this.placedIds.has(it.id) &&
        (this.mode.free || it.slot === slot.id)
      );
      if (!candidate) return;
      this.filled.add(slot.id);
      this.placedIds.add(candidate.id);
      this.placedCount += 1;
      this.ui.markPlaced(candidate.id);
      this._removeSlotMarker(slot.id);
      const model = buildModel(candidate.model);
      model.position.set(slot.x, TABLE_TOP_Y, TABLE_CENTER_Z + row.z);
      this.world.scene.add(model);
      this._popIn(model);
    });
    this._updateTrayLocks();
    this.sfx.rowClear();
    this.ui.setStageLabel(`진설 ${this.placedCount}/${this.totalFood} · ${row.row}열`);

    this.rowIdx += 1;
    if (this.rowIdx < this.rows.length) {
      setTimeout(() => this._beginRow(), 500);
    } else {
      this.ui.setSkipVisible(false);
      this.ui.setAnswerVisible(false);
      setTimeout(() => this._complete(), 700);
    }
  }

  /** 지금 열의 정답을 토스트로 보여줌 (감점 없음) */
  showAnswer() {
    if (this.phase !== 'food') return;
    const row = this.rows[this.rowIdx];
    let body;
    if (this.mode.free) {
      const names = [...new Set(row.items.map((id) => ITEMS[id].name))].join(' · ');
      body = `이번 열은 자유 배치예요. <b>${names}</b> 중 골라 빈 자리 아무 곳에나 놓으면 정답!`;
    } else {
      const lines = row.slots
        .filter((s) => !this.filled.has(s.id))
        .map((s) => {
          const item = row.items.map((id) => ITEMS[id]).find((it) => it.slot === s.id);
          return `${s.name} 자리 → <b>${item ? item.name : '?'}</b>`;
        });
      body = lines.join('<br/>');
      this._showAnswerLabels(row); // 상 위 빈 자리마다 정답 이름을 직접 띄움
    }
    this.ui.eduToast('💡 정답 보기', body, 6000);
  }

  /** 정답 보기 — 빈 슬롯 위에 들어갈 음식 이름을 3D 라벨로 6초간 표시 */
  _showAnswerLabels(row) {
    this._clearAnswerLabels();
    row.slots.forEach((s) => {
      if (this.filled.has(s.id)) return;
      const item = row.items.map((id) => ITEMS[id]).find((it) => it.slot === s.id);
      if (!item) return;
      const sp = makeTextSprite(item.name, { scale: 0.26, fg: '#2f6d51', border: 'rgba(47,109,81,0.8)' });
      sp.position.set(s.x, TABLE_TOP_Y + 0.38, TABLE_CENTER_Z + row.z);
      sp.userData.baseY = sp.position.y;
      this.world.scene.add(sp);
      this.answerLabels.push({ sprite: sp, ttl: 6 });
    });
  }
  _clearAnswerLabels() {
    this.answerLabels.forEach(({ sprite }) => this.world.scene.remove(sprite));
    this.answerLabels = [];
  }

  // ================= 완성 =================
  _complete() {
    this.phase = 'done';
    this.ui.setSkipVisible(false);
    this.ui.setAnswerVisible(false);
    this.ui.finishStepper();
    this.ui.setStageLabel('차례상 완성!');
    this.ui.clearTray();
    this.ui.trayHint('');
    this.$hideBanner();
    this.sfx.fanfare();
    this._clearRowHighlight();
    this._clearDirectionLabels();
    this._clearAnswerLabels();
    this._clearGhost();
    // 완성 연출: 카메라를 뒤로 빼고, 이후 _tick에서 좌우로 천천히 스웨이
    // (OrbitControls.autoRotate는 azimuth 제한에 걸리면 한쪽에 멈춰버려 사용하지 않음)
    this.doneT = 0;
    this._tweenCam([0, 4.8, 6.2], [0, 0.9, -0.9], 1.4);
    // 상 위 전체에 축하 반짝이
    const rows = this.rows;
    rows.forEach((r, i) => setTimeout(() => {
      r.slots.forEach((s) => this.particles.push(...spawnSparkles(this.world.scene, new THREE.Vector3(s.x, TABLE_TOP_Y + 0.1, TABLE_CENTER_Z + r.z), 5)));
    }, 200 + i * 160));

    const wrongTotal = Object.values(this.wrongCounts).reduce((a, b) => a + b, 0);
    const ratio = this.score / this.maxScore;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : 1;
    const hasTaboo = rows.some((r) => r.taboos && r.taboos.length);
    const tabooLine = !hasTaboo ? ''
      : this.tabooCaught > 0
        ? ` · 금기 음식 실수: ${this.tabooCaught}회 — 복숭아·팥·매운 양념·마늘은 기억해요!`
        : ' · 금기 음식을 하나도 올리지 않았어요. 훌륭해요! 👏';
    const summary = `
      <b>오늘 배운 것 — ${this.mode.label}</b><br/>
      ${this.mode.summary}<br/>
      <span style="color:#8a7050">틀린 횟수: ${wrongTotal}회${tabooLine}</span>`;

    // 최고 기록 (모드별, 기기에 저장)
    const prev = loadBest(this.mode.key);
    const isNewBest = !prev || this.score > prev.score;
    if (isNewBest) saveBest(this.mode.key, { score: this.score, stars, maxScore: this.maxScore });
    const bestLine = isNewBest
      ? (prev ? `🏆 최고 기록 갱신! (이전 ${prev.score}점)` : '🏆 첫 완성 기록!')
      : `최고 기록 ${prev.score}점 · ${'★'.repeat(prev.stars)}`;

    this.shop.prepareComplete(this.mode.key); // 완성 화면 '구매 리스트 보기' 버튼
    setTimeout(() => {
      this.ui.showComplete({ score: this.score, maxScore: this.maxScore, summary, stars, bestLine, isNewBest });
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
    this.snapTarget = null;
  }
  /** 오답 시 고스트를 좌우로 짧게 흔듦 */
  _shakeGhost() {
    if (!this.ghost) return;
    this.ghost.userData.shake = 0.35;
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
      if (step.id === 'chotdae' || step.id === 'wipae') ring.position.y = TABLE_TOP_Y + 0.015;
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
    row.slots.forEach((slot) => {
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
    m.userData.flashing = true;
    m.material.color.set(0xe04030);
    setTimeout(() => { m.userData.flashing = false; m.material.color.set(0xffd070); }, 500);
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

  /** 고스트가 흡착할 대상 계산 — 진설: 가장 가까운 빈 슬롯 / 준비: 존 중심 */
  _findSnap(p) {
    if (this.phase === 'food') {
      const row = this.rows[this.rowIdx];
      let best = null, bestD = SNAP_DIST;
      row.slots.forEach((slot) => {
        if (this.filled.has(slot.id)) return;
        const d = Math.hypot(p.x - slot.x, p.z - (TABLE_CENTER_Z + row.z));
        if (d < bestD) { best = slot; bestD = d; }
      });
      return best ? { id: best.id, pos: [best.x, TABLE_TOP_Y, TABLE_CENTER_Z + row.z] } : null;
    }
    if (this.phase === 'setup') {
      const step = this.setupSteps[this.setupIdx];
      if (!step) return null;
      const vertical = step.id.startsWith('jibang');
      const d = vertical ? Math.hypot(p.x - step.pos[0], p.y - step.pos[1]) : Math.hypot(p.x - step.pos[0], p.z - step.pos[2]);
      // 큰 준비물(병풍·돗자리·상)은 존이 넓어 흡착하면 오히려 뚝뚝 끊겨 보임 — 작은 것만 흡착
      if (d < step.zone && step.zone <= 1.2) return { id: step.id, pos: vertical ? [step.pos[0], step.pos[1], -2.52] : step.pos };
    }
    return null;
  }

  _tick(dt) {
    const t = performance.now() / 1000;
    // 고스트 따라다니기 (+ 가까운 자리에 부드럽게 흡착)
    if (this.ghost) {
      const p = this._raycastPlane();
      if (p) {
        const snap = this._findSnap(p);
        this.snapTarget = snap ? snap.id : null;
        const target = snap
          ? new THREE.Vector3(...snap.pos)
          : (this.phase === 'setup' && this.setupSteps[this.setupIdx]?.id.startsWith('jibang'))
            ? new THREE.Vector3(p.x, p.y, -2.52)
            : new THREE.Vector3(p.x, -this.movePlane.constant, p.z);
        // 흡착 중엔 lerp로 미끄러지듯, 아니면 즉시 따라감
        if (snap) this.ghost.position.lerp(target, Math.min(1, dt * 18));
        else this.ghost.position.copy(target);
      }
      if (this.ghost.userData.shake > 0) {
        this.ghost.userData.shake -= dt;
        this.ghost.position.x += Math.sin(this.ghost.userData.shake * 60) * 0.06 * (this.ghost.userData.shake / 0.35);
      }
    }
    // 마커 펄스 (흡착된 마커는 크고 밝게)
    const pulse = 0.8 + Math.sin(t * 4.2) * 0.2;
    if (this.zoneMarker) {
      const hot = this.snapTarget && this.phase === 'setup';
      this.zoneMarker.scale.setScalar(hot ? 1.1 : pulse);
      this.zoneMarker.material.opacity = hot ? 1 : 0.5 + Math.sin(t * 4.2) * 0.3;
      this.zoneMarker.material.color.setHex(hot ? 0xfff0b0 : 0xffd070);
    }
    this.slotMarkers.forEach((m, id) => {
      const hot = id === this.snapTarget;
      m.scale.setScalar(hot ? 1.35 : pulse);
      m.material.opacity = hot ? 1 : 0.45 + Math.sin(t * 4.2) * 0.28;
      if (!m.userData.flashing) m.material.color.setHex(hot ? 0xfff0b0 : 0xffd070);
    });
    if (this.rowHighlight) this.rowHighlight.material.opacity = 0.08 + Math.sin(t * 2.1) * 0.04;

    // 반짝이 파티클
    if (this.particles.length) this.particles = stepSparkles(this.world.scene, this.particles, dt);

    // 정답 라벨 — 살짝 떠다니다 사라짐
    if (this.answerLabels.length) {
      this.answerLabels = this.answerLabels.filter((l) => {
        l.ttl -= dt;
        if (l.ttl <= 0) { this.world.scene.remove(l.sprite); return false; }
        l.sprite.position.y = l.sprite.userData.baseY + Math.sin(t * 2.5 + l.sprite.position.x) * 0.03;
        l.sprite.material.opacity = Math.min(1, l.ttl / 0.6);
        return true;
      });
    }

    // 완성 후 카메라 스웨이 (좌우로 천천히 둘러보기)
    if (this.phase === 'done' && !this.camTween && !this.userGrabbed) {
      const target = this.world.controls.target;
      if (this.doneT === 0) {
        // 트윈이 끝난 지점의 거리·높이를 그대로 이어받아 튐 없이 시작
        const off = this.world.camera.position.clone().sub(target);
        this.swayH = off.y;
        this.swayR = Math.hypot(off.x, off.z);
      }
      this.doneT += dt;
      const az = Math.sin(this.doneT * 0.32) * 0.62;
      this.world.camera.position.set(target.x + Math.sin(az) * this.swayR, target.y + this.swayH, target.z + Math.cos(az) * this.swayR);
    }

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
