// ===================================================================
// 연출 효과 — 텍스트 스프라이트 / 반짝이 파티클 / 점수 팝업
// 게임 로직(game.js)과 분리해 두어 재사용·튜닝이 쉽도록 함
// ===================================================================
import * as THREE from 'three';

// ---------- 텍스트 스프라이트 (3D 공간에 떠 있는 라벨) ----------
const spriteCache = new Map();

/**
 * 한지 느낌의 라운드 라벨 스프라이트. 같은 텍스트/스타일은 텍스처를 재사용.
 * @param {string} text
 * @param {{ fg?: string, bg?: string, border?: string, size?: number, scale?: number, font?: string }} opts
 */
export function makeTextSprite(text, opts = {}) {
  const {
    fg = '#2b2018', bg = 'rgba(253,246,227,0.94)', border = 'rgba(181,136,59,0.9)',
    size = 40, scale = 0.42, font = '"Noto Sans KR", "Gowun Batang", sans-serif',
  } = opts;
  const key = JSON.stringify([text, fg, bg, border, size, font]);
  let tex = spriteCache.get(key);
  if (!tex) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.font = `700 ${size}px ${font}`;
    const padX = size * 0.6, padY = size * 0.38;
    const w = Math.ceil(ctx.measureText(text).width + padX * 2);
    const h = Math.ceil(size + padY * 2);
    c.width = w; c.height = h;
    const r = h / 2;
    ctx.font = `700 ${size}px ${font}`;
    ctx.beginPath();
    ctx.roundRect(1.5, 1.5, w - 3, h - 3, r);
    ctx.fillStyle = bg; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = border; ctx.stroke();
    ctx.fillStyle = fg;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + size * 0.04);
    tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.userData = { w, h };
    spriteCache.set(key, tex);
  }
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
  const { w, h } = tex.userData;
  sp.scale.set(scale * (w / h), scale, 1);
  sp.renderOrder = 10;
  return sp;
}

// ---------- 반짝이 파티클 ----------
let sparkleTex = null;
function getSparkleTex() {
  if (sparkleTex) return sparkleTex;
  const c = document.createElement('canvas');
  c.width = c.height = 48;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(24, 24, 1, 24, 24, 22);
  g.addColorStop(0, 'rgba(255,250,225,1)');
  g.addColorStop(0.35, 'rgba(255,214,120,0.95)');
  g.addColorStop(1, 'rgba(255,190,80,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 48, 48);
  sparkleTex = new THREE.CanvasTexture(c);
  return sparkleTex;
}

/**
 * pos 위치에서 위로 터지는 금빛 반짝이. 반환된 배열을 매 프레임 stepSparkles로 갱신.
 */
export function spawnSparkles(scene, pos, count = 14, color = 0xffd070) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: getSparkleTex(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    const a = Math.random() * Math.PI * 2;
    const r = 0.25 + Math.random() * 0.9;
    sp.position.copy(pos);
    sp.position.y += 0.05;
    const s = 0.07 + Math.random() * 0.09;
    sp.scale.setScalar(s);
    sp.userData = {
      vel: new THREE.Vector3(Math.cos(a) * r, 1.4 + Math.random() * 1.3, Math.sin(a) * r),
      life: 0, dur: 0.55 + Math.random() * 0.35, s,
    };
    scene.add(sp);
    out.push(sp);
  }
  return out;
}

/** 파티클 갱신 — 수명이 끝난 것은 scene에서 제거하고 남은 배열을 반환 */
export function stepSparkles(scene, list, dt) {
  return list.filter((sp) => {
    const u = sp.userData;
    u.life += dt;
    const k = u.life / u.dur;
    if (k >= 1) { scene.remove(sp); sp.material.dispose(); return false; }
    u.vel.y -= 4.2 * dt; // 중력
    sp.position.addScaledVector(u.vel, dt);
    sp.material.opacity = 1 - k * k;
    sp.scale.setScalar(u.s * (1 + k * 0.6));
    return true;
  });
}

// ---------- 점수 팝업 (DOM, 3D 좌표를 화면에 투영) ----------
const _v = new THREE.Vector3();
/**
 * 월드 좌표 worldPos 위에 "+100" 같은 텍스트를 잠깐 띄움.
 * @param {THREE.Camera} camera
 * @param {THREE.Vector3} worldPos
 * @param {string} text
 * @param {'good'|'bad'|'neutral'} tone
 */
export function scorePop(camera, worldPos, text, tone = 'good') {
  _v.copy(worldPos).project(camera);
  if (_v.z > 1) return; // 카메라 뒤
  const x = (_v.x + 1) / 2 * window.innerWidth;
  const y = (1 - _v.y) / 2 * window.innerHeight;
  const el = document.createElement('div');
  el.className = `score-pop ${tone}`;
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
  setTimeout(() => el.remove(), 1400); // animationend 누락 대비
}
