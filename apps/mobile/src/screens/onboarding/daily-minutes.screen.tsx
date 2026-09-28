import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { OptionPill } from '../../components/OptionPill';
import { useTheme } from '../../providers/theme.provider';
import { DEFAULT_DAILY_MINUTES } from './onboarding-logic';
import { OnboardingProgress, type OnboardingProgressValue } from './onboarding-progress';

const DAILY_MINUTES_OPTIONS: readonly (5 | 10 | 15)[] = [5, 10, 15];

// F1, последний шаг — только «Время в день» (5/10/15 минут → лимит новых
// карточек, FR-21). Запрос разрешения на уведомления сюда больше не входит:
// он не в онбординге вовсе, а появляется мягкой карточкой на главном экране
// через настраиваемый интервал после его завершения (docs/decisions.md,
// docs/flows/f01.md → «После онбординга»; см. home-logic.ts::
// shouldPromptForReminders и screens/home/reminder-prompt.tsx).
export const DailyMinutesScreen = ({
  progress,
  onDone,
}: {
  progress: OnboardingProgressValue;
  onDone: (dailyMinutes: 5 | 10 | 15) => void;
}) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('onboarding');
  const [dailyMinutes, setDailyMinutes] = useState<5 | 10 | 15>(DEFAULT_DAILY_MINUTES);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ flex: 1, padding: space[5], gap: space[6] }}>
        <View style={{ gap: space[2] }}>
          <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
            {t('dailyMinutes.title')}
          </Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>{t('dailyMinutes.subtitle')}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: space[2] }}>
          {DAILY_MINUTES_OPTIONS.map((minutes) => (
            <OptionPill
              key={minutes}
              label={t('dailyMinutes.minutes', { count: minutes })}
              selected={dailyMinutes === minutes}
              onPress={() => setDailyMinutes(minutes)}
            />
          ))}
        </View>
      </View>
      <View style={{ padding: space[5] }}>
        <Button
          label={t('dailyMinutes.done')}
          size="lg"
          block
          onPress={() => onDone(dailyMinutes)}
        />
      </View>
      <OnboardingProgress {...progress} />
    </SafeAreaView>
  );
};
