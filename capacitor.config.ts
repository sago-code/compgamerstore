import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.idiottecnology.compgamerstore',
  appName: 'compgamerstore',
  webDir: 'www',
  plugins: {
    SocialLogin: {
      google: {
        androidClientId: "840480061585-volnvfuoup0in8jbkrg2he59109p1arp.apps.googleusercontent.com",
        iosClientId: "840480061585-71s9v9ng34na3ll2q140ll8vlgjbrul3.apps.googleusercontent.com",
        webClientId: "840480061585-volnvfuoup0in8jbkrg2he59109p1arp.apps.googleusercontent.com",
        mode: 'online', // 'online' = obtiene ID Token
      },
    },
  },
};

export default config;
