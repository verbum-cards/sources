import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '../../components/Chip';
import { ProgressBar } from '../../components/ProgressBar';
import { useQuery } from '../../hooks/use-query.hook';
import { useTheme } from '../../providers/theme.provider';
import {
  computeStreakDays,
  countUserCards,
  loadCardCreationDates,
  loadHomeStats,
  STREAK_REVEAL_THRESHOLD,
} from '../home/home-logic';
import { computeDailyActivity, loadDeckProgress } from './progress-logic';

// Короткая подпись дня под столбиком активности — локальный формат недели
// («пн», «вт»…), не строка интерфейса (тот же приём, что и formatRecentWhen
// в home.screen.tsx использует Intl вместо i18n для календарных подписей).
function formatDayLabel(dateString: string): string {
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(new Date(dateString));
}

// MVP-версия экрана прогресса (F18 «Экран прогресса и достижения» с рубежами
// 100/500/1000 слов — v1, вне беты, docs/flows/README.md). Здесь — только
// метрики, которые беты уже и так считает: стрик (home-logic.ts), выучено/в
// очереди/всего слов, активность за неделю и прогресс по колодам, которых
// пользователь коснулся (progress-logic.ts).
export const ProgressScreen = () => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('progress');
  const now = useMemo(() => new Date(), []);

  const { data: totalWords } = useQuery(countUserCards, { tables: ['card'] });
  const { data: stats } = useQuery(loadHomeStats, { tables: ['card', 'card_schedule'] });
  const { data: cardDates } = useQuery(loadCardCreationDates, { tables: ['card'] });
  const { data: deckProgress } = useQuery(loadDeckProgress, { tables: ['card'] });

  const streakDays = computeStreakDays(cardDates ?? [], now);
  const showStreak = streakDays >= STREAK_REVEAL_THRESHOLD;
  const activity = computeDailyActivity(cardDates ?? [], now);
  const maxActivity = Math.max(1, ...activity.map((day) => day.count));
  const hasCards = (totalWords ?? 0) > 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[6] }}>
        <View style={{ gap: space[2] }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: space[3],
            }}
          >
            <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
              {t('title')}
            </Text>
            {showStreak ? (
              <Chip
                label={t('header.streak', { count: streakDays, ns: 'home' })}
                variant="streak"
              />
            ) : null}
          </View>
          <Text style={[type.body, { color: colors.inkMuted }]}>{t('subtitle')}</Text>
        </View>

        {hasCards ? (
          <>
            <View style={{ flexDirection: 'row', gap: space[2] }}>
              {[
                { n: totalWords ?? 0, label: t('stats.total', { count: totalWords ?? 0 }) },
                {
                  n: stats?.learned ?? 0,
                  label: t('stats.learned', { count: stats?.learned ?? 0 }),
                },
                { n: stats?.queued ?? 0, label: t('stats.queued', { count: stats?.queued ?? 0 }) },
              ].map((s) => (
                <View
                  key={s.label}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surfaceSunken,
                    borderRadius: radius.md,
                    paddingVertical: 14,
                    paddingHorizontal: space[3],
                    gap: 2,
                  }}
                >
                  <Text
                    style={[type.displayL, { fontSize: 22, lineHeight: 28, color: colors.ink }]}
                  >
                    {s.n}
                  </Text>
                  <Text
                    style={[type.caption, { fontSize: 12, lineHeight: 16, color: colors.inkMuted }]}
                  >
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ gap: space[2] }}>
              <Text
                accessibilityRole="header"
                style={[type.button, { fontSize: 15, color: colors.ink }]}
              >
                {t('activity.title')}
              </Text>
              <View
                style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space[2], height: 80 }}
              >
                {activity.map((day) => (
                  <View key={day.date} style={{ flex: 1, alignItems: 'center', gap: space[1] }}>
                    <View
                      style={{
                        width: '100%',
                        height: Math.max(4, (day.count / maxActivity) * 64),
                        borderRadius: radius.sm,
                        backgroundColor: day.count > 0 ? colors.meter : colors.surfaceSunken,
                      }}
                    />
                    <Text style={[type.captionS, { fontSize: 10, color: colors.inkMuted }]}>
                      {formatDayLabel(day.date)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {(deckProgress ?? []).length > 0 ? (
              <View style={{ gap: space[3] }}>
                <Text
                  accessibilityRole="header"
                  style={[type.button, { fontSize: 15, color: colors.ink }]}
                >
                  {t('decks.title')}
                </Text>
                <View style={{ gap: space[4] }}>
                  {(deckProgress ?? []).map((deck) => (
                    <ProgressBar
                      key={deck.deckId}
                      title={deck.title}
                      meta={t('decks.meta', { added: deck.added, count: deck.total })}
                      value={deck.added}
                      max={deck.total}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <Text style={[type.body, { color: colors.inkMuted }]}>{t('emptyState')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
