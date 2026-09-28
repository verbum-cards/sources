import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TFunction } from 'i18next';
import { Layers, WholeWord } from 'lucide-react-native';

import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { ProgressBar } from '../../components/ProgressBar';
import { WordNew, type WordNewHandle } from '../../components/WordNew';
import { WordPopup } from '../../components/WordPopup';
import { WordRow } from '../../components/WordRow';
import type { PackWord } from '../../db/entities/dictionary/lookup';
import { loadDictionaryPackMeta } from '../../db/entities/dictionary/pack-meta';
import { resetLocalData } from '../../db/entities/user/reset-local-data';
import { useDb } from '../../hooks/use-db.hook';
import { useDictionaryDb } from '../../hooks/use-dictionary-db.hook';
import { useQuery } from '../../hooks/use-query.hook';
import { useTheme } from '../../providers/theme.provider';
import { groupWords } from '../../utilities/word-category';
import { loadAddedDeckItemIds } from '../decks/decks-logic';
import { addWordToUserDeck, getOrCreateMyVocabularyDeck } from '../decks/user-deck-logic';
import { loadCurrentUserProfile } from '../profile/profile-logic';
import {
  computeStreakDays,
  countCardsCreatedToday,
  countUserCards,
  HOME_WIDGETS_REVEAL_THRESHOLD,
  loadCardCreationDates,
  loadHomeStats,
  loadRecentCards,
  STREAK_REVEAL_THRESHOLD,
  type RecentCard,
} from './home-logic';
import { ReminderPrompt } from './reminder-prompt';

