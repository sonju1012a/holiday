// ===================================================================
// 차례상 차리기 — 게임 데이터 (규칙 / 준비 단계 / 열별 진설)
// 방향 기준: 병풍 쪽이 북쪽(신위), 화면 왼쪽이 서(西), 오른쪽이 동(東)
// ===================================================================

export const RULES = {
  order: {
    name: '진설 순서 — 1열부터 차례대로',
    desc: '차례상은 신위(지방)가 있는 1열부터 5열까지, 지방에서 가까운 쪽부터 먼 쪽으로 차례대로 음식을 놓는 것이 정석입니다.',
  },
  namjwa: {
    name: '남좌여우(男左女右)',
    desc: '남자 조상의 메(밥)·국·잔은 서쪽(왼쪽), 여자 조상의 것은 동쪽(오른쪽)에 놓습니다. 시접(수저)은 가운데에 둡니다.',
  },
  banseo: {
    name: '반서갱동(飯西羹東)',
    desc: '밥(메)은 서쪽, 국(갱)은 동쪽에 놓습니다. 살아있는 사람의 밥상과 반대 방향이에요. 명절 차례에는 밥 대신 설날엔 떡국, 추석엔 송편을 올립니다.',
  },
  eodong: {
    name: '어동육서(魚東肉西)',
    desc: '생선은 동쪽(오른쪽), 고기는 서쪽(왼쪽)에 놓습니다. 2열의 적·전과 3열의 탕에 모두 적용됩니다.',
  },
  dudong: {
    name: '두동미서(頭東尾西)',
    desc: '생선의 머리는 동쪽, 꼬리는 서쪽을 향하게 놓습니다.',
  },
  hongsu: {
    name: '홀수 탕(三湯)',
    desc: '탕은 육탕·소탕·어탕의 3탕, 또는 5탕처럼 홀수로 맞추어 올립니다. 제례에서 홀수는 양(陽)의 수로 여겨집니다.',
  },
  jwapo: {
    name: '좌포우혜(左脯右醯)',
    desc: '포(북어포·명태포)는 왼쪽(서쪽) 끝, 식혜는 오른쪽(동쪽) 끝에 놓습니다. 중간에는 나물과 김치를 올립니다.',
  },
  joyul: {
    name: '조율이시(棗栗梨枾)',
    desc: '과일은 서쪽(왼쪽)부터 대추 → 밤 → 배 → 감(곶감) 순서로 놓습니다. 대추는 왕, 밤은 삼정승, 배는 육조판서, 감은 팔도관찰사를 상징한다는 이야기가 전해집니다.',
  },
  hongdong: {
    name: '홍동백서(紅東白西)',
    desc: '붉은 과일(사과 등)은 동쪽, 흰 과일(배 등)은 서쪽에 놓습니다.',
  },
  ganso: {
    name: '성균관 차례상 표준안',
    desc: '2022년 성균관 의례정립위원회 발표 — 차례 음식은 최대 9가지면 충분하고, 기름에 튀기거나 지진 음식(전)은 올리지 않아도 됩니다. 홍동백서·조율이시 같은 배치법은 옛 예법 문헌에 없는 표현이라, 음식 순서는 가족 합의로 편하게 정하면 돼요. 신위는 지방 대신 사진도 괜찮습니다.',
  },
  taboo: {
    name: '제사상 금기 음식',
    desc: '털 있는 복숭아, 붉은 팥, 고춧가루·마늘 같은 강한 양념은 귀신(혼령)을 쫓는다고 여겨 제사상에 올리지 않는 전통이 있어요. 조상님이 오시는 상이니까요!',
  },
  liberal: {
    name: '고인이 좋아하던 음식',
    desc: '형식보다 마음 — 고인이 생전에 즐기던 음식(배달·냉동·즉석식품이라도)으로 정성껏 차리는 추모상도 늘고 있어요. 금기 음식만 피하면 됩니다.',
  },
};

