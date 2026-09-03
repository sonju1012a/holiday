// ===================================================================
// 절차 생성 3D 모델 — 외부 에셋 없이 three.js 지오메트리로 제작
// 모든 빌더는 THREE.Group 반환. group.userData.tick(dt) 등록 시 매 프레임 호출됨.
// ===================================================================
import * as THREE from 'three';

// ---------- 공용 재질 ----------
const MAT = {
  brass:  new THREE.MeshStandardMaterial({ color: 0xb5883b, metalness: 0.75, roughness: 0.32 }),
  brassDark: new THREE.MeshStandardMaterial({ color: 0x8a6528, metalness: 0.7, roughness: 0.4 }),
  wood:   new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.62 }),
  woodDark: new THREE.MeshStandardMaterial({ color: 0x3e2614, roughness: 0.7 }),
  paper:  new THREE.MeshStandardMaterial({ color: 0xfaf3e0, roughness: 0.9 }),
};

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function std(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...opts });
}

// ---------- 제기(굽 달린 놋그릇) ----------
function jegiPlate(radius = 0.26, height = 0.14) {
  const g = new THREE.Group();
  const stem = mesh(new THREE.CylinderGeometry(radius * 0.32, radius * 0.5, height, 20), MAT.brass, 0, height / 2, 0);
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    pts.push(new THREE.Vector2(radius * (0.35 + 0.65 * t), height + t * t * 0.05));
  }
  const dish = mesh(new THREE.LatheGeometry(pts, 28), MAT.brass);
  const bottom = mesh(new THREE.CylinderGeometry(radius * 0.36, radius * 0.36, 0.012, 20), MAT.brass, 0, height + 0.006, 0);
  g.add(stem, dish, bottom);
  g.userData.topY = height + 0.02;
  return g;
}
function jegiBowl(radius = 0.2, height = 0.1) {
  const g = new THREE.Group();
  const stem = mesh(new THREE.CylinderGeometry(radius * 0.4, radius * 0.55, height * 0.55, 20), MAT.brass, 0, height * 0.275, 0);
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI * 0.52;
    pts.push(new THREE.Vector2(Math.sin(a) * radius, height * 0.5 + (1 - Math.cos(a)) * radius * 0.9));
  }
  const bowl = mesh(new THREE.LatheGeometry(pts, 28), MAT.brass);
  g.add(stem, bowl);
  g.userData.topY = height * 0.5 + radius * 0.75;
  g.userData.innerR = radius * 0.82;
  return g;
}
function liquid(radius, y, color) {
  const m = mesh(new THREE.CylinderGeometry(radius, radius, 0.012, 24), std(color, { roughness: 0.25 }), 0, y, 0);
  m.castShadow = false;
  return m;
}
/** 과일 괴임(피라미드로 쌓기) */
function pileOnPlate(plate, makeUnit, layers, unitR, jitterFn = null) {
  const baseY = plate.userData.topY;
  let n = layers + 1;
  let y = baseY + unitR * 0.85;
  for (let layer = 0; layer < layers; layer++) {
    n -= 1;
    if (n <= 0) break;
    const ringR = n > 1 ? unitR * 1.05 * (n - 1) : 0;
    for (let i = 0; i < Math.max(n * 3 - 3, 1); i++) {
      const count = Math.max(n * 3 - 3, 1);
      const a = (i / count) * Math.PI * 2 + layer * 0.4;
      const u = makeUnit();
      u.position.set(Math.cos(a) * ringR, y, Math.sin(a) * ringR);
      if (jitterFn) jitterFn(u);
      plate.add(u);
    }
    y += unitR * 1.5;
  }
  return plate;
}

// ===================================================================
// 준비물 모델
// ===================================================================

function byeongpungTexture(panelIdx) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 380;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f6eed8';
  ctx.fillRect(0, 0, 128, 380);
  // 은은한 수묵 산수 느낌
  ctx.strokeStyle = 'rgba(60,50,40,0.55)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const base = 240 + Math.sin(panelIdx * 1.7) * 40;
  ctx.moveTo(-10, base);
  for (let x = 0; x <= 128; x += 8) {
    ctx.lineTo(x, base - Math.abs(Math.sin((x + panelIdx * 37) * 0.05)) * 70 - Math.sin(x * 0.02 + panelIdx) * 15);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60,50,40,0.28)';
  ctx.beginPath();
  ctx.moveTo(-10, base + 50);
  for (let x = 0; x <= 128; x += 8) ctx.lineTo(x, base + 50 - Math.abs(Math.sin((x + panelIdx * 61) * 0.04)) * 40);
  ctx.stroke();
  // 매화 가지 (홀수 폭)
  if (panelIdx % 2 === 1) {
    ctx.strokeStyle = 'rgba(70,55,40,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(20, 90); ctx.quadraticCurveTo(60, 60, 100, 95); ctx.stroke();
    ctx.fillStyle = 'rgba(196,90,90,0.8)';
    [[45, 70], [70, 66], [88, 82]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); });
  }
  // 낙관
  ctx.fillStyle = 'rgba(170,50,40,0.85)';
  ctx.fillRect(100, 330, 16, 16);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildByeongpung() {
  const g = new THREE.Group();
  const panels = 6, pw = 0.72, ph = 2.1;
  for (let i = 0; i < panels; i++) {
    const p = new THREE.Group();
    const frame = mesh(new THREE.BoxGeometry(pw, ph, 0.045), MAT.woodDark, 0, ph / 2, 0);
    const paper = mesh(
      new THREE.BoxGeometry(pw - 0.09, ph - 0.12, 0.05),
      new THREE.MeshStandardMaterial({ map: byeongpungTexture(i), roughness: 0.9 }),
      0, ph / 2, 0.002
    );
    p.add(frame, paper);
    const zig = (i % 2 === 0 ? 1 : -1) * 0.11;
    const x = (i - (panels - 1) / 2) * (pw * 0.96);
    p.position.set(x, 0, zig);
    p.rotation.y = (i % 2 === 0 ? -1 : 1) * 0.16;
    g.add(p);
  }
  return g;
}

