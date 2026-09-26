import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Props = { value: number; max: number; title?: string; meta?: string };

export function ProgressBar({ value, max, title, meta }: Props) {
  const { colors, radius, space, type } = useTheme();
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <View style={{ gap: space[2] }}>
      {(title || meta) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          {title ? <Text style={[type.button, { color: colors.ink, fontSize: 15 }]}>{title}</Text> : <View />}
          {meta ? <Text style={[type.bodyS, { color: colors.inkMuted }]}>{meta}</Text> : null}
        </View>
      )}
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={title}
        accessibilityValue={{ min: 0, max, now: value }}
        style={{ height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceSunken, overflow: 'hidden' }}
      >
        <View style={{ width: `${pct}%`, height: 8, borderRadius: radius.pill, backgroundColor: colors.meter }} />
      </View>
    </View>
  );
}
