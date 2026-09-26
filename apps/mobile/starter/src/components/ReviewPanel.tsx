import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';

type Props = { due: number; minutes: number; onStart: () => void };

// Тёмная панель главного действия дня. Когда повторять нечего — не показывается (FR-38).
export function ReviewPanel({ due, minutes, onStart }: Props) {
  const { colors, radius, space, type } = useTheme();

  return (
    <View style={{ backgroundColor: colors.panel, borderRadius: radius.lg, padding: space[5], gap: space[4] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ gap: space[1] }}>
          <Text style={[type.bodyS, { color: colors.panelMuted }]}>К повторению сегодня</Text>
          <Text style={[type.displayXl, { color: colors.onPanel }]}>{due}</Text>
        </View>
        <Text style={[type.bodyS, { color: colors.panelMuted }]}>≈ {minutes} мин</Text>
      </View>
      <Button label="Повторить" variant="highlight" size="lg" block onPress={onStart} />
    </View>
  );
}