export function buildDotjari() {
  const g = new THREE.Group();
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d9c48f';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(140,110,60,0.4)';
  for (let y = 0; y < 256; y += 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(120,90,45,0.25)';
  for (let x = 0; x < 256; x += 22) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = mesh(new THREE.BoxGeometry(7.6, 0.02, 5.2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  mat.position.y = 0.01;
  // 남색 테두리 (전통 돗자리 선단)
  const edgeMat = std(0x27405c, { roughness: 0.85 });
  const e1 = mesh(new THREE.BoxGeometry(7.6, 0.024, 0.22), edgeMat, 0, 0.011, -2.49);
  const e2 = mesh(new THREE.BoxGeometry(7.6, 0.024, 0.22), edgeMat, 0, 0.011, 2.49);
  g.add(mat, e1, e2);
  return g;
}

export function buildSang() {
  const g = new THREE.Group();
  const topW = 6.9, topD = 2.75, topY = 0.82;
  const top = mesh(new THREE.BoxGeometry(topW, 0.09, topD), MAT.wood, 0, topY - 0.045, 0);
  // 상판 테두리(전)
  const rim = mesh(new THREE.BoxGeometry(topW + 0.12, 0.05, topD + 0.12), MAT.woodDark, 0, topY - 0.085, 0);
  g.add(top, rim);
  // 다리 (호랑이 다리 느낌의 굽은 다리 대신 견고한 각다리 + 보강대)
  const legGeo = new THREE.BoxGeometry(0.12, topY - 0.09, 0.12);
  [[-topW / 2 + 0.3, -topD / 2 + 0.25], [topW / 2 - 0.3, -topD / 2 + 0.25],
   [-topW / 2 + 0.3, topD / 2 - 0.25], [topW / 2 - 0.3, topD / 2 - 0.25]].forEach(([x, z]) => {
    g.add(mesh(legGeo, MAT.woodDark, x, (topY - 0.09) / 2, z));
  });
  const brace1 = mesh(new THREE.BoxGeometry(topW - 0.7, 0.07, 0.07), MAT.woodDark, 0, 0.22, -topD / 2 + 0.25);
  const brace2 = mesh(new THREE.BoxGeometry(topW - 0.7, 0.07, 0.07), MAT.woodDark, 0, 0.22, topD / 2 - 0.25);
  g.add(brace1, brace2);
  return g;
}

// columns: 세로줄 하나당 지방 한 줄(考 또는 妣). 考/妣가 짝을 이루도록 2개씩 나란히 넣으면 됩니다.
function jibangTexture(columns = ['顯考學生府君神位']) {
  const colW = 68, rowH = 30, topPad = 34, bottomPad = 24;
  const maxLen = Math.max(...columns.map((s) => [...s].length));
  const c = document.createElement('canvas');
  c.width = colW * columns.length;
  c.height = topPad + maxLen * rowH + bottomPad;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fffdf4';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#1c1710';
  ctx.font = `bold ${columns.length > 2 ? 18 : 22}px "Gowun Batang", serif`;
  ctx.textAlign = 'center';
  columns.forEach((col, ci) => {
    const cx = colW * ci + colW / 2;
    [...col].forEach((ch, i) => ctx.fillText(ch, cx, topPad + i * rowH));
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildJibang(columns, scale = 1, colWidth = 0.34) {
  const cols = columns && columns.length ? columns : ['顯考學生府君神位'];
  const g = new THREE.Group();
  const totalW = colWidth * cols.length;
  // 지방틀 (받침 + 틀)
  const frame = mesh(new THREE.BoxGeometry(totalW, 0.98, 0.035), MAT.woodDark, 0, 0, 0);
  const paper = mesh(
    new THREE.BoxGeometry(totalW - 0.08, 0.88, 0.04),
    new THREE.MeshStandardMaterial({ map: jibangTexture(cols), roughness: 0.92 }),
    0, 0, 0.003
  );
  g.add(frame, paper);
  if (scale !== 1) g.scale.setScalar(scale);
  return g;
}

// 일직 손가 35세손 — 부모·조부모·증조부모·고조부모 4대 8위를
// 실제 사진처럼 부부(考/妣)가 한 장에 나란히 적힌 지방 4장으로 모십니다.
export const MYFAMILY_JIBANG_PAIRS = [
  ['顯考處士府君神位', '顯妣孺人達城徐氏神位'],
  ['顯祖考處士府君神位', '顯祖妣孺人海平尹氏神位'],
  ['顯曾祖考處士府君神位', '顯曾祖妣孺人眞城李氏神位'],
  ['顯高祖考處士府君神位', '顯高祖妣孺人坡平尹氏神位'],
];
export function buildMyFamilyJibang(idx) {
  return buildJibang(MYFAMILY_JIBANG_PAIRS[idx], 0.5, 0.2);
}

// 단일 제사(기제사)용 위패 — 지방과 같은 방식으로 병풍에 붙입니다.
export function buildWipae() {
  return buildJibang(['顯考處士府君神位'], 0.55, 0.3);
}

export function buildChotdae() {
  // 촛대 한 쌍을 하나의 그룹으로 (상 양 끝)
  const g = new THREE.Group();
  const lights = [];
  [-3.05, 3.05].forEach((x) => {
    const s = new THREE.Group();
    s.add(
      mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.035, 20), MAT.brass, 0, 0.018, 0),
      mesh(new THREE.CylinderGeometry(0.024, 0.035, 0.42, 12), MAT.brass, 0, 0.23, 0),
      mesh(new THREE.CylinderGeometry(0.075, 0.05, 0.03, 16), MAT.brass, 0, 0.45, 0),
      mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.3, 14), std(0xf3ead0, { roughness: 0.5 }), 0, 0.61, 0)
    );
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.03, 0.1, 10),
      new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.95 })
    );
    flame.position.set(0, 0.81, 0);
    const glow = new THREE.PointLight(0xffa94d, 0.55, 3.2, 2);
    glow.position.set(0, 0.85, 0);
    s.add(flame, glow);
    lights.push({ flame, glow, seed: x });
    s.position.set(x, 0, -0.85);
    g.add(s);
  });
  g.userData.tick = (dt, t) => {
    lights.forEach(({ flame, glow, seed }) => {
      const f = 0.85 + Math.sin(t * 11 + seed) * 0.1 + Math.sin(t * 23 + seed * 2) * 0.06;
      flame.scale.set(f, 0.9 + f * 0.25, f);
      glow.intensity = 0.42 + f * 0.22;
    });
  };
  return g;
}

