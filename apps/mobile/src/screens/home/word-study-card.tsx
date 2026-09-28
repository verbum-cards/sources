import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';
import { X } from 'lucide-react-native';

import { useTheme } from '../../providers/theme.provider';
import { splitAroundWord } from '../../utilities/highlight-word';
import type { RecentCard } from './home-logic';

interface Props {
  card: RecentCard | null;
  onClose: () => void;
}

// Тап по слову в «Недавно добавлены» открывает тот же вид карточки, что и
// превью при добавлении слова (word-add-panel.tsx) — слово, перевод, пример
// с подсветкой, — но без кнопки добавления: слово уже в карточках, это просто
// посмотреть его ещё раз. Полноценного режима повторения (F10) здесь нет.
export const WordStudyCard = ({ card, onClose }: Props) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('home');
  const example = card?.example ? splitAroundWord(card.example, card.word) : null;

  return (
    <Modal visible={card != null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          padding: space[5],
        }}
      >
        {card ? (
          // Пустой onPress — не закрыть карточку тапом по ней самой, только по
          // фону вокруг (внешний Pressable) или по кнопке-крестику.
          <Pressable onPress={() => {}}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: space[5],
                gap: space[8],
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: space[3],
                }}
              >
                <View style={{ gap: space[2], flexShrink: 1 }}>
                  <Text style={[type.title, { color: colors.ink }]}>{card.word}</Text>
                  <Text style={[type.body, { color: colors.inkMuted }]}>{card.translation}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('recent.close')}
                  onPress={onClose}
                  style={{
                    minWidth: 44,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={20} color={colors.inkMuted} />
                </Pressable>
              </View>

              {example ? (
                <View style={{ gap: space[2] }}>
                  <Text style={[type.body, { color: colors.inkMuted }]}>
                    {example.before}
                    {example.match ? (
                      <Text
                        style={{
                          backgroundColor: colors.highlightSoft,
                          color: colors.ink,
                          borderRadius: radius.sm,
                        }}
                      >
                        {example.match}
                      </Text>
                    ) : null}
                    {example.after}
                  </Text>
                  {card.exampleTranslation ? (
                    <Text style={[type.body, { color: colors.inkMuted }]}>
                      {card.exampleTranslation}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </Pressable>
        ) : null}
      </Pressable>
    </Modal>
  );
};
