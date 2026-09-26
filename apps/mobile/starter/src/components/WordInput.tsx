import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
};

// Главный вход в приложение: подпись видна всегда, плейсхолдер — пример слова.
export function WordInput({ value, onChangeText, onSubmit }: Props) {
  const { colors, radius, space, type } = useTheme();

  return (
    <View style={{ gap: space[2] }}>
      <Text nativeID="new-word-label" style={[type.caption, { color: colors.inkMuted, fontSize: 13 }]}>
        Новое слово
      </Text>
      <View style={{ flexDirection: 'row', gap: space[2] }}>
        <TextInput
          accessibilityLabelledBy="new-word-label"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder="Например, serendipity"
          placeholderTextColor={colors.inkMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[
            type.body,
            {
              flex: 1,
              height: 52,
              paddingHorizontal: space[4],
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: colors.lineStrong,
              backgroundColor: colors.surface,
              color: colors.ink,
              fontSize: 17,
            },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Найти перевод"
          onPress={onSubmit}
          style={({ pressed }) => ({
            width: 52,
            height: 52,
            borderRadius: radius.md,
            backgroundColor: colors.action,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Text style={{ color: colors.onAction, fontSize: 26, lineHeight: 28 }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
