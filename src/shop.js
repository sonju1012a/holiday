// ===================================================================
// 토스쇼핑 쉐어링크 수익화 모듈
//
// ★ 사용법: ./shop-links.json 의 link 값을 본인의 토스쇼핑
//   쉐어링크(수익 공유 링크)로 교체하세요. 코드를 건드릴 필요 없이
//   그 파일만 수정하면 됩니다.
//   토스앱 > 쇼핑 > 상품 > 공유 > 링크 복사 로 발급받을 수 있습니다.
//   아직 교체하지 않은(YOUR_SHARE_LINK) 항목은 어디에도 노출되지 않습니다.
//
// 노출 지점
//   1) 구매 리스트 모달 — 인트로 첫 화면 버튼 + 완성 화면 버튼 (모든 빌드)
//   2) 게임 중 추천 토스트 — 웹 빌드만 (.env VITE_SHOP_TOASTS). 앱인토스 빌드는 끔
// ===================================================================

import shopLinks from './shop-links.json';
import { SETUP_STEPS, MODES } from './data.js';
import { SHOP_TOASTS } from './env.js';

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

/** 실제 쉐어링크가 채워진 상품인지 (플레이스홀더·링크 없음은 제외) */
export function hasRealLink(item) {
  return !!(item && typeof item.link === 'string' && /^https?:\/\//.test(item.link) && !item.link.includes('YOUR_'));
}

const GIFTSET_KEYS = ['giftset_easytable', 'giftset_hanwoo'];

/** 구매 리스트 그룹 구성 — [{ key, title, items: [{ id, ...item }] }] */
function buildGroups(currentModeKey) {
  const pick = (ids) => {
    const seen = new Set();
    return ids
      .filter((id) => id && !seen.has(id) && seen.add(id))
      .map((id) => ({ id, ...SHOP_CATALOG[id] }))
      .filter(hasRealLink);
  };
  const groups = [];
  groups.push({ key: 'giftset', title: '🎁 한 번에 준비하기 (완성 상·선물세트)', items: pick(GIFTSET_KEYS) });
  groups.push({ key: 'setup', title: '🏮 준비물 (병풍·돗자리·상·지방·촛대·향로)', items: pick(SETUP_STEPS.map((s) => s.shop)) });
  const modeKeys = Object.keys(MODES).sort((a, b) => (a === currentModeKey ? -1 : b === currentModeKey ? 1 : 0));
  for (const k of modeKeys) {
    const mode = MODES[k];
    const ids = mode.rows.flatMap((r) => {
      const taboo = new Set(r.taboos || []);
      return (r.items || []).filter((id) => !taboo.has(id));
    });
    groups.push({ key: k, title: `🍽 ${mode.label} 음식`, items: pick(ids), current: k === currentModeKey });
  }
  return groups.filter((g) => g.items.length);
}

// -------------------------------------------------------------------
export class Shop {
  constructor() {
    this.shownKeys = new Set();    // 같은 추천 반복 방지
    this.hideTimer = null;
    this.currentModeKey = null;

    // --- 게임 중 추천 토스트 ---
    this.$toast = document.getElementById('shop-toast');
    this.$name = this.$toast.querySelector('.shop-name');
    this.$desc = this.$toast.querySelector('.shop-desc');
    this.$link = this.$toast.querySelector('.shop-link');
    this.$link.addEventListener('click', (e) => {
      e.preventDefault();          // 미니앱에서는 openURL 브릿지로 열어야 함
      openExternal(this.$link.href);
      this.hide();
    });
    this.$toast.querySelector('.shop-skip').addEventListener('click', () => this.hide());
    this.$toast.querySelector('.shop-close').addEventListener('click', () => this.hide());

    // --- 구매 리스트 모달 ---
    this.$modal = document.getElementById('modal-shoplist');
    this.$tabs = document.getElementById('shoplist-tabs');
    this.$list = document.getElementById('shoplist-list');
    this.$modal.querySelector('.modal-close').addEventListener('click', () => this.closeList());
    this.$modal.addEventListener('click', (e) => { if (e.target === this.$modal) this.closeList(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.closeList(); });
    this.$list.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-link]');
      if (!btn) return;
      e.preventDefault();
      openExternal(btn.dataset.link);
    });
    this.$tabs.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-group]');
      if (!tab) return;
      this._selectGroup(tab.dataset.group);
    });
    document.querySelectorAll('[data-open-shoplist]').forEach((el) =>
      el.addEventListener('click', (e) => { e.preventDefault(); this.openList(); }));
  }

  /** 게임 시작 시 현재 모드 기록 (구매 리스트에서 해당 모드를 먼저 보여줌) */
  setMode(modeKey) { this.currentModeKey = modeKey; }

  // ================= 게임 중 추천 토스트 (웹 빌드 전용) =================
  recommend(key) {
    if (!SHOP_TOASTS) return;
    const item = SHOP_CATALOG[key];
    if (!hasRealLink(item) || this.shownKeys.has(key)) return;
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

  // ================= 구매 리스트 모달 =================
  openList(modeKey = this.currentModeKey) {
    this.groups = buildGroups(modeKey);
    if (!this.groups.length) return;
    this.$tabs.innerHTML = this.groups
      .map((g) => `<button class="shoplist-tab" data-group="${g.key}">${g.title.replace(/^\S+\s/, '')}</button>`)
      .join('');
    const first = this.groups.find((g) => g.current) || this.groups[0];
    this._selectGroup(first.key);
    this.$modal.classList.remove('hidden');
  }

  closeList() { this.$modal.classList.add('hidden'); }

  _selectGroup(key) {
    const g = this.groups.find((x) => x.key === key) || this.groups[0];
    this.$tabs.querySelectorAll('.shoplist-tab').forEach((t) => t.classList.toggle('on', t.dataset.group === g.key));
    this.$list.innerHTML = `<h4 class="shoplist-title">${g.title}</h4>` + g.items.map((it) => `
      <div class="shop-row">
        <div class="shop-row-emoji">${it.emoji || '🛒'}</div>
        <div class="shop-row-body">
          <div class="shop-row-name">${it.shopName || it.name}${it.name && it.shopName && it.name !== it.shopName ? ` <small>· ${it.name}</small>` : ''}</div>
          ${it.shopDesc ? `<div class="shop-row-desc">${it.shopDesc}</div>` : ''}
          ${it.salePrice || it.price ? `<div class="gift-price">${it.salePrice ? `<b>${it.salePrice}</b>` : ''}${it.price && it.salePrice ? `<s>${it.price}</s>` : it.price ? `<b>${it.price}</b>` : ''}</div>` : ''}
        </div>
        <button class="shop-row-btn" data-link="${it.link}">토스쇼핑에서 보기</button>
      </div>`).join('');
    this.$list.scrollTop = 0;
  }

  /** 완성 화면 — 구매 리스트 버튼 노출 (팔 수 있는 상품이 하나라도 있을 때만) */
  prepareComplete(modeKey) {
    this.setMode(modeKey);
    const btn = document.getElementById('btn-shoplist-complete');
    btn.classList.toggle('hidden', buildGroups(modeKey).length === 0);
  }

  reset() {
    this.shownKeys.clear();
    this.hide();
  }
}
