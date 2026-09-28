import React, { useCallback, useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import type { Goal, UserLevel } from '@cards/contracts';

import { getOrCreateLocalUserId, markOnboardingCompleted } from '../../db/entities/user/app-meta';
import { saveUserProfile } from '../../db/entities/user/user-profile';
import { useDb } from '../../hooks/use-db.hook';
import { useTheme } from '../../providers/theme.provider';
import { DailyMinutesScreen } from './daily-minutes.screen';
import { FirstSessionScreen } from './first-session.screen';
import { GoalScreen } from './goal.screen';
import { LevelScreen } from './level.screen';
import { buildUserProfileDraft, DEFAULT_DAILY_MINUTES, DEFAULT_LEVEL } from './onboarding-logic';
import { SignInScreen } from './sign-in.screen';
import { WelcomeScreen } from './welcome.screen';

type Step = 'welcome' | 'goal' | 'level' | 'first-session' | 'sign-in' | 'daily-minutes';

// Порядок для индикатора-точек (OnboardingProgress) — «сколько шагов
// осталось до появления в приложении». Ветка «Уже есть аккаунт» (welcome ->
// sign-in напрямую) индикатору не мешает: он просто покажет реальный прыжок
// с 1-го шага на 5-й, что и произошло.
const STEPS: readonly Step[] = [
  'welcome',
  'goal',
  'level',
  'first-session',
  'sign-in',
  'daily-minutes',
];

// F1 «Первый запуск и онбординг» (docs/flows/f01.md), шаги 1–7 — оркестратор
// без библиотеки навигации, как и Root в App.tsx: просто useState с текущим
// шагом. Полное восстановление прерванного онбординга (FR-29) не реализовано —
// user_profile пишется один раз, в самом конце (см. finish ниже); если
// приложение закрыто раньше, следующий запуск начинает флоу заново.
//
// Переход на главный экран после finish() не вызывается отсюда явно: App.tsx
// реактивно проверяет «онбординг пройден» через useQuery(['user_profile']), а
// saveUserProfile() сам зовёт notifyChange(['user_profile']) — родитель узнаёт
// о завершении сам. Это же делает полезной техническую кнопку сброса на
// главном экране: resetLocalData() стирает user_profile и экран сам
// переключается обратно на онбординг, без ручного перезапуска приложения.
export const OnboardingScreen = () => {
  const db = useDb();
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('welcome');
  // «Уже есть аккаунт» на приветствии ведёт в тот же экран входа, но по
  // завершении сразу закрывает онбординг с накопленными к этому моменту
  // ответами по умолчанию — веток «войти в существующий аккаунт» нет, т.к.
  // реальных аккаунтов не существует (см. бриф T1.x «F1», «НЕ входит в объём»).
  const [skippedToSignIn, setSkippedToSignIn] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [level, setLevel] = useState<UserLevel>(DEFAULT_LEVEL);

  // Короткий fade на каждую смену шага — маскирует «скачок» между экранами
  // с разной высотой контента (тот же приём, что и в MainTabsScreen для
  // табов). useState с ленивым инициализатором, а не useRef(...).current —
  // иначе чтение значения в рендере нарушает react-hooks/refs.
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }, [step, opacity]);

  const finish = useCallback(
    async (dailyMinutes: 5 | 10 | 15) => {
      const now = new Date();
      const userId = await getOrCreateLocalUserId(db);
      const profile = buildUserProfileDraft(
        userId,
        { goals, level, dailyMinutes },
        now.toISOString()
      );
      await saveUserProfile(db, profile);
      // Точка отсчёта для отложенного запроса на напоминания (см. home-logic.ts
      // ::shouldPromptForReminders) — не то же самое, что profile.updatedAt,
      // который потом будет меняться при правках профиля.
      await markOnboardingCompleted(db, now);
    },
    [db, goals, level]
  );

  const progress = { step: STEPS.indexOf(step), total: STEPS.length };

  const screen = (() => {
    switch (step) {
      case 'welcome':
        return (
          <WelcomeScreen
            progress={progress}
            onStart={() => setStep('goal')}
            onSignIn={() => {
              setSkippedToSignIn(true);
              setStep('sign-in');
            }}
          />
        );
      case 'goal':
        return (
          <GoalScreen
            progress={progress}
            onNext={(selectedGoals) => {
              setGoals(selectedGoals);
              setStep('level');
            }}
          />
        );
      case 'level':
        return (
          <LevelScreen
            progress={progress}
            onNext={(selectedLevel) => {
              setLevel(selectedLevel);
              setStep('first-session');
            }}
          />
        );
      case 'first-session':
        return (
          <FirstSessionScreen progress={progress} goals={goals} onDone={() => setStep('sign-in')} />
        );
      case 'sign-in': {
        // Регистрация необязательна (docs/decisions.md, заменяет ADR-5 в части
        // «обязательна»): «Пропустить» продолжает флоу тем же путём, что и
        // успешный вход — заглушка входа не создаёт настоящий аккаунт в любом
        // случае, поэтому дальше по коду разницы между ними нет. Но если сюда
        // попали через «Уже есть аккаунт» на приветствии, второй кнопкой
        // должен быть «Назад» — на welcome, а не «Пропустить» вперёд по флоу,
        // в котором пользователь не участвовал.
        const proceed = () => {
          if (skippedToSignIn) {
            void finish(DEFAULT_DAILY_MINUTES);
          } else {
            setStep('daily-minutes');
          }
        };
        const secondaryAction = skippedToSignIn
          ? {
              kind: 'back' as const,
              onPress: () => {
                setSkippedToSignIn(false);
                setStep('welcome');
              },
            }
          : { kind: 'skip' as const, onPress: proceed };

        return (
          <SignInScreen
            progress={progress}
            onSignedIn={proceed}
            secondaryAction={secondaryAction}
          />
        );
      }
      case 'daily-minutes':
        return (
          <DailyMinutesScreen
            progress={progress}
            onDone={(dailyMinutes) => void finish(dailyMinutes)}
          />
        );
    }
  })();

  return (
    // Общий фон под шагами онбординга — как MainTabsScreen и Root в App.tsx:
    // без него в момент смены step (старый экран уже размонтирован, новый ещё
    // не отрисовал свой SafeAreaView) на долю кадра виден белый фон RN.
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Animated.View style={{ flex: 1, opacity }}>{screen}</Animated.View>
    </View>
  );
};
