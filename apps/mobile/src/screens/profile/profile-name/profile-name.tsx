import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import { Check, X } from 'lucide-react-native';

import type { UserProfileStored } from '@cards/contracts';

import type { DbExecutor } from '../../../db/executor';
import { useTheme } from '../../../providers/theme.provider';
import { updateProfileName } from '../profile-logic';

interface Props {
  db: DbExecutor;
  profile: UserProfileStored;
}

export const ProfileName = ({ db, profile }: Props) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('profile');
  const [name, setName] = useState(profile.name ?? '');
  const [isNameFocused, setIsNameFocused] = useState(false);

  const handleSaveName = async () => {
    try {
      await updateProfileName(db, name);
      Keyboard.dismiss();
    } catch {
      // Ошибка сохранения — клавиатуру не трогаем, поле остаётся в фокусе.
    }
  };

  return (
    <View style={{ gap: space[2] }}>
      <Text nativeID="profile-name-label" style={[type.caption, { color: colors.inkMuted }]}>
        {t('name.label')}
      </Text>
      <View style={{ flexDirection: 'row', gap: space[2] }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <TextInput
            accessibilityLabelledBy="profile-name-label"
            value={name}
            onChangeText={setName}
            onSubmitEditing={() => void handleSaveName()}
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => setIsNameFocused(false)}
            placeholder={t('name.placeholder')}
            placeholderTextColor={colors.inkMuted}
            returnKeyType="done"
            style={[
              type.body,
              {
                height: 52,
                paddingRight: isNameFocused && name.length > 0 ? 40 : space[4],
                paddingLeft: space[4],
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: colors.lineStrong,
                backgroundColor: colors.surface,
                color: colors.ink,
                fontSize: 16,
                lineHeight: 22,
              },
            ]}
          />
          {isNameFocused && name.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('name.clear')}
              // onPressIn, не onPress: onBlur у TextInput срабатывает раньше
              // onPress этой кнопки и снял бы её с экрана до срабатывания тапа.
              onPressIn={() => setName('')}
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
        {profile.name !== name && name.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Сохранить имя"
            onPress={() => void handleSaveName()}
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
            <Check size={28} />
          </Pressable>
        )}
      </View>
    </View>
  );
};
