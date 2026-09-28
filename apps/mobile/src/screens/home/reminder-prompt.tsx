import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';

import { Button } from '../../components/Button';
import { useQuery } from '../../hooks/use-query.hook';
import { useTheme } from '../../providers/theme.provider';
import { loadOnboardingCompletedAt, shouldPromptForReminders } from './home-logic';

// Мягкая карточка на главном экране (docs/flows/f01.md → «После онбординга»):
// разрешение на напоминания больше не спрашивается в онбординге, а предлагается
// здесь — через REMINDER_PROMPT_DELAY_DAYS после его завершения (константа и
// расчёт даты — в home-logic.ts::shouldPromptForReminders). «Не сейчас» прячет
// карточку только на эту сессию: постоянного «не спрашивать снова N дней» тут
// намеренно нет — то, как планировать сами напоминания, решает F12 (v1, ещё не
// расписан).
export const ReminderPrompt = () => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('home');
  const [dismissed, setDismissed] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(
    null
  );

  const { data: onboardingCompletedAt } = useQuery(loadOnboardingCompletedAt, {
    tables: ['app_meta'],
  });

  useEffect(() => {
    void (async () => {
      const result = await Notifications.getPermissionsAsync();
      setPermissionStatus(result.status);
    })();
  }, []);

  const handleEnable = useCallback(async () => {
    const result = await Notifications.requestPermissionsAsync();
    setPermissionStatus(result.status);
  }, []);

  const shouldShow =
    !dismissed &&
    permissionStatus === Notifications.PermissionStatus.UNDETERMINED &&
    shouldPromptForReminders(onboardingCompletedAt ?? null);

  if (!shouldShow) return null;

  return (
    <View
      style={{
        backgroundColor: colors.surfaceSunken,
        borderRadius: radius.lg,
        padding: space[5],
        gap: space[3],
      }}
    >
      <View style={{ gap: space[1] }}>
        <Text style={[type.title, { color: colors.ink }]}>{t('reminders.title')}</Text>
        <Text style={[type.body, { color: colors.inkMuted }]}>{t('reminders.subtitle')}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: space[3] }}>
        <Button
          label={t('reminders.enable')}
          size="lg"
          style={{ flex: 1 }}
          onPress={() => void handleEnable()}
        />
        <Button
          label={t('reminders.notNow')}
          variant="secondary"
          size="lg"
          style={{ flex: 1 }}
          onPress={() => setDismissed(true)}
        />
      </View>
    </View>
  );
};