// -------------------------------------------------------------------
// 준비 단계 (음식을 올리기 전, 순서대로)
// pos: 월드 좌표 [x, y, z] / zone: 클릭 판정 반경
// -------------------------------------------------------------------
export const SETUP_STEPS = [
  {
    id: 'byeongpung',
    name: '병풍 설치',
    emoji: '🪭',
    model: 'byeongpung',
    pos: [0, 0, -2.7],
    zone: 1.9,
    guide: '가장 먼저 <b>병풍</b>을 칩니다. 병풍이 있는 쪽이 <b>북쪽(신위 방향)</b>이 돼요. 빛나는 자리를 눌러 주세요!',
    edu: {
      title: '왜 병풍부터 칠까요?',
      body: '병풍(屛風)은 조상님이 계실 자리를 아늑하게 감싸고 바람과 잡스러운 기운을 막는다는 의미가 있어요. 실제 방위와 상관없이 병풍을 친 쪽을 북쪽으로 삼습니다.',
    },
    shop: 'byeongpung',
  },
  {
    id: 'dotjari',
    name: '돗자리 깔기',
    emoji: '🧺',
    model: 'dotjari',
    pos: [0, 0.011, -0.4],
    zone: 1.9,
    guide: '병풍 앞에 <b>돗자리</b>를 깔아요. 상과 제관이 설 자리를 정갈하게 마련합니다.',
    edu: {
      title: '돗자리(자리) 깔기',
      body: '차례상과 절할 자리에 돗자리를 깔아 바닥을 정갈하게 합니다. 예를 갖추는 공간을 구분하는 의미가 있어요.',
    },
    shop: 'dotjari',
  },
  {
    id: 'sang',
    name: '차례상 펴기',
    emoji: '🪵',
    model: 'sang',
    pos: [0, 0, -0.9],
    zone: 1.6,
    guide: '병풍 바로 앞에 <b>차례상</b>을 폅니다. 상의 병풍 쪽이 신위 자리(북쪽)예요.',
    edu: {
      title: '차례상(교자상) 펴기',
      body: '상다리를 펴서 병풍 앞에 놓습니다. 이제 이 상 위에 신위에서 가까운 1열부터 차례대로 음식을 진설하게 됩니다.',
    },
    shop: 'sang',
  },
  {
    id: 'jibang',
    name: '지방(신위) 모시기',
    emoji: '📜',
    model: 'jibang',
    pos: [0, 1.55, -2.52],
    zone: 1.1,
    guide: '병풍 중앙에 <b>지방(紙榜)</b>을 모십니다. 지방은 조상님의 신위를 종이에 모신 것이에요.',
    edu: {
      title: '지방(紙榜)이란?',
      body: '신주(위패)가 없을 때 종이에 조상님을 모시는 글을 써서 세우는 것이 지방입니다. 「현고학생부군신위(顯考學生府君神位)」처럼 씁니다. 차례를 마치면 지방은 정중히 소각해요.',
    },
    shop: 'jibang',
  },
  {
    id: 'chotdae',
    name: '촛대 놓기',
    emoji: '🕯',
    model: 'chotdae',
    pos: [0, 0.82, -0.9], // 상 윗면 기준, 실제 모델은 양쪽 끝에 한 쌍 배치
    zone: 1.8,
    guide: '차례상 <b>양쪽 끝에 촛대 한 쌍</b>을 놓습니다. 상 위의 빛나는 자리를 눌러 주세요.',
    edu: {
      title: '촛대 한 쌍',
      body: '차례상 동·서 양 끝에 촛대를 한 쌍 놓습니다. 초의 불빛은 조상님을 밝게 모시는 정성을 상징해요.',
    },
    shop: 'chotdae',
  },
  {
    id: 'hyangno',
    name: '향상·향로 놓기',
    emoji: '🏺',
    model: 'hyangsang',
    pos: [0, 0, 0.85],
    zone: 1.4,
    guide: '차례상 앞(남쪽)에 작은 <b>향상</b>을 놓고 그 위에 <b>향로와 향합</b>을 올립니다.',
    edu: {
      title: '향상과 향로',
      body: '차례상 앞에 작은 상(향상)을 두고 향로·향합을 올립니다. 향을 피우는 것은 하늘에 계신 조상님께 오심을 청하는 의미예요. 향상 아래엔 모사기와 퇴주그릇을 둡니다.',
    },
    shop: 'hyangno',
  },
];

