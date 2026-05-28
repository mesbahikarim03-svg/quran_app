import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { MORNING_ADHKAR, EVENING_ADHKAR, Dhikr } from '@/data/adhkar';

type TimeOfDay = 'morning' | 'evening';

export default function AdhkarScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => {
    const hour = new Date().getHours();
    return hour >= 5 && hour < 17 ? 'morning' : 'evening';
  });
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scaleAnims = useRef<Record<string, Animated.Value>>({}).current;

  const adhkar = timeOfDay === 'morning' ? MORNING_ADHKAR : EVENING_ADHKAR;
  const allCompleted = adhkar.every(d => completedIds.has(d.id));

  const getScaleAnim = (id: string) => {
    if (!scaleAnims[id]) scaleAnims[id] = new Animated.Value(1);
    return scaleAnims[id];
  };

  const handleCount = (dhikr: Dhikr) => {
    if (completedIds.has(dhikr.id)) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const scale = getScaleAnim(dhikr.id);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    setCounts(prev => {
      const current = (prev[dhikr.id] || 0) + 1;
      if (current >= dhikr.count) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCompletedIds(ids => new Set([...ids, dhikr.id]));
      }
      return { ...prev, [dhikr.id]: current };
    });
  };

  const resetAll = () => {
    setCounts({});
    setCompletedIds(new Set());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const completedCount = adhkar.filter(d => completedIds.has(d.id)).length;
  const progress = adhkar.length > 0 ? completedCount / adhkar.length : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.gold }]}>
            {timeOfDay === 'morning' ? 'أذكار الصباح' : 'أذكار المساء'}
          </Text>
          {(completedCount > 0) && (
            <TouchableOpacity onPress={resetAll}>
              <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.tabRow, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.timeTab, timeOfDay === 'morning' && [styles.activeTimeTab, { backgroundColor: '#1D3040' }]]}
            onPress={() => { setTimeOfDay('morning'); resetAll(); }}
          >
            <Feather name="sun" size={14} color={timeOfDay === 'morning' ? colors.gold : colors.mutedForeground} />
            <Text style={[styles.timeTabText, { color: timeOfDay === 'morning' ? colors.gold : colors.mutedForeground }]}>
              الصباح
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeTab, timeOfDay === 'evening' && [styles.activeTimeTab, { backgroundColor: '#1D3040' }]]}
            onPress={() => { setTimeOfDay('evening'); resetAll(); }}
          >
            <Feather name="moon" size={14} color={timeOfDay === 'evening' ? colors.gold : colors.mutedForeground} />
            <Text style={[styles.timeTabText, { color: timeOfDay === 'evening' ? colors.gold : colors.mutedForeground }]}>
              المساء
            </Text>
          </TouchableOpacity>
        </View>

        {completedCount > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.gold, width: `${progress * 100}%` }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
              {completedCount}/{adhkar.length}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }}
        showsVerticalScrollIndicator={false}
      >
        {allCompleted && (
          <View style={[styles.allDoneCard, { backgroundColor: '#1A3A1F', borderColor: '#2A5A30' }]}>
            <Feather name="check-circle" size={28} color={colors.gold} />
            <Text style={[styles.allDoneText, { color: colors.gold }]}>
              {timeOfDay === 'morning' ? 'أتممت أذكار الصباح' : 'أتممت أذكار المساء'}
            </Text>
            <Text style={[styles.allDoneSub, { color: colors.mutedForeground }]}>بارك الله فيك</Text>
          </View>
        )}

        {adhkar.map((dhikr) => {
          const current = counts[dhikr.id] || 0;
          const done = completedIds.has(dhikr.id);
          const isExpanded = expandedId === dhikr.id;
          const scale = getScaleAnim(dhikr.id);

          return (
            <Animated.View key={dhikr.id} style={[{ transform: [{ scale }] }, styles.dhikrCard, {
              backgroundColor: done ? '#162030' : colors.card,
              borderColor: done ? colors.gold : colors.border,
              borderWidth: done ? 1 : 0,
            }]}>
              <TouchableOpacity
                onPress={() => setExpandedId(isExpanded ? null : dhikr.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dhikrArabic, { color: done ? colors.mutedForeground : colors.foreground }]}>
                  {dhikr.arabic}
                </Text>

                {isExpanded && (
                  <View style={[styles.dhikrMeta, { borderTopColor: colors.border }]}>
                    <Text style={[styles.dhikrTranslation, { color: colors.mutedForeground }]}>{dhikr.translation}</Text>
                    <Text style={[styles.dhikrSource, { color: colors.gold }]}>المصدر: {dhikr.source}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.dhikrBottom}>
                <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
                  {done ? '✓ اكتمل' : `${current}/${dhikr.count}`}
                </Text>
                {!done && (
                  <TouchableOpacity
                    style={[styles.countBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleCount(dhikr)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.countBtnText}>{dhikr.count === 1 ? 'تم' : `${dhikr.count - current} مرة`}</Text>
                  </TouchableOpacity>
                )}
                {done && <Feather name="check-circle" size={20} color={colors.gold} />}
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  timeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTimeTab: {},
  timeTabText: { fontSize: 14, fontWeight: '600' },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: { fontSize: 12 },
  allDoneCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    gap: 6,
  },
  allDoneText: { fontSize: 18, fontWeight: '700' },
  allDoneSub: { fontSize: 14 },
  dhikrCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  dhikrArabic: {
    fontSize: 20,
    lineHeight: 36,
    textAlign: 'right',
    fontFamily: 'Inter_400Regular',
  },
  dhikrMeta: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 4,
  },
  dhikrTranslation: { fontSize: 13, textAlign: 'right', lineHeight: 20 },
  dhikrSource: { fontSize: 12, textAlign: 'right' },
  dhikrBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  countLabel: { fontSize: 13 },
  countBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
