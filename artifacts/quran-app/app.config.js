const isEASBuild = !!process.env.EAS_BUILD;

const plugins = isEASBuild
  ? [
      ['expo-router', { origin: 'https://replit.com/' }],
      'expo-font',
      'expo-web-browser',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'يحتاج التطبيق إلى موقعك لتحديد مواقيت الصلاة بدقة',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#2A9D5C',
          sounds: [],
        },
      ],
    ]
  : [];

module.exports = {
  expo: {
    name: 'القرآن الكريم',
    slug: 'quran-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'quran-app',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#0F1923',
    },
    ios: {
      supportsTablet: false,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'يحتاج التطبيق إلى موقعك لحساب مواقيت الصلاة بدقة',
        NSMicrophoneUsageDescription:
          'يستخدم التطبيق الميكروفون لميزة المراجعة الصوتية',
      },
    },
    android: {
      package: 'com.krimoss.quranapp',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
        'WAKE_LOCK',
        'RECORD_AUDIO',
        'FOREGROUND_SERVICE',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
    },
    web: { favicon: './assets/images/icon.png' },
    plugins,
    experiments: { typedRoutes: true },
    extra: {
      eas: { projectId: 'c3df65b3-3d2a-4340-b0a5-9294790512e8' },
      router: { origin: 'https://replit.com/' },
    },
    owner: 'krimoss',
  },
};
