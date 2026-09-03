// ===================================================================
// 토스쇼핑 쉐어링크 수익화 모듈
//
// ★ 사용법: ./shop-links.json 의 link 값을 본인의 토스쇼핑
//   쉐어링크(수익 공유 링크)로 교체하세요. 코드를 건드릴 필요 없이
//   그 파일만 수정하면 됩니다.
//   토스앱 > 쇼핑 > 상품 > 공유 > 링크 복사 로 발급받을 수 있습니다.
// ===================================================================

import shopLinks from './shop-links.json';

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

export const SHOP_CATALOG = shopLinks;

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

    this.$name.textContent = item.shopName;
    this.$desc.textContent = item.shopDesc;
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
    document.getElementById('gift-name').textContent = g.shopName;
    document.getElementById('gift-desc').textContent = g.shopDesc;
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
