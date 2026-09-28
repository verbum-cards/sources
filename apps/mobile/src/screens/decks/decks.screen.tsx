import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Briefcase,
  ChevronLeft,
  Cpu,
  Film,
  Gamepad2,
  GraduationCap,
  Heart,
  Plane,
  Truck,
  type LucideIcon,
} from 'lucide-react-native';

import type { Goal } from '@cards/contracts';

import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { WordPopup } from '../../components/WordPopup';
import { WordRow } from '../../components/WordRow';
import { useDb } from '../../hooks/use-db.hook';
import { useQuery } from '../../hooks/use-query.hook';
import { useToast } from '../../hooks/use-toast.hook';
import { DECKS, type DeckWord, type MockDeck } from '../../mocks/decks';
import { useTheme } from '../../providers/theme.provider';
import { groupWords } from '../../utilities/word-category';
import {
  addDeckToUser,
  addSingleDeckWord,
  groupDecksByGoal,
  isDeckWordAdded,
  loadAddedDeckIds,
  loadAddedDeckItemIds,
} from './decks-logic';
import { loadUserDecks } from './user-deck-logic';
import { CreateUserDeckModal, UserDeckDetail } from './user-deck.screen';

// Иконки категорий (goalTags, тот же набор, что и на шаге «Цель»
// онбординга) — один значок на категорию, а не на колоду: новая колода
// просто получает существующий тег, без необходимости придумывать под неё
// отдельную иконку.
const GOAL_ICONS: Record<Goal, LucideIcon> = {
  travel: Plane,
  work: Briefcase,
  move: Truck,
  exam: GraduationCap,
  media: Film,
  self: Heart,
  games: Gamepad2,
  tech: Cpu,
};

