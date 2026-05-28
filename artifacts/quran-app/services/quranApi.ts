export interface Chapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    language_name: string;
    name: string;
  };
}

export interface Word {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: string;
  text: string;
  text_uthmani: string;
  page_number: number;
  line_number: number;
  translation: {
    language_name: string;
    text: string;
  };
  transliteration: {
    language_name: string;
    text: string;
  };
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number: number | null;
  page_number: number;
  juz_number: number;
  words: Word[];
  text_uthmani?: string;
  text_indopak?: string;
  translations?: Array<{
    language_name: string;
    text: string;
    resource_name: string;
    id: number;
  }>;
  audio?: {
    url: string;
    duration: number;
    format: string;
    audio_url: string;
  };
}

export interface VerseAudio {
  url: string;
  duration: number;
}

const BASE_URL = 'https://api.quran.com/api/v4';

export async function fetchChapters(): Promise<Chapter[]> {
  const response = await fetch(`${BASE_URL}/chapters?language=ar`);
  if (!response.ok) throw new Error('Failed to fetch chapters');
  const data = await response.json();
  return data.chapters as Chapter[];
}

export async function fetchChapter(id: number): Promise<Chapter> {
  const response = await fetch(`${BASE_URL}/chapters/${id}?language=ar`);
  if (!response.ok) throw new Error('Failed to fetch chapter');
  const data = await response.json();
  return data.chapter as Chapter;
}

export async function fetchVerses(
  chapterId: number,
  reciterId: number = 7,
  translationId?: number,
  tafsirId?: number
): Promise<Verse[]> {
  let url = `${BASE_URL}/verses/by_chapter/${chapterId}?language=ar&words=true&per_page=300&page=1&word_fields=text_uthmani`;

  if (reciterId) url += `&audio=${reciterId}`;
  if (translationId) url += `&translations=${translationId}`;
  if (tafsirId) url += `&tafsirs=${tafsirId}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch verses');
  const data = await response.json();
  return data.verses as Verse[];
}

export async function fetchTafsir(verseKey: string, tafsirId: number): Promise<string> {
  const response = await fetch(`${BASE_URL}/tafsirs/${tafsirId}/by_ayah/${verseKey}`);
  if (!response.ok) throw new Error('Failed to fetch tafsir');
  const data = await response.json();
  return data.tafsir?.text || '';
}

export function getJuzName(juzNumber: number): string {
  const juzNames: Record<number, string> = {
    1: 'الجزء الأول - الم',
    2: 'الجزء الثاني - سيقول',
    3: 'الجزء الثالث - تلك الرسل',
    4: 'الجزء الرابع - لن تنالوا',
    5: 'الجزء الخامس - والمحصنات',
    6: 'الجزء السادس - لا يحب الله',
    7: 'الجزء السابع - وإذا سمعوا',
    8: 'الجزء الثامن - ولو أننا',
    9: 'الجزء التاسع - قال الملأ',
    10: 'الجزء العاشر - واعلموا',
    30: 'الجزء الثلاثون - عم',
  };
  return juzNames[juzNumber] || `الجزء ${juzNumber}`;
}

export function getRevelationPlace(place: string): string {
  return place === 'makkah' ? 'مكية' : 'مدنية';
}
