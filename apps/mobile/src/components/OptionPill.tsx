import React from 'react';
import { Pressable, Text } from 'react-native';

import { useTheme } from '../providers/theme.provider';

type Props = { label: string; selected: boolean; onPress: () => void };

// Переключаемый вариант ответа (мульти- или одиночный выбор) — цель и уровень
// в онбординге (F1). Собран из токенов, отдельного места в дизайн-системе
// пока не занимает — новых hex/отступов не вводит.
export function OptionPill({ label, selected, onPress }: Props) {
  const { colors, radius, space, type } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: space[4],
        paddingVertical: space[2],
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? colors.highlight : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.highlight : colors.line,
      }}
    >
      <Text style={[type.button, { color: selected ? colors.onHighlight : colors.ink }]}>
        {label}
      </Text>
    </Pressable>
  );
}
