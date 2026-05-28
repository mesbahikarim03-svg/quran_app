import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useAppSettings } from '@/context/AppSettingsContext';
import { fetchChapters, Chapter, getRevelationPlace } from '@/services/quranApi';

const JUZ_STARTS: { juz: number; chapter: number; verse: number }[] = [
  { juz: 1, chapter: 1, verse: 1 },
  { juz: 2, chapter: 2, verse: 142 },
  { juz: 3, chapter: 2, verse: 253 },
  { juz: 4, chapter: 3, verse: 92 },
  { juz: 5, chapter: 4, verse: 24 },
  { juz: 6, chapter: 4, verse: 148 },
  { juz: 7, chapter: 5, verse: 82 },
  { juz: 8, chapter: 6, verse: 111 },
  { juz: 9, chapter: 7, verse: 87 },
  { juz: 10, chapter: 8, verse: 41 },
  { juz: 30, chapter: 78, verse: 1 },
];

type Tab = 'surahs' | 'juz' | 'bookmarks';

export default function QuranScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { settings, isBookmarked } = useAppSettings();
  const [activeTab, setActiveTab] = useState<Tab>('surahs');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: chapters, isLoading, error } = useQuery({
    queryKey: ['chapters'],
    queryFn: fetchChapters,
    staleTime: Infinity,
  });

  const filteredChapters = useMemo(() => {
    if (!chapters) return [];
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.toLowerCase();
    return chapters.filter(c =>
      c.name_arabic.includes(q) ||
      c.name_simple.toLowerCase().includes(q) ||
      String(c.id).includes(q)
    );
  }, [chapters, searchQuery]);

  const bookmarkedChapters = useMemo(() => {
    if (!chapters) return [];
    const bookmarkedIds = new Set(settings.bookmarks.map(b => parseInt(b.split(':')[0])));
    return chapters.filter(c => bookmarkedIds.has(c.id));
  }, [chapters, settings.bookmarks]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const renderSurahItem = ({ item }: { item: Chapter }) => (
    <TouchableOpacity
      style={[styles.surahRow, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/surah/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.surahNumber, { backgroundColor: '#1D3040' }]}>
        <Text style={[styles.surahNumberText, { color: colors.gold }]}>{item.id}</Text>
      </View>
      <View style={styles.surahInfo}>
        <Text style={[styles.surahNameArabic, { color: colors.foreground }]}>{item.name_arabic}</Text>
        <Text style={[styles.surahMeta, { color: colors.mutedForeground }]}>
          {getRevelationPlace(item.revelation_place)} · {item.verses_count} آية
        </Text>
      </View>
      <View style={styles.surahRight}>
        <Text style={[styles.surahNameSimple, { color: colors.mutedForeground }]}>{item.name_simple}</Text>
        <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>جاري تحميل القرآن الكريم...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>تعذر تحميل البيانات</Text>
        </View>
      );
    }

    if (activeTab === 'surahs') {
      return (
        <FlatList
          data={filteredChapters}
          keyExtractor={item => String(item.id)}
          renderItem={renderSurahItem}
          contentContainerStyle={{ paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!filteredChapters.length}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={[styles.errorText, { color: colors.mutedForeground }]}>لا توجد نتائج</Text>
            </View>
          }
        />
      );
    }

    if (activeTab === 'juz') {
      return (
        <FlatList
          data={chapters || []}
          keyExtractor={item => String(item.id)}
          renderItem={renderSurahItem}
          contentContainerStyle={{ paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(chapters?.length)}
        />
      );
    }

    if (activeTab === 'bookmarks') {
      return bookmarkedChapters.length === 0 ? (
        <View style={styles.centered}>
          <Feather name="bookmark" size={40} color={colors.mutedForeground} />
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>لا توجد إشارات مرجعية</Text>
          <Text style={[styles.subText, { color: colors.mutedForeground }]}>
            اضغط على أي آية واضغط إشارة مرجعية لحفظها هنا
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarkedChapters}
          keyExtractor={item => String(item.id)}
          renderItem={renderSurahItem}
          contentContainerStyle={{ paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!bookmarkedChapters.length}
        />
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerArea, { paddingTop: topPad + 8 }]}>
        <Text style={styles.headerTitle}>القرآن الكريم</Text>

        {activeTab === 'surahs' && (
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="ابحث عن سورة..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              textAlign="right"
            />
          </View>
        )}

        <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
          {(['surahs', 'juz', 'bookmarks'] as Tab[]).map(tab => {
            const labels: Record<Tab, string> = { surahs: 'السور', juz: 'الأجزاء', bookmarks: 'المفضلة' };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && [styles.activeTab, { backgroundColor: '#1D3040' }]]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, { color: activeTab === tab ? colors.gold : colors.mutedForeground }]}>
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  headerTitle: {
    color: '#C9963E',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {},
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    gap: 12,
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahNumberText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  surahInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  surahNameArabic: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  surahMeta: {
    fontSize: 12,
  },
  surahRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  surahNameSimple: {
    fontSize: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 16, textAlign: 'center', paddingHorizontal: 32 },
  subText: { fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
});
