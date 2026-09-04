// ===================================================================
// 빌드 타깃 분기 — .env(웹) / .env.toss(앱인토스 번들) 값에서 읽습니다.
//   npm run build       → .env       (VITE_TARGET=web)
//   npm run build:toss  → .env.toss  (VITE_TARGET=toss)  ← granite 번들도 이 명령을 사용
// ===================================================================
const env = import.meta.env;

/** 앱인토스 미니앱 번들 빌드인지 */
export const IS_TOSS = env.VITE_TARGET === 'toss';

/** 게임 중간 쇼핑 추천 토스트 노출 여부 (앱인토스 빌드는 기본 끔) */
export const SHOP_TOASTS = IS_TOSS ? env.VITE_SHOP_TOASTS === '1' : env.VITE_SHOP_TOASTS !== '0';

/** 완성 화면 '온라인 차례지내기' 외부 링크. 빈 문자열이면 버튼 숨김 */
export const ONLINE_CHARYE_URL = (env.VITE_ONLINE_CHARYE_URL || '').trim();
