import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PrayerTimes, formatTime } from './prayerApi';
import { PRAYER_NAMES } from '../data/prayerMethods';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function cancelAllPrayerNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function schedulePrayerNotifications(
  timings: PrayerTimes,
  preAlertMinutes: number = 15,
  enablePreAlert: boolean = true,
  enableAthan: boolean = true
): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelAllPrayerNotifications();

  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
  const now = new Date();

  for (const prayer of prayers) {
    const timeStr = timings[prayer as keyof PrayerTimes];
    if (!timeStr) continue;

    const [hours, minutes] = timeStr.split(':').map(Number);
    const prayerTime = new Date(now);
    prayerTime.setHours(hours, minutes, 0, 0);

    if (prayerTime <= now) {
      prayerTime.setDate(prayerTime.getDate() + 1);
    }

    const arabicName = PRAYER_NAMES[prayer] || prayer;

    if (enableAthan) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `حان وقت صلاة ${arabicName}`,
          body: `الآن ${formatTime(timeStr)} - حان وقت أداء صلاة ${arabicName}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: prayerTime,
        },
      });
    }

    if (enablePreAlert && preAlertMinutes > 0) {
      const preAlertTime = new Date(prayerTime.getTime() - preAlertMinutes * 60 * 1000);
      if (preAlertTime > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `صلاة ${arabicName} بعد ${preAlertMinutes} دقيقة`,
            body: `استعد لصلاة ${arabicName} - سيحل وقتها في تمام ${formatTime(timeStr)}`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: preAlertTime,
          },
        });
      }
    }
  }
}

export async function scheduleAdhkarReminder(
  type: 'morning' | 'evening',
  hour: number,
  minute: number
): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: type === 'morning' ? 'أذكار الصباح' : 'أذكار المساء',
      body: type === 'morning'
        ? 'لا تنسَ أذكار الصباح - ابدأ يومك بذكر الله'
        : 'حان وقت أذكار المساء - اختم يومك بذكر الله',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}
