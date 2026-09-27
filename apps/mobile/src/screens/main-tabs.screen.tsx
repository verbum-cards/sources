import React, { useState } from 'react';

import { TabBar, TabKey } from '../components/TabBar';
import { DecksScreen } from './decks.screen';
import { HomeScreen } from './home.screen';
import { ProfileScreen } from './profile.screen';
import { ProgressScreen } from './progress.screen';

// Оболочка с настоящим переключением табов: TabBar сам не меняет контент —
// он просто сообщает, какой ключ выбран (см. components/TabBar.tsx), а какой
// экран показать — решает этот компонент. onOpenFsrsDebug — временная ссылка
// на дебаг-экран T1.7, нужна только внутри HomeScreen (таб «Главная»).
export const MainTabsScreen = ({ onOpenFsrsDebug }: { onOpenFsrsDebug?: () => void }) => {
  const [tab, setTab] = useState<TabKey>('home');

  return (
    <>
      {tab === 'home' ? <HomeScreen onOpenFsrsDebug={onOpenFsrsDebug} /> : null}
      {tab === 'decks' ? <DecksScreen /> : null}
      {tab === 'progress' ? <ProgressScreen /> : null}
      {tab === 'profile' ? <ProfileScreen /> : null}

      <TabBar active={tab} onChange={setTab} />
    </>
  );
};
