import { createWorld } from './scene.js';
import { UI } from './ui.js';
import { Shop, openExternal } from './shop.js';
import { Sfx } from './audio.js';
import { Game } from './game.js';

const world = createWorld(document.getElementById('app'));
const ui = new UI();
const shop = new Shop();
const sfx = new Sfx();
const game = new Game(world, ui, shop, sfx);

// 인트로 — 모드 선택으로 시작
document.querySelectorAll('.mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.getElementById('modal-intro').classList.add('hidden');
    sfx.select(); // 사용자 제스처로 AudioContext 활성화
    game.start(btn.dataset.mode);
  });
});

// 소리 토글
const $sound = document.getElementById('btn-sound');
$sound.addEventListener('click', () => {
  sfx.enabled = !sfx.enabled;
  $sound.textContent = sfx.enabled ? '🔊' : '🔇';
});

// 다시하기 (쇼핑 참여 기록은 세션 동안 유지)
document.getElementById('btn-replay').addEventListener('click', () => {
  window.location.reload();
});

// 온라인 차례지내기 외부 링크 — online-charye 프로젝트 배포 주소로 교체하세요
document.getElementById('btn-online-charye').addEventListener('click', (e) => {
  e.preventDefault();
  openExternal(e.currentTarget.href); // 앱인토스 안에서는 openURL 브릿지 사용
});
