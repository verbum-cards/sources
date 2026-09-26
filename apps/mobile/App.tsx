import './src/i18n';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Unbounded_600SemiBold } from '@expo-google-fonts/unbounded';
import { Onest_400Regular, Onest_500Medium, Onest_600SemiBold } from '@expo-google-fonts/onest';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { HomeScreen } from './src/screens/HomeScreen';

function Root() {
  const { scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <HomeScreen />
    </>
  );
}

export default function App() {
  const [loaded] = useFonts({ Unbounded_600SemiBold, Onest_400Regular, Onest_500Medium, Onest_600SemiBold });
  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
