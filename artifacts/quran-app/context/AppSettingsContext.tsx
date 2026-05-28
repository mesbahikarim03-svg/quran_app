import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AppSettings {
  reciterId: number;
  mushafStyle: string;
  tafsirId: number;
  prayerMethod: number;
  school: number;
  preAlertMinutes: number;
  enablePrayerNotifications: boolean;
  enablePreAlert: boolean;
  enableAdhkarReminder: boolean;
  morningReminderHour: number;
  morningReminderMinute: number;
  eveningReminderHour: number;
  eveningReminderMinute: number;
  showTransliteration: boolean;
  arabicFontSize: number;
  bookmarks: string[];
  lastReadSurah: number;
  lastReadVerse: number;
  memorizedSurahs: number[];
  reviewSchedule: Record<number, { nextReview: number; level: number }>;
}

const DEFAULT_SETTINGS: AppSettings = {
  reciterId: 7,
  mushafStyle: 'hafs',
  tafsirId: 169,
  prayerMethod: 4,
  school: 0,
  preAlertMinutes: 15,
  enablePrayerNotifications: true,
  enablePreAlert: true,
  enableAdhkarReminder: true,
  morningReminderHour: 6,
  morningReminderMinute: 30,
  eveningReminderHour: 17,
  eveningReminderMinute: 0,
  showTransliteration: false,
  arabicFontSize: 24,
  bookmarks: [],
  lastReadSurah: 1,
  lastReadVerse: 1,
  memorizedSurahs: [],
  reviewSchedule: {},
};

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  toggleBookmark: (verseKey: string) => Promise<void>;
  isBookmarked: (verseKey: string) => boolean;
  toggleMemorized: (surahId: number) => Promise<void>;
  isMemorized: (surahId: number) => boolean;
  markReviewDone: (surahId: number, success: boolean) => Promise<void>;
  getDueReviews: () => number[];
  isLoaded: boolean;
}

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

const STORAGE_KEY = '@quran_app_settings';

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  };

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const toggleBookmark = useCallback(async (verseKey: string) => {
    setSettings(prev => {
      const bookmarks = prev.bookmarks.includes(verseKey)
        ? prev.bookmarks.filter(b => b !== verseKey)
        : [...prev.bookmarks, verseKey];
      const updated = { ...prev, bookmarks };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const isBookmarked = useCallback((verseKey: string) => {
    return settings.bookmarks.includes(verseKey);
  }, [settings.bookmarks]);

  const toggleMemorized = useCallback(async (surahId: number) => {
    setSettings(prev => {
      const memorizedSurahs = prev.memorizedSurahs.includes(surahId)
        ? prev.memorizedSurahs.filter(id => id !== surahId)
        : [...prev.memorizedSurahs, surahId];

      const reviewSchedule = { ...prev.reviewSchedule };
      if (!prev.memorizedSurahs.includes(surahId)) {
        reviewSchedule[surahId] = { nextReview: Date.now(), level: 0 };
      } else {
        delete reviewSchedule[surahId];
      }

      const updated = { ...prev, memorizedSurahs, reviewSchedule };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const isMemorized = useCallback((surahId: number) => {
    return settings.memorizedSurahs.includes(surahId);
  }, [settings.memorizedSurahs]);

  const REVIEW_INTERVALS = [0, 1, 3, 7, 14, 30, 60, 90];

  const markReviewDone = useCallback(async (surahId: number, success: boolean) => {
    setSettings(prev => {
      const current = prev.reviewSchedule[surahId] || { nextReview: Date.now(), level: 0 };
      const newLevel = success
        ? Math.min(current.level + 1, REVIEW_INTERVALS.length - 1)
        : Math.max(current.level - 1, 0);
      const intervalDays = REVIEW_INTERVALS[newLevel];
      const nextReview = Date.now() + intervalDays * 24 * 60 * 60 * 1000;

      const reviewSchedule = {
        ...prev.reviewSchedule,
        [surahId]: { nextReview, level: newLevel },
      };
      const updated = { ...prev, reviewSchedule };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const getDueReviews = useCallback((): number[] => {
    const now = Date.now();
    return settings.memorizedSurahs.filter(surahId => {
      const schedule = settings.reviewSchedule[surahId];
      return !schedule || schedule.nextReview <= now;
    });
  }, [settings.memorizedSurahs, settings.reviewSchedule]);

  return (
    <AppSettingsContext.Provider value={{
      settings,
      updateSettings,
      toggleBookmark,
      isBookmarked,
      toggleMemorized,
      isMemorized,
      markReviewDone,
      getDueReviews,
      isLoaded,
    }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextType {
  const context = useContext(AppSettingsContext);
  if (!context) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return context;
}
