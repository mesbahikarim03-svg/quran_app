export interface Tafsir {
  id: number;
  name: string;
  author: string;
  language: string;
}

export const TAFSIRS: Tafsir[] = [
  { id: 169, name: 'التفسير الميسر', author: 'مجمع الملك فهد', language: 'ar' },
  { id: 91, name: 'تفسير ابن كثير', author: 'ابن كثير', language: 'ar' },
  { id: 90, name: 'تفسير الجلالين', author: 'السيوطي والمحلي', language: 'ar' },
  { id: 93, name: 'تفسير القرطبي', author: 'القرطبي', language: 'ar' },
  { id: 131, name: 'تفسير الطبري', author: 'الطبري', language: 'ar' },
];
