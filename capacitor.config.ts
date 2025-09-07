import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b0f92b2d73c54011888eb990693ad658',
  appName: 'Winnipeg Transit Navigator',
  webDir: 'dist',
  server: {
    url: 'https://b0f92b2d-73c5-4011-888e-b990693ad658.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0ea5e9",
      showSpinner: false
    }
  }
};

export default config;