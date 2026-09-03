// ===================================================================
// DOM UI — 스텝퍼 / 배너 / 교육 토스트 / 트레이 / 모달
// ===================================================================
import { RULES, SETUP_STEPS, FOOD_ROWS } from './data.js';

export class UI {
  constructor() {
    this.$stageLabel = document.getElementById('stage-label');
    this.$score = document.getElementById('score');
    this.$stepper = document.getElementById('stepper');
    this.$banner = document.getElementById('guide-banner');
    this.$edu = document.getElementById('edu-toast');
    this.$tray = document.getElementById('tray');
    this.$trayHint = document.getElementById('tray-hint');
    this.eduTimer = null;

    this.buildStepper();
    this.buildRulesModal();

    document.getElementById('btn-rules').addEventListener('click', () => {
      document.getElementById('modal-rules').classList.remove('hidden');
    });
    document.querySelector('#modal-rules .modal-close').addEventListener('click', () => {
      document.getElementById('modal-rules').classList.add('hidden');
    });
  }

  buildStepper(rows = FOOD_ROWS) {
    this.steps = [
      ...SETUP_STEPS.map((s) => ({ key: `setup:${s.id}`, label: s.emoji + ' ' + s.name.split(' ')[0] })),
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
    this.$edu.querySelector('.edu-title').textContent = title;
    this.$edu.querySelector('.edu-body').textContent = body;
    this.$edu.classList.remove('hidden');
    clearTimeout(this.eduTimer);
    this.eduTimer = setTimeout(() => this.$edu.classList.add('hidden'), ms);
  }

  trayHint(text) { this.$trayHint.textContent = text; }

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

  showComplete({ score, maxScore, summary, stars }) {
    document.getElementById('final-stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('final-score').textContent = `${score}점 / ${maxScore}점`;
    document.getElementById('final-summary').innerHTML = summary;
    document.getElementById('modal-complete').classList.remove('hidden');
  }
}
