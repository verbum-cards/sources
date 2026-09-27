import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../providers/theme.provider';

type Variant = 'primary' | 'highlight' | 'secondary' | 'signal';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'md' | 'lg';
  block?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

// Кнопка из дизайн-системы: primary — одна на экран, highlight — только внутри Panel,
// signal — «Не помню» и необратимые действия.
export function Button({ label, onPress, variant = 'primary', size = 'md', block, disabled, icon, style }: Props) {
  const { colors, radius, space, type } = useTheme();

  const palette = {
    primary: { bg: colors.action, fg: colors.onAction, border: undefined },
    highlight: { bg: colors.highlight, fg: colors.onHighlight, border: undefined },
    secondary: { bg: 'transparent', fg: colors.ink, border: colors.lineStrong },
    signal: { bg: colors.signalSoft, fg: colors.signalInk, border: undefined },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height: size === 'lg' ? 48 : 40,
          paddingHorizontal: size === 'lg' ? space[6] : space[5],
          borderRadius: radius.md,
          backgroundColor: palette.bg,
          borderWidth: palette.border ? 1.5 : 0,
          borderColor: palette.border,
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
          alignSelf: block ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <View style={[styles.row, { gap: space[2] }]}>
        <Text style={[type.button, { color: palette.fg, fontSize: size === 'lg' ? 16 : 14 }]}>{label}</Text>
        {icon}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
