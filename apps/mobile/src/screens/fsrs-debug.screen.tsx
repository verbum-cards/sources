import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TFunction } from 'i18next';

import { Button } from '../components/Button';
import { getOrCreateDeviceId } from '../db/entities/user/app-meta';
import type { CardScheduleRow } from '../db/entities/user/types';
import type { DbExecutor } from '../db/executor';
import { useDb } from '../hooks/use-db.hook';
import { useQuery } from '../hooks/use-query.hook';
import { DEBUG_ITEM_TYPE, DEBUG_WORDS } from '../mocks/fsrs-debug-words';
import { useTheme } from '../providers/theme.provider';
import {
  applyRating,
  getCardSchedule,
  getReviewLogs,
  recalculateSchedule,
} from '../scheduler/scheduler';
import { notifyChange } from '../utilities/event-bus';
import { uuidv7 } from '../utilities/id';
import {
  missingWords,
  orderCardsByWordList,
  type DebugCard,
  type DebugCardRow,
} from './fsrsDebugDeck';

// T1.7: временный дебаг-экран «добавить тестовые карточки -> оценивать одну за
// другой -> увидеть следующий интервал». Не часть финальной структуры экранов
// из CLAUDE.md — сюда не заводим ни очередь сессии по due, ни дневной лимит, ни
// режим знакомства, ни возврат «Не помню» в сессию (T2.x). Переход к следующей
// карточке — просто следующая по порядку добавления, не настоящая FSRS-очередь.
const DEBUG_USER_ID = '0195c000-0000-7000-8000-000000000001';

