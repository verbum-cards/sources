import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Cefr, UserLevel } from '@cards/contracts';

import { Button } from '../../components/Button';
import { OptionPill } from '../../components/OptionPill';
import { useTheme } from '../../providers/theme.provider';

// A1–C1 выбираемы напрямую (коды CEFR — не текст интерфейса, i18n не нужен);
// C2 в онбординге не предлагаем — это не разумный стартовый уровень для беты.
const CEFR_OPTIONS: readonly Cefr[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

// F1, шаг 3 «Уровень»: A1–C1 либо «Не знаю» (сохраняется как есть — MVP-логика
// «старт с A2 и автокалибровка» для «Не знаю» здесь не реализуется, это T2.x).
export const LevelScreen = ({ onNext }: { onNext: (level: UserLevel) => void }) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('onboarding');
  const [selected, setSelected] = useState<UserLevel | null>(null);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: space[5], gap: space[5] }}>
        <View style={{ gap: space[2] }}>
          <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
            {t('level.title')}
          </Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>{t('level.subtitle')}</Text>
        </View>

        <View style={{ flexDirection: 'column', gap: space[2] }}>
          {CEFR_OPTIONS.map((cefr) => (
            <OptionPill
              key={cefr}
              label={cefr}
              selected={selected === cefr}
              onPress={() => setSelected(cefr)}
            />
          ))}
          <OptionPill
            label={t('level.unknown')}
            selected={selected === 'unknown'}
            onPress={() => setSelected('unknown')}
          />
        </View>

        <View style={{ flex: 1 }} />

        <Button
          label={t('level.next')}
          size="lg"
          block
          disabled={selected === null}
          onPress={() => {
            if (selected) onNext(selected);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};
