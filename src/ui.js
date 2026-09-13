// ===================================================================
// DOM UI — 스텝퍼 / 배너 / 교육 토스트 / 트레이 / 모달
// ===================================================================
import { RULES, SETUP_STEPS, FOOD_ROWS } from './data.js';
import ITEMS from './shop-links.json';

export class UI {
  constructor() {
    this.$stageLabel = document.getElementById('stage-label');
    this.$score = document.getElementById('score');
    this.$stepper = document.getElementById('stepper');
    this.$banner = document.getElementById('guide-banner');
    this.$edu = document.getElementById('edu-toast');
    this.$eduGate = document.getElementById('edu-gate');
    this.$tray = document.getElementById('tray');
    this.$trayHint = document.getElementById('tray-hint');
    this.$skipBtn = document.getElementById('btn-skip-row');
    this.$answerBtn = document.getElementById('btn-show-answer');
    this.eduTimer = null;
    this.eduGateFn = null;   // 탭을 기다리는 중인 '다음 단계' 콜백

    this.buildStepper();
    this.buildRulesModal();
    this.buildIngredientsModal(FOOD_ROWS);

    const $rules = document.getElementById('modal-rules');
    const $ingr = document.getElementById('modal-ingredients');
    document.getElementById('btn-rules').addEventListener('click', () => $rules.classList.remove('hidden'));
    document.getElementById('btn-ingredients').addEventListener('click', () => $ingr.classList.remove('hidden'));
    // 닫기 버튼 · 바깥(배경) 탭 · ESC 모두로 닫힘 (인트로·완성 모달은 제외)
    [$rules, $ingr].forEach(($m) => {
      $m.querySelector('.modal-close').addEventListener('click', () => $m.classList.add('hidden'));
      $m.addEventListener('click', (e) => { if (e.target === $m) $m.classList.add('hidden'); });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') [$rules, $ingr].forEach(($m) => $m.classList.add('hidden'));
    });

    // 설명 대기 해제 — 화면 아무 데나 탭(데스크톱은 Enter/Space)하면 다음 단계로
    this.$eduGate.addEventListener('pointerup', () => this.releaseEduGate());
    document.addEventListener('keydown', (e) => {
      if (this.eduGateFn && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.releaseEduGate(); }
    });
  }

  /** 재료 목록 모달을 현재 모드의 열 구성으로 다시 채움 */
  buildIngredientsModal(rows) {
    const list = document.getElementById('ingredients-list');
    list.innerHTML = rows
      .map((r) => {
        const names = [...new Set(r.items.map((id) => ITEMS[id]?.name).filter(Boolean))].join(' · ');
        return `<div class="rule-item"><h4>${r.title}</h4><p>${names}</p></div>`;
      })
      .join('');
  }

  buildStepper(rows = FOOD_ROWS, setupSteps = SETUP_STEPS) {
    this.steps = [
      ...setupSteps.map((s) => ({ key: `setup:${s.id}`, label: s.emoji + ' ' + s.name.split(' ')[0] })),
      ...rows.map((r) => ({ key: `row:${r.row}`, label: `${r.row}열` })),
    ];
    this.$stepper.innerHTML = '';
    this.dots = {};
    this.steps.forEach((s) => {
      const d = document.createElement('div');
      d.className = 'step-dot';
      d.textContent = s.label;
      this.$stepper.appendChild(d);
      this.dots[s.key] = d;
    });
  }

  setStep(key) {
    let passed = true;
    this.steps.forEach((s) => {
      const d = this.dots[s.key];
      d.classList.remove('active', 'done');
      if (s.key === key) { d.classList.add('active'); passed = false; }
      else if (passed) d.classList.add('done');
    });
  }
  finishStepper() {
    this.steps.forEach((s) => { this.dots[s.key].classList.remove('active'); this.dots[s.key].classList.add('done'); });
  }

  setStageLabel(text) { this.$stageLabel.textContent = text; }
  setScore(n) { this.$score.textContent = n; }

  banner(html, ruleKeys = []) {
    const tags = ruleKeys.map((k) => `<span class="rule-tag">${RULES[k].name.split('(')[0]}</span>`).join('');
    this.$banner.innerHTML = html + (tags ? `<div style="margin-top:6px">${tags}</div>` : '');
    this.$banner.classList.remove('hidden');
  }

  eduToast(title, body, ms = 6500) {
    this._fillEdu(title, body);
    this.$edu.classList.remove('gated');
    clearTimeout(this.eduTimer);
    this.eduTimer = setTimeout(() => this.$edu.classList.add('hidden'), ms);
  }

