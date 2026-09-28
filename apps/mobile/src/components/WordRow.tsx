import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../providers/theme.provider';
import { formatPos } from '../utilities/format-pos';
import { Chip } from './Chip';

type Props = {
  word: string;
  ipa?: string | null;
  pos?: string | null;
  cefr?: string | null;
  translation: string;
  when?: string;
  last?: boolean;
  onPress?: () => void;
};

export function WordRow({ word, ipa, pos, cefr, translation, when, last, onPress }: Props) {
  const { colors, space, type } = useTheme();
  const posLabel = formatPos(pos);

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
      <View style={{ flexShrink: 1, gap: space[1] }}>
        <Text style={[type.button, { color: colors.ink }]}>
          {word}
          {ipa ? <Text style={[type.bodyS, { color: colors.inkMuted }]}> · /{ipa}/</Text> : null}
          {cefr ? <Text style={[type.bodyS, { color: colors.inkMuted }]}> · {cefr}</Text> : null}
        </Text>
        <Text numberOfLines={1} style={[type.bodyS, { color: colors.inkMuted }]}>
          {translation}
        </Text>
      </View>
      {when ? <Chip label={when} variant="quiet" /> : null}
    </Pressable>
  );
}
