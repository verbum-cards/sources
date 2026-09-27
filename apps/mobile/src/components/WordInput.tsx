import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';

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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ gap: space[2] }}>
      <Text
        nativeID="new-word-label"
        style={[type.caption, { color: colors.inkMuted, fontSize: 14 }]}
      >
        {t('wordInput.label')}
      </Text>
      <View style={{ flexDirection: 'row', gap: space[4] }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <TextInput
            ref={ref}
            accessibilityLabelledBy="new-word-label"
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t('wordInput.placeholder')}
            placeholderTextColor={colors.inkMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={[
              type.body,
              {
                height: 52,
                lineHeight: 22,
                paddingLeft: space[4],
                paddingRight: isFocused && value.length > 0 ? 40 : space[4],
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: colors.lineStrong,
                backgroundColor: colors.surface,
                color: colors.ink,
                fontSize: 16,
              },
            ]}
          />
          {isFocused && value.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('wordInput.clear')}
              // onPressIn, не onPress: onBlur у TextInput срабатывает раньше
              // onPress этой кнопки и снял бы её с экрана до срабатывания тапа.
              onPressIn={() => onChangeText('')}
              style={{
                position: 'absolute',
                right: space[3],
                top: 0,
                bottom: 0,
                justifyContent: 'center',
              }}
            >
              <X size={18} color={colors.inkMuted} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};
