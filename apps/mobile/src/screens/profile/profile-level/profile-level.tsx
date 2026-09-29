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
// A0 («Первые шаги», ADR-33) — единственный код, у которого подпись не сам
// код, а текст интерфейса (см. levelOptions).
const CEFR_OPTIONS: readonly Cefr[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'];

interface Props {
  profile: UserProfileStored;
  db: DbExecutor;
}

export const ProfileLevel = ({ profile, db }: Props) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('profile');

  const levelOptions: readonly { value: Cefr; label: string }[] = CEFR_OPTIONS.map((cefr) => ({
    value: cefr,
    label: cefr === 'A0' ? t('level.firstSteps') : cefr,
  }));

  return (
    <View style={{ gap: space[4] }}>
      <View style={{ gap: space[2] }}>
        <Text style={[type.title, { color: colors.ink }]}>{t('level.title')}</Text>
        <Text style={[type.bodyS, { color: colors.inkMuted }]}>{t('level.description')}</Text>
      </View>
      <View style={{ gap: space[4] }}>
        {levelOptions.map((option) => (
          <OptionPill
            key={option.value}
            label={option.label}
            selected={profile.level === option.value}
            onPress={() => void updateProfileLevel(db, option.value)}
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
