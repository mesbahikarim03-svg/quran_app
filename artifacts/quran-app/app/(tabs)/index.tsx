import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppSettings } from '@/context/AppSettingsContext';
import { useLocation } from '@/hooks/useLocation';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useColors } from '@/hooks/useColors';
import { formatTime, getNextPrayer } from '@/services/prayerApi';
import { schedulePrayerNotifications, requestNotificationPermissions } from '@/services/notificationService';
import { PRAYER_NAMES } from '@/data/prayerMethods';

const PRAYER_ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { settings } = useAppSettings();
  const { location, loading: locLoading, error: locError, refresh: refreshLocation } = useLocation();
  const { data: prayerData, isLoading, refetch } = usePrayerTimes(location, settings.prayerMethod, settings.school);
  const [now, setNow] = useState(new Date());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (prayerData && settings.enablePrayerNotifications) {
      requestNotificationPermissions().then(granted => {
        if (granted) {
          schedulePrayerNotifications(
            prayerData.timings,
            settings.preAlertMinutes,
            settings.enablePreAlert,
            settings.enablePrayerNotifications
          );
        }
      });
    }
  }, [prayerData, settings.enablePrayerNotifications, settings.preAlertMinutes, settings.enablePreAlert]);

  const nextPrayer = prayerData ? getNextPrayer(prayerData.timings) : null;
  const hijriDate = prayerData?.date?.hijri;
  const gregorianDate = prayerData?.date?.gregorian;

  const formatCountdown = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h} ساعة ${m > 0 ? `و${m} دقيقة` : ''}`;
    return `${m} دقيقة`;
  };

  const getCurrentPrayer = (): string => {
    if (!prayerData) return '';
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let current = 'Isha';
    for (const prayer of PRAYER_ORDER) {
      const timeStr = prayerData.timings[prayer as keyof typeof prayerData.timings];
      if (!timeStr) continue;
      const [h, m] = timeStr.split(':').map(Number);
      if (h * 60 + m <= currentMinutes) current = prayer;
    }
    return current;
  };

  const currentPrayer = getCurrentPrayer();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading || locLoading}
          onRefresh={() => { refetch(); refreshLocation(); }}
          tintColor={colors.gold}
        />
      }
    >
      <LinearGradient
        colors={['#0D2818', '#0F1923']}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.arabicDate}>
              {hijriDate ? `${hijriDate.day} ${hijriDate.month.ar} ${hijriDate.year} هـ` : ''}
            </Text>
            <Text style={styles.gregorianDate}>
              {gregorianDate ? `${gregorianDate.day}/${gregorianDate.month.number}/${gregorianDate.year}` : ''}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={colors.gold} />
            <Text style={styles.locationText}>
              {location?.city || 'جاري التحديد...'}
            </Text>
          </View>
        </View>

        <Text style={styles.clockText}>
          {now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </Text>

        {nextPrayer && (
          <Animated.View style={[styles.nextPrayerCard, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['#1A3A1F', '#0D4A2A']}
              style={styles.nextPrayerGradient}
            >
              <Text style={styles.nextPrayerLabel}>الصلاة القادمة</Text>
              <Text style={styles.nextPrayerName}>{nextPrayer.nameAr}</Text>
              <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text>
              <View style={styles.countdownRow}>
                <Feather name="clock" size={14} color={colors.gold} />
                <Text style={styles.countdown}>بعد {formatCountdown(nextPrayer.minutesUntil)}</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}
      </LinearGradient>

      <View style={styles.prayersSection}>
        <Text style={[styles.sectionTitle, { color: colors.gold }]}>مواقيت الصلاة</Text>

        {isLoading || locLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.gold} size="large" />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>جاري تحديد المواقيت...</Text>
          </View>
        ) : prayerData ? (
          PRAYER_ORDER.map((prayer) => {
            const timeStr = prayerData.timings[prayer as keyof typeof prayerData.timings];
            if (!timeStr) return null;
            const isActive = prayer === currentPrayer;
            const isNext = prayer === nextPrayer?.name;
            return (
              <View
                key={prayer}
                style={[
                  styles.prayerRow,
                  { backgroundColor: isActive ? '#1A3A1F' : isNext ? '#1A2535' : colors.card },
                  isActive && styles.activePrayerRow,
                ]}
              >
                <View style={styles.prayerLeft}>
                  {isActive && <View style={styles.activeDot} />}
                  {isNext && !isActive && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
                  {!isActive && !isNext && <View style={[styles.activeDot, { backgroundColor: 'transparent' }]} />}
                  <Text style={[styles.prayerName, isActive && { color: colors.gold }]}>
                    {PRAYER_NAMES[prayer] || prayer}
                  </Text>
                </View>
                <Text style={[styles.prayerTime, isActive && { color: colors.gold }]}>
                  {formatTime(timeStr)}
                </Text>
              </View>
            );
          })
        ) : (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
            <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
              {locError || 'تعذر تحميل مواقيت الصلاة'}
            </Text>
            <TouchableOpacity style={[styles.retryBtn, { borderColor: colors.gold }]} onPress={() => refetch()}>
              <Text style={[styles.retryText, { color: colors.gold }]}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  arabicDate: {
    color: '#F0ECD8',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    fontFamily: 'Inter_600SemiBold',
  },
  gregorianDate: {
    color: '#8A9BAE',
    fontSize: 13,
    textAlign: 'right',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#C9963E',
    fontSize: 13,
  },
  clockText: {
    color: '#F0ECD8',
    fontSize: 42,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 20,
    fontFamily: 'Inter_700Bold',
  },
  nextPrayerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  nextPrayerGradient: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A5A30',
  },
  nextPrayerLabel: {
    color: '#8A9BAE',
    fontSize: 13,
    marginBottom: 4,
  },
  nextPrayerName: {
    color: '#C9963E',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter_700Bold',
  },
  nextPrayerTime: {
    color: '#F0ECD8',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdown: {
    color: '#C9963E',
    fontSize: 14,
  },
  prayersSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'right',
    fontFamily: 'Inter_700Bold',
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  activePrayerRow: {
    borderWidth: 1,
    borderColor: '#2A5A30',
  },
  prayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C9963E',
  },
  prayerName: {
    color: '#F0ECD8',
    fontSize: 16,
    fontWeight: '500',
  },
  prayerTime: {
    color: '#F0ECD8',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  retryText: {
    fontSize: 14,
  },
});
