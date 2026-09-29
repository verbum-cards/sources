import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Goal } from '@cards/contracts';

import { Button } from '../../components/Button';
import { getOrCreateDeviceId, getOrCreateLocalUserId } from '../../db/entities/user/app-meta';
import { useDb } from '../../hooks/use-db.hook';
import { useTheme } from '../../providers/theme.provider';
import { formatPos } from '../../utilities/format-pos';
import {
  answerFirstSessionWord,
  getFirstSessionWords,
  isFirstSessionFinished,
} from './onboarding-logic';
import { OnboardingProgress, type OnboardingProgressValue } from './onboarding-progress';

// F1, шаг 4 «Первая сессия» — режим знакомства (FR-36) для ровно 5 слов,
// подобранных по целям, выбранным на предыдущем шаге (docs/flows/f01.md →
// «Как используется цель»). Временный набор (T1.6 ещё не готов), но уже с
// учётом goals — см. getFirstSessionWords в onboarding-logic.ts. Каждый ответ
// создаёт настоящую карточку — см. answerFirstSessionWord там же. Это НЕ
// настоящая FSRS-очередь сессии из T2.x — просто локальный проход по
// фиксированным 5 словам внутри онбординга.
export const FirstSessionScreen = ({
  progress,
  goals,
  onDone,
}: {
  progress: OnboardingProgressValue;
  goals: readonly Goal[];
  onDone: () => void;
}) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('onboarding');
  const db = useDb();
  const [index, setIndex] = useState(0);
  const [skippedAll, setSkippedAll] = useState(false);

  // goals — стабильная ссылка на протяжении жизни этого экрана (меняется
  // только на шаге «Цель», который уже пройден к этому моменту) — useMemo
  // даёт React Compiler'у то же самое, что стабильный модульный массив давал
  // раньше, когда подбор ещё не зависел от goals.
  const words = useMemo(() => getFirstSessionWords(goals), [goals]);
  const finished = isFirstSessionFinished(index, words.length);
  const word = words[index];

  const answer = useCallback(
    async (knowsWord: boolean) => {
      if (!word) return;

      const userId = await getOrCreateLocalUserId(db);
      const deviceId = await getOrCreateDeviceId(db);
      await answerFirstSessionWord({
        db,
        userId,
        deviceId,
        word,
        knowsWord,
        myVocabularyTitle: t('myVocabularyTitle', { ns: 'common' }),
      });

      setIndex((i) => i + 1);
    },
    [db, word, t]
  );

  // «Пропустить» пропускает всю первую сессию целиком, а не одно слово: сразу
  // переводит index за последнее слово (isFirstSessionFinished(index, total)
  // становится true) и показывает отдельный текст — skippedAll вместо обычного
  // «5 слов в памяти», ни одна карточка при этом не создаётся.
  const skip = useCallback(() => {
    setSkippedAll(true);
    setIndex(words.length);
  }, [words.length]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: space[5], gap: space[3] }}>
        {finished || !word ? (
          <View style={{ gap: space[2] }}>
            <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
              {t(skippedAll ? 'firstSession.skippedTitle' : 'firstSession.finishedTitle')}
            </Text>
            <Text style={[type.body, { color: colors.inkMuted }]}>
              {t(skippedAll ? 'firstSession.skippedSubtitle' : 'firstSession.finishedSubtitle')}
            </Text>
          </View>
        ) : (
          <View style={{ gap: space[2] }}>
            <Text style={[type.caption, { color: colors.inkMuted }]}>
              {t('firstSession.progress', { current: index + 1, total: words.length })}
            </Text>
            <Text style={[type.displayWord, { color: colors.ink }]}>{word.lemma}</Text>
            <Text style={[type.body, { color: colors.inkMuted }]}>
              /{word.ipa}/ · {formatPos(word.pos)} · {word.cefr}
            </Text>
            <Text style={[type.body, { color: colors.inkMuted }]}>{word.translation}</Text>
            <Text style={[type.bodyS, { color: colors.inkMuted }]}>{word.example}</Text>
            <Text style={[type.bodyS, { color: colors.inkMuted }]}>{word.exampleTranslation}</Text>
          </View>
        )}
      </View>

      <View style={{ padding: space[5], gap: space[3] }}>
        {finished || !word ? (
          <Button label={t('firstSession.continue')} size="lg" block onPress={onDone} />
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: space[4] }}>
              <Button
                label={t('firstSession.dontKnowThisWord')}
                variant="secondary"
                size="lg"
                style={{ flex: 1 }}
                onPress={() => void answer(false)}
              />
              <Button
                label={t('firstSession.knowThisWord')}
                size="lg"
                style={{ flex: 1 }}
                onPress={() => void answer(true)}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={skip}
              style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={[type.button, { color: colors.inkMuted }]}>
                {t('firstSession.skip')}
              </Text>
            </Pressable>
          </>
        )}
      </View>
      <OnboardingProgress {...progress} />
    </SafeAreaView>
  );
};