export function buildHyangsang() {
  const g = new THREE.Group();
  // 작은 향상
  const top = mesh(new THREE.BoxGeometry(1.05, 0.06, 0.62), MAT.wood, 0, 0.42, 0);
  [[-0.45, -0.24], [0.45, -0.24], [-0.45, 0.24], [0.45, 0.24]].forEach(([x, z]) =>
    g.add(mesh(new THREE.BoxGeometry(0.07, 0.4, 0.07), MAT.woodDark, x, 0.2, z)));
  g.add(top);
  // 향로 (삼발 놋향로)
  const burner = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(0.13, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), MAT.brass);
  body.scale.y = 0.85;
  body.position.y = 0.1;
  burner.add(body);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    burner.add(mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.09, 8), MAT.brassDark, Math.cos(a) * 0.08, 0.045, Math.sin(a) * 0.08));
  }
  burner.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 18), MAT.brassDark, 0, 0.16, 0));
  burner.position.set(0, 0.45, 0);
  g.add(burner);
  // 향합
  const box = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16), MAT.brass, 0.34, 0.48, 0.08);
  g.add(box);
  // 모사기 (바닥, 향상 앞)
  const mosagi = jegiBowl(0.11, 0.06);
  mosagi.position.set(-0.28, 0, 0.5);
  mosagi.add(liquid(0.08, mosagi.userData.topY - 0.02, 0x8aa050));
  g.add(mosagi);
  // 퇴주그릇
  const toeju = jegiBowl(0.1, 0.05);
  toeju.position.set(0.28, 0, 0.5);
  g.add(toeju);

  // 향 연기 파티클
  const smokeTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grd.addColorStop(0, 'rgba(230,225,215,0.55)');
    grd.addColorStop(1, 'rgba(230,225,215,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const puffs = [];
  for (let i = 0; i < 7; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false }));
    sp.position.set(0, 0.62, 0);
    sp.scale.setScalar(0.12);
    sp.userData.phase = i / 7;
    g.add(sp);
    puffs.push(sp);
  }
  g.userData.tick = (dt, t) => {
    puffs.forEach((sp) => {
      const p = ((t * 0.22) + sp.userData.phase) % 1;
      sp.position.y = 0.62 + p * 1.05;
      sp.position.x = Math.sin(p * 9 + sp.userData.phase * 20) * 0.06 * p;
      sp.scale.setScalar(0.1 + p * 0.3);
      sp.material.opacity = (1 - p) * 0.5;
    });
  };
  return g;
}

// ===================================================================
// 음식 모델 (모두 제기 위에)
// ===================================================================

