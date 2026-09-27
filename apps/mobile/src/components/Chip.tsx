import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../providers/theme.provider';

type Props = { label: string; variant?: 'default' | 'streak' | 'quiet'; icon?: React.ReactNode };

export function Chip({ label, variant = 'default', icon }: Props) {
  const { colors, radius, space, type } = useTheme();
  const v = {
    default: { bg: colors.surface, fg: colors.ink, border: colors.line, h: 32 },
    streak: { bg: colors.signalSoft, fg: colors.signalInk, border: undefined, h: 32 },
    quiet: { bg: colors.surfaceSunken, fg: colors.inkMuted, border: undefined, h: 24 },
  }[variant];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: v.h,
        paddingHorizontal: variant === 'quiet' ? 12 : space[3],
        borderRadius: radius.pill,
        backgroundColor: v.bg,
        borderWidth: v.border ? 1 : 0,
        borderColor: v.border,
      }}
    >
      {icon}
      <Text
        style={[
          variant === 'quiet' ? type.caption : type.button,
          { color: v.fg, fontSize: variant === 'quiet' ? 12 : 14 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
