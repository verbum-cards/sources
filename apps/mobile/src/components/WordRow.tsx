import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check, ListPlus } from 'lucide-react-native';

import { useTheme } from '../providers/theme.provider';
import { Chip } from './Chip';

type Props = {
  word: string;
  ipa?: string | null;
  cefr?: string | null;
  translation: string;
  when?: string;
  last?: boolean;
  onPress?: () => void;
  // Иконка добавления слова по одному (колода, decks.screen.tsx) — если
  // задан onAdd, addLabel обязателен (аккессибилити-подпись кнопки); added
  // переключает иконку на «уже добавлено» (не нажимается). Взаимоисключимо
  // с when — оба сразу нигде не используются.
  onAdd?: () => void;
  added?: boolean;
  addLabel?: string;
};

export function WordRow({
  word,
  ipa,
  cefr,
  translation,
  when,
  last,
  onPress,
  onAdd,
  added,
  addLabel,
}: Props) {
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
      {onAdd ? (
        added ? (
          <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Check size={20} color={colors.inkMuted} />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={addLabel}
            onPress={onAdd}
            hitSlop={8}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <ListPlus size={20} color={colors.action} />
          </Pressable>
        )
      ) : when ? (
        <Chip label={when} variant="quiet" />
      ) : null}
    </Pressable>
  );
}
