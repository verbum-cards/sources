import React, { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { TabBar, TabKey } from '../components/TabBar';
import { useTheme } from '../providers/theme.provider';
import { DecksScreen } from './decks/decks.screen';
import { HomeScreen } from './home/home.screen';
import { ProfileScreen } from './profile/profile.screen';
import { ProgressScreen } from './progress/progress.screen';

// Оболочка с настоящим переключением табов: TabBar сам не меняет контент —
// он просто сообщает, какой ключ выбран (см. components/TabBar.tsx), а какой
// экран показать — решает этот компонент. onOpenFsrsDebug — временная ссылка
// на дебаг-экран T1.7, нужна только внутри HomeScreen (таб «Главная»).
export const MainTabsScreen = ({ onOpenFsrsDebug }: { onOpenFsrsDebug?: () => void }) => {
  const { colors } = useTheme();
  const [tab, setTab] = useState<TabKey>('home');

  // Резкая смена экрана (разный скролл/высота контента) выглядит как «прыжок»
  // даже с правильным фоном — короткий fade-in на каждую смену таба маскирует
  // это, не требуя новой зависимости (react-native-reanimated пока не стоит).
  // useState с ленивым инициализатором, а не useRef(...).current — так читать
  // значение прямо в рендере не нарушает react-hooks/refs (React Compiler).
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [tab, opacity]);

  return (
    // Общий фон под всеми табами: без него в момент переключения (старый экран
    // уже размонтирован, новый ещё не отрисовал свой SafeAreaView) на долю
    // кадра виден белый фон RN по умолчанию — особенно заметно в тёмной теме.
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Animated.View style={{ flex: 1, opacity }}>
        {tab === 'home' ? (
          <HomeScreen onOpenFsrsDebug={onOpenFsrsDebug} onOpenDecks={() => setTab('decks')} />
        ) : null}
        {tab === 'decks' ? <DecksScreen onOpenProgress={() => setTab('progress')} /> : null}
        {tab === 'progress' ? <ProgressScreen /> : null}
        {tab === 'profile' ? <ProfileScreen /> : null}
      </Animated.View>

      <TabBar active={tab} onChange={setTab} />
    </View>
  );
};
