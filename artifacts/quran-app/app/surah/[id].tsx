import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
import { fetchChapter, fetchVerses, fetchTafsir, Verse, Chapter } from '@/services/quranApi';
import { RECITERS, getGlobalVerseNumber, getAudioUrl } from '@/data/reciters';
import { TAFSIRS } from '@/data/tafsirs';

export default function SurahScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const surahId = parseInt(id || '1');
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { settings, toggleBookmark, isBookmarked, updateSettings } = useAppSettings();

  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showTafsir, setShowTafsir] = useState<string | null>(null);
  const [tafsirText, setTafsirText] = useState('');
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  const [showOptions, setShowOptions] = useState<string | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const { data: chapter } = useQuery<Chapter>({
    queryKey: ['chapter', surahId],
    queryFn: () => fetchChapter(surahId),
    staleTime: Infinity,
  });

  const { data: verses, isLoading: versesLoading } = useQuery<Verse[]>({
    queryKey: ['verses', surahId, settings.reciterId, settings.tafsirId],
    queryFn: () => fetchVerses(surahId, settings.reciterId),
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync();
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
  }, []);

  const playVerse = useCallback(async (verseNumber: number) => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const reciter = RECITERS.find(r => r.id === settings.reciterId) || RECITERS[0];
      const globalNum = getGlobalVerseNumber(surahId, verseNumber);
      const audioUrl = getAudioUrl(reciter.networkKey, globalNum);

      setPlayingVerse(verseNumber);
      setIsPlaying(true);

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            if (autoPlay && verses && verseNumber < verses.length) {
              setTimeout(() => playVerse(verseNumber + 1), 500);
            } else {
              setPlayingVerse(null);
            }
          }
        }
      );

      soundRef.current = sound;

      flatListRef.current?.scrollToIndex({
        index: verseNumber - 1,
        animated: true,
        viewPosition: 0.3,
      });
    } catch (e) {
      setIsPlaying(false);
      setPlayingVerse(null);
    }
  }, [surahId, settings.reciterId, autoPlay, verses]);

  const pausePlay = useCallback(async () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const stopPlay = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
    setPlayingVerse(null);
  }, []);

  const openTafsir = async (verseKey: string) => {
    setShowTafsir(verseKey);
    setTafsirText('');
    setLoadingTafsir(true);
    setShowOptions(null);
    try {
      const text = await fetchTafsir(verseKey, settings.tafsirId);
      const clean = text.replace(/<[^>]+>/g, '').trim();
      setTafsirText(clean || 'التفسير غير متوفر لهذه الآية');
    } catch {
      setTafsirText('تعذر تحميل التفسير');
    } finally {
      setLoadingTafsir(false);
    }
  };

  const currentTafsir = TAFSIRS.find(t => t.id === settings.tafsirId);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const renderVerse = ({ item }: { item: Verse }) => {
    const isActive = item.verse_number === playingVerse;
    const verseKey = item.verse_key;
    const bookmarked = isBookmarked(verseKey);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => { setShowOptions(verseKey); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
        onPress={() => playVerse(item.verse_number)}
        style={[
          styles.verseContainer,
          {
            backgroundColor: isActive ? '#1A3A1F' : colors.card,
            borderColor: isActive ? '#2A5A30' : bookmarked ? colors.gold : 'transparent',
            borderWidth: isActive || bookmarked ? 1 : 0,
          },
        ]}
      >
        <View style={styles.verseHeader}>
          <View style={[styles.verseNumBadge, { backgroundColor: isActive ? '#2A5A30' : '#1D3040' }]}>
            <Text style={[styles.verseNum, { color: isActive ? '#fff' : colors.gold }]}>{item.verse_number}</Text>
          </View>
          <View style={styles.verseActions}>
            {bookmarked && <Feather name="bookmark" size={14} color={colors.gold} />}
            {isActive && (
              <TouchableOpacity onPress={pausePlay}>
                <Feather name={isPlaying ? 'pause-circle' : 'play-circle'} size={22} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={[
          styles.arabicText,
          {
            color: isActive ? '#F0ECD8' : colors.foreground,
            fontSize: settings.arabicFontSize,
          },
        ]}>
          {item.words?.map(w => w.text_uthmani || w.text).join(' ') || ''}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => { stopPlay(); router.back(); }} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerSurahName, { color: colors.gold }]}>{chapter?.name_arabic || ''}</Text>
          <Text style={[styles.headerMeta, { color: colors.mutedForeground }]}>
            {chapter?.verses_count} آية
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setAutoPlay(p => !p)}
          style={[styles.autoPlayBtn, autoPlay && { backgroundColor: '#1A3A1F' }]}
        >
          <Feather name="refresh-cw" size={18} color={autoPlay ? colors.primary : colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {versesLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>جاري تحميل السورة...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={verses}
          keyExtractor={item => item.verse_key}
          renderItem={renderVerse}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: (playingVerse !== null ? 120 : 40) + (Platform.OS === 'web' ? 34 : insets.bottom),
          }}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={() => {}}
          scrollEnabled={!!(verses?.length)}
          ListHeaderComponent={
            surahId !== 9 && surahId !== 1 ? (
              <View style={[styles.bismillah, { backgroundColor: colors.card }]}>
                <Text style={[styles.bismillahText, { color: colors.gold }]}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {playingVerse !== null && (
        <View style={[styles.audioBar, {
          backgroundColor: colors.card,
          paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 8,
          borderTopColor: colors.border,
        }]}>
          <TouchableOpacity onPress={stopPlay} style={styles.audioBtn}>
            <Feather name="square" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => playingVerse > 1 && playVerse(playingVerse - 1)} style={styles.audioBtn}>
            <Feather name="skip-forward" size={20} color={colors.foreground} />
          </TouchableOpacity>

          <TouchableOpacity onPress={pausePlay} style={[styles.playMainBtn, { backgroundColor: colors.primary }]}>
            <Feather name={isPlaying ? 'pause' : 'play'} size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => verses && playingVerse < verses.length && playVerse(playingVerse + 1)}
            style={styles.audioBtn}
          >
            <Feather name="skip-back" size={20} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.audioInfo}>
            <Text style={[styles.audioVerseNum, { color: colors.gold }]}>آية {playingVerse}</Text>
          </View>
        </View>
      )}

      <Modal
        visible={!!showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowOptions(null)} activeOpacity={1}>
          <View style={[styles.optionsSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => { if (showOptions) { toggleBookmark(showOptions); setShowOptions(null); } }}
            >
              <Feather name={showOptions && isBookmarked(showOptions) ? 'bookmark' : 'bookmark'} size={20} color={colors.gold} />
              <Text style={[styles.optionText, { color: colors.foreground }]}>
                {showOptions && isBookmarked(showOptions) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => showOptions && openTafsir(showOptions)}
            >
              <Feather name="book" size={20} color={colors.primary} />
              <Text style={[styles.optionText, { color: colors.foreground }]}>عرض التفسير</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                const verseNum = showOptions ? parseInt(showOptions.split(':')[1]) : null;
                if (verseNum) playVerse(verseNum);
                setShowOptions(null);
              }}
            >
              <Feather name="play-circle" size={20} color={colors.primary} />
              <Text style={[styles.optionText, { color: colors.foreground }]}>تشغيل الآية</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={!!showTafsir}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTafsir(null)}
      >
        <View style={styles.tafsirOverlay}>
          <View style={[styles.tafsirSheet, { backgroundColor: colors.card }]}>
            <View style={styles.tafsirHeader}>
              <TouchableOpacity onPress={() => setShowTafsir(null)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.tafsirTitle, { color: colors.gold }]}>
                {currentTafsir?.name} - آية {showTafsir}
              </Text>
            </View>
            {loadingTafsir ? (
              <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
            ) : (
              <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.tafsirText, { color: colors.foreground }]}>{tafsirText}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSurahName: { fontSize: 20, fontWeight: '700' },
  headerMeta: { fontSize: 12, marginTop: 2 },
  autoPlayBtn: { padding: 8, borderRadius: 20 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14 },
  bismillah: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  bismillahText: {
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 40,
  },
  verseContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verseNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseNum: { fontSize: 12, fontWeight: '700' },
  verseActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arabicText: {
    lineHeight: 44,
    textAlign: 'right',
    fontFamily: 'Inter_400Regular',
  },
  audioBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 16,
  },
  audioBtn: { padding: 8 },
  playMainBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioInfo: { flex: 1, alignItems: 'flex-end' },
  audioVerseNum: { fontSize: 13, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    gap: 4,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 12,
  },
  optionText: { fontSize: 16 },
  tafsirOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  tafsirSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
  },
  tafsirHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  tafsirTitle: { flex: 1, fontSize: 15, fontWeight: '600', textAlign: 'right' },
  tafsirText: { fontSize: 16, lineHeight: 30, textAlign: 'right' },
});
