import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { UserProfileStored } from '@cards/contracts';

import type { DbExecutor } from '../../db/executor';
import { useDb } from '../../hooks/use-db.hook';
import { useQuery } from '../../hooks/use-query.hook';
import { useTheme } from '../../providers/theme.provider';
import { ProfileGoal } from './profile-goal';
import { ProfileLevel } from './profile-level';
import { loadCurrentUserProfile } from './profile-logic';
import { ProfileLogout } from './profile-logout';
import { ProfileName } from './profile-name';
import { ProfilePeriod } from './profile-period';

// Экран «Профиль»: то, что собрано на онбординге (F1) — level/goals/daily_minutes
// из user_profile — здесь же и редактируется, сохраняется сразу на каждый тап
// (profile-logic.ts, тот же saveUserProfile, что и в конце онбординга). Имя —
// новое поле, которого в онбординге нет вовсе, добавляется только здесь.
export const ProfileScreen = () => {
  const db = useDb();
  const { data: profile } = useQuery(loadCurrentUserProfile, { tables: ['user_profile'] });

  // Экран «Профиль» доступен только после онбординга (см. MainTabsScreen ->
  // AppContent) — user_profile обязана уже существовать; пока useQuery не
  // прочитал строку, ничего не рендерим (тот же паттерн, что и в App.tsx).
  if (!profile) return null;

  return <ProfileContent db={db} profile={profile} />;
};

const ProfileContent = ({ db, profile }: { db: DbExecutor; profile: UserProfileStored }) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('profile');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space[5], gap: space[6] * 2 }}
      >
        <View style={{ gap: space[2] }}>
          <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
            {t('title')}
          </Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>{t('greeting')}</Text>
        </View>

        <ProfileName db={db} profile={profile} />

        <ProfilePeriod db={db} profile={profile} />

        <ProfileGoal db={db} profile={profile} />

        <ProfileLevel db={db} profile={profile} />

        <ProfileLogout db={db} />
      </ScrollView>
    </SafeAreaView>
  );
};
