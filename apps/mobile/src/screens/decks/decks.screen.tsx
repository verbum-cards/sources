import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { WordRow } from '../../components/WordRow';
import { useDb } from '../../hooks/use-db.hook';
import { useQuery } from '../../hooks/use-query.hook';
import { DECKS, type MockDeck } from '../../mocks/decks';
import { useTheme } from '../../providers/theme.provider';
import { groupWords } from '../../utilities/word-category';
import { addDeckToUser, loadAddedDeckIds } from './decks-logic';

// Таб «Колоды» — каталог + детали, без библиотеки навигации (тот же приём,
// что и в OnboardingScreen/FsrsDebugScreen): локальный useState с выбранной
// колодой вместо экрана. Настоящего каталога официальных колод ещё нет
// (docs/data-model.md, data/ и apps/api удалены) — список зашит в
// mocks/decks.ts, тот же временный приём, что и словарь для F6/первой сессии.
export const DecksScreen = ({ onOpenProgress }: { onOpenProgress?: () => void }) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('decks');
  const [selectedDeck, setSelectedDeck] = useState<MockDeck | null>(null);
  const { data: addedDeckIds } = useQuery(loadAddedDeckIds, { tables: ['user_deck'] });

  if (selectedDeck) {
    return (
      <DeckDetail
        deck={selectedDeck}
        isAdded={addedDeckIds?.has(selectedDeck.id) ?? false}
        onBack={() => setSelectedDeck(null)}
        onOpenProgress={onOpenProgress}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[4] }}>
        <View style={{ gap: space[2] }}>
          <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
            {t('title')}
          </Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>{t('subtitle')}</Text>
        </View>

        <View style={{ gap: space[3] }}>
          {DECKS.map((deck) => (
            <DeckRow
              key={deck.id}
              deck={deck}
              isAdded={addedDeckIds?.has(deck.id) ?? false}
              onPress={() => setSelectedDeck(deck)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const DeckRow = ({
  deck,
  isAdded,
  onPress,
}: {
  deck: MockDeck;
  isAdded: boolean;
  onPress: () => void;
}) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('decks');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.line,
        padding: space[4],
        gap: space[1],
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: space[2],
        }}
      >
        <Text style={[type.title, { color: colors.ink }]}>{deck.title}</Text>
        {isAdded ? <Chip label={t('added')} variant="quiet" /> : null}
      </View>
      <Text style={[type.bodyS, { color: colors.inkMuted }]}>
        {t('wordsCount', { count: deck.items.length })}
      </Text>
    </Pressable>
  );
};

const DeckDetail = ({
  deck,
  isAdded,
  onBack,
  onOpenProgress,
}: {
  deck: MockDeck;
  isAdded: boolean;
  onBack: () => void;
  onOpenProgress?: () => void;
}) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('decks');
  const db = useDb();
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    await addDeckToUser(db, deck);
    setIsAdding(false);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[4] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          onPress={onBack}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space[1],
            minHeight: 44,
            alignSelf: 'flex-start',
          }}
        >
          <ChevronLeft size={20} color={colors.inkMuted} />
          <Text style={[type.bodyS, { color: colors.inkMuted }]}>{t('back')}</Text>
        </Pressable>

        <View style={{ gap: space[2] }}>
          <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
            {deck.title}
          </Text>
          {deck.context ? (
            <Text style={[type.body, { color: colors.inkMuted }]}>{deck.context.situation}</Text>
          ) : null}
        </View>

        <View style={{ gap: space[4] }}>
          {groupWords(deck.items).map((group) => (
            <View key={group.category} style={{ gap: space[2] }}>
              <Text
                accessibilityRole="header"
                style={[type.button, { fontSize: 15, color: colors.ink }]}
              >
                {t(`categories.${group.category}`)}
              </Text>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.line,
                  overflow: 'hidden',
                }}
              >
                {group.items.map((word, i, all) => (
                  <WordRow
                    key={word.itemId}
                    word={word.lemma}
                    ipa={word.ipa}
                    cefr={word.cefr}
                    translation={word.translation}
                    last={i === all.length - 1}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ padding: space[5], gap: space[2] }}>
        {isAdded ? (
          <>
            <Text style={[type.bodyS, { color: colors.inkMuted, textAlign: 'center' }]}>
              {t('alreadyAdded')}
            </Text>
            <Button label={t('goToProgress')} size="lg" block onPress={() => onOpenProgress?.()} />
          </>
        ) : (
          <Button
            label={t('addDeck')}
            size="lg"
            block
            disabled={isAdding}
            onPress={() => void handleAdd()}
          />
        )}
      </View>
    </SafeAreaView>
  );
};
