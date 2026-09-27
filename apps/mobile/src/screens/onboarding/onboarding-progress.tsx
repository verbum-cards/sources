import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../providers/theme.provider';

export interface OnboardingProgressValue {
  step: number;
  total: number;
}

type Props = OnboardingProgressValue;

// Индикатор шага в онбординге (F1): сколько экранов осталось до появления
// в приложении. Шаги идут строго по порядку без возврата назад
// (onboarding.screen.tsx), поэтому индикатор чисто информационный, не тап-абельный.
//
// Абсолютное позиционирование у нижнего края — намеренно: кнопок под точками
// разное число на разных шагах (1–2 штуки, где-то ещё и заголовок «Готово»),
// поэтому в обычном потоке точки оказывались бы на разной высоте. Рендерить
// нужно прямо внутри SafeAreaView экрана (родитель = вся высота экрана), а не
// внутри вложенного контейнера с кнопками — иначе привязка будет не к экрану.
export const OnboardingProgress = ({ step, total }: Props) => {
  const { colors, space } = useTheme();

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: space[2], alignItems: 'center' }}
    >
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: total, now: step + 1 }}
        style={{ flexDirection: 'row', gap: space[2], padding: space[4] }}
      >
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: index === step ? colors.highlight : colors.line,
            }}
          />
        ))}
      </View>
    </View>
  );
};
