// ===================================================================
// 뒤로가기(안드로이드 백버튼·토스 내비바) / 종료 확인 모달
//
// 앱인토스 체크리스트
//   - 최초 화면(인트로)에서 뒤로가기 → 미니앱 종료  (컨테이너가 처리, 우리는 개입 안 함)
//   - 게임 중 뒤로가기 → 뒤로가기 동작 = 종료 확인 모달
//   - 종료 시 확인 모달 노출
//
// 구현: 게임 시작 시 history 엔트리를 하나 push 해 두고, popstate 가 오면
//   ① 열린 보조 모달(규칙·재료·구매 리스트)이 있으면 그것만 닫고
//   ② 없으면 종료 확인 모달을 띄웁니다. (다시 push 해 게임 상태 유지)
//   완성 화면에서는 잃을 게 없으니 확인 없이 바로 처음 화면으로 갑니다.
// ===================================================================
import { IS_TOSS } from './env.js';

const STATE = { charye: 'game' };
const SIDE_MODALS = ['modal-rules', 'modal-ingredients', 'modal-shoplist'];

export class Nav {
  /**
   * @param {{ isDone: () => boolean, onPause?: () => void }} opts
   *   isDone  — 완성 화면인지 (true 면 확인 없이 처음으로)
   */
  constructor({ isDone }) {
    this.isDone = isDone;
    this.inGame = false;
    this.leaving = false;

    this.$modal = document.getElementById('modal-exit');
    this.$modal.querySelector('#btn-exit-stay').addEventListener('click', () => this.hide());
    this.$modal.querySelector('#btn-exit-home').addEventListener('click', () => this.goHome());
    const $close = this.$modal.querySelector('#btn-exit-close');
    if (IS_TOSS) {
      $close.classList.remove('hidden');
      $close.addEventListener('click', () => this.closeMiniApp());
    }

    // 새로고침으로 push 된 엔트리 위에 다시 로드된 경우 → 기준 엔트리로 되돌려
    // "인트로에서 뒤로가기 = 미니앱 종료" 가 항상 성립하게 정리
    if (history.state && history.state.charye) {
      this.leaving = 'normalize';
      history.back();
    }

    window.addEventListener('popstate', () => this._onPop());
  }

  /** 모드 선택 → 게임 진입 */
  enterGame() {
    if (this.inGame) return;
    this.inGame = true;
    history.pushState(STATE, '', location.href);
  }

  /** HUD 🏠 버튼 등 — 사용자가 직접 나가기를 요청 */
  requestExit() {
    if (!this.inGame) return;
    if (this.isDone()) { this.goHome(); return; }
    this.show();
  }

  show() { this.$modal.classList.remove('hidden'); }
  hide() { this.$modal.classList.add('hidden'); }

  /** 처음 화면으로 — 기준 엔트리로 돌아간 뒤 새로 로드 */
  goHome() {
    this.hide();
    if (history.state && history.state.charye) {
      this.leaving = 'home';
      history.back();          // popstate 에서 reload
    } else {
      location.reload();
    }
  }

  async closeMiniApp() {
    try {
      const mod = await import('@apps-in-toss/web-framework');
      if (mod?.closeView) { await mod.closeView(); return; }
    } catch (_) { /* 토스 밖 */ }
    this.goHome();
  }

  _onPop() {
    if (this.leaving === 'normalize') { this.leaving = false; return; }
    if (this.leaving === 'home') { this.leaving = false; location.reload(); return; }
    if (!this.inGame) return;                       // 인트로: 컨테이너가 종료 처리

    // 뒤로가기를 소비했으니 게임 상태 엔트리를 다시 세움
    history.pushState(STATE, '', location.href);

    const open = SIDE_MODALS.map((id) => document.getElementById(id)).filter(($m) => $m && !$m.classList.contains('hidden'));
    if (open.length) { open.forEach(($m) => $m.classList.add('hidden')); return; }
    if (!this.$modal.classList.contains('hidden')) { this.hide(); return; }   // 확인 모달에서 뒤로가기 = 계속하기
    if (this.isDone()) { this.goHome(); return; }
    this.show();
  }
}
