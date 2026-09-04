# 차례상 프로젝트 가이드

교육용 3D 차례상 게임과 온라인 차례지내기 화상통화 사이트, 두 프로젝트의 실행·수정·배포 가이드입니다.

| 프로젝트 | 경로 | 기술 | 용도 |
|---|---|---|---|
| 차례상 차리기 게임 | `project/test` | Vite + Three.js | 앱인토스 미니앱 (수익: 토스쇼핑 쉐어링크) |
| 온라인 차례지내기 | `project/online-charye` | Express + ws + WebRTC | 외부 링크로 연결되는 가족 화상 차례 사이트 |

---

## 1. 차례상 차리기 게임 (`project/test`)

### 실행

```bash
npm install
npm run dev      # http://localhost:5199 (granite.config.ts 기준 포트)
npm run build    # dist/ 생성
```

모바일 화면 확인: 브라우저 개발자 도구의 기기 에뮬레이션(390×780)을 사용하세요.

### 게임 구성

**게임 모드 3종** (인트로에서 선택):

| 모드 | 키 | 열 | 배치 규칙 | 함정(금기) 카드 |
|---|---|---|---|---|
| 전통 차례상 | `trad` | 5열 | 슬롯 정확히 일치 (반서갱동·어동육서·좌포우혜·조율이시·홍동백서·남좌여우) | 없음 |
| 성균관 표준안 | `ganso` | 3열 | 열 안 자유 배치 (음식 9가지) | 육전·모둠튀김·복숭아 |
| 간편 제사상 | `easy` | 5열 | 열 안 자유 배치 (배달·냉동식품) | 마늘보쌈·불닭볶음면·팥빙수·복숭아 |

**공통 흐름**: 준비 6단계(병풍 → 돗자리 → 차례상 → 지방 → 촛대 → 향상·향로) → 신위에서 가까운 1열부터 열 순서대로 진설 → 완성(별점 + 배운 규칙 요약).

**점수**: 준비 단계 +50 / 음식 첫 시도 정답 +100 (오답마다 -20, 최소 +20) / 금기 음식 선택 -30.

### 파일 구조

```
src/
├── main.js      # 부트스트랩, 모드 선택 버튼, 온라인 차례 링크
├── data.js      # ★ 게임 콘텐츠 전부 — 규칙(RULES), 준비 단계, 모드별 열/음식/금기, MODES
├── game.js      # 상태 머신 (준비 → 진설 → 완성), 레이캐스트 배치, 채점
├── models.js    # 절차 생성 3D 모델 (전통 제기 + 현대 음식, 외부 에셋 없음)
├── icons.js     # 트레이용 전통 SVG 아이콘 26종 (간편 모드는 이모지 사용)
├── scene.js     # 렌더러·조명·한옥 배경, 세로 화면 FOV 자동 조정
├── shop.js      # ★ 토스쇼핑 수익화 — 구매 리스트 모달, 추천 토스트, openExternal(openURL 브릿지)
├── env.js       # 빌드 타깃 플래그 (IS_TOSS / SHOP_TOASTS / ONLINE_CHARYE_URL)
├── nav.js       # 뒤로가기(백버튼) 처리 + 종료 확인 모달
├── ui.js        # DOM UI (스텝퍼·배너·토스트·트레이·모달)
├── audio.js     # WebAudio 효과음
└── style.css    # 한지 테마 + 모바일(640px 이하) 대응
```

**음식/규칙 수정**: `data.js`만 고치면 됩니다. 새 음식 = 열의 `items`에 항목 추가 + `models.js`의 `BUILDERS`에 모델 빌더 등록 (+ 전통 모드라면 `icons.js`에 아이콘).

### 수익화 — 토스쇼핑 쉐어링크

`src/shop-links.json`의 `link` 값을 본인의 쉐어링크로 교체하세요. 발급: 토스앱 → 쇼핑 → 상품 → 공유 → 링크 복사.
아직 교체하지 않은 항목(`YOUR_SHARE_LINK`)은 게임 어디에도 노출되지 않으므로, 채운 것만 자동으로 보입니다.

