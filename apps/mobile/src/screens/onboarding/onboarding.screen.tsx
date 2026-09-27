import React, { useCallback, useState } from 'react';

import type { Goal, UserLevel } from '@cards/contracts';

import { getOrCreateLocalUserId } from '../../db/entities/user/app-meta';
import { saveUserProfile } from '../../db/entities/user/user-profile';
import { useDb } from '../../hooks/use-db.hook';
import { FirstSessionScreen } from './first-session.screen';
import { GoalScreen } from './goal.screen';
import { LevelScreen } from './level.screen';
import { NotificationsScreen } from './notifications.screen';
import { buildUserProfileDraft, DEFAULT_DAILY_MINUTES, DEFAULT_LEVEL } from './onboarding-logic';
import { SignInScreen } from './sign-in.screen';
import { WelcomeScreen } from './welcome.screen';

type Step = 'welcome' | 'goal' | 'level' | 'first-session' | 'sign-in' | 'notifications';

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
  const [step, setStep] = useState<Step>('welcome');
  // «Уже есть аккаунт» на приветствии ведёт в тот же экран входа, но по
  // завершении сразу закрывает онбординг с накопленными к этому моменту
  // ответами по умолчанию — веток «войти в существующий аккаунт» нет, т.к.
  // реальных аккаунтов не существует (см. бриф T1.x «F1», «НЕ входит в объём»).
  const [skippedToSignIn, setSkippedToSignIn] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [level, setLevel] = useState<UserLevel>(DEFAULT_LEVEL);

  const finish = useCallback(
    async (dailyMinutes: 5 | 10 | 15) => {
      const userId = await getOrCreateLocalUserId(db);
      const profile = buildUserProfileDraft(
        userId,
        { goals, level, dailyMinutes },
        new Date().toISOString()
      );
      await saveUserProfile(db, profile);
    },
    [db, goals, level]
  );

  switch (step) {
    case 'welcome':
      return (
        <WelcomeScreen
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
          onNext={(selectedGoals) => {
            setGoals(selectedGoals);
            setStep('level');
          }}
        />
      );
    case 'level':
      return (
        <LevelScreen
          onNext={(selectedLevel) => {
            setLevel(selectedLevel);
            setStep('first-session');
          }}
        />
      );
    case 'first-session':
      return <FirstSessionScreen onDone={() => setStep('sign-in')} />;
    case 'sign-in':
      return (
        <SignInScreen
          onSignedIn={() => {
            if (skippedToSignIn) {
              void finish(DEFAULT_DAILY_MINUTES);
            } else {
              setStep('notifications');
            }
          }}
        />
      );
    case 'notifications':
      return <NotificationsScreen onDone={(dailyMinutes) => void finish(dailyMinutes)} />;
  }
};
