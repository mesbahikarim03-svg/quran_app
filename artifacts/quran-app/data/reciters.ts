export interface Reciter {
  id: number;
  networkKey: string;
  name: string;
  nameEn: string;
  style: string;
  bitrate: number;
}

export const RECITERS: Reciter[] = [
  { id: 7, networkKey: 'ar.alafasy', name: 'مشاري راشد العفاسي', nameEn: 'Mishary Rashid Alafasy', style: 'مرتل', bitrate: 128 },
  { id: 1, networkKey: 'ar.husary', name: 'محمود خليل الحصري', nameEn: 'Mahmoud Khalil Al-Husary', style: 'مرتل', bitrate: 128 },
  { id: 3, networkKey: 'ar.minshawi', name: 'محمد صديق المنشاوي', nameEn: 'Muhammad Siddiq Al-Minshawi', style: 'مجود', bitrate: 128 },
  { id: 9, networkKey: 'ar.shaatree', name: 'أبو بكر الشاطري', nameEn: 'Abu Bakr Al-Shatri', style: 'مرتل', bitrate: 128 },
  { id: 10, networkKey: 'ar.abdullahbasfar', name: 'عبدالله بصفر', nameEn: 'Abdullah Basfar', style: 'مرتل', bitrate: 128 },
  { id: 12, networkKey: 'ar.yasserdossari', name: 'ياسر الدوسري', nameEn: 'Yasser Al-Dosari', style: 'مرتل', bitrate: 128 },
  { id: 2, networkKey: 'ar.abdulsamad', name: 'عبد الباسط عبد الصمد', nameEn: 'Abdul Basit Abdul Samad', style: 'مجود', bitrate: 128 },
];

export const CHAPTER_VERSE_COUNTS = [
  0,
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
  123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
  34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
  60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
  28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
  15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
  5, 4, 5, 6,
];

export function getGlobalVerseNumber(chapter: number, verse: number): number {
  let total = 0;
  for (let i = 1; i < chapter; i++) {
    total += CHAPTER_VERSE_COUNTS[i];
  }
  return total + verse;
}

export function getAudioUrl(networkKey: string, globalVerseNumber: number, bitrate = 128): string {
  return `https://cdn.islamic.network/quran/audio/${bitrate}/${networkKey}/${globalVerseNumber}.mp3`;
}

export const CHAPTER_AUDIO_URL = (networkKey: string, chapter: number): string => {
  const paddedChapter = String(chapter).padStart(3, '0');
  return `https://download.quranicaudio.com/qdc/${networkKey}/chapter/${paddedChapter}.mp3`;
};
