import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const SafeAreaProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  return <SafeAreaProvider>{children}</SafeAreaProvider>;
};
