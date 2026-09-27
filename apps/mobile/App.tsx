import './src/i18n';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { useFonts, Unbounded_600SemiBold } from '@expo-google-fonts/unbounded';
import { Onest_400Regular, Onest_500Medium, Onest_600SemiBold } from '@expo-google-fonts/onest';
import { useTranslation } from 'react-i18next';
import { SafeAreaProviderWrapper } from './src/providers/safe-area.provider';
import { ThemeProvider, useTheme } from './src/providers/theme.provider';
import { HomeScreen } from './src/screens/home.screen';
import { FsrsDebugScreen } from './src/screens/fsrs-debug.screen';
import { DbProvider } from './src/providers/db.provider';
import { openUserDatabase } from './src/db/entities/user/open';
import type { DbExecutor } from './src/db/executor';

type Screen = 'home' | 'fsrs-debug';

function Root() {
  const { scheme } = useTheme();
  const [screen, setScreen] = useState<Screen>('home');
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {screen === 'home' ? (
        <HomeScreen onOpenFsrsDebug={() => setScreen('fsrs-debug')} />
      ) : (
        <FsrsDebugScreen onBack={() => setScreen('home')} />
      )}
    </>
  );
}

function DbErrorView() {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('common');
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[5], gap: space[2], backgroundColor: colors.paper }}>
      <Text accessibilityRole="header" style={[type.title, { color: colors.ink, textAlign: 'center' }]}>
        {t('dbError.title')}
      </Text>
      <Text style={[type.body, { color: colors.inkMuted, textAlign: 'center' }]}>{t('dbError.hint')}</Text>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Unbounded_600SemiBold, Onest_400Regular, Onest_500Medium, Onest_600SemiBold });
  const [db, setDb] = useState<DbExecutor | null>(null);
  const [dbError, setDbError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Открывает cards-user.db и прогоняет миграции (см. src/db/user/open.ts).
    openUserDatabase()
      .then(({ executor }) => {
        if (!cancelled) setDb(executor);
      })
      .catch((err: unknown) => {
        if (!cancelled) setDbError(err instanceof Error ? err : new Error(String(err)));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!fontsLoaded || (!db && !dbError)) return null;

  return (
    <SafeAreaProviderWrapper>
      <ThemeProvider>
        {dbError ? (
          <DbErrorView />
        ) : (
          <DbProvider db={db!}>
            <Root />
          </DbProvider>
        )}
      </ThemeProvider>
    </SafeAreaProviderWrapper>
  );
}
