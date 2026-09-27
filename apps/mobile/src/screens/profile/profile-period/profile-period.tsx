import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { UserProfileStored } from '@cards/contracts';

import { OptionPill } from '../../../components/OptionPill';
import type { DbExecutor } from '../../../db/executor';
import { useTheme } from '../../../providers/theme.provider';
import { updateProfileDailyMinutes } from '../profile-logic';

const DAILY_MINUTES_OPTIONS: readonly (5 | 10 | 15)[] = [5, 10, 15];

interface Props {
  profile: UserProfileStored;
  db: DbExecutor;
}

export const ProfilePeriod = ({ profile, db }: Props) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('profile');

  return (
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
  );
};