// -------------------------------------------------------------------
// 진설 5열 — 상(테이블) 로컬 좌표 (x: 서-, 동+ / z: 신위쪽 -, 앞쪽 +)
//
// slots: 실제로 채워야 하는 상 위의 자리 (자리 수 고정, name은 오답 안내용 라벨)
// items / taboos: shop-links.json에 정의된 음식 id 목록 — slots 수보다 많이 제공.
//   정석 모드(free:false)에서는 각 item이 shop-links.json에서 지정한 slot(자리 id)에만
//   들어가며, 같은 slot을 가리키는 대체 음식(계절/지역 변형) 중 하나만 고르면 정답.
//   음식 이름·설명·아이콘·쇼핑 정보는 모두 shop-links.json에서 관리합니다.
// -------------------------------------------------------------------
export const FOOD_ROWS = [
  {
    row: 1,
    title: '1열 — 신위와 가까운 첫 줄',
    guide: '신위(지방)에서 가장 가까운 <b>1열</b>부터 놓아요. 시접은 <b>가운데</b>, 남자 조상 상은 <b>서쪽(왼쪽)</b>, 여자 조상 상은 <b>동쪽(오른쪽)</b>!',
    rules: ['order', 'namjwa', 'banseo'],
    z: -0.95,
    slots: [
      { id: 'me_m',   x: -2.1, name: '메(남)' },
      { id: 'guk_m',  x: -1.4, name: '국(남)' },
      { id: 'jan_m',  x: -0.7, name: '술잔(남)' },
      { id: 'sijeop', x: 0,    name: '시접' },
      { id: 'jan_f',  x: 0.7,  name: '술잔(여)' },
      { id: 'me_f',   x: 1.4,  name: '메(여)' },
      { id: 'guk_f',  x: 2.1,  name: '국(여)' },
    ],
    items: ['me_m', 'tteokguk_m', 'guk_m', 'jan_m', 'makgeolli_m', 'sijeop', 'jan_f', 'makgeolli_f', 'me_f', 'tteokguk_f', 'guk_f'],
  },
  {
    row: 2,
    title: '2열 — 적과 전',
    guide: '<b>2열</b>은 구이(적)와 전! <b>어동육서</b> — 생선은 동쪽(오른쪽), 고기는 서쪽(왼쪽)이에요.',
    rules: ['eodong', 'dudong'],
    z: -0.42,
    slots: [
      { id: 'yukjeok', x: -1.9,  name: '육적(고기 구이)' },
      { id: 'yukjeon', x: -0.95, name: '육전(고기 전)' },
      { id: 'sojeok',  x: 0,     name: '소적(두부 적)' },
      { id: 'eojeon',  x: 0.95,  name: '어전(생선 전)' },
      { id: 'eojeok',  x: 1.9,   name: '어적(생선 구이)' },
    ],
    items: ['yukjeok', 'tteokgalbi', 'yukjeon', 'donggeurangttaeng', 'sojeok', 'pyogojeok', 'eojeon', 'dongtaejeon', 'eojeok'],
  },
  {
    row: 3,
    title: '3열 — 탕류',
    guide: '<b>3열</b>은 탕! <b>육탕·소탕·어탕 3탕</b>을 홀수로 맞춰요. 여기도 어동육서 — 육탕은 서쪽, 어탕은 동쪽.',
    rules: ['hongsu', 'eodong'],
    z: 0.11,
    slots: [
      { id: 'yuktang', x: -1.3, name: '육탕' },
      { id: 'sotang',  x: 0,    name: '소탕' },
      { id: 'eotang',  x: 1.3,  name: '어탕' },
    ],
    items: ['yuktang', 'sagoltang', 'sotang', 'dubutang', 'eotang', 'dongtaetang'],
  },
  {
    row: 4,
    title: '4열 — 포·나물·김치·식혜',
    guide: '<b>4열</b>은 <b>좌포우혜</b>! 포는 왼쪽(서쪽) 끝, 식혜는 오른쪽(동쪽) 끝. 가운데엔 나물과 김치를 올려요.',
    rules: ['jwapo'],
    z: 0.64,
    slots: [
      { id: 'po',     x: -1.9,  name: '포' },
      { id: 'namul',  x: -0.65, name: '나물' },
      { id: 'kimchi', x: 0.65,  name: '김치' },
      { id: 'sikhye', x: 1.9,   name: '식혜' },
    ],
    items: ['po', 'daegupo', 'namul', 'chwinamul', 'kimchi', 'baekkimchi', 'sikhye', 'sujeonggwa'],
    taboos: ['t_redkimchi'],
  },
  {
    row: 5,
    title: '5열 — 과일과 한과 (신위에서 가장 먼 줄)',
    guide: '마지막 <b>5열</b>은 과일! <b>조율이시</b> — 왼쪽부터 대추·밤·배·감 순서, <b>홍동백서</b> — 붉은 과일은 동쪽!',
    rules: ['joyul', 'hongdong'],
    z: 1.15,
    slots: [
      { id: 'daechu', x: -2.15, name: '대추' },
      { id: 'bam',    x: -1.29, name: '밤' },
      { id: 'bae',    x: -0.43, name: '배' },
      { id: 'gotgam', x: 0.43,  name: '곶감' },
      { id: 'sagwa',  x: 1.29,  name: '사과' },
      { id: 'yakgwa', x: 2.15,  name: '약과·한과' },
    ],
    items: ['daechu', 'bam', 'bae', 'cheongpodo', 'gotgam', 'sagwa', 'hongsi', 'yakgwa', 'yugwa'],
    taboos: ['t_peach'],
  },
];