| 노출 지점 | 웹 빌드 | 앱인토스 빌드 |
|---|---|---|
| 🛒 구매 리스트 모달 (인트로 첫 화면 버튼 · 완성 화면 버튼) | ✅ | ✅ |
| 게임 중 추천 토스트 (준비 단계·열 시작·아이템 선택) | ✅ | ❌ (심사 다크패턴 조항 회피) |

구매 리스트는 `세트 → 준비물 → 모드별 음식` 탭으로 구성되며, 완성 화면에서 열면 방금 차린 모드가 먼저 나옵니다. 금기 음식은 목록에서 제외됩니다.

### 빌드 타깃 분기 (.env)

| 파일 | 명령 | 내용 |
|---|---|---|
| `.env` | `npm run build`, `npm run dev` | 웹 배포용. 쇼핑 토스트 켬 |
| `.env.toss` | `npm run build:toss` (granite 번들도 동일) | 앱인토스용. 쇼핑 토스트 끔, 외부 서비스 링크 숨김 |

코드에서는 `src/env.js`의 `IS_TOSS` / `SHOP_TOASTS` / `ONLINE_CHARYE_URL`만 참조합니다.
`VITE_ONLINE_CHARYE_URL`을 채우면 완성 화면에 '가족과 온라인 차례지내기' 버튼이 나타납니다 (비우면 숨김 — 앱인토스는 '자사 서비스 이동 유도 금지' 조항이 있어 비워 두세요).

### 앱인토스 배포

