import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { resetLocalData } from '../../../db/entities/user/reset-local-data';
import type { DbExecutor } from '../../../db/executor';
import { useTheme } from '../../../providers/theme.provider';

interface Props {
  db: DbExecutor;
}

// resetLocalData(db) с подтверждением (ADR-13): полностью стирает локальные
// данные, экран сам уедет на онбординг через реактивную проверку в App.tsx
// (AppContent), как и техническая кнопка сброса на главном экране.
export const ProfileLogout = ({ db }: Props) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('profile');

  const handleLogout = () => {
    Alert.alert(t('logout.confirmTitle'), t('logout.confirmMessage'), [
      { text: t('logout.cancelButton'), style: 'cancel' },
      {
        text: t('logout.confirmButton'),
        style: 'destructive',
        onPress: () => void resetLocalData(db),
      },
    ]);
  };

  return (
    <View style={{ gap: space[4] }}>
      <View
        style={{
          gap: space[2],
          padding: space[6],
          borderRadius: radius.md,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={[type.captionS, { color: colors.inkMuted }]}>{t('logout.factLabel')}</Text>
        <Text style={[type.bodyS, { color: colors.ink }]}>{t('logout.fact')}</Text>
      </View>

      <Button label={t('logout.button')} variant="signal" size="lg" block onPress={handleLogout} />
    </View>
  );
};
