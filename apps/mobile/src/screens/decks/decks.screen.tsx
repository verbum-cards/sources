import React, { useEffect, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Briefcase,
  ChevronLeft,
  Cpu,
  Film,
  Gamepad2,
  GraduationCap,
  Heart,
  Pencil,
  Plane,
  Sparkles,
  Trash2,
  Truck,
  type LucideIcon,
} from 'lucide-react-native';

import type { Goal } from '@cards/contracts';

import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { SwipeActions } from '../../components/SwipeActions';
import { WordPopup } from '../../components/WordPopup';
import { WordRow } from '../../components/WordRow';
import { useDb } from '../../hooks/use-db.hook';
import { useQuery } from '../../hooks/use-query.hook';
import { useToast } from '../../hooks/use-toast.hook';
import { DECKS, FIRST_STEPS_DECK_ID, type DeckWord, type MockDeck } from '../../mocks/decks';
import { useTheme } from '../../providers/theme.provider';
import { groupWords } from '../../utilities/word-category';
import { loadCurrentUserProfile } from '../profile/profile-logic';
import { SessionScreen } from '../session/session.screen';
import {
  addDeckToUser,
  addSingleDeckWord,
  getDeckLevel,
  groupDecksByGoal,
  isDeckWordAdded,
  loadAddedDeckIds,
  loadAddedDeckItemIds,
  removeDeckFromUser,
} from './decks-logic';
import { deleteUserDeck, getOrCreateMyVocabularyDeck, loadUserDecks } from './user-deck-logic';
import { CreateUserDeckModal, RenameUserDeckModal, UserDeckDetail } from './user-deck.screen';

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

// Императивный доступ извне — нужен main-tabs.screen.tsx: повторный тап по
// уже активному табу «Колоды» возвращает к стартовому списку, но только если
// мы не там (setState на уже null-значение — нет-оп, ререндера и «прыжка»
// скролла/перезапроса не будет, если пользователь и так на списке).
export interface DecksScreenHandle {
  resetToRoot: () => void;
}