function buildSongpyeon() {
  const p = jegiBowl(0.17, 0.09);
  const colors = [0xf2ecd8, 0xa8c69a, 0xd8a8b8];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const r = i < 5 ? 0.09 : 0.03;
    const y = p.userData.topY + (i < 5 ? 0 : 0.055);
    const s = mesh(new THREE.SphereGeometry(0.05, 12, 10), std(colors[i % 3], { roughness: 0.55 }),
      Math.cos(a) * r, y, Math.sin(a) * r);
    s.scale.set(1, 0.72, 0.62);
    s.rotation.y = a;
    p.add(s);
  }
  return p;
}
function buildGuk() {
  const p = jegiBowl(0.17, 0.1);
  p.add(liquid(p.userData.innerR, p.userData.topY - 0.015, 0xc8b494));
  const tofu = mesh(new THREE.BoxGeometry(0.05, 0.02, 0.05), std(0xf4efdf), 0.04, p.userData.topY - 0.005, 0.02);
  p.add(tofu);
  return p;
}
function buildSulJan() {
  const g = new THREE.Group();
  // 잔받침 + 잔
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.02, 18), MAT.brass, 0, 0.01, 0));
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    pts.push(new THREE.Vector2(0.028 + t * 0.05, 0.02 + t * 0.09));
  }
  g.add(mesh(new THREE.LatheGeometry(pts, 20), MAT.brass));
  g.add(liquid(0.06, 0.1, 0xe8dcc0));
  return g;
}
function buildSijeop() {
  const g = new THREE.Group();
  const dish = mesh(new THREE.BoxGeometry(0.34, 0.035, 0.2), MAT.brass, 0, 0.018, 0);
  g.add(dish);
  // 숟가락 2 + 젓가락 2쌍
  const spoonMat = MAT.brassDark;
  [-0.08, -0.03].forEach((x) => {
    const handle = mesh(new THREE.BoxGeometry(0.018, 0.012, 0.17), spoonMat, x, 0.045, 0.01);
    const head = mesh(new THREE.SphereGeometry(0.022, 10, 8), spoonMat, x, 0.045, -0.085);
    head.scale.set(1, 0.4, 1.3);
    g.add(handle, head);
  });
  [0.04, 0.07, 0.1, 0.13].forEach((x) => {
    g.add(mesh(new THREE.BoxGeometry(0.008, 0.008, 0.19), spoonMat, x, 0.042, 0));
  });
  return g;
}
function buildJeon() { // 육전 — 넓은 전 부침 쌓기
  const p = jegiPlate(0.24, 0.12);
  for (let i = 0; i < 4; i++) {
    const disc = mesh(new THREE.CylinderGeometry(0.16 - i * 0.008, 0.16 - i * 0.008, 0.02, 20),
      std(0xc98d4e, { roughness: 0.7 }), (i % 2) * 0.015 - 0.008, p.userData.topY + 0.012 + i * 0.021, 0);
    p.add(disc);
  }
  return p;
}
function buildYukjeok() { // 고기 산적 꼬치
  const p = jegiPlate(0.24, 0.12);
  for (let layer = 0; layer < 3; layer++) {
    const y = p.userData.topY + 0.02 + layer * 0.035;
    for (let i = 0; i < 3; i++) {
      const bar = mesh(new THREE.BoxGeometry(0.3, 0.03, 0.05),
        std(layer % 2 ? 0x7a4a2c : 0x8d5636, { roughness: 0.6 }), 0, y, (i - 1) * 0.062);
      bar.rotation.y = (layer % 2) * 0.12 - 0.06;
      p.add(bar);
      const stick = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.38, 6), std(0xd6c49a), 0, y, (i - 1) * 0.062);
      stick.rotation.z = Math.PI / 2;
      p.add(stick);
    }
  }
  return p;
}
function buildSojeok() { // 두부적
  const p = jegiPlate(0.22, 0.12);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      p.add(mesh(new THREE.BoxGeometry(0.13, 0.035, 0.1), std(0xf1e9cf, { roughness: 0.55 }),
        (j - 0.5) * 0.14, p.userData.topY + 0.02 + i * 0.037, (i % 2) * 0.02 - 0.01));
    }
  }
  return p;
}
function fishMesh(len, color) {
  const f = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(len * 0.5, 16, 12), std(color, { roughness: 0.5 }));
  body.scale.set(1, 0.28, 0.34);
  const tail = mesh(new THREE.ConeGeometry(len * 0.14, len * 0.28, 8), std(color, { roughness: 0.55 }), -len * 0.58, 0, 0);
  tail.rotation.z = Math.PI / 2; // 꼬리 서쪽(-x), 머리 동쪽(+x) — 두동미서
  tail.scale.z = 0.4;
  const eye = mesh(new THREE.SphereGeometry(len * 0.03, 8, 6), std(0x222222), len * 0.36, len * 0.05, len * 0.1);
  f.add(body, tail, eye);
  return f;
}
function buildEojeok() { // 생선 구이 — 머리 동쪽
  const p = jegiPlate(0.25, 0.12);
  const f1 = fishMesh(0.4, 0x9f8b62);
  f1.position.y = p.userData.topY + 0.05;
  const f2 = fishMesh(0.34, 0xaf9a70);
  f2.position.set(0.02, p.userData.topY + 0.11, 0.05);
  f2.rotation.y = 0.15;
  p.add(f1, f2);
  return p;
}
function buildEojeon() { // 동태전 — 노란 전
  const p = jegiPlate(0.22, 0.12);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const e = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.018, 14), std(0xe3b953, { roughness: 0.6 }),
      Math.cos(a) * 0.08, p.userData.topY + 0.015 + (i % 3) * 0.019, Math.sin(a) * 0.08);
    e.scale.x = 1.35;
    e.rotation.y = a;
    p.add(e);
  }
  return p;
}
function buildTangFactory(broth, chunk) {
  return () => {
    const p = jegiBowl(0.19, 0.11);
    p.add(liquid(p.userData.innerR, p.userData.topY - 0.018, broth));
    const c1 = mesh(new THREE.BoxGeometry(0.06, 0.025, 0.06), std(chunk), -0.03, p.userData.topY - 0.006, 0.02);
    const c2 = mesh(new THREE.SphereGeometry(0.03, 10, 8), std(chunk), 0.05, p.userData.topY - 0.004, -0.03);
    c2.scale.y = 0.6;
    p.add(c1, c2);
    return p;
  };
}
function buildPo() { // 북어포 — 납작하게 포개어
  const p = jegiPlate(0.26, 0.11);
  for (let i = 0; i < 3; i++) {
    const slab = mesh(new THREE.BoxGeometry(0.42 - i * 0.03, 0.025, 0.16 - i * 0.015),
      std(0xd8c08e, { roughness: 0.85 }), 0, p.userData.topY + 0.015 + i * 0.027, 0);
    slab.rotation.y = (i % 2) * 0.1 - 0.05;
    p.add(slab);
  }
  // 머리 모양 (동쪽)
  const head = mesh(new THREE.ConeGeometry(0.05, 0.1, 8), std(0xcbb27f), 0.24, p.userData.topY + 0.045, 0);
  head.rotation.z = -Math.PI / 2;
  head.scale.y = 0.6;
  p.add(head);
  return p;
}
function buildNamul() { // 삼색나물
  const p = jegiPlate(0.24, 0.11);
  [[0x4a7040, -0.09], [0x8a6a3a, 0], [0xdcd6c0, 0.09]].forEach(([col, x]) => {
    const mound = mesh(new THREE.SphereGeometry(0.075, 14, 10), std(col, { roughness: 0.9 }), x, p.userData.topY + 0.03, 0);
    mound.scale.set(0.85, 0.55, 1);
    p.add(mound);
  });
  return p;
}
function buildKimchi() { // 나박김치 (하얀 김치 + 국물)
  const p = jegiBowl(0.17, 0.09);
  p.add(liquid(p.userData.innerR, p.userData.topY - 0.015, 0xe8dfd2));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    p.add(mesh(new THREE.BoxGeometry(0.045, 0.012, 0.045), std(0xf4efe2), Math.cos(a) * 0.06, p.userData.topY - 0.006, Math.sin(a) * 0.06));
  }
  return p;
}
function buildSikhye() { // 식혜 — 밥알 동동
  const p = jegiBowl(0.18, 0.1);
  p.add(liquid(p.userData.innerR, p.userData.topY - 0.014, 0xd9b878));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.4;
    const r = 0.04 + (i % 3) * 0.03;
    const grain = mesh(new THREE.SphereGeometry(0.009, 6, 5), std(0xfdf8ea), Math.cos(a) * r, p.userData.topY - 0.007, Math.sin(a) * r);
    grain.castShadow = false;
    p.add(grain);
  }
  return p;
}
function buildDaechu() {
  const p = jegiPlate(0.2, 0.13);
  return pileOnPlate(p, () => {
    const d = mesh(new THREE.SphereGeometry(0.035, 10, 8), std(0x8c2f1e, { roughness: 0.45 }));
    d.scale.set(1, 1.35, 1);
    return d;
  }, 3, 0.042);
}
function buildBam() {
  const p = jegiPlate(0.2, 0.13);
  return pileOnPlate(p, () => {
    const b = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.042, 10, 8), std(0x6d4526, { roughness: 0.5 }));
    body.scale.set(1, 0.92, 0.8);
    const base = mesh(new THREE.CylinderGeometry(0.03, 0.033, 0.02, 10), std(0xcbb693), 0, -0.032, 0);
    b.add(body, base);
    return b;
  }, 3, 0.048);
}
function buildGyeran() {
  const p = jegiPlate(0.2, 0.13);
  return pileOnPlate(p, () => {
    const e = mesh(new THREE.SphereGeometry(0.04, 12, 10), std(0xf3ead2, { roughness: 0.4 }));
    e.scale.set(0.85, 1, 0.85);
    return e;
  }, 3, 0.046);
}
function buildBae() {
  const p = jegiPlate(0.24, 0.14);
  return pileOnPlate(p, () => {
    const b = new THREE.Group();
    b.add(mesh(new THREE.SphereGeometry(0.075, 14, 12), std(0xd9c27a, { roughness: 0.55 })));
    b.add(mesh(new THREE.CylinderGeometry(0.005, 0.007, 0.04, 6), std(0x5a4326), 0, 0.08, 0));
    return b;
  }, 2, 0.078);
}
function buildGotgam() {
  const p = jegiPlate(0.2, 0.13);
  return pileOnPlate(p, () => {
    const d = mesh(new THREE.SphereGeometry(0.045, 12, 10), std(0xc06a28, { roughness: 0.55 }));
    d.scale.set(1, 0.55, 1);
    return d;
  }, 3, 0.04);
}
function buildSagwa() {
  const p = jegiPlate(0.24, 0.14);
  return pileOnPlate(p, () => {
    const a = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.068, 14, 12), std(0xb23a2a, { roughness: 0.4 }));
    body.scale.y = 0.92;
    a.add(body);
    a.add(mesh(new THREE.CylinderGeometry(0.005, 0.006, 0.035, 6), std(0x4a3620), 0, 0.07, 0));
    return a;
  }, 2, 0.07);
}
function buildYakgwa() {
  const p = jegiPlate(0.2, 0.13);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < (3 - i); j++) {
      const y = mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.028, 8),
        std(0xa5702f, { roughness: 0.5 }), (j - (2 - i) / 2) * 0.105, p.userData.topY + 0.018 + i * 0.032, 0);
      p.add(y);
    }
  }
  return p;
}

