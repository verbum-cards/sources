import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Chip } from './Chip';

type Props = { word: string; translation: string; when?: string; last?: boolean; onPress?: () => void };

export function WordRow({ word, translation, when, last, onPress }: Props) {
  const { colors, space, type } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space[3],
        paddingVertical: space[3],
        paddingHorizontal: space[4],
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line,
      }}
    >
      <View style={{ flexShrink: 1, gap: 2 }}>
        <Text style={[type.button, { color: colors.ink }]}>{word}</Text>
        <Text numberOfLines={1} style={[type.bodyS, { color: colors.inkMuted }]}>
          {translation}
        </Text>
      </View>
      {when ? <Chip label={when} variant="quiet" /> : null}
    </Pressable>
  );
}
