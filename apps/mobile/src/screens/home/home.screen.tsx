import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TFunction } from 'i18next';

import { Chip } from '../../components/Chip';
import { ProgressBar } from '../../components/ProgressBar';
import { WordRow } from '../../components/WordRow';
import { resetLocalData } from '../../db/entities/user/reset-local-data';
import { useDb } from '../../hooks/use-db.hook';
import { useQuery } from '../../hooks/use-query.hook';
import { useTheme } from '../../providers/theme.provider';
import { loadCurrentUserProfile } from '../profile/profile-logic';
import { WordAddPanel } from '../word-add-panel';
import {
  computeStreakDays,
  countCardsCreatedToday,
  countUserCards,
  HOME_WIDGETS_REVEAL_THRESHOLD,
  loadCardCreationDates,
  loadHomeStats,
  loadRecentCards,
  STREAK_REVEAL_THRESHOLD,
} from './home-logic';

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
//   - 0 карточек            -> только пустое состояние, WordAddPanel ведёт
//                              к первому своему слову;
//   - 1..2 карточки         -> + «Недавно добавлены»;
//   - >= HOME_WIDGETS_REVEAL_THRESHOLD (3, та же цифра, что и в гипотезе
//     активации) -> + «Цель дня» и плитки «выучено»/«в очереди»;
//   - >= STREAK_REVEAL_THRESHOLD (2) дней подряд -> + стрик в шапке.
// «Повторить сейчас» (ReviewPanel) на экране нет вовсе: F10 (сессия
// повторения) ещё не реализован, а кнопка, которая ничего не делает, хуже
// отсутствующей кнопки.
export const HomeScreen = ({ onOpenFsrsDebug }: { onOpenFsrsDebug?: () => void }) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('home');
  const db = useDb();
  const now = useMemo(() => new Date(), []);

  const { data: cardCount } = useQuery(countUserCards, { tables: ['card'] });
  const hasCards = (cardCount ?? 0) > 0;
  const showWidgets = (cardCount ?? 0) >= HOME_WIDGETS_REVEAL_THRESHOLD;

  const { data: recentCards } = useQuery(loadRecentCards, { tables: ['card', 'card_content'] });
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
          paddingHorizontal: space[5],
          paddingTop: space[6],
          paddingBottom: space[6],
          gap: space[4],
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: space[3],
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

        <WordAddPanel />

        {hasCards ? (
          <>
            {showWidgets ? (
              <>
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
              </>
            ) : null}

            <View style={{ gap: space[2] }}>
              <Text
                accessibilityRole="header"
                style={[type.button, { fontSize: 15, color: colors.ink }]}
              >
                {t('recent.title')}
              </Text>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.line,
                  overflow: 'hidden',
                }}
              >
                {(recentCards ?? []).map((card, i, all) => (
                  <WordRow
                    key={`${card.word}-${card.createdAt}`}
                    word={card.word}
                    translation={card.translation}
                    when={formatRecentWhen(t, card.createdAt)}
                    last={i === all.length - 1}
                  />
                ))}
              </View>
            </View>
          </>
        ) : (
          // FR-38: пустое состояние вместо демо-данных — карточек ещё нет,
          // WordInput выше уже ведёт к первому своему слову.
          <View
            style={{
              backgroundColor: colors.surfaceSunken,
              borderRadius: radius.lg,
              padding: space[5],
              gap: space[1],
            }}
          >
            <Text style={[type.title, { color: colors.ink }]}>{t('emptyState.title')}</Text>
            <Text style={[type.body, { color: colors.inkMuted }]}>{t('emptyState.subtitle')}</Text>
          </View>
        )}

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
    </SafeAreaView>
  );
};
