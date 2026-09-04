// 가벼운 WebAudio 효과음 (파일 없이 신디사이즈)
export class Sfx {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.inBackground = false;
  }
  _ac() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended' && !this.inBackground) this.ctx.resume();
    return this.ctx;
  }
  /** 백그라운드 전환 — 재생 중인 소리·진동 즉시 정지 (앱인토스 체크리스트) */
  suspend() {
    this.inBackground = true;
    try { navigator.vibrate && navigator.vibrate(0); } catch (_) { /* 미지원 */ }
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }
  /** 포그라운드 복귀 — 다시 재생 가능 상태로 */
  resume() {
    this.inBackground = false;
    if (this.ctx && this.enabled && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }
  _tone(freq, dur, type = 'sine', gain = 0.16, when = 0) {
    if (!this.enabled || this.inBackground) return;
    const ac = this._ac();
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }
  /** 모바일 햅틱 — 지원 기기에서만 (iOS Safari는 무시함) */
  _buzz(pattern) {
    if (!this.enabled || this.inBackground) return;
    try { navigator.vibrate && navigator.vibrate(pattern); } catch (_) { /* 미지원 */ }
  }
  select() { this._tone(660, 0.09, 'triangle', 0.1); this._buzz(8); }
  place() { this._tone(392, 0.12, 'sine', 0.18); this._tone(523, 0.18, 'sine', 0.12, 0.05); this._buzz(18); }
  correct() { [523, 659, 784].forEach((f, i) => this._tone(f, 0.16, 'triangle', 0.13, i * 0.07)); this._buzz([14, 30, 22]); }
  wrong() { this._tone(196, 0.25, 'sawtooth', 0.09); this._tone(185, 0.25, 'sawtooth', 0.07, 0.08); this._buzz([40, 40, 40]); }
  rowClear() { [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.22, 'triangle', 0.13, i * 0.09)); this._buzz([15, 40, 15, 40, 30]); }
  fanfare() {
    [392, 523, 659, 784, 1047, 1319].forEach((f, i) => this._tone(f, 0.3, 'triangle', 0.14, i * 0.11));
    // 마무리 징(鉦) 울림 — 낮은 배음이 길게 남도록
    [130.8, 261.6, 392].forEach((f, i) => this._tone(f, 1.6 - i * 0.3, 'sine', 0.09 - i * 0.02, 0.7));
    this._buzz([30, 60, 30, 60, 80]);
  }
}