// Таб «Колоды» — каталог + детали, без библиотеки навигации (тот же приём,
// что и в OnboardingScreen/FsrsDebugScreen): локальный useState с выбранной
// колодой вместо экрана. Настоящего каталога официальных колод ещё нет
// (docs/data-model.md, data/ и apps/api удалены) — список зашит в
// mocks/decks.ts, тот же временный приём, что и словарь для F6/первой сессии.
export const DecksScreen = ({ onOpenProgress }: { onOpenProgress?: () => void }) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('decks');
  const [selectedDeck, setSelectedDeck] = useState<MockDeck | null>(null);
  const [selectedUserDeckId, setSelectedUserDeckId] = useState<string | null>(null);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const { data: addedDeckIds } = useQuery(loadAddedDeckIds, { tables: ['user_deck'] });
  const { data: userDecks } = useQuery(loadUserDecks, { tables: ['deck', 'deck_item'] });
  const deckGroups = groupDecksByGoal(DECKS);
  // «Добавить колоду» сохраняет официальную колоду в «Мои колоды» — весь
  // прогресс пользователя (свои колоды + добавленные официальные) виден в
  // одном месте, а не только по чипу «Добавлена» в каталоге ниже.
  const officialAddedDecks = DECKS.filter((deck) => addedDeckIds?.has(deck.id));

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

  if (selectedUserDeckId) {
    return (
      <UserDeckDetail deckId={selectedUserDeckId} onBack={() => setSelectedUserDeckId(null)} />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[8] }}>
        <View style={{ gap: space[2] }}>
          <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
            {t('title')}
          </Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>{t('subtitle')}</Text>
        </View>

        <View style={{ gap: space[3] }}>
          <Text
            accessibilityRole="header"
            style={[type.button, { fontSize: 15, color: colors.ink }]}
          >
            {t('userDecks.title')}
          </Text>
          {(userDecks ?? []).map((deck) => (
            <MyDeckRow
              key={deck.id}
              title={deck.title}
              itemCount={deck.itemCount}
              onPress={() => setSelectedUserDeckId(deck.id)}
            />
          ))}
          {officialAddedDecks.map((deck) => (
            <MyDeckRow
              key={deck.id}
              title={deck.title}
              itemCount={deck.items.length}
              onPress={() => setSelectedDeck(deck)}
            />
          ))}
          <Button
            label={t('userDecks.create')}
            variant="secondary"
            size="lg"
            block
            onPress={() => setIsCreatingDeck(true)}
          />
        </View>

        <View style={{ gap: space[8] }}>
          {deckGroups.map((group) => {
            const Icon = GOAL_ICONS[group.goal];

            return (
              <View key={group.goal} style={{ gap: space[4] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
                  <Icon size={40} color={colors.ink} />
                  <Text
                    accessibilityRole="header"
                    style={[type.displayWord, { fontSize: 28, color: colors.ink }]}
                  >
                    {t(`goal.options.${group.goal}`, { ns: 'onboarding' })}
                  </Text>
                </View>
                <View style={{ gap: space[3] }}>
                  {group.decks.map((deck) => (
                    <DeckRow
                      key={deck.id}
                      deck={deck}
                      isAdded={addedDeckIds?.has(deck.id) ?? false}
                      onPress={() => setSelectedDeck(deck)}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <CreateUserDeckModal
        visible={isCreatingDeck}
        onClose={() => setIsCreatingDeck(false)}
        onCreated={(deckId) => {
          setIsCreatingDeck(false);
          setSelectedUserDeckId(deckId);
        }}
      />
    </SafeAreaView>
  );
};

// Строка секции «Мои колоды» — общая для своих колод (userDecks) и
// официальных, добавленных через «Добавить колоду»: экран, на который ведёт
// нажатие (UserDeckDetail или DeckDetail), задаёт вызывающий через onPress.
const MyDeckRow = ({
  title,
  itemCount,
  onPress,
}: {
  title: string;
  itemCount: number;
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
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.line,
        padding: space[4],
        gap: space[1],
      }}
    >
      <Text style={[type.title, { fontSize: 20, color: colors.ink }]}>{title}</Text>
      <Text style={[type.bodyS, { color: colors.inkMuted }]}>
        {t('wordsCount', { count: itemCount })}
      </Text>
    </Pressable>
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
        borderRadius: radius.md,
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
        <Text style={[type.title, { fontSize: 20, color: colors.ink }]}>{deck.title}</Text>
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
  const toast = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedWord, setSelectedWord] = useState<DeckWord | null>(null);
  const { data: addedItemIds } = useQuery(loadAddedDeckItemIds, { tables: ['card'] });

  const handleAdd = async () => {
    setIsAdding(true);
    await addDeckToUser(db, deck);
    setIsAdding(false);
  };

  const handleAddWord = async (word: DeckWord) => {
    await addSingleDeckWord(db, deck, word, t('myVocabularyTitle', { ns: 'common' }));
    toast.show({ message: t('wordAdded', { word: word.lemma }) });
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
                  borderRadius: radius.md,
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
                    // Вся колода уже добавлена — галочка/плюс на каждом слове
                    // ничего не сообщают (по определению уже добавлено) и
                    // выглядят как приглашение добавить то, что и так есть.
                    added={isAdded ? undefined : isDeckWordAdded(addedItemIds ?? new Set(), word)}
                    addLabel={isAdded ? undefined : t('addWord')}
                    onAdd={isAdded ? undefined : () => void handleAddWord(word)}
                    onPress={() => setSelectedWord(word)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View
        style={{
          padding: space[5],
          gap: space[2],
          borderTopLeftRadius: radius.md,
          borderTopRightRadius: radius.md,
          backgroundColor: colors.surface,
        }}
      >
        {isAdded ? (
          <Button label={t('goToProgress')} size="lg" block onPress={() => onOpenProgress?.()} />
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

      <WordPopup
        card={
          selectedWord && {
            word: selectedWord.lemma,
            ipa: selectedWord.ipa,
            pos: selectedWord.pos,
            cefr: selectedWord.cefr,
            translation: selectedWord.translation,
            example: selectedWord.example,
            exampleTranslation: selectedWord.exampleTranslation,
            definition: selectedWord.definition,
          }
        }
        onClose={() => setSelectedWord(null)}
      />
    </SafeAreaView>
  );
};
