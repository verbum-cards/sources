import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { Goal, UserProfileStored } from '@cards/contracts';

import { OptionPill } from '../../../components/OptionPill';
import type { DbExecutor } from '../../../db/executor';
import { useTheme } from '../../../providers/theme.provider';
import { toggleGoal } from '../../onboarding/onboarding-logic';
import { updateProfileGoals } from '../profile-logic';

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

interface Props {
  profile: UserProfileStored;
  db: DbExecutor;
}

export const ProfileGoal = ({ profile, db }: Props) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('profile');

  return (
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
  );
};