// «Когда» — без точного относительного времени: сегодня/вчера, иначе дата.
// Не переусложняем — это подпись-подсказка, а не точная метка времени.
function formatRecentWhen(t: TFunction<'home'>, createdAtIso: string): string {
  const created = new Date(createdAtIso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (created.toDateString() === now.toDateString()) return t('recent.today');
  if (created.toDateString() === yesterday.toDateString()) return t('recent.yesterday');

  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(created);
}

// FR-38 + принцип «Просто работает» (docs/product.md): главный экран не
// вываливает весь набор виджетов сразу после онбординга. Виджеты появляются
// постепенно, по мере реального использования (см. home-logic.ts):
//   - 0 карточек            -> только пустое состояние, WordNew ведёт
//                              к первому своему слову;
//   - 1..2 карточки         -> + «Недавно добавлены»;
//   - >= HOME_WIDGETS_REVEAL_THRESHOLD (3, та же цифра, что и в гипотезе
//     активации) -> + «Цель дня» и плитки «выучено»/«в очереди»;
//   - >= STREAK_REVEAL_THRESHOLD (2) дней подряд -> + стрик в шапке.
// «Повторить сейчас» (ReviewPanel) на экране нет вовсе: F10 (сессия
// повторения) ещё не реализован, а кнопка, которая ничего не делает, хуже
// отсутствующей кнопки.
// Императивный доступ извне — нужен main-tabs.screen.tsx: повторный тап по
// уже активному табу «Главная» закрывает попап слова, но только если он
// открыт (setState на уже null-значение — нет-оп, без лишнего ререндера).
export interface HomeScreenHandle {
  resetToRoot: () => void;
}

interface Props {
  onOpenFsrsDebug?: () => void;
  onOpenDecks?: () => void;
  ref?: React.Ref<HomeScreenHandle>;
}

export const HomeScreen = ({ onOpenFsrsDebug, onOpenDecks, ref }: Props) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('home');
  const db = useDb();
  const dictionaryDb = useDictionaryDb();
  const now = useMemo(() => new Date(), []);
  const [selectedCard, setSelectedCard] = useState<RecentCard | null>(null);
  const wordNewRef = useRef<WordNewHandle>(null);

  useImperativeHandle(ref, () => ({ resetToRoot: () => setSelectedCard(null) }), []);

  const { data: addedItemIds } = useQuery(loadAddedDeckItemIds, { tables: ['card'] });

  const handleAddWord = useCallback(
    async (word: PackWord) => {
      const myVocabularyTitle = t('myVocabularyTitle', { ns: 'common' });
      const deckId = await getOrCreateMyVocabularyDeck(db, myVocabularyTitle);
      await addWordToUserDeck(db, deckId, word, myVocabularyTitle);
    },
    [db, t]
  );

  // Дебаг-проверка (см. docs/decisions.md, ADR-25): пакет словаря сейчас
  // собирается на месте при первом запуске (App.tsx) — эта строка доказывает
  // вживую, что он реально засеян, без ныряния в тесты. Разовое чтение, не
  // useQuery: пакет read-only, меняться на лету ему нечему.
  const [dictionaryPackMeta, setDictionaryPackMeta] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const meta = await loadDictionaryPackMeta(dictionaryDb);
      if (!cancelled) setDictionaryPackMeta(meta);
    })();

    return () => {
      cancelled = true;
    };
  }, [dictionaryDb]);

  // Пустое состояние прячем сразу, как только пользователь начал добавлять
  // слово — тапом на «Добавить слово» или прямо в поле ввода — плавным
  // fade-out, а не резко (и не дожидаясь, пока реально появится карточка).
  // emptyStateDismissed — защёлка на время жизни экрана: если пользователь
  // так и не добавит слово, пустое состояние не должно всплыть обратно само,
  // тап/фокус уже были явным намерением «дальше сам». useState с ленивым
  // инициализатором для Animated.Value — не useRef(...).current, иначе чтение
  // в рендере нарушает react-hooks/refs (тот же приём, что и в MainTabsScreen).
  const [emptyStateDismissed, setEmptyStateDismissed] = useState(false);
  const [emptyStateOpacity] = useState(() => new Animated.Value(1));

  const dismissEmptyState = () => {
    Animated.timing(emptyStateOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setEmptyStateDismissed(true));
  };

  const handleStartAddingFirstWord = () => {
    wordNewRef.current?.focus();
    dismissEmptyState();
  };

  const { data: cardCount } = useQuery(countUserCards, { tables: ['card'] });
  const hasCards = (cardCount ?? 0) > 0;
  const showWidgets = (cardCount ?? 0) >= HOME_WIDGETS_REVEAL_THRESHOLD;

  const { data: recentCards } = useQuery(loadRecentCards, { tables: ['card', 'card_content'] });
  // Те же подгруппы, что и внутри колоды (существительные/глаголы/прилагательные/
  // фразы/вопросы), тем же приёмом — utilities/word-category.ts. lemma
  // добавляется прямо тут: у RecentCard слово называется word, а не lemma.
  const recentGroups = groupWords(
    (recentCards ?? []).map((card) => ({ ...card, lemma: card.word }))
  );
  const { data: profile } = useQuery(loadCurrentUserProfile, { tables: ['user_profile'] });
  const name = profile?.name;
  // Онбординг (F1) всегда пишет user_profile перед тем, как главный экран
  // становится доступен (App.tsx -> AppContent) — newPerDay уже есть; 10 —
  // тот же дефолт, что и DEFAULT_DAILY_MINUTES в onboarding-logic.ts, на
  // случай доли секунды до того, как useQuery отдаст первое значение.
  const dailyGoal = profile?.newPerDay ?? 10;

  const { data: stats } = useQuery(loadHomeStats, { tables: ['card', 'card_schedule'] });
  const { data: cardDates } = useQuery(loadCardCreationDates, { tables: ['card'] });
  const todayAdded = countCardsCreatedToday(cardDates ?? [], now);
  const streakDays = computeStreakDays(cardDates ?? [], now);
  const showStreak = streakDays >= STREAK_REVEAL_THRESHOLD;

  const today = useMemo(
    () => now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }),
    [now]
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: space[4],
          paddingTop: space[6],
          paddingBottom: space[6],
          gap: space[6],
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: space[4],
          }}
        >
          <View style={{ gap: 6, flexShrink: 1 }}>
            <Text style={[type.bodyS, { color: colors.inkMuted }]}>
              {today.charAt(0).toUpperCase() + today.slice(1)}
            </Text>
            <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
              {name ? t('header.greeting', { name }) : t('header.greetingNoName')}
            </Text>
          </View>
          {showStreak ? (
            <Chip label={t('header.streak', { count: streakDays })} variant="streak" />
          ) : null}
        </View>

        <WordNew
          ref={wordNewRef}
          onFocus={dismissEmptyState}
          onAddWord={handleAddWord}
          addedRefs={addedItemIds ?? new Set()}
        />

        {hasCards ? (
          <>
            {showWidgets ? (
              <View style={{ gap: space[4] }}>
                <ProgressBar
                  title={t('goal.title')}
                  meta={t('goal.meta', { count: dailyGoal, done: todayAdded })}
                  value={todayAdded}
                  max={dailyGoal}
                />

                <View style={{ flexDirection: 'row', gap: space[2] }}>
                  {[
                    {
                      n: stats?.learned ?? 0,
                      label: t('stats.learned', { count: stats?.learned ?? 0 }),
                    },
                    {
                      n: stats?.queued ?? 0,
                      label: t('stats.queued', { count: stats?.queued ?? 0 }),
                    },
                  ].map((s) => (
                    <View
                      key={s.label}
                      style={{
                        flex: 1,
                        backgroundColor: colors.surfaceSunken,
                        borderRadius: radius.md,
                        paddingVertical: 14,
                        paddingHorizontal: space[4],
                        gap: 2,
                      }}
                    >
                      <Text
                        style={[type.displayL, { fontSize: 24, lineHeight: 30, color: colors.ink }]}
                      >
                        {s.n}
                      </Text>
                      <Text
                        style={[
                          type.caption,
                          { fontSize: 13, lineHeight: 18, color: colors.inkMuted },
                        ]}
                      >
                        {s.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={{ gap: space[4], paddingTop: space[4] }}>
              <Text accessibilityRole="header" style={[type.title, { color: colors.ink }]}>
                {t('recent.title')}
              </Text>
              {recentGroups.map((group) => (
                <View key={group.category} style={{ gap: space[2] }}>
                  <Text style={[type.caption, { color: colors.inkMuted }]}>
                    {t(`categories.${group.category}`, { ns: 'decks' })}
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: colors.line,
                      overflow: 'hidden',
                    }}
                  >
                    {group.items.map((card, i, all) => (
                      <WordRow
                        key={`${card.word}-${card.createdAt}`}
                        word={card.word}
                        ipa={card.ipa}
                        cefr={card.cefr}
                        translation={card.translation}
                        when={formatRecentWhen(t, card.createdAt)}
                        last={i === all.length - 1}
                        onPress={() => setSelectedCard(card)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : emptyStateDismissed ? null : (
          // FR-38: пустое состояние вместо демо-данных — показываем, только
          // пока карточек вообще нет; WordNew выше уже ведёт к первому
          // своему слову.
          <Animated.View
            style={{
              opacity: emptyStateOpacity,
              backgroundColor: colors.surfaceSunken,
              borderRadius: radius.lg,
              padding: space[8],
              gap: space[4],
            }}
          >
            <Text style={[type.titleL, { color: colors.ink }]}>{t('emptyState.title')}</Text>
            <Text style={[type.bodyS, { color: colors.inkMuted }]}>{t('emptyState.subtitle')}</Text>

            <Button
              icon={<WholeWord size={24} color={colors.onAction} />}
              label={t('emptyState.newWord')}
              size="lg"
              block
              onPress={handleStartAddingFirstWord}
            />
            <Button
              icon={<Layers size={24} color={colors.onAction} />}
              label={t('emptyState.newDeck')}
              size="lg"
              block
              onPress={() => onOpenDecks?.()}
            />
          </Animated.View>
        )}

        <ReminderPrompt />

        {dictionaryPackMeta ? (
          // Временная строка (ADR-25) — убрать, когда экраны переключатся на
          // чтение из пакета и он перестанет быть единственным способом
          // убедиться, что тот реально собрался на устройстве.
          <Text style={[type.bodyS, { color: colors.inkMuted }]}>
            {t('debug.dictionaryPack', {
              version: dictionaryPackMeta.content_version,
              count: dictionaryPackMeta.sense_count,
            })}
          </Text>
        ) : null}

        {onOpenFsrsDebug ? (
          // Временный вход в дебаг-экран T1.7 — не часть финальной структуры табов.
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('debug.openFsrs')}
            onPress={onOpenFsrsDebug}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={[type.bodyS, { color: colors.inkMuted, textDecorationLine: 'underline' }]}>
              {t('debug.openFsrs')}
            </Text>
          </Pressable>
        ) : null}

        {/* Дебаг-инструмент, не продуктовая функция — без подтверждения. Полный
            сброс локальных данных: экран сам переключится на онбординг через
            реактивную проверку в App.tsx (см. AppContent). */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('debug.resetLocalData')}
          onPress={() => void resetLocalData(db)}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={[type.bodyS, { color: colors.signalInk, textDecorationLine: 'underline' }]}>
            {t('debug.resetLocalData')}
          </Text>
        </Pressable>
      </ScrollView>

      <WordPopup card={selectedCard} onClose={() => setSelectedCard(null)} />
    </SafeAreaView>
  );
};