// ===================================================================
// 간편 제사상(현대) 음식 — 흰 도자기 접시/그릇 위에
// ===================================================================
const MAT_CERAMIC = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.35 });

function modernPlate(radius = 0.24) {
  const g = new THREE.Group();
  const pts = [
    new THREE.Vector2(0, 0.015),
    new THREE.Vector2(radius * 0.62, 0.02),
    new THREE.Vector2(radius * 0.95, 0.06),
    new THREE.Vector2(radius, 0.075),
  ];
  g.add(mesh(new THREE.LatheGeometry(pts, 26), MAT_CERAMIC));
  g.userData.topY = 0.035;
  return g;
}
function modernBowl(radius = 0.17) {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 9; i++) {
    const a = (i / 9) * Math.PI * 0.52;
    pts.push(new THREE.Vector2(Math.sin(a) * radius + radius * 0.15, (1 - Math.cos(a)) * radius * 1.15 + 0.01));
  }
  g.add(mesh(new THREE.LatheGeometry(pts, 26), MAT_CERAMIC));
  g.userData.topY = radius * 0.85;
  g.userData.innerR = radius * 0.95;
  return g;
}
function canDrink(color) {
  return () => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.26, 20), std(color, { roughness: 0.35, metalness: 0.3 }), 0, 0.13, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.068, 0.075, 0.02, 20), std(0xd8d8d8, { metalness: 0.8, roughness: 0.3 }), 0, 0.27, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.068, 0.02, 20), std(0xd8d8d8, { metalness: 0.8, roughness: 0.3 }), 0, 0.01, 0));
    return g;
  };
}
function buildInstantBap() {
  const g = new THREE.Group();
  const cup = mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.09, 22), std(0xfdfaf0, { roughness: 0.5 }), 0, 0.045, 0);
  const rim = mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.018, 22), std(0xe8e2d0), 0, 0.095, 0);
  const rice = mesh(new THREE.SphereGeometry(0.115, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), std(0xfbf7ec, { roughness: 0.85 }), 0, 0.095, 0);
  rice.scale.y = 0.5;
  g.add(cup, rim, rice);
  return g;
}
function buildPizza() {
  const p = modernPlate(0.27);
  const dough = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 26), std(0xe0b060, { roughness: 0.7 }), 0, p.userData.topY + 0.02, 0);
  const cheese = mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.012, 26), std(0xf2cf6b, { roughness: 0.55 }), 0, p.userData.topY + 0.04, 0);
  p.add(dough, cheese);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.5;
    const r = 0.06 + (i % 3) * 0.045;
    p.add(mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.01, 12), std(0xa8342a, { roughness: 0.5 }),
      Math.cos(a) * r, p.userData.topY + 0.05, Math.sin(a) * r));
  }
  return p;
}
function buildChicken() {
  const p = modernPlate(0.26);
  const drum = (x, z, rot) => {
    const d = new THREE.Group();
    const meat = mesh(new THREE.SphereGeometry(0.06, 12, 10), std(0xc98b3e, { roughness: 0.8 }));
    meat.scale.set(1.25, 0.85, 0.9);
    const bone = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 8), std(0xf1e9d8), 0.085, 0.01, 0);
    bone.rotation.z = Math.PI / 2.3;
    d.add(meat, bone);
    d.position.set(x, p.userData.topY + 0.05, z);
    d.rotation.y = rot;
    return d;
  };
  p.add(drum(-0.07, 0.03, 0.4), drum(0.07, -0.04, 2.5), drum(0.01, 0.09, 4.2));
  const top = drum(0, 0, 1.2);
  top.position.y = p.userData.topY + 0.14;
  p.add(top);
  return p;
}
function buildJokbal() {
  const p = modernPlate(0.26);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const slice = new THREE.Group();
    const meat = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.022, 14), std(0x6e3f22, { roughness: 0.55 }));
    const center = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.024, 12), std(0xc79b74, { roughness: 0.6 }));
    slice.add(meat, center);
    slice.position.set(Math.cos(a) * 0.13, p.userData.topY + 0.015 + (i % 2) * 0.024, Math.sin(a) * 0.13);
    p.add(slice);
  }
  return p;
}
function buildMandu() {
  const p = modernPlate(0.24);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const m = mesh(new THREE.SphereGeometry(0.055, 12, 10), std(0xf5efdd, { roughness: 0.6 }),
      Math.cos(a) * (i < 5 ? 0.11 : 0), i < 5 ? p.userData.topY + 0.035 : p.userData.topY + 0.1, Math.sin(a) * (i < 5 ? 0.11 : 0));
    m.scale.set(1.15, 0.75, 0.7);
    m.rotation.y = a;
    p.add(m);
  }
  return p;
}
function buildTangsu() {
  const p = modernPlate(0.24);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = i < 6 ? 0.12 : 0.05;
    const y = i < 6 ? p.userData.topY + 0.035 : p.userData.topY + 0.09;
    const chunk = mesh(new THREE.SphereGeometry(0.042, 10, 8), std(0xd0862f, { roughness: 0.35 }),
      Math.cos(a) * r, y, Math.sin(a) * r);
    chunk.scale.set(1, 0.8, 0.9);
    p.add(chunk);
  }
  return p;
}
function buildGimbap() {
  const p = modernPlate(0.25);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const g2 = new THREE.Group();
    const roll = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.035, 16), std(0x1d1d18, { roughness: 0.5 }));
    const rice = mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.037, 16), std(0xf4efe0));
    const fill = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.039, 10), std(0xd8a34c));
    g2.add(roll, rice, fill);
    g2.position.set(Math.cos(a) * 0.13, p.userData.topY + 0.02, Math.sin(a) * 0.13);
    p.add(g2);
  }
  return p;
}
function buildCupRamen() {
  const g = new THREE.Group();
  const cup = mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.16, 20), std(0xf3ede0, { roughness: 0.6 }), 0, 0.08, 0);
  const band = mesh(new THREE.CylinderGeometry(0.112, 0.106, 0.05, 20), std(0xc8452f, { roughness: 0.5 }), 0, 0.055, 0);
  const noodle = mesh(new THREE.TorusGeometry(0.055, 0.018, 8, 20), std(0xe8c56a, { roughness: 0.7 }), 0, 0.165, 0);
  noodle.rotation.x = Math.PI / 2;
  g.add(cup, band, noodle);
  return g;
}
function buildEomukTang() {
  const p = modernBowl(0.18);
  p.add(liquid(p.userData.innerR, p.userData.topY - 0.015, 0xd9cba8));
  for (let i = 0; i < 3; i++) {
    const stick = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 6), std(0xd6c49a), -0.05 + i * 0.05, p.userData.topY + 0.06, i * 0.02 - 0.02);
    stick.rotation.z = 0.5 - i * 0.4;
    const em = mesh(new THREE.BoxGeometry(0.05, 0.015, 0.035), std(0xe5d3a8, { roughness: 0.7 }), -0.05 + i * 0.05, p.userData.topY - 0.005, i * 0.02 - 0.02);
    p.add(stick, em);
  }
  return p;
}
function buildMiyeokGuk() {
  const p = modernBowl(0.17);
  p.add(liquid(p.userData.innerR, p.userData.topY - 0.015, 0x9aa583));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.5;
    const wm = mesh(new THREE.BoxGeometry(0.05, 0.008, 0.03), std(0x3f5233, { roughness: 0.5 }),
      Math.cos(a) * 0.06, p.userData.topY - 0.008, Math.sin(a) * 0.06);
    wm.rotation.y = a;
    p.add(wm);
  }
  return p;
}
function buildChips() {
  const p = modernBowl(0.17);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const r = 0.04 + (i % 3) * 0.035;
    const chip = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.006, 12), std(0xe9c96e, { roughness: 0.6 }),
      Math.cos(a) * r, p.userData.topY - 0.02 + (i % 4) * 0.02, Math.sin(a) * r);
    chip.rotation.set((i % 3) * 0.4 - 0.4, a, (i % 2) * 0.3);
    p.add(chip);
  }
  return p;
}
function buildHotdog() {
  const p = modernPlate(0.24);
  [[-0.06, 0.35], [0.06, -0.3]].forEach(([z, rot], i) => {
    const h = new THREE.Group();
    const body = mesh(new THREE.CapsuleGeometry(0.045, 0.16, 6, 12), std(0xb5732f, { roughness: 0.65 }));
    body.rotation.z = Math.PI / 2;
    const stick = mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.14, 6), std(0xd6c49a), 0.17, 0, 0);
    stick.rotation.z = Math.PI / 2;
    const sauce = mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 14, Math.PI), std(0xc23a25), -0.03, 0.03, 0);
    sauce.rotation.x = Math.PI / 2.4;
    h.add(body, stick, sauce);
    h.position.set(0, p.userData.topY + 0.05 + i * 0.02, z);
    h.rotation.y = rot;
    p.add(h);
  });
  return p;
}
function buildJelly() {
  const p = modernBowl(0.15);
  const colors = [0xd8574f, 0xdf9c3e, 0x6fae5a, 0x8464b8, 0xd8574f, 0x4f8fd8, 0xdf9c3e];
  colors.forEach((c, i) => {
    const a = (i / colors.length) * Math.PI * 2;
    const b = mesh(new THREE.SphereGeometry(0.028, 10, 8), std(c, { roughness: 0.25 }),
      Math.cos(a) * 0.06, p.userData.topY - 0.015 + (i % 2) * 0.03, Math.sin(a) * 0.06);
    b.scale.y = 0.8;
    p.add(b);
  });
  return p;
}
function buildChoco() {
  const p = modernPlate(0.2);
  for (let i = 0; i < 2; i++) {
    const bar = new THREE.Group();
    for (let r2 = 0; r2 < 2; r2++) {
      for (let c = 0; c < 4; c++) {
        bar.add(mesh(new THREE.BoxGeometry(0.045, 0.02, 0.045), std(0x4a2c18, { roughness: 0.4 }),
          -0.075 + c * 0.05, 0, -0.025 + r2 * 0.05));
      }
    }
    bar.position.set(0, p.userData.topY + 0.012 + i * 0.024, i * 0.03 - 0.015);
    bar.rotation.y = i * 0.25;
    p.add(bar);
  }
  return p;
}
function buildStrawberry() {
  const p = modernPlate(0.22);
  return pileOnPlate(p, () => {
    const s = new THREE.Group();
    const body = mesh(new THREE.ConeGeometry(0.035, 0.06, 10), std(0xc4302b, { roughness: 0.45 }));
    body.rotation.x = Math.PI;
    const leaf = mesh(new THREE.ConeGeometry(0.02, 0.018, 6), std(0x4a7040), 0, 0.035, 0);
    s.add(body, leaf);
    return s;
  }, 3, 0.038);
}
function buildBanana() {
  const p = modernPlate(0.24);
  for (let i = 0; i < 4; i++) {
    const b = mesh(new THREE.TorusGeometry(0.09, 0.024, 8, 14, Math.PI * 0.85), std(0xe8cf5a, { roughness: 0.55 }));
    b.position.set(-0.04 + (i % 2) * 0.08, p.userData.topY + 0.03 + Math.floor(i / 2) * 0.045, -0.03 + (i % 2) * 0.06);
    b.rotation.set(Math.PI / 2.15, 0, (i % 2) * 0.7 + 0.4);
    p.add(b);
  }
  return p;
}
function buildCake() {
  const p = modernPlate(0.22);
  const wedge = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 20, 1, false, 0, Math.PI / 2.6), std(0xfaf3e2, { roughness: 0.5 }), -0.04, p.userData.topY + 0.05, -0.04);
  const layer = mesh(new THREE.CylinderGeometry(0.148, 0.148, 0.02, 20, 1, false, 0, Math.PI / 2.6), std(0xd88a94), -0.04, p.userData.topY + 0.05, -0.04);
  const berry = mesh(new THREE.SphereGeometry(0.028, 10, 8), std(0xc4302b, { roughness: 0.4 }), 0.02, p.userData.topY + 0.12, 0.02);
  p.add(wedge, layer, berry);
  return p;
}
function buildMacaron() {
  const p = modernPlate(0.2);
  const colors = [0xe8a4b8, 0xa4c8e8, 0xc8e0a0, 0xf0d090, 0xd0b0e0];
  colors.forEach((c, i) => {
    const a = (i / colors.length) * Math.PI * 2;
    const m = new THREE.Group();
    const top = mesh(new THREE.SphereGeometry(0.038, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(c, { roughness: 0.5 }), 0, 0.012, 0);
    top.scale.y = 0.55;
    const bottom = top.clone();
    bottom.rotation.x = Math.PI;
    bottom.position.y = -0.012;
    const cream = mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.012, 14), std(0xfdf6e3), 0, 0, 0);
    m.add(top, bottom, cream);
    const rr = i < 4 ? 0.1 : 0;
    m.position.set(Math.cos(a) * rr, (i < 4 ? p.userData.topY + 0.035 : p.userData.topY + 0.1), Math.sin(a) * rr);
    p.add(m);
  });
  return p;
}