function formatDue(t: TFunction<'fsrsDebug'>, dueIso: string): string {
  const diffMs = new Date(dueIso).getTime() - Date.now();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes < 60) return t('dueInMinutes', { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('dueInHours', { count: hours });
  const days = Math.round(hours / 24);

  return t('dueInDays', { count: days });
}

async function loadDebugCards(db: DbExecutor): Promise<DebugCard[]> {
  const itemIds = DEBUG_WORDS.map((word) => word.itemId);
  const placeholders = itemIds.map(() => '?').join(', ');
  const rows = await db.all<DebugCardRow>(
    `SELECT c.id, c.item_id, cc.lemma, cc.translation, cc.example
     FROM card c
     JOIN card_content cc ON cc.card_id = c.id
     WHERE c.user_id = ? AND c.item_type = ? AND c.deleted_at IS NULL AND c.item_id IN (${placeholders})`,
    [DEBUG_USER_ID, DEBUG_ITEM_TYPE, ...itemIds]
  );

  return orderCardsByWordList(DEBUG_WORDS, rows);
}

export const FsrsDebugScreen = ({ onBack }: { onBack: () => void }) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('fsrsDebug');
  const db = useDb();

  // Реактивное чтение списка карточек: перечитывается при монтировании и каждый
  // раз, когда addTestCards() сообщает notifyChange(['card', 'card_content']).
  const { data: cardsData } = useQuery(loadDebugCards, { tables: ['card', 'card_content'] });
  const cards = cardsData ?? [];

  const [index, setIndex] = useState(0);
  const [schedule, setSchedule] = useState<CardScheduleRow | null>(null);
  const [recalcStatus, setRecalcStatus] = useState<'match' | 'mismatch' | null>(null);

  const card = cards[index] ?? null;
  const finished = cards.length > 0 && index >= cards.length;

  // Кеш FSRS текущей карточки — подгружается заново при смене card.id (первый
  // показ, переход «Следующая карточка», повторное открытие экрана).
  useEffect(() => {
    setRecalcStatus(null);
    if (!card) {
      setSchedule(null);

      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const row = await getCardSchedule(db, card.id);
        if (!cancelled) setSchedule(row ?? null);
      } catch {
        if (!cancelled) setSchedule(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [db, card?.id]);

  const addTestCards = useCallback(async () => {
    const existingRows = await db.all<{ item_id: string }>(
      `SELECT item_id FROM card WHERE user_id = ? AND item_type = ? AND deleted_at IS NULL AND item_id IN (${DEBUG_WORDS.map(() => '?').join(', ')})`,
      [DEBUG_USER_ID, DEBUG_ITEM_TYPE, ...DEBUG_WORDS.map((word) => word.itemId)]
    );
    const existingIds = new Set(existingRows.map((row) => row.item_id));
    const toInsert = missingWords(DEBUG_WORDS, existingIds);

    for (const word of toInsert) {
      const id = uuidv7();
      const now = new Date().toISOString();
      await db.run(
        'INSERT INTO card (id, user_id, item_type, item_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, DEBUG_USER_ID, DEBUG_ITEM_TYPE, word.itemId, 'active', now, now]
      );
      await db.run(
        `INSERT INTO card_content (card_id, lemma, pos, translation, example, example_translation, source, refreshed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          word.lemma,
          word.pos,
          word.translation,
          word.example,
          word.exampleTranslation,
          'manual',
          now,
        ]
      );
    }

    if (toInsert.length > 0) {
      notifyChange(['card', 'card_content']);
    }
    setIndex(0);
  }, [db]);

  const rate = useCallback(
    async (rating: 'again' | 'good') => {
      if (!card) return;
      const deviceId = await getOrCreateDeviceId(db);
      const { schedule: nextSchedule } = await applyRating({
        db,
        cardId: card.id,
        userId: DEBUG_USER_ID,
        deviceId,
        rating,
      });
      setSchedule(nextSchedule);
      setRecalcStatus(null);
    },
    [card, db]
  );

  const goToNext = useCallback(() => {
    setIndex((i) => i + 1);
  }, []);

  const recalculate = useCallback(async () => {
    if (!card || !schedule) return;
    const logs = await getReviewLogs(db, card.id);
    const recalculated = recalculateSchedule(logs);
    if (!recalculated) return;
    const matches =
      recalculated.due.toISOString() === schedule.due &&
      recalculated.stability === schedule.stability;
    setRecalcStatus(matches ? 'match' : 'mismatch');
  }, [card, db, schedule]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[4] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          onPress={onBack}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={[type.body, { color: colors.ink }]}>{`< ${t('back')}`}</Text>
        </Pressable>

        <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
          {t('title')}
        </Text>

        {cards.length === 0 ? (
          <View style={{ gap: space[3] }}>
            <Text style={[type.body, { color: colors.inkMuted }]}>{t('empty')}</Text>
            <Button label={t('addCards')} onPress={() => void addTestCards()} />
          </View>
        ) : (
          <View style={{ gap: space[2] }}>
            <Text style={[type.caption, { color: colors.inkMuted }]}>
              {t('progress', { current: Math.min(index + 1, cards.length), total: cards.length })}
            </Text>
            <Button label={t('addCards')} variant="secondary" onPress={() => void addTestCards()} />
          </View>
        )}

        {finished ? (
          <Text style={[type.body, { color: colors.ink }]}>{t('finished')}</Text>
        ) : card ? (
          <>
            <View style={{ gap: space[1] }}>
              <Text style={[type.displayWord, { color: colors.ink }]}>{card.lemma}</Text>
              <Text style={[type.body, { color: colors.inkMuted }]}>{card.translation}</Text>
              <Text style={[type.bodyS, { color: colors.inkMuted }]}>{card.example}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: space[3] }}>
              <Button
                label={t('again')}
                variant="signal"
                onPress={() => void rate('again')}
                style={{ flex: 1 }}
              />
              <Button
                label={t('good')}
                variant="primary"
                onPress={() => void rate('good')}
                style={{ flex: 1 }}
              />
            </View>

            {schedule?.due ? (
              <Text style={[type.body, { color: colors.ink }]}>
                {t('nextDue', { when: formatDue(t, schedule.due) })}
              </Text>
            ) : null}

            {schedule ? (
              <View style={{ gap: 2 }}>
                <Text style={[type.caption, { color: colors.inkMuted }]}>
                  {t('fields.stability')}: {schedule.stability?.toFixed(2) ?? '—'}
                </Text>
                <Text style={[type.caption, { color: colors.inkMuted }]}>
                  {t('fields.difficulty')}: {schedule.difficulty?.toFixed(2) ?? '—'}
                </Text>
                <Text style={[type.caption, { color: colors.inkMuted }]}>
                  {t('fields.reps')}: {schedule.reps ?? 0}
                </Text>
                <Text style={[type.caption, { color: colors.inkMuted }]}>
                  {t('fields.lapses')}: {schedule.lapses ?? 0}
                </Text>
                <Text style={[type.caption, { color: colors.inkMuted }]}>
                  {t('fields.state')}: {schedule.fsrs_state ?? '—'}
                </Text>
              </View>
            ) : null}

            {schedule ? (
              <View style={{ flexDirection: 'row', gap: space[3] }}>
                <Button
                  label={t('recalculate')}
                  variant="secondary"
                  onPress={() => void recalculate()}
                  style={{ flex: 1 }}
                />
                <Button label={t('next')} onPress={goToNext} style={{ flex: 1 }} />
              </View>
            ) : null}
            {recalcStatus ? (
              <Text
                style={[
                  type.bodyS,
                  { color: recalcStatus === 'match' ? colors.ink : colors.signalInk },
                ]}
              >
                {t(recalcStatus === 'match' ? 'recalculateMatch' : 'recalculateMismatch')}
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};
