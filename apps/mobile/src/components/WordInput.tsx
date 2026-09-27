import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../providers/theme.provider';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
};

// Главный вход в приложение: подпись видна всегда, плейсхолдер — пример слова.
export function WordInput({ value, onChangeText, onSubmit }: Props) {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('common');

  return (
    <View style={{ gap: space[2] }}>
      <Text nativeID="new-word-label" style={[type.caption, { color: colors.inkMuted, fontSize: 14 }]}>
        {t('wordInput.label')}
      </Text>
      <View style={{ flexDirection: 'row', gap: space[4] }}>
        <TextInput
          accessibilityLabelledBy="new-word-label"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={t('wordInput.placeholder')}
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
              fontSize: 16,
            },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('wordInput.submitLabel')}
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
          <Text style={{ color: colors.onAction, fontSize: 24, lineHeight: 26 }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
