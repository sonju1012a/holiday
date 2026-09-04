import { defineConfig } from '@apps-in-toss/web-framework/config';

// ★ 앱인토스 콘솔(console.apps-in-toss.toss.im)에 미니앱을 등록한 뒤
//   appName / displayName / icon 을 콘솔 등록 정보와 동일하게 맞춰주세요.
export default defineConfig({
  appName: 'charye-game', // 콘솔에 등록한 앱 이름 (딥링크 intoss://charye-game 에 사용)
  brand: {
    displayName: '차례상 차리기', // 토스 앱에 표시될 이름
    primaryColor: '#B3392C',
    icon: 'https://YOUR_CONSOLE_IMAGE_URL/icon.png', // TODO: 콘솔에 업로드한 아이콘 URL로 교체
  },
  web: {
    host: 'localhost',
    port: 5199,
    commands: {
      dev: 'vite --port 5199 --strictPort',
      build: 'vite build --mode toss', // .env.toss 적용 (쇼핑 토스트 끔·외부 링크 숨김)
    },
  },
  permissions: [],
  outdir: 'dist',
});