1. **콘솔 등록**: [앱인토스 콘솔](https://console.apps-in-toss.toss.im)에서 미니앱 등록 (앱 이름·표시명·아이콘 업로드)
2. **설정 동기화**: `granite.config.ts`의 `appName`(→ 딥링크 `intoss://{appName}`), `brand.displayName`, `brand.icon`(콘솔 이미지 URL)을 콘솔 등록값과 동일하게 수정
3. **빌드·업로드**: `npm run build:toss` 후 `.ait` 번들 업로드 (압축 해제 기준 100MB 이하 — 현재 번들 약 600KB로 여유 충분)
4. **출시**: 콘솔에서 테스트 1회 이상 → '검토 요청하기' → 승인(영업일 최대 3일) → '출시하기'

**외부 링크 규칙**: 미니앱 안에서는 `window.open` 대신 SDK의 `openURL()`을 써야 합니다. 이미 `shop.js`의 `openExternal()`이 처리합니다 (토스 안 → `openURL`, 일반 브라우저 → `window.open` 폴백). 새 외부 링크를 추가할 땐 반드시 `openExternal()`을 거치세요.

참고 문서: [웹 SDK 연동](https://developers-apps-in-toss.toss.im/ai-vibe-coding/tutorials/webview.md) · [출시 가이드](https://developers-apps-in-toss.toss.im/guide/operation/deploy.md)

---

## 2. 온라인 차례지내기 (`project/online-charye`)

WebRTC mesh 화상통화(방당 최대 8명)로 떨어져 있는 가족이 함께 차례를 지내는 사이트입니다.

### 실행

```bash
cd ../online-charye
npm install
npm start        # http://localhost:5300
```

두 개의 브라우저 창에서 같은 방 코드로 입장하면 화상 연결을 확인할 수 있습니다.

### 기능

- **방 코드 입장**: 로비에서 코드 생성(🎲)·입장, `?room=코드` URL로 초대 링크 공유(🔗 복사 버튼)
- **차례 9단계 동기화**: 준비 → 강신 → 참신 → 헌작 → 계반삽시 → 합문·유식 → 철시복반 → 사신 → 철상·음복. **호스트(방을 처음 만든 사람)만** 이전/다음 버튼이 활성화되며, 넘기면 전원에게 반영. 늦게 입장해도 현재 단계로 맞춰짐
- **절 리액션**: 🙇 버튼 → 모든 참가자 화면에 떠오르는 애니메이션
- **카메라 거부 허용**: getUserMedia 거부 시 보기 전용(recvonly)으로 참여
- **현대 차례상 장보기**(🛒): 로비·방 상단 버튼 → 메·과일·김치(백김치/나박김치/동치미 선택)·전·제수용품 구매 링크 모달. 현재 네이버쇼핑 검색 링크(`app.js`의 `shopLink()`)로 연결되며, **토스쇼핑 쉐어링크로 교체하려면 `SHOP` 배열의 항목에 링크 필드를 추가하고 `buyLink()`를 수정**하면 됩니다

### 구조와 프로토콜

```
server.js          # Express 정적 서빙 + WebSocket 시그널링 (방 관리, 단계 저장)
public/app.js      # WebRTC mesh, 차례 단계 UI, 장보기 모달
public/index.html  # 로비 + 차례 방 + 장보기 모달
public/style.css   # 한지 테마, 모바일(760px 이하) 세로 레이아웃
```

시그널링 메시지: `join` → `joined`(내 id·호스트 여부·현재 단계·기존 참가자) / `peer-joined` / `signal`(SDP·ICE 중계) / `stage`(단계 동기화) / `react` / `peer-left`. 새 참가자가 기존 참가자들에게 offer를 보내는 mesh 방식입니다.

### 배포 시 주의

- **HTTPS 필수**: `getUserMedia`는 localhost 외에는 HTTPS에서만 동작합니다. WebSocket은 자동으로 `wss://`를 사용합니다 (프로토콜 자동 감지)
- Node 서버가 필요하므로 Render, Railway, Fly.io 같은 서비스에 배포 (정적 호스팅 불가)
- 사내망/모바일 환경에 따라 STUN만으로 연결이 안 되면 TURN 서버 추가 (`app.js`의 `ICE` 설정)
- 배포 후 **게임 쪽 `index.html`의 `btn-online-charye` 링크(`https://YOUR_ONLINE_CHARYE_URL`)를 실제 주소로 교체** — 게임 완성 화면에서 이 사이트로 연결됩니다

---

## 3. 출시 전 체크리스트

앱인토스 게임 체크리스트 대응 현황 (코드로 처리된 항목):

| 체크리스트 항목 | 구현 |
|---|---|
| 사운드 On/Off | HUD 🔊 버튼 |
| 백그라운드 전환 시 사운드 즉시 종료 / 복귀 시 재생 | `main.js` visibilitychange·pagehide·blur → `Sfx.suspend()/resume()` |
| 안드로이드 백버튼 → 뒤로가기 또는 종료 | `nav.js` — 인트로에서는 컨테이너가 종료, 게임 중에는 보조 모달 닫기 → 종료 확인 모달 |
| 종료 시 확인 모달 | `#modal-exit` (계속 차리기 / 처음 화면으로 / 미니앱 종료`closeView`) |
| 모든 화면에서 이탈 수단 | HUD 🏠 버튼 + 토스 내비바 닫기 |
| 예측 불가능한 CTA·다크패턴 금지 | 앱인토스 빌드는 게임 중 쇼핑 토스트 없음, 구매 리스트는 사용자가 직접 열기 |
| Safe Area | `style.css` env(safe-area-inset-*) |


- [ ] `src/shop-links.json` — 남은 `YOUR_SHARE_LINK` 24개 교체 (미교체 항목은 자동 숨김)
- [ ] `test/granite.config.ts` — `appName` / `displayName` / `icon` 콘솔 등록값으로 교체
- [ ] (웹 배포 시) `.env`의 `VITE_ONLINE_CHARYE_URL`에 online-charye 배포 주소 입력
- [ ] online-charye를 HTTPS로 배포하고 두 기기에서 화상 연결 테스트
- [ ] (선택) online-charye 장보기 링크를 토스쇼핑 쉐어링크로 교체
- [ ] 앱인토스 콘솔에서 테스트 → 검토 요청 → 출시

> ※ 교육 콘텐츠 참고: 차례상 예법은 지역·가문마다 다르며, 성균관 표준안 모드는 2022년 성균관 의례정립위원회 발표(음식 최대 9가지, 전 제외, 배치 자유)를 근거로 합니다.
