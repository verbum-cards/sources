import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

export type TabKey = 'home' | 'decks' | 'progress' | 'profile';

const TABS: { key: TabKey; label: string; glyph: string }[] = [
  { key: 'home', label: 'Главная', glyph: '⌂' },
  { key: 'decks', label: 'Колоды', glyph: '▤' },
  { key: 'progress', label: 'Прогресс', glyph: '▮' },
  { key: 'profile', label: 'Профиль', glyph: '○' },
];

// Иконки-глифы — временные; в проекте подключаем lucide-react-native (см. README).
export function TabBar({ active, onChange }: { active: TabKey; onChange: (key: TabKey) => void }) {
  const { colors, radius, space, type } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        paddingTop: space[2],
        paddingBottom: Math.max(insets.bottom, space[5]),
        paddingHorizontal: space[2],
      }}
    >
      {TABS.map((tab) => {
        const on = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(tab.key)}
            style={{ flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: space[1] }}
          >
            <View
              style={{
                width: 52,
                height: 28,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? colors.highlight : 'transparent',
              }}
            >
              <Text style={{ fontSize: 16, color: on ? colors.onHighlight : colors.inkMuted }}>{tab.glyph}</Text>
            </View>
            <Text style={[type.caption, { color: on ? colors.ink : colors.inkMuted, fontFamily: on ? 'Onest_600SemiBold' : 'Onest_500Medium' }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
