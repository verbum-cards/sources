import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { Cefr, UserProfileStored } from '@cards/contracts';

import { OptionPill } from '../../../components/OptionPill';
import type { DbExecutor } from '../../../db/executor';
import { useTheme } from '../../../providers/theme.provider';
import { updateProfileLevel } from '../profile-logic';

// C2 не предлагаем — тот же набор, что и на шаге «Уровень» онбординга
// (level.screen.tsx), намеренно не вынесенный в общий компонент: экраны не
// делят между собой ни состояние, ни колбэки, только одинаковый список опций.
const CEFR_OPTIONS: readonly Cefr[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

interface Props {
  profile: UserProfileStored;
  db: DbExecutor;
}

export const ProfileLevel = ({ profile, db }: Props) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('profile');

  return (
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
  );
};
