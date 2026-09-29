import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { Button } from '../../components/Button';
import { getOrCreateDeviceId, getOrCreateLocalUserId } from '../../db/entities/user/app-meta';
import { useDb } from '../../hooks/use-db.hook';
import { useTheme } from '../../providers/theme.provider';
import { applyRating, markCardIntroduced } from '../../scheduler/scheduler';
import {
  advanceAfterAgain,
  advanceAfterGood,
  advanceAfterIntro,
  advanceAfterKnown,
  buildDeckSessionQueue,
  computeSessionSummary,
  currentSessionCard,
  isSessionDone,
  markCardKnown,
  startSession,
  type SessionCard,
  type SessionState,
  type SessionSummary,
} from './session-logic';

// F10 — сессия повторения одной колоды (см. session-logic.ts: очередь строится
// один раз при старте, дальше сессия сама двигает её в памяти через
// advanceAfter*). Не настоящий стек навигации — тот же приём, что и в
// DecksScreen/UserDeckDetail: родитель передаёт deckId и получает onExit.
export const SessionScreen = ({ deckId, onExit }: { deckId: string; onExit: () => void }) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('session');
  const db = useDb();

  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewedCardIds, setReviewedCardIds] = useState<ReadonlySet<string>>(() => new Set());
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  // Один снимок очереди на весь экран — при повторном открытии сессии
  // (новый deckId или заново смонтированный экран) собираем её заново.
  useEffect(() => {
    void (async () => {
      setSessionState(null);
      setSummary(null);
      setReviewedCardIds(new Set());
      setTotalAnswers(0);
      setCorrectAnswers(0);
      const queue = await buildDeckSessionQueue(db, deckId);
      setSessionState(startSession(queue));
    })();
  }, [db, deckId]);

  const done = sessionState ? isSessionDone(sessionState) : false;

  useEffect(() => {
    if (!done || !sessionState) return;
    void (async () => {
      const result = await computeSessionSummary(db, deckId, {
        cardsReviewed: reviewedCardIds.size,
        totalAnswers,
        correctAnswers,
      });
      setSummary(result);
    })();
  }, [done, db, deckId, reviewedCardIds, totalAnswers, correctAnswers, sessionState]);

  const handleIntroNext = (card: SessionCard) => {
    void markCardIntroduced(db, card.cardId);
    setSessionState((state) => (state ? advanceAfterIntro(state) : state));
  };

  const handleIntroKnown = (card: SessionCard) => {
    void markCardKnown(db, card.cardId);
    setSessionState((state) => (state ? advanceAfterKnown(state) : state));
  };

  const handleAnswer = async (card: SessionCard, rating: 'again' | 'good') => {
    const userId = await getOrCreateLocalUserId(db);
    const deviceId = await getOrCreateDeviceId(db);
    await applyRating({ db, cardId: card.cardId, userId, deviceId, rating });

    setReviewedCardIds((prev) => new Set(prev).add(card.cardId));
    setTotalAnswers((n) => n + 1);
    if (rating === 'good') setCorrectAnswers((n) => n + 1);
    setRevealed(false);
    setSessionState((state) =>
      state ? (rating === 'again' ? advanceAfterAgain(state) : advanceAfterGood(state)) : state
    );
  };

  const remaining = sessionState ? sessionState.queue.length - sessionState.position : 0;
  const card = sessionState ? currentSessionCard(sessionState) : undefined;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: space[5],
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('exit')}
          onPress={onExit}
          hitSlop={8}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={22} color={colors.inkMuted} />
        </Pressable>
        {!done && card ? (
          <Text style={[type.caption, { color: colors.inkMuted }]}>
            {t('progressRemaining', { count: remaining })}
          </Text>
        ) : null}
        <View style={{ width: 44 }} />
      </View>

      <View style={{ flex: 1, justifyContent: 'center', padding: space[5] }}>
        {!sessionState ? null : done ? (
          <SessionSummaryView summary={summary} onDone={onExit} />
        ) : card?.needsIntro ? (
          <IntroCardView
            card={card}
            onNext={() => handleIntroNext(card)}
            onKnown={() => handleIntroKnown(card)}
          />
        ) : card ? (
          <QuizCardView
            card={card}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            onAgain={() => void handleAnswer(card, 'again')}
            onGood={() => void handleAnswer(card, 'good')}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
};

// Знакомство (FR-36) — слово сразу с переводом и примером, без оценки FSRS.
// «Дальше» возвращает карточку в эту же сессию через 3–5 карточек уже
// вопросом; «Знаю это слово» убирает её из повторений насовсем (FR-22).
const IntroCardView = ({
  card,
  onNext,
  onKnown,
}: {
  card: SessionCard;
  onNext: () => void;
  onKnown: () => void;
}) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('session');

  return (
    <View style={{ gap: space[6] }}>
      <View style={{ gap: space[2] }}>
        <Text style={[type.displayWord, { color: colors.ink }]}>{card.lemma}</Text>
        {card.ipa ? (
          <Text style={[type.body, { color: colors.inkMuted }]}>/{card.ipa}/</Text>
        ) : null}
        <Text style={[type.body, { color: colors.ink }]}>{card.translation}</Text>
        {card.example ? (
          <Text style={[type.bodyS, { color: colors.inkMuted }]}>{card.example}</Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: space[3] }}>
        <Button
          label={t('intro.knowLabel')}
          variant="secondary"
          size="lg"
          style={{ flex: 1 }}
          onPress={onKnown}
        />
        <Button label={t('intro.nextLabel')} size="lg" style={{ flex: 1 }} onPress={onNext} />
      </View>
    </View>
  );
};

