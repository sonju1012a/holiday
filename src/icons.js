// ===================================================================
// 전통 차례상 SVG 아이콘 — 이모지 대신 놋제기(유기) 위에 담긴 제수 그림
// 팔레트: 놋쇠 #b5883b / 진한 놋쇠 #8a6528 / 먹 #2b2018 / 한지 #fdf6e3 / 단청홍 #b3392c
// ===================================================================

const S = (body) => `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

// 굽 달린 놋제기 (접시형) — 음식은 y 8~24 영역에 그림
const JEGI = `
  <ellipse cx="20" cy="25" rx="12" ry="3.2" fill="#b5883b"/>
  <ellipse cx="20" cy="24.2" rx="12" ry="3" fill="#c99a49"/>
  <path d="M17.5 27 L22.5 27 L24.5 33 L15.5 33 Z" fill="#a1782f"/>
  <rect x="13.5" y="33" width="13" height="2.4" rx="1.2" fill="#8a6528"/>`;

// 굽 달린 놋탕기 (볼형) — 국물 음식용
const BOWL = `
  <path d="M8 16 a12 9 0 0 0 24 0 Z" fill="#b5883b"/>
  <path d="M8 16 a12 2.8 0 0 0 24 0 a12 2.8 0 0 0 -24 0" fill="#8a6528"/>
  <path d="M17.5 24.6 L22.5 24.6 L24 31 L16 31 Z" fill="#a1782f"/>
  <rect x="14" y="31" width="12" height="2.4" rx="1.2" fill="#8a6528"/>`;

const STEAM = `
  <path d="M16 10 q-1.5 -2.5 0 -5 M20 9 q1.5 -2.5 0 -5 M24 10 q-1.5 -2.5 0 -5"
    fill="none" stroke="#c9b896" stroke-width="1.4" stroke-linecap="round" opacity="0.9"/>`;

export const ICONS = {
  // ================= 준비물 =================
  byeongpung: S(`
    <g stroke="#3e2614" stroke-width="1.2">
      <path d="M5 8 L11 6.5 L11 33 L5 34.5 Z" fill="#f2e9d2"/>
      <path d="M11 6.5 L17 8 L17 33 L11 33 Z" fill="#e7dcc0"/>
      <path d="M17 8 L23 6.5 L23 33 L17 33 Z" fill="#f2e9d2"/>
      <path d="M23 6.5 L29 8 L29 33 L23 33 Z" fill="#e7dcc0"/>
      <path d="M29 8 L35 6.5 L35 33 L29 34.5 Z" fill="#f2e9d2"/>
    </g>
    <path d="M6.5 24 q3 -5 5.5 0 M18 22 q3 -6 5.5 0 M30 24 q2.5 -5 4.5 0" fill="none" stroke="#6b5a45" stroke-width="1.1"/>
    <circle cx="14" cy="12" r="1.6" fill="#b3392c"/><circle cx="26" cy="12" r="1.6" fill="#b3392c"/>`),
  dotjari: S(`
    <path d="M5 14 L35 14 L38 30 L2 30 Z" fill="#d9c48f"/>
    <path d="M5 14 L35 14 L35.6 17 L4.4 17 Z" fill="#27405c"/>
    <path d="M3 27 L37 27 L38 30 L2 30 Z" fill="#27405c"/>
    <g stroke="#b09a63" stroke-width="1">
      <path d="M4.7 19.5 H35.3 M4.3 22 H35.7 M3.9 24.5 H36.1"/>
    </g>`),
  sang: S(`
    <rect x="3" y="14" width="34" height="5" rx="1.5" fill="#5c3a21"/>
    <rect x="2" y="18" width="36" height="2.6" rx="1.3" fill="#3e2614"/>
    <rect x="6" y="20.5" width="3" height="12" fill="#3e2614"/>
    <rect x="31" y="20.5" width="3" height="12" fill="#3e2614"/>
    <rect x="8" y="26" width="24" height="2" fill="#4a2d18"/>`),
  jibang: S(`
    <rect x="13" y="4" width="14" height="32" rx="1.5" fill="#3e2614"/>
    <rect x="15.5" y="6.5" width="9" height="27" fill="#fffdf4"/>
    <g fill="#2b2018">
      <rect x="18.5" y="9" width="3" height="2"/><rect x="18.5" y="13" width="3" height="2"/>
      <rect x="18.5" y="17" width="3" height="2"/><rect x="18.5" y="21" width="3" height="2"/>
      <rect x="18.5" y="25" width="3" height="2"/><rect x="18.5" y="29" width="3" height="2"/>
    </g>`),
  chotdae: S(`
    <path d="M20 12 q-3 3.5 0 6 q3 -2.5 0 -6" fill="#e8912d"/>
    <path d="M20 14.5 q-1.3 1.8 0 3 q1.3 -1.2 0 -3" fill="#f7c95c"/>
    <rect x="17.8" y="18" width="4.4" height="8" rx="1" fill="#f3ead0"/>
    <path d="M16 26 L24 26 L22.5 28.5 L17.5 28.5 Z" fill="#b5883b"/>
    <rect x="19" y="28.5" width="2" height="5" fill="#a1782f"/>
    <ellipse cx="20" cy="34.5" rx="6" ry="1.8" fill="#8a6528"/>`),
  hyangsang: S(`
    <ellipse cx="20" cy="13.5" rx="7" ry="2" fill="#8a6528"/>
    <path d="M13 13.5 a7 5.5 0 0 0 14 0 Z" fill="#b5883b"/>
    <path d="M14.5 20 l-1.5 3 M20 20.5 l0 3 M25.5 20 l1.5 3" stroke="#8a6528" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M17 10 q-1.5 -3 0 -6 M23 10 q1.5 -3 0 -6" fill="none" stroke="#c9b896" stroke-width="1.4" stroke-linecap="round"/>
    <rect x="6" y="26" width="28" height="3.5" rx="1.2" fill="#5c3a21"/>
    <rect x="9" y="29.5" width="2.6" height="6" fill="#3e2614"/>
    <rect x="28.4" y="29.5" width="2.6" height="6" fill="#3e2614"/>`),

  // ================= 1열 =================
  songpyeon: S(`${JEGI}
    <path d="M11 22 a5 5 0 0 1 9 -2 q-4.5 4 -9 2" fill="#f2ecd8" stroke="#dfd5b8" stroke-width="0.8"/>
    <path d="M20 22 a5 5 0 0 1 9 -2 q-4.5 4 -9 2" fill="#a8c69a" stroke="#8fb282" stroke-width="0.8"/>
    <path d="M15 16.5 a5 5 0 0 1 9 -2 q-4.5 4 -9 2" fill="#d8a8b8" stroke="#c493a5" stroke-width="0.8"/>`),
  guk: S(`${STEAM}${BOWL}
    <ellipse cx="20" cy="16" rx="10.5" ry="2.2" fill="#c8b494"/>
    <rect x="21" y="14.6" width="4" height="1.8" rx="0.6" fill="#f4efdf"/>`),
  sulJan: S(`
    <ellipse cx="20" cy="30" rx="9" ry="2.4" fill="#8a6528"/>
    <ellipse cx="20" cy="29" rx="9" ry="2.4" fill="#b5883b"/>
    <path d="M14.5 15 L25.5 15 L23.5 27 L16.5 27 Z" fill="#c99a49"/>
    <ellipse cx="20" cy="15" rx="5.5" ry="1.6" fill="#e8dcc0"/>`),
  sijeop: S(`
    <rect x="5" y="24" width="30" height="5" rx="2" fill="#b5883b"/>
    <rect x="5" y="27" width="30" height="2.6" rx="1.3" fill="#8a6528"/>
    <ellipse cx="12" cy="10" rx="2.8" ry="3.6" fill="#c99a49"/>
    <rect x="11" y="13" width="2" height="11" rx="1" fill="#c99a49"/>
    <rect x="20" y="7" width="1.8" height="17" rx="0.9" fill="#a1782f"/>
    <rect x="24.5" y="7" width="1.8" height="17" rx="0.9" fill="#a1782f"/>`),

  // ================= 2열 =================
  jeon: S(`${JEGI}
    <ellipse cx="20" cy="21" rx="9.5" ry="3" fill="#b57c3e"/>
    <ellipse cx="20" cy="18" rx="9.5" ry="3" fill="#c98d4e"/>
    <ellipse cx="20" cy="15" rx="9.5" ry="3" fill="#d99f60"/>
    <circle cx="16" cy="14.5" r="0.9" fill="#a76a30"/><circle cx="23" cy="15.5" r="0.9" fill="#a76a30"/>`),
  yukjeok: S(`${JEGI}
    <rect x="8" y="19" width="24" height="4" rx="1.6" fill="#7a4a2c"/>
    <rect x="9" y="14.5" width="22" height="4" rx="1.6" fill="#8d5636"/>
    <rect x="10" y="10" width="20" height="4" rx="1.6" fill="#7a4a2c"/>
    <rect x="6" y="15.7" width="28" height="1.4" rx="0.7" fill="#d6c49a"/>`),
  sojeok: S(`${JEGI}
    <g stroke="#e3dabf" stroke-width="0.8">
      <rect x="10" y="18" width="9" height="5" rx="1" fill="#f1e9cf"/>
      <rect x="21" y="18" width="9" height="5" rx="1" fill="#f1e9cf"/>
      <rect x="12.5" y="12.5" width="9" height="5" rx="1" fill="#f7f0da"/>
      <rect x="19" y="12.5" width="9" height="5" rx="1" fill="#f1e9cf"/>
    </g>`),
  eojeon: S(`${JEGI}
    <ellipse cx="14" cy="20.5" rx="6" ry="3.4" fill="#e3b953"/>
    <ellipse cx="26" cy="20.5" rx="6" ry="3.4" fill="#d9ae48"/>
    <ellipse cx="20" cy="14.5" rx="6" ry="3.4" fill="#eec463"/>
    <circle cx="18" cy="14" r="0.8" fill="#c39a38"/><circle cx="22.5" cy="15" r="0.8" fill="#c39a38"/>`),
  eojeok: S(`${JEGI}
    <ellipse cx="21" cy="17" rx="9" ry="4.2" fill="#9f8b62"/>
    <path d="M13 17 L7 13.5 L8.5 17 L7 20.5 Z" fill="#8a7752"/>
    <circle cx="26.5" cy="16" r="1" fill="#2b2018"/>
    <path d="M17 15.5 q2 1.5 0 3 M21 15 q2 2 0 4" fill="none" stroke="#877450" stroke-width="0.9"/>`),

  // ================= 3열 =================
  tang: S(`${STEAM}${BOWL}
    <ellipse cx="20" cy="16" rx="10.5" ry="2.2" fill="#b9a684"/>
    <rect x="14" y="14.7" width="4" height="2" rx="0.7" fill="#e9e2cc"/>
    <circle cx="24" cy="15.8" r="1.5" fill="#d9cdb0"/>`),

  // ================= 4열 =================
  po: S(`${JEGI}
    <path d="M9 20 L28 20 L31 22.5 L28 24 L9 24 Z" fill="#cbb27f"/>
    <path d="M10 15.5 L29 15.5 L32 18 L29 19.5 L10 19.5 Z" fill="#d8c08e"/>
    <path d="M11 11 L30 11 L33 13.5 L30 15 L11 15 Z" fill="#e2cc9d"/>
    <path d="M14 12.5 h13 M13 17 h13" stroke="#bfa877" stroke-width="0.8"/>`),
  namul: S(`${JEGI}
    <path d="M8.5 22 a5.5 5 0 0 1 11 0 Z" fill="#4a7040"/>
    <path d="M14.5 17 a5.5 5 0 0 1 11 0 Z" fill="#8a6a3a"/>
    <path d="M20.5 22 a5.5 5 0 0 1 11 0 Z" fill="#dcd6c0"/>
    <path d="M11 19.5 q1.5 -2 3 0 M17 14.5 q1.5 -2 3 0 M23 19.5 q1.5 -2 3 0" fill="none" stroke="rgba(43,32,24,0.35)" stroke-width="0.9"/>`),
  kimchi: S(`${BOWL}
    <ellipse cx="20" cy="16" rx="10.5" ry="2.2" fill="#e8dfd2"/>
    <rect x="13" y="14.6" width="4.5" height="2.2" rx="0.6" fill="#f4efe2" stroke="#d8cdb9" stroke-width="0.5"/>
    <rect x="22" y="14.8" width="4.5" height="2.2" rx="0.6" fill="#f4efe2" stroke="#d8cdb9" stroke-width="0.5"/>
    <path d="M19 13.5 q1 -2.5 3 -3" fill="none" stroke="#8fae7a" stroke-width="1.3" stroke-linecap="round"/>`),
  sikhye: S(`${BOWL}
    <ellipse cx="20" cy="16" rx="10.5" ry="2.2" fill="#d9b878"/>
    <g fill="#fdf8ea">
      <circle cx="14" cy="15.8" r="0.9"/><circle cx="18" cy="16.6" r="0.9"/>
      <circle cx="22" cy="15.4" r="0.9"/><circle cx="26" cy="16.3" r="0.9"/><circle cx="20" cy="14.9" r="0.9"/>
    </g>`),

  // ================= 5열 =================
  daechu: S(`${JEGI}
    <g fill="#8c2f1e" stroke="#6d2416" stroke-width="0.6">
      <ellipse cx="13" cy="21" rx="3.2" ry="4"/>
      <ellipse cx="20" cy="21.5" rx="3.2" ry="4"/>
      <ellipse cx="27" cy="21" rx="3.2" ry="4"/>
      <ellipse cx="16.5" cy="14.5" rx="3.2" ry="4"/>
      <ellipse cx="23.5" cy="14.5" rx="3.2" ry="4"/>
    </g>
    <path d="M16 12 l0.8 -1.8 M23 12 l0.8 -1.8" stroke="#4a3620" stroke-width="0.9"/>`),
  bam: S(`${JEGI}
    <g stroke="#4f3018" stroke-width="0.6">
      <path d="M13 23 a4 4 0 0 1 -4.5 -4 q2 -3.5 4.5 -4 q2.5 0.5 4.5 4 a4 4 0 0 1 -4.5 4" fill="#6d4526"/>
      <path d="M27 23 a4 4 0 0 1 -4.5 -4 q2 -3.5 4.5 -4 q2.5 0.5 4.5 4 a4 4 0 0 1 -4.5 4" fill="#7a4e2b"/>
      <path d="M20 16.5 a4 4 0 0 1 -4.5 -4 q2 -3.5 4.5 -4 q2.5 0.5 4.5 4 a4 4 0 0 1 -4.5 4" fill="#6d4526"/>
    </g>
    <ellipse cx="13" cy="22.5" rx="2.6" ry="1" fill="#cbb693"/>
    <ellipse cx="27" cy="22.5" rx="2.6" ry="1" fill="#cbb693"/>`),
  bae: S(`${JEGI}
    <circle cx="20" cy="16" r="8" fill="#d9c27a"/>
    <circle cx="17" cy="13.5" r="2.2" fill="#e5d190" opacity="0.8"/>
    <path d="M20 8 q0.5 -3 2.5 -4" fill="none" stroke="#5a4326" stroke-width="1.5" stroke-linecap="round"/>
    <g fill="#c2ab62"><circle cx="23" cy="17.5" r="0.6"/><circle cx="19" cy="19.5" r="0.6"/><circle cx="24.5" cy="13" r="0.6"/></g>`),
  gotgam: S(`${JEGI}
    <ellipse cx="20" cy="21" rx="8" ry="3" fill="#a85520"/>
    <ellipse cx="20" cy="17" rx="8" ry="3" fill="#c06a28"/>
    <ellipse cx="20" cy="13" rx="8" ry="3" fill="#cf7830"/>
    <path d="M17 11.5 L20 9.5 L23 11.5 L20 12.8 Z" fill="#5f7245"/>
    <ellipse cx="20" cy="12.6" rx="2.5" ry="0.8" fill="#e8e0cc" opacity="0.65"/>`),
  sagwa: S(`${JEGI}
    <circle cx="20" cy="16.5" r="8" fill="#b23a2a"/>
    <path d="M13.5 12.5 a8 8 0 0 1 5 -3.5" fill="none" stroke="#cf5a45" stroke-width="2" stroke-linecap="round"/>
    <path d="M20 8.5 q0 -2.5 1.5 -3.8" fill="none" stroke="#4a3620" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M21.5 6.5 q3 -0.5 3.5 2 q-2.8 0.8 -3.5 -2" fill="#5f7245"/>`),
  yakgwa: S(`${JEGI}
    <g fill="#a5702f" stroke="#7f541f" stroke-width="0.7">
      <path d="M12.5 23.5 l2 -2 l-2 -2 l2 -2 l6 0 l2 2 l-2 2 l2 2 l-2 2 l-6 0 Z" transform="translate(-2,0)"/>
      <path d="M12.5 23.5 l2 -2 l-2 -2 l2 -2 l6 0 l2 2 l-2 2 l2 2 l-2 2 l-6 0 Z" transform="translate(9,-6)"/>
    </g>
    <circle cx="14.5" cy="19.5" r="1.1" fill="#7f541f"/>
    <circle cx="25.5" cy="13.5" r="1.1" fill="#7f541f"/>`),
};

/** 모델 키로 아이콘 조회 (없으면 null → 이모지 폴백) */
export function iconFor(key) {
  return ICONS[key] || null;
}
