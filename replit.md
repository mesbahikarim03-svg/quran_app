# القرآن الكريم - Quran App

تطبيق موبايل متكامل للقرآن الكريم بمميزات شاملة.

## Run & Operate

- `pnpm --filter @workspace/quran-app run dev` — run the Expo app
- `pnpm run typecheck` — full typecheck across all packages
- Required env: none (uses free public APIs)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54 + React Native + Expo Router
- State: React Query + AsyncStorage + React Context
- APIs: quran.com API v4 (Quran data), Aladhan API (prayer times)
- Audio: expo-av (verse-by-verse playback)
- Location: expo-location (GPS for prayer times)
- Notifications: expo-notifications (prayer alerts)

## Where things live

- `artifacts/quran-app/` — main Expo app
- `artifacts/quran-app/app/(tabs)/` — main tab screens (home, quran, adhkar, review, settings)
- `artifacts/quran-app/app/surah/[id].tsx` — Surah reader with audio player
- `artifacts/quran-app/context/AppSettingsContext.tsx` — global settings & bookmarks
- `artifacts/quran-app/services/prayerApi.ts` — Aladhan prayer times API
- `artifacts/quran-app/services/quranApi.ts` — quran.com API
- `artifacts/quran-app/services/notificationService.ts` — notification scheduling
- `artifacts/quran-app/data/adhkar.ts` — morning/evening adhkar data
- `artifacts/quran-app/data/reciters.ts` — reciters list + audio URL helpers
- `.github/workflows/android.yml` — GitHub Actions APK build

## Features

1. تعدد المصاحف وطرق التصفح (حفص، ورش، تجويد ملون، هندي)
2. تعدد التلاوات (العفاسي، الحصري، المنشاوي، الشاطري، بصفر، الدوسري، عبد الصمد)
3. تحديد الموقع GPS لأوقات الصلاة
4. نظام مراجعة القرآن بالتكرار المتباعد (Spaced Repetition)
5. أذكار الصباح والمساء مع عداد وتذكير
6. تفسير القرآن (التفسير الميسر، ابن كثير، الجلالين، القرطبي، الطبري)
7. تنبيه قبل الصلاة بـ15 دقيقة (قابل للتغيير)
8. تنبيه بأوقات الصلاة

## User preferences

- تطبيق عربي كامل RTL
- تصميم داكن إسلامي (أخضر زمردي وذهب)

## Gotchas

- expo-av deprecated in SDK 54 — works but shows warning; upgrade to expo-audio in future
- expo-notifications version mismatch with SDK 54 — functional but shows warning
- Quran audio uses Islamic Network CDN: cdn.islamic.network/quran/audio/128/{reciter}/{verse}.mp3
- Prayer times from Aladhan API with GPS coordinates
