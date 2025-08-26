import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.idiottecnology.compgamerstore',
  appName: 'compgamerstore',
  webDir: 'www',
  plugins: {
    SocialLogin: {
      google: {
        webClientId: '840480061585-volnvfuoup0in8jbkrg2he59109p1arp.apps.googleusercontent.com',
        mode: 'online', // 'online' = obtiene ID Token
      },
    },
  },
};

export default config;
