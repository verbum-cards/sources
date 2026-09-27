import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import WelcomeDark from '../../../assets/onboarding/welcome-dark.svg';
import WelcomeLight from '../../../assets/onboarding/welcome-light.svg';
import { Button } from '../../components/Button';
import { useTheme } from '../../providers/theme.provider';
import { OnboardingProgress, type OnboardingProgressValue } from './onboarding-progress';

// F1, шаг 1 «Приветствие». «Уже есть аккаунт» ведёт в тот же экран-заглушку
// входа, что и обычный путь — настоящих аккаунтов ещё нет, различать нечего.
export const WelcomeScreen = ({
  progress,
  onStart,
  onSignIn,
}: {
  progress: OnboardingProgressValue;
  onStart: () => void;
  onSignIn: () => void;
}) => {
  const { colors, scheme, space, type } = useTheme();
  const { t } = useTranslation('onboarding');
  const Illustration = scheme === 'dark' ? WelcomeDark : WelcomeLight;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: space[8] }}>
        <Illustration width={280} height={200} />
        <Text
          accessibilityRole="header"
          style={[
            type.displayL,
            { color: colors.ink, textAlign: 'center', paddingHorizontal: space[8] },
          ]}
        >
          {t('welcome.valueProp')}
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: space[8],
          paddingTop: space[8],
          paddingBottom: space[5],
          gap: space[4],
        }}
      >
        <Button label={t('welcome.start')} size="lg" block onPress={onStart} />
        <Button
          label={t('welcome.haveAccount')}
          variant="secondary"
          size="lg"
          block
          onPress={onSignIn}
        />
      </View>
      <OnboardingProgress {...progress} />
    </SafeAreaView>
  );
};
