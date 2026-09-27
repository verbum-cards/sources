import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Goal } from '@cards/contracts';

import { Button } from '../../components/Button';
import { OptionPill } from '../../components/OptionPill';
import { useTheme } from '../../providers/theme.provider';
import { SKIPPED_GOALS, toggleGoal } from './onboarding-logic';
import { OnboardingProgress, type OnboardingProgressValue } from './onboarding-progress';

const GOAL_OPTIONS: readonly Goal[] = [
  'travel',
  'work',
  'move',
  'exam',
  'media',
  'self',
  'games',
  'tech',
];

// F1, шаг 2 «Цель» (FR-41): мультивыбор либо «Пропустить» — пропуск равнозначен
// выбору «для себя» (docs/flows/f01.md).
export const GoalScreen = ({
  progress,
  onNext,
}: {
  progress: OnboardingProgressValue;
  onNext: (goals: Goal[]) => void;
}) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('onboarding');
  const [selected, setSelected] = useState<Goal[]>([]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: space[8],
          paddingTop: space[8],
          paddingBottom: space[5],
          gap: space[4],
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: space[2] }}>
          <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
            {t('goal.title')}
          </Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>{t('goal.subtitle')}</Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
          {GOAL_OPTIONS.map((goal) => (
            <OptionPill
              key={goal}
              label={t(`goal.options.${goal}`)}
              selected={selected.includes(goal)}
              onPress={() => setSelected((prev) => toggleGoal(prev, goal))}
            />
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ gap: space[3] }}>
          <Button
            label={t('goal.next')}
            size="lg"
            block
            disabled={selected.length === 0}
            onPress={() => onNext(selected)}
          />
          <Button
            label={t('goal.skip')}
            variant="secondary"
            size="lg"
            block
            onPress={() => onNext([...SKIPPED_GOALS])}
          />
        </View>
      </ScrollView>
      <OnboardingProgress {...progress} />
    </SafeAreaView>
  );
};