  /**
   * 설명을 띄우고 화면 탭을 기다림 — 탭하면 설명이 사라지면서 onTap()(= 다음 단계)이 실행돼요.
   * 자동으로 닫히지 않으므로 플레이어가 끝까지 읽고 넘어갈 수 있습니다.
   */
  eduToastGate(title, body, onTap) {
    this._fillEdu(title, body);
    this.$edu.classList.add('gated');
    clearTimeout(this.eduTimer);      // 자동 닫힘 없음 — 탭이 유일한 진행 수단
    this.eduGateFn = onTap;
    this.$eduGate.classList.remove('hidden');
  }

  /** 대기 중이던 다음 단계를 실행하고 설명을 닫음 (대기 중이 아니면 아무 일도 안 함) */
  releaseEduGate() {
    const next = this.eduGateFn;
    if (!next) return;
    this.eduGateFn = null;
    this.$eduGate.classList.add('hidden');
    this.$edu.classList.add('hidden');
    this.$edu.classList.remove('gated');
    next();
  }

  _fillEdu(title, body) {
    this.$edu.querySelector('.edu-title').textContent = title;
    this.$edu.querySelector('.edu-body').innerHTML = body;
    this.$edu.classList.remove('hidden');
  }

  trayHint(text) { this.$trayHint.textContent = text; }
  setSkipVisible(visible) { this.$skipBtn.classList.toggle('hidden', !visible); }
  setAnswerVisible(visible) { this.$answerBtn.classList.toggle('hidden', !visible); }

  /** 트레이에 아이템 카드 렌더 — onSelect(id) */
  renderTray(items, onSelect) {
    this.$tray.innerHTML = '';
    this.cards = {};
    items.forEach((it) => {
      const card = document.createElement('div');
      card.className = 'tray-card';
      card.innerHTML = `<div class="t-emoji">${it.icon || it.emoji}</div><div class="t-name">${it.name}</div><div class="t-sub">${it.sub || ''}</div>`;
      card.addEventListener('click', () => onSelect(it.id, card));
      this.$tray.appendChild(card);
      this.cards[it.id] = card;
    });
  }
  clearTray() { this.$tray.innerHTML = ''; this.cards = {}; }
  /** 카드 부제(작은 글씨) 교체 — 다른 열 카드에 "N열" 표시 등 */
  setCardSub(id, text) {
    const c = this.cards[id];
    const sub = c && c.querySelector('.t-sub');
    if (sub && sub.textContent !== text) sub.textContent = text;
  }
  /** 해당 카드가 트레이 왼쪽에 오도록 가로 스크롤 */
  scrollTrayTo(id) {
    const c = this.cards[id];
    if (!c) return;
    const left = Math.max(0, c.offsetLeft - this.$tray.offsetLeft - 12);
    this.$tray.scrollTo({ left, behavior: 'smooth' });
  }
  markSelected(id) {
    Object.values(this.cards).forEach((c) => c.classList.remove('selected'));
    if (id && this.cards[id]) this.cards[id].classList.add('selected');
  }
  markPlaced(id) {
    const c = this.cards[id];
    if (c) { c.classList.remove('selected'); c.classList.add('placed'); }
  }
  markTaboo(id) {
    const c = this.cards[id];
    if (!c) return;
    c.classList.add('taboo-revealed');
    const em = c.querySelector('.t-emoji');
    if (em) em.textContent = '🚫';
  }
  shakeCard(id) {
    const c = this.cards[id];
    if (!c) return;
    c.classList.remove('shake');
    void c.offsetWidth;
    c.classList.add('shake');
  }

  buildRulesModal() {
    const list = document.getElementById('rules-list');
    list.innerHTML = Object.values(RULES)
      .map((r) => `<div class="rule-item"><h4>${r.name}</h4><p>${r.desc}</p></div>`)
      .join('');
  }

  showComplete({ score, maxScore, summary, stars, bestLine = '', isNewBest = false }) {
    const $stars = document.getElementById('final-stars');
    $stars.innerHTML = Array.from({ length: 3 }, (_, i) =>
      `<span class="star ${i < stars ? 'on' : ''}" style="animation-delay:${0.15 + i * 0.18}s">${i < stars ? '★' : '☆'}</span>`
    ).join('');
    document.getElementById('final-score').textContent = `${score}점 / ${maxScore}점`;
    const $best = document.getElementById('final-best');
    $best.textContent = bestLine;
    $best.classList.toggle('new', isNewBest);
    $best.classList.toggle('hidden', !bestLine);
    document.getElementById('final-summary').innerHTML = summary;
    document.getElementById('modal-complete').classList.remove('hidden');
  }
}
