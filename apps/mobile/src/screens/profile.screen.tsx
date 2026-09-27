import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../providers/theme.provider';

// Заглушка таба «Профиль» — реальный экран и данные придут отдельной задачей.
export const ProfileScreen = () => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('profile');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ flex: 1, padding: space[5], gap: space[2] }}>
        <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
          {t('title')}
        </Text>
        <Text style={[type.body, { color: colors.inkMuted }]}>{t('placeholder')}</Text>
      </View>
    </SafeAreaView>
  );
};
