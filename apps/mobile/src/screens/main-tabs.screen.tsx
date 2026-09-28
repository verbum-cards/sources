import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';

import { TabBar, TabKey } from '../components/TabBar';
import { useTheme } from '../providers/theme.provider';
import { DecksScreen, type DecksScreenHandle } from './decks/decks.screen';
import { HomeScreen, type HomeScreenHandle } from './home/home.screen';
import { ProfileScreen } from './profile/profile.screen';
import { ProgressScreen } from './progress/progress.screen';

// Оболочка с настоящим переключением табов: TabBar сам не меняет контент —
// он просто сообщает, какой ключ выбран (см. components/TabBar.tsx), а какой
// экран показать — решает этот компонент. onOpenFsrsDebug — временная ссылка
// на дебаг-экран T1.7, нужна только внутри HomeScreen (таб «Главная»).
export const MainTabsScreen = ({ onOpenFsrsDebug }: { onOpenFsrsDebug?: () => void }) => {
  const { colors } = useTheme();
  const [tab, setTab] = useState<TabKey>('home');
  const homeRef = useRef<HomeScreenHandle>(null);
  const decksRef = useRef<DecksScreenHandle>(null);

  // Повторный тап по уже активному табу — сигнал «вернуться к стартовому
  // экрану», как в стандартных таб-барах: вызывает resetToRoot экрана через
  // ref, а не пересоздаёт компонент целиком — если пользователь и так на
  // стартовом списке (не внутри колоды/без открытого попапа), setState на
  // уже такое же значение ничего не меняет и не перезагружает экран.
  const handleTabChange = (key: TabKey) => {
    if (key === tab) {
      if (key === 'home') homeRef.current?.resetToRoot();
      if (key === 'decks') decksRef.current?.resetToRoot();

      return;
    }
    setTab(key);
  };

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
          <HomeScreen
            ref={homeRef}
            onOpenFsrsDebug={onOpenFsrsDebug}
            onOpenDecks={() => setTab('decks')}
          />
        ) : null}
        {tab === 'decks' ? (
          <DecksScreen ref={decksRef} onOpenProgress={() => setTab('progress')} />
        ) : null}
        {tab === 'progress' ? <ProgressScreen /> : null}
        {tab === 'profile' ? <ProfileScreen /> : null}
      </Animated.View>

      <TabBar active={tab} onChange={handleTabChange} />
    </View>
  );
};
