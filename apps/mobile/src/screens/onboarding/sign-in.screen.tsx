import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { useTheme } from '../../providers/theme.provider';

// F1, шаг 5 «Вход» — ЗАГЛУШКА до реального входа (Apple/Google SDK, токены,
// apps/api — отдельная задача через architect: вход — security-чувствительная
// область). Обе кнопки визуально настоящие, но по нажатию одинаково просто
// продолжают флоу — без SDK, без сети, без реальной привязки аккаунта.
export const SignInScreen = ({ onSignedIn }: { onSignedIn: () => void }) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('onboarding');

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: space[5], gap: space[2] }}>
        <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
          {t('signIn.title')}
        </Text>
        <Text style={[type.body, { color: colors.inkMuted }]}>{t('signIn.subtitle')}</Text>
      </View>
      <View style={{ padding: space[5], gap: space[3] }}>
        <Button label={t('signIn.apple')} size="lg" block onPress={onSignedIn} />
        <Button
          label={t('signIn.google')}
          variant="secondary"
          size="lg"
          block
          onPress={onSignedIn}
        />
      </View>
    </SafeAreaView>
  );
};
