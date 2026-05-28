export interface PrayerMethod {
  id: number;
  name: string;
  nameEn: string;
}

export const PRAYER_METHODS: PrayerMethod[] = [
  { id: 4, name: 'أم القرى - مكة المكرمة', nameEn: 'Umm Al-Qura University, Mecca' },
  { id: 3, name: 'رابطة العالم الإسلامي', nameEn: 'Muslim World League' },
  { id: 2, name: 'الجمعية الإسلامية في أمريكا الشمالية', nameEn: 'Islamic Society of North America (ISNA)' },
  { id: 1, name: 'الهيئة العلمية لمواقيت الصلاة - مصر', nameEn: 'Egyptian General Authority of Survey' },
  { id: 5, name: 'هيئة الشؤون الإسلامية الباكستانية', nameEn: 'University of Islamic Sciences, Karachi' },
  { id: 16, name: 'الاتحاد الإسلامي لأمريكا الشمالية', nameEn: 'Union Organizations Islamic de France' },
];

export const ADHAN_STYLES = [
  { id: 'makkah', name: 'أذان مكة المكرمة' },
  { id: 'madinah', name: 'أذان المدينة المنورة' },
  { id: 'egypt', name: 'أذان مصر' },
  { id: 'turkey', name: 'أذان تركيا' },
];

export const MUSHAF_STYLES = [
  { id: 'hafs', name: 'مصحف المدينة (حفص عن عاصم)', description: 'الرواية الأكثر انتشاراً في العالم' },
  { id: 'tajweed', name: 'مصحف التجويد الملون', description: 'مع ألوان التجويد' },
  { id: 'warsh', name: 'رواية ورش عن نافع', description: 'رواية شائعة في المغرب العربي' },
  { id: 'indopak', name: 'مصحف الهند والباكستان', description: 'الرسم الهندي' },
];

export const PRAYER_NAMES: Record<string, string> = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
  Midnight: 'منتصف الليل',
  Firstthird: 'ثلث الليل الأول',
  Lastthird: 'ثلث الليل الأخير',
};
