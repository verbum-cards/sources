import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart2, Home, Layers, User } from 'lucide-react-native';

import { fonts } from '@cards/tokens';

import { useTheme } from '../providers/theme.provider';

export type TabKey = 'home' | 'decks' | 'progress' | 'profile';

const TABS: { key: TabKey; labelKey: string; Icon: typeof Home }[] = [
  { key: 'home', labelKey: 'tabBar.home', Icon: Home },
  { key: 'decks', labelKey: 'tabBar.decks', Icon: Layers },
  { key: 'progress', labelKey: 'tabBar.progress', Icon: BarChart2 },
  { key: 'profile', labelKey: 'tabBar.profile', Icon: User },
];

export function TabBar({ active, onChange }: { active: TabKey; onChange: (key: TabKey) => void }) {
  const { colors, radius, space, type } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('common');

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
        const label = t(tab.labelKey);

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(tab.key)}
            style={{
              flex: 1,
              minHeight: 56,
              alignItems: 'center',
              justifyContent: 'center',
              gap: space[1],
            }}
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
              <tab.Icon
                size={24}
                strokeWidth={1.5}
                color={on ? colors.onHighlight : colors.inkMuted}
              />
            </View>
            <Text
              style={[
                type.caption,
                {
                  color: on ? colors.ink : colors.inkMuted,
                  fontFamily: on ? fonts.semibold : fonts.medium,
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
