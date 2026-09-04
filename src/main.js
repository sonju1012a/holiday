import { createWorld } from './scene.js';
import { UI } from './ui.js';
import { Shop, openExternal } from './shop.js';
import { Sfx } from './audio.js';
import { Game, loadBest } from './game.js';
import { ONLINE_CHARYE_URL } from './env.js';
import { Nav } from './nav.js';

const world = createWorld(document.getElementById('app'));
const ui = new UI();
const shop = new Shop();
const sfx = new Sfx();
const game = new Game(world, ui, shop, sfx);
const nav = new Nav({ isDone: () => game.phase === 'done' });

// 인트로 — 모드 선택으로 시작 (모드별 최고 기록 별점 배지 표시)
document.querySelectorAll('.mode-btn').forEach((btn) => {
  const best = loadBest(btn.dataset.mode);
  if (best) {
    const badge = document.createElement('span');
    badge.className = 'mode-best';
    badge.title = `최고 기록 ${best.score}점`;
    badge.textContent = '★'.repeat(best.stars) + '☆'.repeat(3 - best.stars);
    btn.appendChild(badge);
  }
  btn.addEventListener('click', () => {
    document.getElementById('modal-intro').classList.add('hidden');
    sfx.select(); // 사용자 제스처로 AudioContext 활성화
    shop.setMode(btn.dataset.mode);
    nav.enterGame(); // 백버튼 → 종료 확인 모달
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

// 처음 화면으로 (게임 중이면 종료 확인 모달)
document.getElementById('btn-home').addEventListener('click', () => nav.requestExit());

// 백그라운드 전환 시 사운드·진동 즉시 정지, 복귀 시 재생 가능 (앱인토스 체크리스트)
const onVisibility = () => (document.visibilityState === 'hidden' ? sfx.suspend() : sfx.resume());
document.addEventListener('visibilitychange', onVisibility);
window.addEventListener('pagehide', () => sfx.suspend());
window.addEventListener('pageshow', () => { if (document.visibilityState !== 'hidden') sfx.resume(); });
window.addEventListener('blur', () => sfx.suspend());
window.addEventListener('focus', () => { if (document.visibilityState !== 'hidden') sfx.resume(); });

// 소리 토글
const $sound = document.getElementById('btn-sound');
$sound.addEventListener('click', () => {
  sfx.enabled = !sfx.enabled;
  if (sfx.enabled) sfx.resume();
  $sound.textContent = sfx.enabled ? '🔊' : '🔇';
});

// 다시하기 (쇼핑 참여 기록은 세션 동안 유지)
document.getElementById('btn-replay').addEventListener('click', () => {
  window.location.reload();
});

// 온라인 차례지내기 외부 링크 — .env 의 VITE_ONLINE_CHARYE_URL 이 있을 때만 버튼 노출
// (앱인토스 빌드는 '자사 서비스 이동 유도 금지' 조항 때문에 기본 숨김)
const $online = document.getElementById('btn-online-charye');
if (ONLINE_CHARYE_URL) {
  $online.href = ONLINE_CHARYE_URL;
  $online.classList.remove('hidden');
  $online.addEventListener('click', (e) => {
    e.preventDefault();
    openExternal(ONLINE_CHARYE_URL); // 앱인토스 안에서는 openURL 브릿지 사용
  });
}

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
