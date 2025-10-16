// Archivo: capacitor.config.ts

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.idiottecnology.compgamerstore',
  appName: 'compgamerstore',
  webDir: 'www',
  plugins: {
    SocialLogin: {
      google: {
        // En Android usar el webClientId (Capgo), no androidClientId
        webClientId: '840480061585-volnvfuoup0in8jbkrg2he59109p1arp.apps.googleusercontent.com',
        // En iOS usar iOSClientId (con mayúsculas)
        iOSClientId: '840480061585-71s9v9ng34na3ll2q140ll8vlgjbrul3.apps.googleusercontent.com',
        mode: 'online',
      },
    },
  },
};

export default config;
