// ===================================================================
// 토스쇼핑 쉐어링크 수익화 모듈
//
// ★ 사용법: 아래 SHOP_CATALOG 의 link 값을 본인의 토스쇼핑
//   쉐어링크(수익 공유 링크)로 교체하세요.
//   토스앱 > 쇼핑 > 상품 > 공유 > 링크 복사 로 발급받을 수 있습니다.
// ===================================================================

const PLACEHOLDER = 'https://link.toss.im/YOUR_SHARE_LINK'; // TODO: 교체

/**
 * 외부 링크 열기 — 앱인토스 미니앱 안에서는 SDK의 openURL을 써야 하고,
 * 일반 브라우저에서는 window.open 으로 폴백합니다.
 */
export async function openExternal(url) {
  try {
    const mod = await import('@apps-in-toss/web-framework');
    if (mod?.openURL) {
      await mod.openURL(url);
      return;
    }
  } catch (_) {
    // 토스 밖(일반 웹)에서는 SDK 브릿지가 없어 실패할 수 있음 → 폴백
  }
  window.open(url, '_blank', 'noopener');
}

export const SHOP_CATALOG = {
  // ---- 준비물 ----
  byeongpung: {
    name: '차례용 병풍 (6폭)',
    desc: '명절 차례·제사에 두루 쓰는 접이식 병풍이에요.',
    link: PLACEHOLDER,
  },
  dotjari:    { name: '왕골 돗자리·제례용 자리', desc: '차례상 아래에 깔기 좋은 정갈한 돗자리.', link: PLACEHOLDER },
  sang:       { name: '접이식 교자상(차례상)', desc: '다리를 접어 보관하는 원목 교자상.', link: PLACEHOLDER },
  jibang:     { name: '지방 쓰기 세트', desc: '지방 용지 · 붓펜 · 지방틀 세트로 간편하게.', link: PLACEHOLDER },
  chotdae:    { name: '놋 촛대 한 쌍 + 양초', desc: '차례상 양 끝에 놓는 전통 촛대 세트.', link: PLACEHOLDER },
  hyangno:    { name: '향로·향합·향 세트', desc: '향상 위에 올리는 향로 3종 세트.', link: PLACEHOLDER },
  // ---- 열별 음식 ----
  row1: { name: '유기 제기 세트 (메·갱기·시접·잔반)', desc: '1열에 올리는 밥그릇·국그릇·수저·술잔 유기 세트.', link: PLACEHOLDER },
  row2: { name: '모둠전·적 세트 (냉동/당일)', desc: '육전·동태전·꼬치적까지 부칠 필요 없이 한 번에.', link: PLACEHOLDER },
  row3: { name: '탕국 재료 세트 (사골·두부·동태)', desc: '3탕 끓이기 좋은 손질 재료 모음.', link: PLACEHOLDER },
  row4: { name: '북어포·삼색나물·식혜 세트', desc: '4열 필수 제수 모음 — 손질 완료 배송.', link: PLACEHOLDER },
  row5: { name: '차례 과일 세트 (배·사과·곶감·밤·대추)', desc: '조율이시 그대로 담은 프리미엄 과일 박스.', link: PLACEHOLDER },
  // ---- 간편 제사상(현대) 모드 열별 추천 ----
  mrow1: { name: '즉석밥·음료 제수 세트', desc: '즉석밥 6입 + 음료 — 간편상 1열이 한 번에.', link: PLACEHOLDER },
  mrow2: { name: '치킨·족발 배달 기프티콘', desc: '명절 저녁, 배달 메인 요리를 선물하세요.', link: PLACEHOLDER },
  mrow3: { name: '컵라면·즉석국 모음전', desc: '순한맛 컵라면 + 파우치 미역국·어묵탕 밀키트.', link: PLACEHOLDER },
  mrow4: { name: '명절 간식 스낵박스', desc: '감자칩·젤리·초콜릿 — 온 가족 나눔 간식.', link: PLACEHOLDER },
  mrow5: { name: '디저트·과일 선물박스', desc: '딸기·바나나·마카롱·약과까지 한 박스로.', link: PLACEHOLDER },
  // ---- 최종 선물세트 (한 번도 클릭하지 않은 유저에게) ----
  giftset: {
    name: '명절 차례상 올인원 선물세트',
    desc: '과일·전·포·식혜까지 차례상 한 상이 통째로! 준비가 어렵다면 이 세트 하나로 해결하세요.',
    link: PLACEHOLDER,
  },
};

// -------------------------------------------------------------------
export class Shop {
  constructor() {
    // 쉐어링크를 한 번이라도 눌렀는지 (다시하기 후에도 유지)
    this.engaged = sessionStorage.getItem('charye_engaged') === '1';
    this.shownKeys = new Set();    // 같은 추천 반복 방지
    this.hideTimer = null;

    this.$toast = document.getElementById('shop-toast');
    this.$name = this.$toast.querySelector('.shop-name');
    this.$desc = this.$toast.querySelector('.shop-desc');
    this.$link = this.$toast.querySelector('.shop-link');

    this.$link.addEventListener('click', (e) => {
      e.preventDefault();          // 미니앱에서는 openURL 브릿지로 열어야 함
      this._markEngaged();         // 클릭 = 쇼핑 참여로 기록
      openExternal(this.$link.href);
      this.hide();
    });
    this.$toast.querySelector('.shop-skip').addEventListener('click', () => this.hide());
    this.$toast.querySelector('.shop-close').addEventListener('click', () => this.hide());
  }

  /** 추천 토스트 노출 (key: SHOP_CATALOG 키) */
  recommend(key) {
    const item = SHOP_CATALOG[key];
    if (!item || this.shownKeys.has(key)) return;
    this.shownKeys.add(key);

    this.$name.textContent = item.name;
    this.$desc.textContent = item.desc;
    this.$link.href = item.link;
    this.$toast.classList.remove('hidden');

    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.hide(), 9000); // 9초 뒤 자동 닫힘
  }

  hide() {
    clearTimeout(this.hideTimer);
    this.$toast.classList.add('hidden');
  }

  /** 게임 완료 시 — 쇼핑 미참여 유저에게 선물세트 추천 여부 결정 */
  fillGiftSet() {
    const box = document.getElementById('giftset-reco');
    if (this.engaged) { box.classList.add('hidden'); return; }
    const g = SHOP_CATALOG.giftset;
    document.getElementById('gift-name').textContent = g.name;
    document.getElementById('gift-desc').textContent = g.desc;
    const $link = document.getElementById('gift-link');
    $link.href = g.link;
    $link.onclick = (e) => {
      e.preventDefault();
      this._markEngaged();
      openExternal($link.href);
    };
    box.classList.remove('hidden');
  }

  _markEngaged() {
    this.engaged = true;
    sessionStorage.setItem('charye_engaged', '1');
  }

  reset() {
    this.shownKeys.clear();
    this.hide();
    // engaged 는 세션 동안 유지 — 다시하기 해도 이미 참여한 유저에겐 강제 추천 안 함
  }
}
