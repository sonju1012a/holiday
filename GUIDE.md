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

모바일 화면 확인: 개발 서버 실행 후 `http://localhost:5199/mobile-test.html`
(390×780 iframe으로 세로 화면을 재현하는 개발 전용 페이지 — 배포 전 `public/mobile-test.html` 삭제 권장)

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
├── shop.js      # ★ 토스쇼핑 수익화 — SHOP_CATALOG, openExternal(openURL 브릿지)
├── ui.js        # DOM UI (스텝퍼·배너·토스트·트레이·모달)
├── audio.js     # WebAudio 효과음
└── style.css    # 한지 테마 + 모바일(640px 이하) 대응
```

**음식/규칙 수정**: `data.js`만 고치면 됩니다. 새 음식 = 열의 `items`에 항목 추가 + `models.js`의 `BUILDERS`에 모델 빌더 등록 (+ 전통 모드라면 `icons.js`에 아이콘).

### 수익화 — 토스쇼핑 쉐어링크 교체 (필수 ★)

`src/shop.js`의 `SHOP_CATALOG`에서 `link` 값 **17개**를 본인의 쉐어링크로 교체하세요.
발급: 토스앱 → 쇼핑 → 상품 → 공유 → 링크 복사.

| 키 | 노출 시점 |
|---|---|
| `byeongpung` `dotjari` `sang` `jibang` `chotdae` `hyangno` | 준비 단계 배치 직후 |
| `row1`~`row5` | 전통/성균관 모드 열 시작 시 |
| `mrow1`~`mrow5` | 간편 제사상 모드 열 시작 시 |
| `giftset` | **쉐어링크를 한 번도 안 누르고 완주한 유저에게** 완성 화면에서 강조 노출 |

동작 방식: 추천 토스트는 9초 뒤 자동으로 닫히고 같은 추천은 반복되지 않습니다. 링크 클릭 여부는 `sessionStorage`(`charye_engaged`)에 저장되어 "다시 차리기" 후에도 유지됩니다.

### 앱인토스 배포

1. **콘솔 등록**: [앱인토스 콘솔](https://console.apps-in-toss.toss.im)에서 미니앱 등록 (앱 이름·표시명·아이콘 업로드)
2. **설정 동기화**: `granite.config.ts`의 `appName`(→ 딥링크 `intoss://{appName}`), `brand.displayName`, `brand.icon`(콘솔 이미지 URL)을 콘솔 등록값과 동일하게 수정
3. **빌드·업로드**: `npm run build` 후 `.ait` 번들 업로드 (압축 해제 기준 100MB 이하 — 현재 번들 약 600KB로 여유 충분)
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

- [ ] `test/src/shop.js` — 쉐어링크 17개 교체 (`https://link.toss.im/YOUR_SHARE_LINK` 검색)
- [ ] `test/granite.config.ts` — `appName` / `displayName` / `icon` 콘솔 등록값으로 교체
- [ ] `test/index.html` — `btn-online-charye`의 href를 online-charye 배포 주소로 교체
- [ ] `test/public/mobile-test.html` 삭제 (개발 전용)
- [ ] online-charye를 HTTPS로 배포하고 두 기기에서 화상 연결 테스트
- [ ] (선택) online-charye 장보기 링크를 토스쇼핑 쉐어링크로 교체
- [ ] 앱인토스 콘솔에서 테스트 → 검토 요청 → 출시

> ※ 교육 콘텐츠 참고: 차례상 예법은 지역·가문마다 다르며, 성균관 표준안 모드는 2022년 성균관 의례정립위원회 발표(음식 최대 9가지, 전 제외, 배치 자유)를 근거로 합니다.
