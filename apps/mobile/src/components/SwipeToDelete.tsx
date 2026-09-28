import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';

import { useTheme } from '../providers/theme.provider';

const ANIMATION_MS = 180;
// Порог свайпа, а не непрерывное слежение за пальцем: строка никуда не
// уезжает, свайп — просто жест-триггер для короткой микроанимации появления.
const SWIPE_THRESHOLD = 24;
const DIRECTION_LOCK_DX = 10;
// Вертикальный люфт, прежде чем жест «сдаётся» и отдаёт палец ScrollView —
// увод пальца по вертикали в начале свайпа (обычное дело) в пределах этого
// не мешает.
const VERTICAL_FAIL = 20;

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel: string;
  // Управляется снаружи, не собственным useState: список решает, какая из
  // строк сейчас открыта (один ключ на весь список), чтобы одновременно был
  // раскрыт только один SwipeToDelete — открытие одного естественно
  // закрывает остальные, раз revealed у них становится false тем же путём.
  revealed: boolean;
  onReveal: () => void;
  onHide: () => void;
}

// Свайп влево на слове — не уезжающая строка, а оверлей поверх неё (0.5
// прозрачности) и иконка действия справа, всплывающая fade-in + чуть снизу
// вверх. react-native-gesture-handler (ADR-31, docs/decisions.md) вместо
// plain PanResponder: жест распознаётся нативно, а не в JS-потоке —
// activeOffsetX/failOffsetY отдают предпочтение вертикальному ScrollView
// раньше, чем наш горизонтальный успел бы «выиграть» гонку в JS.
export const SwipeToDelete = ({
  children,
  onDelete,
  deleteLabel,
  revealed,
  onReveal,
  onHide,
}: Props) => {
  const { colors, space } = useTheme();
  // useState с ленивым инициализатором, а не useRef(...).current — читаются
  // прямо в рендере (opacity/transform), а useRef здесь нарушил бы
  // react-hooks/refs (React Compiler) — тот же приём, что и в MainTabsScreen.
  const [overlayOpacity] = useState(() => new Animated.Value(0));
  const [iconOpacity] = useState(() => new Animated.Value(0));
  const [iconTranslateY] = useState(() => new Animated.Value(8));

  // Анимация следует за revealed, откуда бы он ни поменялся — свайпом этой
  // же строки (onReveal) или тем, что открылась другая (revealed сверху
  // стал false без прямого onHide).
  useEffect(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: revealed ? 0.5 : 0,
        duration: ANIMATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: revealed ? 1 : 0,
        duration: ANIMATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(iconTranslateY, {
        toValue: revealed ? 0 : 8,
        duration: ANIMATION_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [revealed, overlayOpacity, iconOpacity, iconTranslateY]);

  const panGesture = Gesture.Pan()
    .enabled(!revealed)
    .activeOffsetX(-DIRECTION_LOCK_DX)
    .failOffsetX(DIRECTION_LOCK_DX)
    .failOffsetY([-VERTICAL_FAIL, VERTICAL_FAIL])
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD) onReveal();
    });

  return (
    <View style={{ position: 'relative' }}>
      <GestureDetector gesture={panGesture}>
        <View>{children}</View>
      </GestureDetector>

      {revealed ? (
        <Pressable onPress={onHide} style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.onSignal, opacity: overlayOpacity },
            ]}
          />
        </Pressable>
      ) : null}

      {revealed ? (
        <Animated.View
          style={{
            position: 'absolute',
            right: space[4],
            top: 0,
            bottom: 0,
            justifyContent: 'center',
            opacity: iconOpacity,
            transform: [{ translateY: iconTranslateY }],
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={deleteLabel}
            onPress={onDelete}
            hitSlop={8}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Trash2 size={20} color={colors.signalInk} />
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
};
