// ===================================================================
// 3D 월드 — 렌더러 / 카메라 / 조명 / 한옥 대청 느낌의 방
// ===================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createWorld(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e1610);
  scene.fog = new THREE.Fog(0x1e1610, 14, 26);

  // 환경맵 — 놋그릇(유기)·촛대 같은 금속 재질이 실제로 반사광을 받아 반짝이게 함.
  // 조명만으로는 metalness 재질이 어둡고 탁하게 보이기 때문에 PBR에는 필수.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55; // 한옥 실내의 은은한 분위기를 유지하도록 약하게
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.set(0, 4.4, 6.4);

  // 세로 화면(모바일)에서는 시야각을 넓혀 상 전체가 보이게 함
  const applyResponsiveFov = () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.fov = aspect < 1 ? Math.min(46 + (1 - aspect) * 40, 74) : 46;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  };
  applyResponsiveFov();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.85, -0.6);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 3.2;
  controls.maxDistance = 11;
  controls.minPolarAngle = 0.28;
  controls.maxPolarAngle = 1.38;
  controls.minAzimuthAngle = -1.05;
  controls.maxAzimuthAngle = 1.05;
  controls.enablePan = false;

  // ---------- 조명 ----------
  scene.add(new THREE.AmbientLight(0xffe6c4, 0.42));
  const hemi = new THREE.HemisphereLight(0xfff2dc, 0x2a1c10, 0.5);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffe0b0, 1.65);
  key.position.set(4, 7, 5);
  key.castShadow = true;
  // 모바일(터치 기기)에서는 그림자 해상도를 낮춰 성능 확보
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  key.shadow.mapSize.set(isCoarse ? 1024 : 2048, isCoarse ? 1024 : 2048);
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 7;
  key.shadow.camera.bottom = -7;
  key.shadow.bias = -0.0004;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xb0c8ff, 0.32);
  fill.position.set(-5, 4, 2);
  scene.add(fill);

  // ---------- 방 (한옥 대청) ----------
  const room = new THREE.Group();
  // 마루 바닥 (널판 텍스처)
  const floorTex = (() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#7a5433';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8; i++) {
      const y = i * 64;
      ctx.fillStyle = i % 2 ? '#714c2d' : '#7d5735';
      ctx.fillRect(0, y, 512, 64);
      ctx.strokeStyle = 'rgba(40,24,12,0.7)';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, y, 512, 64);
      // 나뭇결
      ctx.strokeStyle = 'rgba(60,38,20,0.35)';
      ctx.lineWidth = 1;
      for (let k = 0; k < 5; k++) {
        ctx.beginPath();
        ctx.moveTo(0, y + 10 + k * 11);
        for (let x = 0; x <= 512; x += 32) {
          ctx.lineTo(x, y + 10 + k * 11 + Math.sin(x * 0.02 + i * 3 + k) * 3);
        }
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  })();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);

  // 뒷벽 (한지 창살문 느낌)
  const wallTex = (() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(0, 0, 512, 256);
    // 창호지 문 4짝
    for (let d = 0; d < 4; d++) {
      const x0 = 20 + d * 122;
      ctx.fillStyle = '#e9ddbe';
      ctx.fillRect(x0, 24, 104, 208);
      ctx.strokeStyle = '#4a3520';
      ctx.lineWidth = 5;
      ctx.strokeRect(x0, 24, 104, 208);
      ctx.lineWidth = 2;
      for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x0 + i * 26, 24); ctx.lineTo(x0 + i * 26, 232); ctx.stroke(); }
      for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(x0, 24 + i * 26); ctx.lineTo(x0 + 104, 24 + i * 26); ctx.stroke(); }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 7.5),
    new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 })
  );
  backWall.position.set(0, 3.75, -6.5);
  room.add(backWall);

  const sideMat = new THREE.MeshStandardMaterial({ color: 0x332417, roughness: 0.95 });
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 7.5), sideMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-9, 3.75, 0);
  const rightWall = leftWall.clone();
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.x = 9;
  room.add(leftWall, rightWall);

  // 천장 — 대들보·서까래가 보이는 한옥 대청 느낌 (카메라가 낮아질 때 상단에 드러남)
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: 0.95 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 6.2;
  room.add(ceiling);
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x3a2716, roughness: 0.85 });
  const girder = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.42, 0.5), beamMat); // 대들보
  girder.position.set(0, 5.95, -1.2);
  room.add(girder);
  for (let i = -6; i <= 6; i++) { // 서까래
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 14), beamMat);
    rafter.position.set(i * 1.45, 6.08, -0.5);
    room.add(rafter);
  }
  // 기둥 (양옆)
  const pillarGeo = new THREE.CylinderGeometry(0.22, 0.25, 6.2, 14);
  [[-6.8, -5.9], [6.8, -5.9], [-8.6, 3.2], [8.6, 3.2]].forEach(([x, z]) => {
    const pillar = new THREE.Mesh(pillarGeo, beamMat);
    pillar.position.set(x, 3.1, z);
    pillar.castShadow = true;
    room.add(pillar);
  });
  scene.add(room);

  // ---------- 애니메이션 루프 ----------
  const animatables = new Set();
  const clock = new THREE.Clock();
  let onTick = null;

  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    controls.update();
    animatables.forEach((obj) => obj.userData.tick && obj.userData.tick(dt, t));
    if (onTick) onTick(dt, t);
    renderer.render(scene, camera);
  }
  loop();

  window.addEventListener('resize', () => {
    applyResponsiveFov();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    scene, camera, renderer, controls,
    registerAnimatable: (obj) => animatables.add(obj),
    unregisterAnimatable: (obj) => animatables.delete(obj),
    setTick: (fn) => { onTick = fn; },
  };
}
