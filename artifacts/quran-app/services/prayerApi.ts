import { PRAYER_NAMES } from '../data/prayerMethods';

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Midnight: string;
}

export interface PrayerTimesResponse {
  timings: PrayerTimes;
  date: {
    readable: string;
    timestamp: string;
    hijri: {
      date: string;
      month: { number: number; en: string; ar: string };
      year: string;
      day: string;
    };
    gregorian: {
      date: string;
      month: { number: number; en: string };
      year: string;
      day: string;
    };
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: { id: number; name: string };
  };
}

export async function fetchPrayerTimes(
  latitude: number,
  longitude: number,
  method: number = 4,
  school: number = 0
): Promise<PrayerTimesResponse> {
  const timestamp = Math.floor(Date.now() / 1000);
  const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${school}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Prayer times API error: ${response.status}`);
  }
  const data = await response.json();
  if (data.code !== 200) {
    throw new Error(`Prayer times error: ${data.status}`);
  }
  return data.data as PrayerTimesResponse;
}

export interface NextPrayer {
  name: string;
  nameAr: string;
  time: string;
  minutesUntil: number;
}

export function getNextPrayer(timings: PrayerTimes): NextPrayer | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

  for (const prayer of prayers) {
    const timeStr = timings[prayer];
    const [hours, minutes] = timeStr.split(':').map(Number);
    const prayerMinutes = hours * 60 + minutes;

    if (prayerMinutes > currentMinutes) {
      return {
        name: prayer,
        nameAr: PRAYER_NAMES[prayer] || prayer,
        time: formatTime(timeStr),
        minutesUntil: prayerMinutes - currentMinutes,
      };
    }
  }

  const fajrTime = timings['Fajr'];
  const [fajrHours, fajrMinutes] = fajrTime.split(':').map(Number);
  const fajrTotalMinutes = fajrHours * 60 + fajrMinutes + 24 * 60;
  return {
    name: 'Fajr',
    nameAr: 'الفجر',
    time: formatTime(fajrTime),
    minutesUntil: fajrTotalMinutes - currentMinutes,
  };
}

export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'م' : 'ص';
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, '0')} ${period}`;
}
