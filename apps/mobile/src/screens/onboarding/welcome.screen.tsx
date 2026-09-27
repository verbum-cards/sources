import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { useTheme } from '../../providers/theme.provider';

// F1, шаг 1 «Приветствие». «Уже есть аккаунт» ведёт в тот же экран-заглушку
// входа, что и обычный путь — настоящих аккаунтов ещё нет, различать нечего.
export const WelcomeScreen = ({
  onStart,
  onSignIn,
}: {
  onStart: () => void;
  onSignIn: () => void;
}) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('onboarding');

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: space[8] }}>
        <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
          {t('welcome.valueProp')}
        </Text>
      </View>
      <View style={{ padding: space[8], gap: space[4] }}>
        <Button label={t('welcome.start')} size="lg" block onPress={onStart} />
        <Button
          label={t('welcome.haveAccount')}
          variant="secondary"
          size="lg"
          block
          onPress={onSignIn}
        />
      </View>
    </SafeAreaView>
  );
};
