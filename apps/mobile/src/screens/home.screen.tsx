import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TFunction } from 'i18next';

import { Chip } from '../components/Chip';
import { ProgressBar } from '../components/ProgressBar';
import { ReviewPanel } from '../components/ReviewPanel';
import { WordRow } from '../components/WordRow';
import { getOrCreateLocalUserId } from '../db/entities/user/app-meta';
import { resetLocalData } from '../db/entities/user/reset-local-data';
import type { DbExecutor } from '../db/executor';
import { useDb } from '../hooks/use-db.hook';
import { useQuery } from '../hooks/use-query.hook';
import { DEMO } from '../mocks/home';
import { useTheme } from '../providers/theme.provider';
import { WordAddPanel } from './word-add-panel';

// FR-38: пустое состояние вместо демо-данных, если у пользователя ещё нет ни
// одной живой карточки. Дальше (не в этой задаче) сюда придут реальные данные
// и для непустого состояния тоже — сейчас непустая ветка остаётся на demo.
async function countUserCards(db: DbExecutor): Promise<number> {
  const userId = await getOrCreateLocalUserId(db);
  const row = await db.get<{ count: number }>(
    'SELECT COUNT(*) as count FROM card WHERE user_id = ? AND deleted_at IS NULL',
    [userId]
  );

  return row?.count ?? 0;
}

const RECENT_CARDS_LIMIT = 10;

interface RecentCard {
  word: string;
  translation: string;
  createdAt: string;
}

// Блок «Недавно добавлены» — единственный кусок непустого состояния, который
// уже переведён на реальные данные (остальное — стрик/ReviewPanel/статистика —
// сознательно остаётся на demo, это отдельная задача).
async function loadRecentCards(db: DbExecutor): Promise<RecentCard[]> {
  const userId = await getOrCreateLocalUserId(db);
  const rows = await db.all<{ lemma: string; translation: string; created_at: string }>(
    `SELECT cc.lemma, cc.translation, c.created_at
     FROM card c
     JOIN card_content cc ON cc.card_id = c.id
     WHERE c.user_id = ? AND c.deleted_at IS NULL
     ORDER BY c.created_at DESC
     LIMIT ?`,
    [userId, RECENT_CARDS_LIMIT]
  );

  return rows.map((row) => ({
    word: row.lemma,
    translation: row.translation,
    createdAt: row.created_at,
  }));
}

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

export const HomeScreen = ({ onOpenFsrsDebug }: { onOpenFsrsDebug?: () => void }) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('home');
  const db = useDb();
  const { data: cardCount } = useQuery(countUserCards, { tables: ['card'] });
  const hasCards = (cardCount ?? 0) > 0;
  const { data: recentCards } = useQuery(loadRecentCards, { tables: ['card', 'card_content'] });

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }),
    []
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
              {t('header.greeting', { name: DEMO.name })}
            </Text>
          </View>
          <Chip label={t('header.streak', { count: DEMO.streak })} variant="streak" />
        </View>

        <WordAddPanel />

        {hasCards ? (
          <>
            {DEMO.due > 0 ? (
              <ReviewPanel
                due={DEMO.due}
                minutes={Math.max(1, Math.round(DEMO.due * 0.25))}
                onStart={() => {
                  /* F10 */
                }}
              />
            ) : null}

            <ProgressBar
              title={t('goal.title')}
              meta={t('goal.meta', { count: DEMO.goal, done: DEMO.done })}
              value={DEMO.done}
              max={DEMO.goal}
            />

            <View style={{ flexDirection: 'row', gap: space[2] }}>
              {[
                { n: DEMO.learned, label: t('stats.learned', { count: DEMO.learned }) },
                { n: DEMO.queued, label: t('stats.queued', { count: DEMO.queued }) },
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
                    style={[type.caption, { fontSize: 13, lineHeight: 18, color: colors.inkMuted }]}
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
