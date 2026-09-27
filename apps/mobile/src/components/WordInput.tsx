import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';

import { useTheme } from '../providers/theme.provider';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  ref?: React.Ref<TextInput>;
};

// Главный вход в приложение: подпись видна всегда, плейсхолдер — пример слова.
// ref (React 19 — обычный проп, без forwardRef) — чтобы F6 (word-add-panel.tsx)
// могло вернуть фокус в пустое поле после добавления карточки (docs/flows/f06.md, шаг 5).
export const WordInput = ({ value, onChangeText, onSubmit, ref }: Props) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('common');

  return (
    <View style={{ gap: space[2] }}>
      <Text
        nativeID="new-word-label"
        style={[type.caption, { color: colors.inkMuted, fontSize: 14 }]}
      >
        {t('wordInput.label')}
      </Text>
      <View style={{ flexDirection: 'row', gap: space[4] }}>
        <TextInput
          ref={ref}
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
              lineHeight: 22,
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
      </View>
    </View>
  );
};