// Вопрос (карточка уже была знакомством раньше, в этой или прошлой сессии) —
// слово и транскрипция → «Показать перевод» → «Не помню» / «Помню».
const QuizCardView = ({
  card,
  revealed,
  onReveal,
  onAgain,
  onGood,
}: {
  card: SessionCard;
  revealed: boolean;
  onReveal: () => void;
  onAgain: () => void;
  onGood: () => void;
}) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('session');

  return (
    <View style={{ gap: space[6] }}>
      <View style={{ gap: space[2] }}>
        <Text style={[type.displayWord, { color: colors.ink }]}>{card.lemma}</Text>
        {card.ipa ? (
          <Text style={[type.body, { color: colors.inkMuted }]}>/{card.ipa}/</Text>
        ) : null}
        {revealed ? (
          <>
            <Text style={[type.body, { color: colors.ink }]}>{card.translation}</Text>
            {card.example ? (
              <Text style={[type.bodyS, { color: colors.inkMuted }]}>{card.example}</Text>
            ) : null}
          </>
        ) : null}
      </View>

      {revealed ? (
        <View style={{ flexDirection: 'row', gap: space[3] }}>
          <Button
            label={t('quiz.dontRemember')}
            variant="signal"
            size="lg"
            style={{ flex: 1 }}
            onPress={onAgain}
          />
          <Button label={t('quiz.remember')} size="lg" style={{ flex: 1 }} onPress={onGood} />
        </View>
      ) : (
        <Button label={t('quiz.showTranslation')} size="lg" block onPress={onReveal} />
      )}
    </View>
  );
};

const SessionSummaryView = ({
  summary,
  onDone,
}: {
  summary: SessionSummary | null;
  onDone: () => void;
}) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('session');

  if (!summary) return null;

  const isEmpty = summary.cardsReviewed === 0;

  return (
    <View style={{ gap: space[5] }}>
      <View style={{ gap: space[2] }}>
        <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
          {t(isEmpty ? 'summary.emptyTitle' : 'summary.title')}
        </Text>
        {isEmpty ? (
          <Text style={[type.body, { color: colors.inkMuted }]}>{t('summary.emptySubtitle')}</Text>
        ) : null}
      </View>

      {!isEmpty ? (
        <View style={{ gap: space[2] }}>
          <Text style={[type.body, { color: colors.ink }]}>
            {t('summary.cardsReviewed', { count: summary.cardsReviewed })}
          </Text>
          {summary.correctRatio !== null ? (
            <Text style={[type.body, { color: colors.ink }]}>
              {t('summary.correctRatio', { percent: Math.round(summary.correctRatio * 100) })}
            </Text>
          ) : null}
          {summary.streakDays > 0 ? (
            <Text style={[type.body, { color: colors.ink }]}>
              {t('summary.streakDays', { count: summary.streakDays })}
            </Text>
          ) : null}
          <Text style={[type.bodyS, { color: colors.inkMuted }]}>
            {summary.dueTodayCount > 0
              ? t('summary.dueToday', { count: summary.dueTodayCount })
              : t('summary.dueTodayNone')}
          </Text>
          {summary.dueTomorrowCount > 0 ? (
            <Text style={[type.bodyS, { color: colors.inkMuted }]}>
              {t('summary.dueTomorrow', { count: summary.dueTomorrowCount })}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Button label={t('summary.done')} size="lg" block onPress={onDone} />
    </View>
  );
};
