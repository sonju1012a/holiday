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

// 다음 열로 건너뛰기 (스킵)
document.getElementById('btn-skip-row').addEventListener('click', () => {
  game.skipRow();
});

// 정답 보기 (감점 없음)
document.getElementById('btn-show-answer').addEventListener('click', () => {
  game.showAnswer();
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

// 우리집 차례상 등록 요청 — 앱인토스 웹뷰에서 mailto 스킴이 막힐 수 있어
// 이메일 앱 이동 대신 주소를 복사해 주는 방식으로 대체
const $request = document.getElementById('request-charye');
const REQUEST_EMAIL = 'sonju1012jja@gmail.com';
$request.addEventListener('click', async (e) => {
  e.preventDefault();
  const original = $request.textContent;
  try {
    await navigator.clipboard.writeText(REQUEST_EMAIL);
    $request.textContent = `✅ ${REQUEST_EMAIL} 복사됨! 메일 앱에 붙여넣어 보내주세요`;
  } catch (_) {
    window.location.href = $request.href; // 클립보드 API를 못 쓰면 mailto로 폴백
  }
  setTimeout(() => { $request.textContent = original; }, 3000);
});
