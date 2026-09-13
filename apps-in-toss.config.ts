import { defineConfig } from '@apps-in-toss/web-framework/config';

// ★ 앱인토스 콘솔(apps-in-toss.toss.im/console)에 미니앱을 등록한 뒤
//   appName / displayName / icon 을 콘솔 등록 정보와 동일하게 맞춰주세요.
export default defineConfig({
  // 콘솔에 등록한 앱 이름 (딥링크 intoss://charyesang 에 사용)
  appName: 'charyesang',

  brand: {
    primaryColor: '#B3392C'
  },

  permissions: [],
  webBundleDir: 'dist'
});