// -------------------------------------------------------------------
// 성균관 간소화 표준안 모드 — 자유 배치(free), 전·튀김 제외
// 각 열의 items는 slots 수보다 많이 제공 — 마음에 드는 조합을 골라 채우면 됩니다.
// -------------------------------------------------------------------
export const GANSO_ROWS = [
  {
    row: 1,
    title: '1열 — 수저·잔·메',
    guide: '<b>성균관 표준안</b>으로 차려요. 음식은 <b>최대 9가지</b>면 충분! 순서·방향 부담 없이 <b>빈 자리 아무 곳에나</b> 편하게 놓으세요.',
    rules: ['ganso'],
    z: -0.85,
    slots: [
      { id: 'g1_1', x: -1.5 },
      { id: 'g1_2', x: 0 },
      { id: 'g1_3', x: 1.5 },
    ],
    items: ['g_sijeop', 'g_jan', 'g_makgeolli', 'g_songpyeon', 'g_tteokguk'],
  },
  {
    row: 2,
    title: '2열 — 나물·구이·김치',
    guide: '나물·구이·김치를 올려요. ⚠️ <b>전(부침개)처럼 기름에 부친 음식은 올리지 않아도 예에 어긋나지 않아요!</b>',
    rules: ['ganso'],
    z: 0.15,
    slots: [
      { id: 'g2_1', x: -1.5 },
      { id: 'g2_2', x: 0 },
      { id: 'g2_3', x: 1.5 },
    ],
    items: ['g_namul', 'g_japchae', 'g_gui', 'g_eojeokgui', 'g_kimchi', 'g_yeolmukimchi'],
    taboos: ['t_yukjeon', 't_twigim'],
  },
  {
    row: 3,
    title: '3열 — 과일 네 가지',
    guide: '과일을 올려요. <b>홍동백서·조율이시는 옛 예법 문헌에 없는 표현</b>이에요. 편한 자리에 놓으세요!',
    rules: ['ganso', 'taboo'],
    z: 1.05,
    slots: [
      { id: 'g3_1', x: -1.95 },
      { id: 'g3_2', x: -0.65 },
      { id: 'g3_3', x: 0.65 },
      { id: 'g3_4', x: 1.95 },
    ],
    items: ['g_bam', 'g_sagwa', 'g_bae', 'g_gotgam', 'g_podo', 'g_gyul'],
    taboos: ['t_peach'],
  },
];

