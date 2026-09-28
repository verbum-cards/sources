import React, { useEffect, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../providers/theme.provider';

export interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

// Общая верхняя нотификация — единая точка для «Добавлено» и подобных
// коротких подтверждений в любом экране (см. providers/toast.provider.tsx,
// useToast()). Палитра — та же, что и у прежнего локального подтверждения в
// word-add-panel.tsx (highlightSoft/ink), чтобы не заводить второй стиль.
export const Toast = ({ message, actionLabel, onAction }: ToastProps) => {
  const { colors, radius, space, type } = useTheme();
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: space[5],
        right: space[5],
        top: insets.top + space[3],
        opacity,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space[3],
          backgroundColor: colors.highlightSoft,
          borderRadius: radius.md,
          paddingVertical: space[3],
          paddingHorizontal: space[4],
        }}
      >
        <Text style={[type.bodyS, { color: colors.ink, flexShrink: 1 }]}>{message}</Text>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            onPress={onAction}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text
              style={[
                type.button,
                { color: colors.ink, fontSize: 14, textDecorationLine: 'underline' },
              ]}
            >
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
};
