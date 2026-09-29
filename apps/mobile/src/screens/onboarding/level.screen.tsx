import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Cefr, UserLevel } from '@cards/contracts';

import { Button } from '../../components/Button';
import { OptionPill } from '../../components/OptionPill';
import { useTheme } from '../../providers/theme.provider';
import { SKIPPED_GOALS } from './onboarding-logic';
import { OnboardingProgress, type OnboardingProgressValue } from './onboarding-progress';

// A0–C1 выбираемы напрямую; C2 в онбординге не предлагаем — это не разумный
// стартовый уровень для беты. A0 («Первые шаги», ADR-33) — единственный код,
// у которого подпись не сам код, а текст интерфейса (см. levelOptions).
const CEFR_OPTIONS: readonly Cefr[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'];

// F1, шаг 3 «Уровень»: A0–C1 либо «Не знаю» (сохраняется как есть — MVP-логика
// «старт с A2 и автокалибровка» для «Не знаю» здесь не реализуется, это T2.x;
// A0 по той же логике MVP просто сохраняет выбор, без своего алгоритма).
export const LevelScreen = ({
  progress,
  onNext,
}: {
  progress: OnboardingProgressValue;
  onNext: (level: UserLevel) => void;
}) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('onboarding');
  const [selected, setSelected] = useState<UserLevel | null>(null);

  const levelOptions: readonly { value: Cefr; label: string }[] = CEFR_OPTIONS.map((cefr) => ({
    value: cefr,
    label: cefr === 'A0' ? t('level.firstSteps') : cefr,
  }));

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: space[5], gap: space[5] }}>
        <View style={{ gap: space[2] }}>
          <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
            {t('level.title')}
          </Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>{t('level.subtitle')}</Text>
        </View>

        <View style={{ flexDirection: 'column', gap: space[2] }}>
          {levelOptions.map((option) => (
            <OptionPill
              key={option.value}
              label={option.label}
              selected={selected === option.value}
              onPress={() => setSelected(option.value)}
            />
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <Button
          label={t('level.next')}
          size="lg"
          block
          disabled={selected === null}
          onPress={() => {
            if (selected) onNext(selected);
          }}
        />
        <Button
          label={t('level.unknown')}
          variant="secondary"
          size="lg"
          block
          onPress={() => onNext('unknown')}
        />
      </ScrollView>
      <OnboardingProgress {...progress} />
    </SafeAreaView>
  );
};
