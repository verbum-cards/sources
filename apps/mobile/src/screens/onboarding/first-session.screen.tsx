import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { useTheme } from '../../providers/theme.provider';
import { getFirstSessionWords, isFirstSessionFinished } from './onboarding-logic';

// F1, шаг 4 «Первая сессия» — режим знакомства (FR-36) для ровно 5 фиксированных
// слов (временный набор, T1.6 ещё не готов). Это НЕ настоящий FSRS-режим
// знакомства из T2.x: ответы нигде не пишутся (ни card/card_content, ни
// review_log/card_schedule) — просто локальный проход внутри онбординга.
export const FirstSessionScreen = ({ onDone }: { onDone: () => void }) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('onboarding');
  const [index, setIndex] = useState(0);

  const words = getFirstSessionWords();
  const finished = isFirstSessionFinished(index, words.length);
  const word = words[index];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: space[5], gap: space[3] }}>
        {finished || !word ? (
          <View style={{ gap: space[2] }}>
            <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
              {t('firstSession.finishedTitle')}
            </Text>
            <Text style={[type.body, { color: colors.inkMuted }]}>
              {t('firstSession.finishedSubtitle')}
            </Text>
          </View>
        ) : (
          <View style={{ gap: space[2] }}>
            <Text style={[type.caption, { color: colors.inkMuted }]}>
              {t('firstSession.progress', { current: index + 1, total: words.length })}
            </Text>
            <Text style={[type.displayWord, { color: colors.ink }]}>{word.lemma}</Text>
            <Text style={[type.body, { color: colors.inkMuted }]}>{word.translation}</Text>
            <Text style={[type.bodyS, { color: colors.inkMuted }]}>{word.example}</Text>
            <Text style={[type.bodyS, { color: colors.inkMuted }]}>{word.exampleTranslation}</Text>
          </View>
        )}
      </View>
      <View style={{ padding: space[8], gap: space[4] }}>
        {finished && (
          <Button
            label={finished || !word ? t('firstSession.continue') : t('firstSession.knowThisWord')}
            size="lg"
            block
            onPress={() => {
              if (finished || !word) {
                onDone();
              } else {
                setIndex((i) => i + 1);
              }
            }}
          />
        )}

        {!finished && (
          <>
            <Button
              label={!word ? t('firstSession.continue') : t('firstSession.knowThisWord')}
              size="lg"
              block
              onPress={() => {
                if (!word) {
                  onDone();
                } else {
                  setIndex((i) => i + 1);
                }
              }}
            />
            <Button
              label={!word ? t('firstSession.continue') : t('firstSession.dontKnowThisWord')}
              size="lg"
              variant="secondary"
              block
              onPress={() => {
                if (!word) {
                  onDone();
                } else {
                  setIndex((i) => i + 1);
                }
              }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};
