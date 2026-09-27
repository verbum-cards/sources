import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';

import type { Cefr, Goal, UserProfileStored } from '@cards/contracts';

import { Button } from '../components/Button';
import { OptionPill } from '../components/OptionPill';
import { resetLocalData } from '../db/entities/user/reset-local-data';
import type { DbExecutor } from '../db/executor';
import { useDb } from '../hooks/use-db.hook';
import { useQuery } from '../hooks/use-query.hook';
import { useTheme } from '../providers/theme.provider';
import { toggleGoal } from './onboarding/onboarding-logic';
import {
  loadCurrentUserProfile,
  updateProfileDailyMinutes,
  updateProfileGoals,
  updateProfileLevel,
  updateProfileName,
} from './profile-logic';

// C2 не предлагаем — тот же набор, что и на шаге «Уровень» онбординга
// (level.screen.tsx), намеренно не вынесенный в общий компонент: экраны не
// делят между собой ни состояние, ни колбэки, только одинаковый список опций.
const CEFR_OPTIONS: readonly Cefr[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
const GOAL_OPTIONS: readonly Goal[] = [
  'travel',
  'work',
  'move',
  'exam',
  'media',
  'self',
  'games',
  'tech',
];
const DAILY_MINUTES_OPTIONS: readonly (5 | 10 | 15)[] = [5, 10, 15];

// Экран «Профиль»: то, что собрано на онбординге (F1) — level/goals/daily_minutes
// из user_profile — здесь же и редактируется, сохраняется сразу на каждый тап
// (profile-logic.ts, тот же saveUserProfile, что и в конце онбординга). Имя —
// новое поле, которого в онбординге нет вовсе, добавляется только здесь.
// «Выйти» — resetLocalData(db) с подтверждением (ADR-13): полностью стирает
// локальные данные, экран сам уедет на онбординг через реактивную проверку в
// App.tsx (AppContent), как и техническая кнопка сброса на главном экране.
export const ProfileScreen = () => {
  const db = useDb();
  const { data: profile } = useQuery(loadCurrentUserProfile, { tables: ['user_profile'] });

  // Экран «Профиль» доступен только после онбординга (см. MainTabsScreen ->
  // AppContent) — user_profile обязана уже существовать; пока useQuery не
  // прочитал строку, ничего не рендерим (тот же паттерн, что и в App.tsx).
  // ProfileContent монтируется заново только когда profile впервые появляется
  // — этим пользуется локальный useState поля имени ниже (сид один раз из
  // текущего значения, без лишнего useEffect-синка).
  if (!profile) return null;

  return <ProfileContent db={db} profile={profile} />;
};

const ProfileContent = ({ db, profile }: { db: DbExecutor; profile: UserProfileStored }) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('profile');
  const [name, setName] = useState(profile.name ?? '');
  const [isNameFocused, setIsNameFocused] = useState(false);

  const handleSaveName = async () => {
    try {
      await updateProfileName(db, name);
      Keyboard.dismiss();
    } catch {
      // Ошибка сохранения — клавиатуру не трогаем, поле остаётся в фокусе.
    }
  };

  const handleLogout = () => {
    Alert.alert(t('logout.confirmTitle'), t('logout.confirmMessage'), [
      { text: t('logout.cancelButton'), style: 'cancel' },
      {
        text: t('logout.confirmButton'),
        style: 'destructive',
        onPress: () => void resetLocalData(db),
      },
    ]);
  };

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

        <View style={{ gap: space[2] }}>
          <Text
            nativeID="profile-name-label"
            style={[type.caption, { color: colors.inkMuted, fontSize: 14 }]}
          >
            {t('name.label')}
          </Text>
          <View style={{ flexDirection: 'row', gap: space[2] }}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <TextInput
                accessibilityLabelledBy="profile-name-label"
                value={name}
                onChangeText={setName}
                onSubmitEditing={() => void handleSaveName()}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
                placeholder={t('name.placeholder')}
                placeholderTextColor={colors.inkMuted}
                returnKeyType="done"
                style={[
                  type.body,
                  {
                    height: 52,
                    paddingRight: isNameFocused && name.length > 0 ? 40 : space[4],
                    paddingLeft: space[4],
                    borderRadius: radius.md,
                    borderWidth: 1.5,
                    borderColor: colors.lineStrong,
                    backgroundColor: colors.surface,
                    color: colors.ink,
                    fontSize: 16,
                    lineHeight: 22,
                  },
                ]}
              />
              {isNameFocused && name.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('name.clear')}
                  // onPressIn, не onPress: onBlur у TextInput срабатывает раньше
                  // onPress этой кнопки и снял бы её с экрана до срабатывания тапа.
                  onPressIn={() => setName('')}
                  style={{
                    position: 'absolute',
                    right: space[3],
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} color={colors.inkMuted} />
                </Pressable>
              )}
            </View>
            {profile.name !== name && name.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Сохранить имя"
                onPress={() => void handleSaveName()}
                style={({ pressed }) => ({
                  width: 52,
                  height: 52,
                  borderRadius: radius.md,
                  backgroundColor: colors.action,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Check size={28} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={{ gap: space[4] }}>
          <View style={{ gap: space[2] }}>
            <Text style={[type.title, { color: colors.ink }]}>{t('dailyMinutes.title')}</Text>
            <Text style={[type.bodyS, { color: colors.inkMuted }]}>
              {t('dailyMinutes.description')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: space[2] }}>
            {DAILY_MINUTES_OPTIONS.map((minutes) => (
              <OptionPill
                key={minutes}
                label={t('dailyMinutes.minutes', { count: minutes })}
                selected={profile.dailyMinutes === minutes}
                onPress={() => void updateProfileDailyMinutes(db, minutes)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: space[4] }}>
          <View style={{ gap: space[2] }}>
            <Text style={[type.title, { color: colors.ink }]}>{t('goal.title')}</Text>
            <Text style={[type.bodyS, { color: colors.inkMuted }]}>{t('goal.description')}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[4] }}>
            {GOAL_OPTIONS.map((goal) => (
              <OptionPill
                key={goal}
                label={t(`goal.options.${goal}`)}
                selected={profile.goals.includes(goal)}
                onPress={() => void updateProfileGoals(db, toggleGoal(profile.goals, goal))}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: space[4] }}>
          <View style={{ gap: space[2] }}>
            <Text style={[type.title, { color: colors.ink }]}>{t('level.title')}</Text>
            <Text style={[type.bodyS, { color: colors.inkMuted }]}>{t('level.description')}</Text>
          </View>
          <View style={{ gap: space[4] }}>
            {CEFR_OPTIONS.map((cefr) => (
              <OptionPill
                key={cefr}
                label={cefr}
                selected={profile.level === cefr}
                onPress={() => void updateProfileLevel(db, cefr)}
              />
            ))}
            <OptionPill
              label={t('level.unknown')}
              selected={profile.level === 'unknown'}
              onPress={() => void updateProfileLevel(db, 'unknown')}
            />
          </View>
        </View>

        <View style={{ gap: space[4] }}>
          <View
            style={{
              gap: space[2],
              padding: space[6],
              borderRadius: radius.md,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={[type.caption, { color: colors.inkMuted }]}>{t('logout.factLabel')}</Text>
            <Text style={[type.body, { color: colors.ink }]}>{t('logout.fact')}</Text>
          </View>

          <Button
            label={t('logout.button')}
            variant="signal"
            size="lg"
            block
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
