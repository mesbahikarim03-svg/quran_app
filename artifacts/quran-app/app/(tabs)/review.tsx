import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useAppSettings } from '@/context/AppSettingsContext';
import { fetchChapters, Chapter } from '@/services/quranApi';

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { settings, toggleMemorized, isMemorized, getDueReviews, markReviewDone } = useAppSettings();
  const [reviewMode, setReviewMode] = useState<number | null>(null);
  const [reviewResult, setReviewResult] = useState<'success' | 'fail' | null>(null);

  const { data: chapters, isLoading } = useQuery({
    queryKey: ['chapters'],
    queryFn: fetchChapters,
    staleTime: Infinity,
  });

  const dueReviews = getDueReviews();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleReviewDone = async (surahId: number, success: boolean) => {
    await markReviewDone(surahId, success);
    setReviewMode(null);
    setReviewResult(success ? 'success' : 'fail');
    Haptics.notificationAsync(success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    setTimeout(() => setReviewResult(null), 2000);
  };

  const currentReview = reviewMode !== null ? chapters?.find(c => c.id === reviewMode) : null;

  if (reviewMode !== null && currentReview) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.reviewHeader, { paddingTop: topPad + 8, backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={() => setReviewMode(null)}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.reviewHeaderTitle, { color: colors.gold }]}>مراجعة حفظ</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.reviewContent}>
          <View style={[styles.reviewCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.reviewSurahName, { color: colors.gold }]}>{currentReview.name_arabic}</Text>
            <Text style={[styles.reviewVerseCount, { color: colors.mutedForeground }]}>
              {currentReview.verses_count} آية
            </Text>
            <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.reviewInstruction, { color: colors.foreground }]}>
              قم بمراجعة سورة {currentReview.name_arabic} بتلاوتها كاملاً من الذاكرة
            </Text>
            <Text style={[styles.reviewSub, { color: colors.mutedForeground }]}>
              استحضر السورة في ذهنك وتلُها كاملاً، ثم حدد مدى إتقانك
            </Text>
          </View>

          <TouchableOpacity
            style={styles.openSurahBtn}
            onPress={() => router.push(`/surah/${currentReview.id}`)}
          >
            <Feather name="book-open" size={16} color={colors.primary} />
            <Text style={[styles.openSurahText, { color: colors.primary }]}>افتح السورة للمراجعة</Text>
          </TouchableOpacity>

          <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>كيف كانت المراجعة؟</Text>

          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={[styles.resultBtn, { backgroundColor: '#1A3A1F', borderColor: colors.primary }]}
              onPress={() => handleReviewDone(currentReview.id, true)}
            >
              <Feather name="check-circle" size={24} color={colors.primary} />
              <Text style={[styles.resultBtnText, { color: colors.primary }]}>أتقنتها</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultBtn, { backgroundColor: '#2A0D0D', borderColor: '#ef4444' }]}
              onPress={() => handleReviewDone(currentReview.id, false)}
            >
              <Feather name="x-circle" size={24} color="#ef4444" />
              <Text style={[styles.resultBtnText, { color: '#ef4444' }]}>تحتاج مراجعة</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.headerTitle, { color: colors.gold }]}>مراجعة الحفظ</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          {settings.memorizedSurahs.length} سورة محفوظة
        </Text>
      </View>

      {reviewResult && (
        <View style={[styles.resultToast, {
          backgroundColor: reviewResult === 'success' ? '#1A3A1F' : '#2A0D0D',
          borderColor: reviewResult === 'success' ? colors.primary : '#ef4444',
        }]}>
          <Text style={{ color: reviewResult === 'success' ? colors.primary : '#ef4444', fontSize: 15, fontWeight: '600' }}>
            {reviewResult === 'success' ? 'ممتاز! سيتم تأجيل مراجعتها لاحقاً' : 'سيتم تكرار المراجعة قريباً'}
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }}
        showsVerticalScrollIndicator={false}
      >
        {dueReviews.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.dueDot, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                مستحقة المراجعة اليوم ({dueReviews.length})
              </Text>
            </View>
            {dueReviews.map(surahId => {
              const surah = chapters?.find(c => c.id === surahId);
              if (!surah) return null;
              return (
                <TouchableOpacity
                  key={surahId}
                  style={[styles.dueCard, { backgroundColor: '#1A2535', borderColor: colors.primary }]}
                  onPress={() => setReviewMode(surahId)}
                >
                  <View style={styles.dueCardLeft}>
                    <Text style={[styles.dueCardName, { color: colors.gold }]}>{surah.name_arabic}</Text>
                    <Text style={[styles.dueCardMeta, { color: colors.mutedForeground }]}>{surah.verses_count} آية</Text>
                  </View>
                  <View style={[styles.reviewBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.reviewBadgeText}>راجع</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>جميع السور</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>اضغط على السورة لتحديد حفظها</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
        ) : (
          chapters?.map(chapter => {
            const memorized = isMemorized(chapter.id);
            const isDue = dueReviews.includes(chapter.id);
            const schedule = settings.reviewSchedule[chapter.id];
            const nextReviewDate = schedule ? new Date(schedule.nextReview) : null;

            return (
              <TouchableOpacity
                key={chapter.id}
                style={[
                  styles.surahRow,
                  {
                    backgroundColor: memorized ? '#162030' : colors.card,
                    borderColor: memorized ? (isDue ? '#ef4444' : colors.primary) : colors.border,
                    borderWidth: memorized ? 1 : 0,
                  },
                ]}
                onPress={() => toggleMemorized(chapter.id)}
                onLongPress={() => memorized && setReviewMode(chapter.id)}
                activeOpacity={0.7}
              >
                <View style={styles.surahLeft}>
                  <View style={[styles.surahNum, { backgroundColor: memorized ? '#1D3A2A' : '#1D3040' }]}>
                    <Text style={[styles.surahNumText, { color: memorized ? colors.primary : colors.mutedForeground }]}>
                      {chapter.id}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.surahName, { color: colors.foreground }]}>{chapter.name_arabic}</Text>
                    {memorized && nextReviewDate && (
                      <Text style={[styles.nextReview, { color: colors.mutedForeground }]}>
                        مراجعة: {nextReviewDate <= new Date() ? 'اليوم' : nextReviewDate.toLocaleDateString('ar-SA')}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={[styles.memCheckbox, {
                  backgroundColor: memorized ? colors.primary : 'transparent',
                  borderColor: memorized ? colors.primary : colors.border,
                }]}>
                  {memorized && <Feather name="check" size={14} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 14, marginTop: 2 },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  reviewHeaderTitle: { fontSize: 18, fontWeight: '700' },
  reviewContent: { padding: 20, gap: 16 },
  reviewCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  reviewSurahName: { fontSize: 32, fontWeight: '700' },
  reviewVerseCount: { fontSize: 14 },
  reviewDivider: { height: 1, width: '80%', marginVertical: 8 },
  reviewInstruction: { fontSize: 16, textAlign: 'center', lineHeight: 26 },
  reviewSub: { fontSize: 13, textAlign: 'center' },
  openSurahBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  openSurahText: { fontSize: 15 },
  resultLabel: { fontSize: 14, textAlign: 'center' },
  resultButtons: { flexDirection: 'row', gap: 12 },
  resultBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  resultBtnText: { fontSize: 15, fontWeight: '600' },
  resultToast: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionSub: { fontSize: 12 },
  dueDot: { width: 8, height: 8, borderRadius: 4 },
  dueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  dueCardLeft: { gap: 2 },
  dueCardName: { fontSize: 18, fontWeight: '600' },
  dueCardMeta: { fontSize: 12 },
  reviewBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  reviewBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  surahRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  surahLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  surahNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahNumText: { fontSize: 13, fontWeight: '600' },
  surahName: { fontSize: 16, fontWeight: '500' },
  nextReview: { fontSize: 11, marginTop: 2 },
  memCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
