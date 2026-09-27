import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { Button } from '../../components/Button';
import { OptionPill } from '../../components/OptionPill';
import { useTheme } from '../../providers/theme.provider';
import { DEFAULT_DAILY_MINUTES } from './onboarding-logic';

const DAILY_MINUTES_OPTIONS: readonly (5 | 10 | 15)[] = [5, 10, 15];

// F1, шаг 6 «Время в день и напоминания»: выбор 5/10/15 минут + разрешение на
// уведомления на одном экране. Это первый и единственный системный запрос
// разрешения во всём флоу (docs/product.md: «никакого paywall и запросов
// разрешений до первой сессии», skill expo-mobile) — до этого экрана он нигде
// не запрашивается. Результат (разрешил/отказал) не блокирует продолжение.
export const NotificationsScreen = ({
  onDone,
}: {
  onDone: (dailyMinutes: 5 | 10 | 15) => void;
}) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('onboarding');
  const [dailyMinutes, setDailyMinutes] = useState<5 | 10 | 15>(DEFAULT_DAILY_MINUTES);

  const handleDone = () => {
    void Notifications.requestPermissionsAsync();
    onDone(dailyMinutes);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ flex: 1, padding: space[5], gap: space[6] }}>
        <View style={{ gap: space[2] }}>
          <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
            {t('notifications.title')}
          </Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>{t('notifications.subtitle')}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: space[2] }}>
          {DAILY_MINUTES_OPTIONS.map((minutes) => (
            <OptionPill
              key={minutes}
              label={t('notifications.minutes', { count: minutes })}
              selected={dailyMinutes === minutes}
              onPress={() => setDailyMinutes(minutes)}
            />
          ))}
        </View>

        <View style={{ gap: space[2] }}>
          <Text style={[type.title, { color: colors.ink }]}>
            {t('notifications.remindersTitle')}
          </Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>
            {t('notifications.remindersSubtitle')}
          </Text>
        </View>
      </View>
      <View style={{ padding: space[5] }}>
        <Button label={t('notifications.done')} size="lg" block onPress={handleDone} />
      </View>
    </SafeAreaView>
  );
};
