import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../providers/theme.provider';

type Props = { value: number; max: number; title?: string; meta?: string };

export function ProgressBar({ value, max, title, meta }: Props) {
  const { colors, radius, space, type } = useTheme();
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  const isCompleted = pct >= 100;

  return (
    <View style={{ gap: space[2] }}>
      {(title || meta) && (
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}
        >
          {title ? <Text style={[type.captionS, { color: colors.ink }]}>{title}</Text> : <View />}
          {meta ? <Text style={[type.captionS, { color: colors.inkMuted }]}>{meta}</Text> : null}
        </View>
      )}
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={title}
        accessibilityValue={{ min: 0, max, now: value }}
        style={{
          height: 16,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceSunken,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: 16,
            borderRadius: radius.pill,
            backgroundColor: isCompleted ? colors.highlight : colors.meter,
          }}
        />
      </View>
    </View>
  );
}