// Таб «Колоды» — каталог + детали, без библиотеки навигации (тот же приём,
// что и в OnboardingScreen/FsrsDebugScreen): локальный useState с выбранной
// колодой вместо экрана. Настоящего каталога официальных колод ещё нет
// (docs/data-model.md, data/ и apps/api удалены) — список зашит в
// mocks/decks.ts, тот же временный приём, что и словарь для F6/первой сессии.
export const DecksScreen = ({ ref }: { ref?: React.Ref<DecksScreenHandle> }) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('decks');
  const db = useDb();
  const [selectedDeck, setSelectedDeck] = useState<MockDeck | null>(null);
  const [selectedUserDeckId, setSelectedUserDeckId] = useState<string | null>(null);
  const [sessionDeckId, setSessionDeckId] = useState<string | null>(null);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [renamingDeck, setRenamingDeck] = useState<{ id: string; title: string } | null>(null);
  const { data: addedDeckIds } = useQuery(loadAddedDeckIds, { tables: ['user_deck'] });
  const { data: userDecks } = useQuery(loadUserDecks, { tables: ['deck', 'deck_item'] });
  const { data: profile } = useQuery(loadCurrentUserProfile, { tables: ['user_profile'] });
  const deckGroups = groupDecksByGoal(DECKS);
  // Колода «Первые шаги» (ADR-33) — не про ситуацию, а про уровень:
  // единственная колода без goalTags (не попадает в deckGroups выше). Блок
  // «Рекомендую» под «Мои колоды» показывает её, но только тем, у кого именно
  // такой уровень в настройках — заголовок блока не совпадает с названием
  // самой колоды нарочно, тот же приём, что и у групп по целям (заголовок
  // группы — не название колоды внутри неё).
  const firstStepsDeck = DECKS.find((deck) => deck.id === FIRST_STEPS_DECK_ID);
  const showFirstSteps = profile?.level === 'A0' && firstStepsDeck != null;
  const [myVocabularyDeckId, setMyVocabularyDeckId] = useState<string | null>(null);
  // Один ключ на весь список «Мои колоды» — одновременно открыт максимум
  // один свайп, тем же приёмом, что и у слов внутри колоды (UserDeckDetail).
  const [revealedDeckKey, setRevealedDeckKey] = useState<string | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      resetToRoot: () => {
        setSelectedDeck(null);
        setSelectedUserDeckId(null);
        setSessionDeckId(null);
        setIsCreatingDeck(false);
        setRenamingDeck(null);
      },
    }),
    []
  );

  // «Мой словарь» видна в «Мои колоды» сразу, даже пустой — не ждём первого
  // слова (get-or-create тот же, что и при добавлении слова откуда угодно,
  // просто вызван раньше; повторный вызов при последующих словах — нет-оп).
  // Id запоминаем — по нему решаем, показывать ли жест удаления на строке
  // (её саму удалить нельзя).
  useEffect(() => {
    void (async () => {
      const deckId = await getOrCreateMyVocabularyDeck(
        db,
        t('myVocabularyTitle', { ns: 'common' })
      );
      setMyVocabularyDeckId(deckId);
    })();
  }, [db, t]);
  // «Добавить колоду» сохраняет официальную колоду в «Мои колоды» — весь
  // прогресс пользователя (свои колоды + добавленные официальные) виден в
  // одном месте, а не только по чипу «Добавлена» в каталоге ниже.
  const officialAddedDecks = DECKS.filter((deck) => addedDeckIds?.has(deck.id));

  // Удаление колоды — с подтверждением (тот же приём, что и у выхода с
  // удалением данных, profile-logout.tsx): в отличие от удаления одного
  // слова, тут один свайп+тап может унести из виду сразу всю колоду.
  const confirmDeleteDeck = (title: string, onConfirm: () => void) => {
    Alert.alert(t('userDecks.deleteConfirmTitle', { title }), t('userDecks.deleteConfirmMessage'), [
      { text: t('userDecks.deleteCancelButton'), style: 'cancel' },
      { text: t('userDecks.deleteConfirmButton'), style: 'destructive', onPress: onConfirm },
    ]);
  };

  const handleDeleteUserDeck = (deckId: string, title: string) => {
    confirmDeleteDeck(title, () => void deleteUserDeck(db, deckId));
  };

  const handleRemoveOfficialDeck = (deckId: string, title: string) => {
    confirmDeleteDeck(title, () => void removeDeckFromUser(db, deckId));
  };

  if (sessionDeckId) {
    return <SessionScreen deckId={sessionDeckId} onExit={() => setSessionDeckId(null)} />;
  }

  if (selectedDeck) {
    return (
      <DeckDetail
        deck={selectedDeck}
        isAdded={addedDeckIds?.has(selectedDeck.id) ?? false}
        onBack={() => setSelectedDeck(null)}
        onStartSession={() => setSessionDeckId(selectedDeck.id)}
      />
    );
  }

  if (selectedUserDeckId) {
    return (
      <UserDeckDetail
        deckId={selectedUserDeckId}
        onBack={() => setSelectedUserDeckId(null)}
        onStartSession={() => setSessionDeckId(selectedUserDeckId)}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Тап вне открытой строки закрывает свайп — вложенные Pressable
          (строки колод, кнопки) перехватывают тач раньше и наружу не
          всплывают, но тап по пустому месту сюда доходит. disabled, когда
          нечего закрывать: иначе этот Pressable перехватывает responder везде,
          где под пальцем нет своего вложенного Pressable (например, заголовок
          категории «Путешествия»), и блокирует там скролл. */}
      <Pressable
        style={{ flex: 1 }}
        onPress={() => setRevealedDeckKey(null)}
        disabled={revealedDeckKey === null}
      >
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
            {(userDecks ?? []).map((deck) => {
              // «Мой словарь» удалить нельзя — жеста на этой строке нет вовсе.
              if (deck.id === myVocabularyDeckId) {
                return (
                  <MyDeckRow
                    key={deck.id}
                    title={deck.title}
                    itemCount={deck.itemCount}
                    onPress={() => setSelectedUserDeckId(deck.id)}
                  />
                );
              }

              return (
                <SwipeActions
                  key={deck.id}
                  actions={[
                    {
                      key: 'rename',
                      icon: Pencil,
                      label: t('userDecks.rename'),
                      color: colors.ink,
                      onPress: () => {
                        setRevealedDeckKey(null);
                        setRenamingDeck({ id: deck.id, title: deck.title });
                      },
                    },
                    {
                      key: 'delete',
                      icon: Trash2,
                      label: t('userDecks.removeDeck'),
                      color: colors.signalInk,
                      onPress: () => handleDeleteUserDeck(deck.id, deck.title),
                    },
                  ]}
                  revealed={revealedDeckKey === deck.id}
                  onReveal={() => setRevealedDeckKey(deck.id)}
                  onHide={() =>
                    setRevealedDeckKey((current) => (current === deck.id ? null : current))
                  }
                >
                  <MyDeckRow
                    title={deck.title}
                    itemCount={deck.itemCount}
                    onPress={() => setSelectedUserDeckId(deck.id)}
                  />
                </SwipeActions>
              );
            })}
            {officialAddedDecks.map((deck) => (
              <SwipeActions
                key={deck.id}
                actions={[
                  {
                    key: 'delete',
                    icon: Trash2,
                    label: t('userDecks.removeDeck'),
                    color: colors.signalInk,
                    onPress: () => handleRemoveOfficialDeck(deck.id, deck.title),
                  },
                ]}
                revealed={revealedDeckKey === deck.id}
                onReveal={() => setRevealedDeckKey(deck.id)}
                onHide={() =>
                  setRevealedDeckKey((current) => (current === deck.id ? null : current))
                }
              >
                <MyDeckRow
                  title={deck.title}
                  itemCount={deck.items.length}
                  onPress={() => setSelectedDeck(deck)}
                />
              </SwipeActions>
            ))}
            <Button
              label={t('userDecks.create')}
              variant="secondary"
              size="lg"
              block
              onPress={() => setIsCreatingDeck(true)}
            />
          </View>

          {showFirstSteps && firstStepsDeck ? (
            <View style={{ gap: space[3] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
                <Sparkles size={40} color={colors.ink} />
                <Text
                  accessibilityRole="header"
                  style={[type.displayWord, { fontSize: 28, color: colors.ink }]}
                >
                  {t('recommended')}
                </Text>
              </View>
              <DeckRow
                deck={firstStepsDeck}
                isAdded={addedDeckIds?.has(firstStepsDeck.id) ?? false}
                onPress={() => setSelectedDeck(firstStepsDeck)}
              />
            </View>
          ) : null}

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
      </Pressable>

      <CreateUserDeckModal
        visible={isCreatingDeck}
        onClose={() => setIsCreatingDeck(false)}
        onCreated={(deckId) => {
          setIsCreatingDeck(false);
          setSelectedUserDeckId(deckId);
        }}
      />

      <RenameUserDeckModal
        visible={renamingDeck !== null}
        deckId={renamingDeck?.id ?? null}
        currentTitle={renamingDeck?.title ?? ''}
        onClose={() => setRenamingDeck(null)}
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
  const level = getDeckLevel(deck);

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
        {level ? <Chip label={level} variant="quiet" /> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
        <Text style={[type.bodyS, { color: colors.inkMuted }]}>
          {t('wordsCount', { count: deck.items.length })}
        </Text>
        {isAdded ? <Chip label={t('added')} variant="streak" /> : null}
      </View>
    </Pressable>
  );
};

const DeckDetail = ({
  deck,
  isAdded,
  onBack,
  onStartSession,
}: {
  deck: MockDeck;
  isAdded: boolean;
  onBack: () => void;
  onStartSession: () => void;
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
          <Button label={t('goToProgress')} size="lg" block onPress={onStartSession} />
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
            examples: selectedWord.examples,
            definition: selectedWord.definition,
          }
        }
        onSave={
          selectedWord && !isAdded && !isDeckWordAdded(addedItemIds ?? new Set(), selectedWord)
            ? () => {
                void handleAddWord(selectedWord);
                setSelectedWord(null);
              }
            : undefined
        }
        onClose={() => setSelectedWord(null)}
      />
    </SafeAreaView>
  );
};
