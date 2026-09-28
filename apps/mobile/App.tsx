import './src/i18n';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Onest_400Regular, Onest_500Medium, Onest_600SemiBold } from '@expo-google-fonts/onest';
import { Unbounded_600SemiBold, useFonts } from '@expo-google-fonts/unbounded';
import { StatusBar } from 'expo-status-bar';

import { openOrBuildDictionaryDatabase } from './src/db/entities/dictionary/open';
import { openUserDatabase } from './src/db/entities/user/open';
import { hasCompletedOnboarding } from './src/db/entities/user/user-profile';
import type { DbExecutor } from './src/db/executor';
import { useQuery } from './src/hooks/use-query.hook';
import { DbProvider } from './src/providers/db.provider';
import { DictionaryDbProvider } from './src/providers/dictionary-db.provider';
import { SafeAreaProviderWrapper } from './src/providers/safe-area.provider';
import { ThemeProvider, useTheme } from './src/providers/theme.provider';
import { ToastProvider } from './src/providers/toast.provider';
import { FsrsDebugScreen } from './src/screens/fsrs-debug.screen';
import { MainTabsScreen } from './src/screens/main-tabs.screen';
import { OnboardingScreen } from './src/screens/onboarding/onboarding.screen';

type Screen = 'home' | 'fsrs-debug';

const Root = () => {
  const { colors, scheme } = useTheme();
  const [screen, setScreen] = useState<Screen>('home');

  return (
    // Тот же фон-«подложка», что и в MainTabsScreen — без него переключение
    // home <-> fsrs-debug на долю кадра показывает белый фон RN по умолчанию.
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {screen === 'home' ? (
        <MainTabsScreen onOpenFsrsDebug={() => setScreen('fsrs-debug')} />
      ) : (
        <FsrsDebugScreen onBack={() => setScreen('home')} />
      )}
    </View>
  );
};

// Реактивная проверка «онбординг пройден» (F1): существование строки
// user_profile для локального userId — единственный источник истины. useQuery
// подписан на таблицу user_profile, поэтому переключение работает само —
// без ручного перезапуска приложения — и после обычного завершения онбординга
// (saveUserProfile сам зовёт notifyChange), и после технического сброса
// локальных данных (resetLocalData на главном экране).
const AppContent = () => {
  const { data: onboardingComplete } = useQuery(hasCompletedOnboarding, {
    tables: ['user_profile'],
  });

  if (onboardingComplete === undefined) return null;

  return onboardingComplete ? <Root /> : <OnboardingScreen />;
};

const DbErrorView = () => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('common');

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: space[5],
        gap: space[2],
        backgroundColor: colors.paper,
      }}
    >
      <Text
        accessibilityRole="header"
        style={[type.title, { color: colors.ink, textAlign: 'center' }]}
      >
        {t('dbError.title')}
      </Text>
      <Text style={[type.body, { color: colors.inkMuted, textAlign: 'center' }]}>
        {t('dbError.hint')}
      </Text>
    </View>
  );
};

export const App = () => {
  const [fontsLoaded] = useFonts({
    Unbounded_600SemiBold,
    Onest_400Regular,
    Onest_500Medium,
    Onest_600SemiBold,
  });
  const [db, setDb] = useState<DbExecutor | null>(null);
  const [dictionaryDb, setDictionaryDb] = useState<DbExecutor | null>(null);
  const [dbError, setDbError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Открывает cards-user.db (миграции, см. src/db/user/open.ts) и пакет
    // словаря (пока временно собирается на месте из моков, если ещё не
    // собран — см. src/db/entities/dictionary/open.ts) — два независимых
    // файла SQLite, открываются параллельно.
    void (async () => {
      try {
        const [{ executor }, dictionaryExecutor] = await Promise.all([
          openUserDatabase(),
          openOrBuildDictionaryDatabase(),
        ]);
        if (!cancelled) {
          setDb(executor);
          setDictionaryDb(dictionaryExecutor);
        }
      } catch (err) {
        if (!cancelled) setDbError(err instanceof Error ? err : new Error(String(err)));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!fontsLoaded || ((!db || !dictionaryDb) && !dbError)) return null;

  return (
    <SafeAreaProviderWrapper>
      <ThemeProvider>
        <ToastProvider>
          {dbError ? (
            <DbErrorView />
          ) : (
            <DbProvider db={db!}>
              <DictionaryDbProvider db={dictionaryDb!}>
                <AppContent />
              </DictionaryDbProvider>
            </DbProvider>
          )}
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProviderWrapper>
  );
};