// -------------------------------------------------------------------
// 간편 제사상 모드 — 배달·냉동·즉석식품, 자유 배치, 금기 음식만 피하기
// 각 열의 items는 slots 수보다 많이 제공 — 좋아하시던 음식 위주로 골라 채우세요.
// -------------------------------------------------------------------
export const MODERN_ROWS = [
  {
    row: 1,
    title: '1열 — 주식과 음료',
    guide: '<b>간편 제사상</b>! 고인이 좋아하던 음식이면 배달·냉동식품도 괜찮아요. 열 안에서는 <b>빈 자리 아무 곳에나</b> 놓으세요.',
    rules: ['liberal'],
    z: -0.95,
    slots: [
      { id: 'm1_1', x: -2.0 },
      { id: 'm1_2', x: -1.0 },
      { id: 'm1_3', x: 0 },
      { id: 'm1_4', x: 1.0 },
      { id: 'm1_5', x: 2.0 },
    ],
    items: ['m_bap', 'm_cupbap', 'm_cola', 'm_zerocola', 'm_sijeop', 'm_cider', 'm_ion', 'm_pizza', 'm_cheesestick'],
  },
  {
    row: 2,
    title: '2열 — 배달 메인 요리',
    guide: '치킨·족발 같은 <b>배달 메인</b>을 올려요. ⚠️ 단, <b>마늘·매운 양념</b>은 혼령을 쫓는다니 조심!',
    rules: ['liberal', 'taboo'],
    z: -0.42,
    slots: [
      { id: 'm2_1', x: -1.9 },
      { id: 'm2_2', x: -0.95 },
      { id: 'm2_3', x: 0 },
      { id: 'm2_4', x: 0.95 },
      { id: 'm2_5', x: 1.9 },
    ],
    items: ['m_chicken', 'm_jokbal', 'm_bossam', 'm_mandu', 'm_tangsu', 'm_gimbap'],
    taboos: ['t_garlic', 't_yangnyeom'],
  },
  {
    row: 3,
    title: '3열 — 국물 음식 (홀수 전통 잇기)',
    guide: '국물 음식은 전통처럼 <b>홀수(3가지)</b>로! ⚠️ <b>매운 국물</b>은 금기예요.',
    rules: ['liberal', 'hongsu'],
    z: 0.11,
    slots: [
      { id: 'm3_1', x: -1.3 },
      { id: 'm3_2', x: 0 },
      { id: 'm3_3', x: 1.3 },
    ],
    items: ['m_jjajangramen', 'm_eomuk', 'm_sundubu', 'm_miyeok', 'm_gomguk'],
    taboos: ['t_buldak'],
  },
  {
    row: 4,
    title: '4열 — 간식·사이드',
    guide: '고인이 즐기던 <b>간식</b>을 올려요. ⚠️ <b>붉은 팥</b>이 든 음식은 금기!',
    rules: ['liberal', 'taboo'],
    z: 0.64,
    slots: [
      { id: 'm4_1', x: -1.8 },
      { id: 'm4_2', x: -0.6 },
      { id: 'm4_3', x: 0.6 },
      { id: 'm4_4', x: 1.8 },
    ],
    items: ['m_chips', 'm_cheesecookie', 'm_hotdog', 'm_jelly', 'm_dubaiball', 'm_chocopie'],
    taboos: ['t_patbingsu'],
  },
  {
    row: 5,
    title: '5열 — 디저트와 과일',
    guide: '마지막 줄은 <b>디저트와 과일</b>! ⚠️ 과일 중에도 금기가 하나 숨어 있어요.',
    rules: ['liberal', 'taboo'],
    z: 1.15,
    slots: [
      { id: 'm5_1', x: -2.15 },
      { id: 'm5_2', x: -1.29 },
      { id: 'm5_3', x: -0.43 },
      { id: 'm5_4', x: 0.43 },
      { id: 'm5_5', x: 1.29 },
      { id: 'm5_6', x: 2.15 },
    ],
    items: ['m_berry', 'm_banana', 'm_cheesecake', 'm_buttertteok', 'm_sagwa', 'm_orange', 'm_yakgwa'],
    taboos: ['t_peach2'],
  },
];

// -------------------------------------------------------------------
// 게임 모드 정의
// free: true → 열 안에서 아무 빈 자리에나 배치 가능 (순서 자유)
// -------------------------------------------------------------------
export const MODES = {
  trad: {
    key: 'trad',
    label: '전통 차례상',
    rows: FOOD_ROWS,
    free: false,
    summary: `
      ① 병풍 → 돗자리 → 상 → 지방 → 촛대 → 향로 순서로 준비<br/>
      ② 신위(지방)에서 가까운 <b>1열부터 5열까지 차례대로</b> 진설<br/>
      ③ 남좌여우(男左女右) · 반서갱동(飯西羹東)<br/>
      ④ 어동육서(魚東肉西) · 두동미서(頭東尾西)<br/>
      ⑤ 탕은 홀수(3탕) · 좌포우혜(左脯右醯)<br/>
      ⑥ 조율이시(棗栗梨枾) · 홍동백서(紅東白西)`,
  },
  ganso: {
    key: 'ganso',
    label: '성균관 표준안',
    rows: GANSO_ROWS,
    free: true,
    summary: `
      ① 차례 음식은 <b>최대 9가지</b>면 충분해요<br/>
      ② <b>전(기름에 부친 음식)은 올리지 않아도</b> 예에 어긋나지 않아요<br/>
      ③ 홍동백서·조율이시는 옛 예법 문헌에 없는 표현 — <b>배치는 가족 합의로</b><br/>
      ④ 신위는 지방 대신 <b>사진도 가능</b><br/>
      ⑤ 차례의 핵심은 형식이 아니라 <b>조상을 기리는 마음</b>`,
  },
  easy: {
    key: 'easy',
    label: '간편 제사상',
    rows: MODERN_ROWS,
    free: true,
    summary: `
      ① 고인이 좋아하던 음식이면 <b>배달·냉동·즉석식품도 OK</b><br/>
      ② 단, <b>금기 음식</b>은 피해요 — 복숭아(털)·팥(붉은색)·고춧가루·마늘(강한 양념)<br/>
      ③ 국물 음식 <b>홀수</b>처럼 잇고 싶은 전통은 이어가요<br/>
      ④ 형식보다 <b>마음과 정성</b>이 예법입니다`,
  },
};

// 상 윗면 높이(월드 y) — models.js 의 상 규격과 맞춤
export const TABLE_TOP_Y = 0.82;
export const TABLE_CENTER_Z = -0.9;
