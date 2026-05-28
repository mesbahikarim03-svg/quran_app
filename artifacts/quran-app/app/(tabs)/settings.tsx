import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useAppSettings } from '@/context/AppSettingsContext';
import { RECITERS } from '@/data/reciters';
import { PRAYER_METHODS, ADHAN_STYLES, MUSHAF_STYLES } from '@/data/prayerMethods';
import { TAFSIRS } from '@/data/tafsirs';
import { requestNotificationPermissions } from '@/services/notificationService';

type PickerType = 'reciter' | 'mushaf' | 'tafsir' | 'prayerMethod' | 'preAlert' | null;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { settings, updateSettings } = useAppSettings();
  const [activePicker, setActivePicker] = useState<PickerType>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const currentReciter = RECITERS.find(r => r.id === settings.reciterId);
  const currentMushaf = MUSHAF_STYLES.find(m => m.id === settings.mushafStyle);
  const currentTafsir = TAFSIRS.find(t => t.id === settings.tafsirId);
  const currentMethod = PRAYER_METHODS.find(m => m.id === settings.prayerMethod);

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('التنبيهات', 'يرجى السماح بالتنبيهات من إعدادات الجهاز لتفعيل هذه الميزة');
        return;
      }
    }
    updateSettings({ enablePrayerNotifications: value });
  };

  const Section = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: colors.gold }]}>{title}</Text>
  );

  const SettingRow = ({
    label,
    value,
    onPress,
    toggle,
    toggleValue,
    onToggle,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    toggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (val: boolean) => void;
  }) => (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card }]}
      onPress={onPress}
      disabled={toggle}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      ) : (
        <View style={styles.rowRight}>
          <Text style={[styles.rowValue, { color: colors.mutedForeground }]} numberOfLines={1}>{value}</Text>
          <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
        </View>
      )}
    </TouchableOpacity>
  );

  const PickerModal = ({ type }: { type: PickerType }) => {
    if (!type) return null;

    type Option = { id: string | number; name: string; description?: string };
    let options: Option[] = [];
    let title = '';
    let selectedId: string | number = '';
    let onSelect: (id: any) => void = () => {};

    if (type === 'reciter') {
      title = 'اختر القارئ';
      options = RECITERS.map(r => ({ id: r.id, name: r.name, description: r.style }));
      selectedId = settings.reciterId;
      onSelect = (id: number) => updateSettings({ reciterId: id });
    } else if (type === 'mushaf') {
      title = 'اختر المصحف';
      options = MUSHAF_STYLES.map(m => ({ id: m.id, name: m.name, description: m.description }));
      selectedId = settings.mushafStyle;
      onSelect = (id: string) => updateSettings({ mushafStyle: id });
    } else if (type === 'tafsir') {
      title = 'اختر التفسير';
      options = TAFSIRS.map(t => ({ id: t.id, name: t.name, description: t.author }));
      selectedId = settings.tafsirId;
      onSelect = (id: number) => updateSettings({ tafsirId: id });
    } else if (type === 'prayerMethod') {
      title = 'طريقة حساب الصلاة';
      options = PRAYER_METHODS.map(m => ({ id: m.id, name: m.name }));
      selectedId = settings.prayerMethod;
      onSelect = (id: number) => updateSettings({ prayerMethod: id });
    } else if (type === 'preAlert') {
      title = 'وقت التنبيه قبل الصلاة';
      options = [5, 10, 15, 20, 30].map(m => ({ id: m, name: `${m} دقيقة` }));
      selectedId = settings.preAlertMinutes;
      onSelect = (id: number) => updateSettings({ preAlertMinutes: id });
    }

    return (
      <Modal
        visible
        transparent
        animationType="slide"
        onRequestClose={() => setActivePicker(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setActivePicker(null)} activeOpacity={1}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.gold }]}>{title}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map(opt => {
                const isSelected = opt.id === selectedId;
                return (
                  <TouchableOpacity
                    key={String(opt.id)}
                    style={[styles.optionRow, isSelected && { backgroundColor: '#1D3040' }]}
                    onPress={() => {
                      onSelect(opt.id);
                      setActivePicker(null);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionName, { color: isSelected ? colors.gold : colors.foreground }]}>
                        {opt.name}
                      </Text>
                      {opt.description && (
                        <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{opt.description}</Text>
                      )}
                    </View>
                    {isSelected && <Feather name="check" size={18} color={colors.gold} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.headerTitle, { color: colors.gold }]}>الإعدادات</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom), gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <Section title="القرآن الكريم" />
        <SettingRow label="القارئ" value={currentReciter?.name} onPress={() => setActivePicker('reciter')} />
        <SettingRow label="المصحف" value={currentMushaf?.name} onPress={() => setActivePicker('mushaf')} />
        <SettingRow label="التفسير الافتراضي" value={currentTafsir?.name} onPress={() => setActivePicker('tafsir')} />

        <Section title="أوقات الصلاة" />
        <SettingRow label="طريقة الحساب" value={currentMethod?.name} onPress={() => setActivePicker('prayerMethod')} />

        <Section title="التنبيهات" />
        <SettingRow
          label="تنبيه أوقات الصلاة"
          toggle
          toggleValue={settings.enablePrayerNotifications}
          onToggle={handleNotificationToggle}
        />
        <SettingRow
          label="تنبيه قبل الصلاة"
          toggle
          toggleValue={settings.enablePreAlert}
          onToggle={val => updateSettings({ enablePreAlert: val })}
        />
        <SettingRow
          label="وقت التنبيه المبكر"
          value={`${settings.preAlertMinutes} دقيقة`}
          onPress={() => setActivePicker('preAlert')}
        />
        <SettingRow
          label="تذكير بأذكار الصباح"
          toggle
          toggleValue={settings.enableAdhkarReminder}
          onToggle={val => updateSettings({ enableAdhkarReminder: val })}
        />

        <Section title="حول التطبيق" />
        <View style={[styles.aboutCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.aboutTitle, { color: colors.gold }]}>القرآن الكريم</Text>
          <Text style={[styles.aboutVersion, { color: colors.mutedForeground }]}>الإصدار 1.0.0</Text>
          <Text style={[styles.aboutDesc, { color: colors.mutedForeground }]}>
            تطبيق القرآن الكريم المتكامل - جميع البيانات من quran.com
          </Text>
        </View>
      </ScrollView>

      <PickerModal type={activePicker} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' },
  rowValue: { fontSize: 13, flex: 1, textAlign: 'left' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionName: { fontSize: 15, fontWeight: '500', textAlign: 'right' },
  optionDesc: { fontSize: 12, marginTop: 2, textAlign: 'right' },
  aboutCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  aboutTitle: { fontSize: 20, fontWeight: '700' },
  aboutVersion: { fontSize: 13 },
  aboutDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