// ===================================================================
export const BUILDERS = {
  // 준비물
  byeongpung: buildByeongpung,
  dotjari: buildDotjari,
  sang: buildSang,
  jibang: buildJibang,
  chotdae: buildChotdae,
  hyangsang: buildHyangsang,
  // 음식
  songpyeon: buildSongpyeon,
  guk: buildGuk,
  sulJan: buildSulJan,
  sijeop: buildSijeop,
  jeon: buildJeon,
  yukjeok: buildYukjeok,
  sojeok: buildSojeok,
  eojeok: buildEojeok,
  eojeon: buildEojeon,
  tang: buildTangFactory(0xb9a684, 0xe9e2cc),
  po: buildPo,
  namul: buildNamul,
  kimchi: buildKimchi,
  sikhye: buildSikhye,
  daechu: buildDaechu,
  bam: buildBam,
  bae: buildBae,
  gotgam: buildGotgam,
  sagwa: buildSagwa,
  yakgwa: buildYakgwa,
  gyeran: buildGyeran,
  // 간편 제사상(현대)
  instantBap: buildInstantBap,
  cola: canDrink(0xb02318),
  cider: canDrink(0x3f9e4d),
  pizza: buildPizza,
  chicken: buildChicken,
  jokbal: buildJokbal,
  mandu: buildMandu,
  tangsu: buildTangsu,
  gimbap: buildGimbap,
  cupRamen: buildCupRamen,
  eomukTang: buildEomukTang,
  miyeokGuk: buildMiyeokGuk,
  chips: buildChips,
  hotdog: buildHotdog,
  jelly: buildJelly,
  choco: buildChoco,
  strawberry: buildStrawberry,
  banana: buildBanana,
  cake: buildCake,
  macaron: buildMacaron,
};

MYFAMILY_JIBANG_PAIRS.forEach((_, i) => {
  BUILDERS[`jibang_mf_${i}`] = () => buildMyFamilyJibang(i);
});
BUILDERS.wipae = buildWipae;

export function buildModel(key) {
  const fn = BUILDERS[key];
  if (!fn) throw new Error(`unknown model: ${key}`);
  return fn();
}
