import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { useTheme } from '../providers/theme.provider';

export interface DeckPickerOption {
  id: string;
  title: string;
}

interface Props {
  visible: boolean;
  title: string;
  emptyMessage: string;
  decks: readonly DeckPickerOption[];
  onPick: (deck: DeckPickerOption) => void;
  onClose: () => void;
}

// Список своих колод для выбора одной — общая модалка для «Добавить в
// колоду» (WordPopup.tsx) и любого другого места, где нужно спросить, в
// какую свою колоду положить слово. Сама операция (что происходит при
// выборе) — на стороне вызывающего (onPick), эта модалка ничего не пишет в
// базу. Визуально — тот же список, что и у MoveWordModal
// (screens/decks/user-deck.screen.tsx), но без логики перемещения между
// колодами: она устроена иначе (убирает из исходной), это не тот случай.
export const DeckPickerModal = ({
  visible,
  title,
  emptyMessage,
  decks,
  onPick,
  onClose,
}: Props) => {
  const { colors, radius, space, type } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          padding: space[5],
        }}
      >
        <Pressable onPress={() => {}}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: space[5],
              gap: space[4],
            }}
          >
            <Text style={[type.title, { color: colors.ink }]}>{title}</Text>
            {decks.length > 0 ? (
              <View style={{ gap: space[2] }}>
                {decks.map((deck) => (
                  <Pressable
                    key={deck.id}
                    accessibilityRole="button"
                    onPress={() => onPick(deck)}
                    style={{
                      paddingVertical: space[4],
                      paddingHorizontal: space[4],
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: colors.line,
                    }}
                  >
                    <Text style={[type.bodyS, { color: colors.ink }]}>{deck.title}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={[type.bodyS, { color: colors.inkMuted }]}>{emptyMessage}</Text>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
