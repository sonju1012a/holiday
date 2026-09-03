// 가벼운 WebAudio 효과음 (파일 없이 신디사이즈)
export class Sfx {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }
  _ac() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }
  _tone(freq, dur, type = 'sine', gain = 0.16, when = 0) {
    if (!this.enabled) return;
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
  select() { this._tone(660, 0.09, 'triangle', 0.1); }
  place() { this._tone(392, 0.12, 'sine', 0.18); this._tone(523, 0.18, 'sine', 0.12, 0.05); }
  correct() { [523, 659, 784].forEach((f, i) => this._tone(f, 0.16, 'triangle', 0.13, i * 0.07)); }
  wrong() { this._tone(196, 0.25, 'sawtooth', 0.09); this._tone(185, 0.25, 'sawtooth', 0.07, 0.08); }
  rowClear() { [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.22, 'triangle', 0.13, i * 0.09)); }
  fanfare() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => this._tone(f, 0.3, 'triangle', 0.14, i * 0.11)); }
}
