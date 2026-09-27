import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '../components/Chip';
import { ProgressBar } from '../components/ProgressBar';
import { ReviewPanel } from '../components/ReviewPanel';
import { TabBar, TabKey } from '../components/TabBar';
import { WordInput } from '../components/WordInput';
import { WordRow } from '../components/WordRow';
import { getOrCreateLocalUserId } from '../db/entities/user/app-meta';
import { resetLocalData } from '../db/entities/user/reset-local-data';
import type { DbExecutor } from '../db/executor';
import { useDb } from '../hooks/use-db.hook';
import { useQuery } from '../hooks/use-query.hook';
import { DEMO } from '../mocks/home';
import { useTheme } from '../providers/theme.provider';

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

export const HomeScreen = ({ onOpenFsrsDebug }: { onOpenFsrsDebug?: () => void }) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('home');
  const db = useDb();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<TabKey>('home');
  const { data: cardCount } = useQuery(countUserCards, { tables: ['card'] });
  const hasCards = (cardCount ?? 0) > 0;

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

        <WordInput
          value={query}
          onChangeText={setQuery}
          onSubmit={() => {
            /* F6: поиск в локальном словаре */
          }}
        />

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
                {DEMO.recent.map((w, i) => (
                  <WordRow
                    key={w.word}
                    word={w.word}
                    translation={w.tr}
                    when={w.when}
                    last={i === DEMO.recent.length - 1}
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
      <TabBar active={tab} onChange={setTab} />
    </SafeAreaView>
  );
};
