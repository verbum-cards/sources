import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';
import { X } from 'lucide-react-native';

import { useTheme } from '../../providers/theme.provider';
import { formatPos } from '../../utilities/format-pos';
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
                padding: space[2],
                gap: space[6],
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: space[4],
                }}
              >
                <View style={{ gap: space[2], flexShrink: 1, padding: space[4] }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: space[4],
                      paddingRight: space[2],
                    }}
                  >
                    <Text style={[type.title, { color: colors.ink }]}>{card.word}</Text>
                    {card.cefr ? (
                      <Text
                        style={[
                          type.captionS,
                          {
                            color: colors.inkMuted,
                            backgroundColor: colors.surfaceSunken,
                            marginTop: -space[1],
                            padding: space[2],
                            borderRadius: radius.pill,
                            width: 32,
                            height: 32,
                            textAlign: 'center',
                          },
                        ]}
                      >
                        {card.cefr}
                      </Text>
                    ) : null}
                  </View>

                  <View style={{ flexDirection: 'row', gap: space[1] }}>
                    {card.ipa ? (
                      <Text style={[type.caption, { color: colors.inkMuted }]}> /{card.ipa}/</Text>
                    ) : null}
                    {formatPos(card.pos) ? (
                      <Text style={[type.caption, { color: colors.inkMuted }]}>
                        · {formatPos(card.pos)}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[type.body, { color: colors.ink }]}>{card.translation}</Text>
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
                    padding: space[4],
                  }}
                >
                  <X size={20} color={colors.inkMuted} />
                </Pressable>
              </View>

              {card.definition ? (
                <View style={{ paddingHorizontal: space[4] }}>
                  <Text style={[type.bodyS, { color: colors.inkMuted, fontStyle: 'italic' }]}>
                    {card.definition}
                  </Text>
                </View>
              ) : null}

              {example ? (
                <View style={{ gap: space[2], padding: space[4] }}>
                  <Text style={[type.body, { color: colors.ink }]}>
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
                    <Text style={[type.bodyS, { color: colors.inkMuted }]}>
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
