import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../../providers/theme.provider';
import { OnboardingProgress, type OnboardingProgressValue } from './onboarding-progress';

// Точные цвета Apple/Google — обязательные значения из гайдлайнов вендоров
// (Apple HIG «Sign in with Apple», Google Identity brand guidelines), а не
// часть дизайн-системы «Слово»: осознанное исключение из правила «цвета
// только из токенов» (CLAUDE.md, п.5) — токены тут неприменимы по смыслу.
const APPLE_BG = '#000000';
const APPLE_FG = '#ffffff';
const GOOGLE_BG = '#ffffff';
const GOOGLE_BORDER = '#747775';
const GOOGLE_FG = '#1f1f1f';

const AppleLogo = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={(size * 512) / 384} viewBox="0 0 384 512">
    <Path
      fill={APPLE_FG}
      d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
    />
  </Svg>
);

const GoogleLogo = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <Path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <Path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <Path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </Svg>
);

// F1, шаг 5 «Вход» — ЗАГЛУШКА до реального входа (Apple/Google SDK, токены,
// apps/api — отдельная задача через architect: вход — security-чувствительная
// область). Обе кнопки визуально настоящие и стилизованы под гайдлайны
// вендоров, но по нажатию одинаково просто продолжают флоу — без SDK, без
// сети, без реальной привязки аккаунта.
//
// Регистрация необязательна (заменяет ADR-5 в части «обязательна» —
// см. docs/decisions.md): вторая кнопка ведёт по флоу дальше тем же путём,
// что и успешный вход, — локальный прогресс не привязывается к аккаунту,
// пока пользователь не решит войти (например, в профиле). Что именно на ней
// написано и куда она ведёт, решает вызывающий код (onboarding.screen.tsx):
// «Пропустить» на основном пути, «Назад» — если сюда попали через
// «Уже есть аккаунт» на приветствии (там куда возвращаться уже есть).
export const SignInScreen = ({
  progress,
  onSignedIn,
  secondaryAction,
}: {
  progress: OnboardingProgressValue;
  onSignedIn: () => void;
  secondaryAction: { kind: 'skip' | 'back'; onPress: () => void };
}) => {
  const { colors, scheme, radius, space, type } = useTheme();
  const { t } = useTranslation('onboarding');
  // На тёмном фоне (paper тёмной темы почти чёрный) сплошная чёрная кнопка
  // сливается с экраном — Apple HIG для этого случая и предусматривает
  // вариант «white outline»: прозрачная заливка и белая обводка вместо неё.
  const appleBg = scheme === 'dark' ? 'transparent' : APPLE_BG;
  const appleBorder = scheme === 'dark' ? APPLE_FG : undefined;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: space[5], gap: space[2] }}>
        <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
          {t('signIn.title')}
        </Text>
        <Text style={[type.body, { color: colors.inkMuted }]}>{t('signIn.subtitle')}</Text>
      </View>
      <View style={{ padding: space[5], gap: space[3] }}>
        <Pressable
          accessibilityRole="button"
          onPress={onSignedIn}
          style={({ pressed }) => ({
            height: 48,
            borderRadius: radius.md,
            backgroundColor: appleBg,
            borderWidth: appleBorder ? 1.5 : 0,
            borderColor: appleBorder,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: space[2],
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <AppleLogo size={18} />
          <Text style={[type.button, { color: APPLE_FG, fontSize: 16 }]}>{t('signIn.apple')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onSignedIn}
          style={({ pressed }) => ({
            height: 48,
            borderRadius: radius.md,
            backgroundColor: GOOGLE_BG,
            borderWidth: 1,
            borderColor: GOOGLE_BORDER,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: space[2],
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <GoogleLogo size={18} />
          <Text style={[type.button, { color: GOOGLE_FG, fontSize: 16 }]}>
            {t('signIn.google')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={secondaryAction.onPress}
          style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={[type.button, { color: colors.inkMuted }]}>
            {secondaryAction.kind === 'back' ? t('signIn.back') : t('signIn.skip')}
          </Text>
        </Pressable>
      </View>
      <OnboardingProgress {...progress} />
    </SafeAreaView>
  );
};
