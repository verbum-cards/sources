import React, { useEffect, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, SectionList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Briefcase,
  Bus,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Cpu,
  Dumbbell,
  Film,
  Footprints,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  MessageCircle,
  Pencil,
  Plane,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';

import type { DeckCategory } from '@cards/contracts';

import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { DeckPickerModal } from '../../components/DeckPickerModal';
import { SwipeActions } from '../../components/SwipeActions';
import { WordPopup } from '../../components/WordPopup';
import { WordRow } from '../../components/WordRow';
import { useDb } from '../../hooks/use-db.hook';
import { useQuery } from '../../hooks/use-query.hook';
import { useToast } from '../../hooks/use-toast.hook';
import { DECKS, REVIEW_DECK_IDS, type DeckWord, type MockDeck } from '../../mocks/decks';
import { useTheme } from '../../providers/theme.provider';
import { groupWords } from '../../utilities/word-category';
import { SessionScreen } from '../session/session.screen';
import {
  addDeckToUser,
  addSingleDeckWord,
  CATEGORY_ORDER,
  getDeckLevel,
  getDecksByCategory,
  isDeckWordAdded,
  loadAddedDeckIds,
  loadAddedDeckItemIds,
  removeDeckFromUser,
} from './decks-logic';
import {
  addWordToUserDeck,
  deleteUserDeck,
  getOrCreateMyVocabularyDeck,
  loadUserDecks,
} from './user-deck-logic';
import { CreateUserDeckModal, RenameUserDeckModal, UserDeckDetail } from './user-deck.screen';

// Иконка на категорию каталога (ADR-35, замена группировки по goalTags/Goal
// из ADR-24) — один значок на категорию, а не на колоду: новая колода просто
// получает существующую категорию, без необходимости придумывать под неё
// отдельную иконку.
const CATEGORY_ICONS: Record<DeckCategory, LucideIcon> = {
  basics: Sparkles,
  firstSteps: Footprints,
  workOffice: Briefcase,
  businessCareer: TrendingUp,
  abroad: Truck,
  health: HeartPulse,
  shopping: ShoppingBag,
  cafeRestaurant: Coffee,
  travelLeisure: Plane,
  transportCity: Bus,
  opinion: MessageCircle,
  emotionsRelationships: Heart,
  itTech: Cpu,
  sportsHobbies: Dumbbell,
  homeLife: Home,
  moviesBooks: Film,
  study: GraduationCap,
  socializing: Users,
};

// Императивный доступ извне — нужен main-tabs.screen.tsx: повторный тап по
// уже активному табу «Колоды» возвращает к стартовому списку, но только если
// мы не там (setState на уже null-значение — нет-оп, ререндера и «прыжка»
// скролла/перезапроса не будет, если пользователь и так на списке).
export interface DecksScreenHandle {
  resetToRoot: () => void;
}

// Таб «Колоды» (ADR-35) — стартовый экран теперь навигационное меню: строка
// «Мои колоды» (список переехал на свой экран, MyDecksScreen), «Проверка
// партий» (служебная, без изменений) и список категорий каталога — у каждой
// свой экран (CategoryDetail), без инлайн-секций, как было раньше. Без
// библиотеки навигации (тот же приём, что и в OnboardingScreen/
// FsrsDebugScreen): локальный useState вместо стека экранов. Настоящего
// каталога официальных колод ещё нет (docs/data-model.md, data/ и apps/api
// удалены) — список зашит в mocks/decks.ts, тот же временный приём, что и
// словарь для F6/первой сессии.
export const DecksScreen = ({ ref }: { ref?: React.Ref<DecksScreenHandle> }) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('decks');
  const [selectedDeck, setSelectedDeck] = useState<MockDeck | null>(null);
  const [selectedUserDeckId, setSelectedUserDeckId] = useState<string | null>(null);
  const [sessionDeckId, setSessionDeckId] = useState<string | null>(null);
  const [showMyDecks, setShowMyDecks] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DeckCategory | null>(null);
  const { data: addedDeckIds } = useQuery(loadAddedDeckIds, { tables: ['user_deck'] });

  // Служебные колоды для проверки партий словаря (generate-senses.ts) — не
  // для пользователей беты, по одной на уровень CEFR (review_a1_a2.json и
  // т.д.), видны всегда, но только пока в них есть слова (после разбора
  // конвейер туда больше ничего не кладёт сам). Не категория — отдельные
  // строки вне списка ниже.
  const reviewDecks = REVIEW_DECK_IDS.map((id) => DECKS.find((deck) => deck.id === id)).filter(
    (deck): deck is MockDeck => deck != null && deck.items.length > 0
  );

  useImperativeHandle(
    ref,
    () => ({
      resetToRoot: () => {
        setSelectedDeck(null);
        setSelectedUserDeckId(null);
        setSessionDeckId(null);
        setShowMyDecks(false);
        setSelectedCategory(null);
      },
    }),
    []
  );

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

  if (showMyDecks) {
    return (
      <MyDecksScreen
        onBack={() => setShowMyDecks(false)}
        onOpenUserDeck={setSelectedUserDeckId}
        onOpenOfficialDeck={setSelectedDeck}
      />
    );
  }

  if (selectedCategory) {
    return (
      <CategoryDetail
        category={selectedCategory}
        onBack={() => setSelectedCategory(null)}
        onOpenDeck={setSelectedDeck}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ padding: space[5], gap: space[6] }}>
        <View style={{ gap: space[2] }}>
          <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
            {t('title')}
          </Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>{t('subtitle')}</Text>
        </View>

        <View style={{ gap: space[3] }}>
          <NavRow
            icon={Sparkles}
            label={t('userDecks.title')}
            onPress={() => setShowMyDecks(true)}
          />
          {reviewDecks.map((deck) => (
            <NavRow
              key={deck.id}
              icon={Wrench}
              label={deck.title}
              onPress={() => setSelectedDeck(deck)}
            />
          ))}
        </View>

        <View style={{ gap: space[3] }}>
          {CATEGORY_ORDER.map((category) => (
            <NavRow
              key={category}
              icon={CATEGORY_ICONS[category]}
              label={t(`catalogCategories.${category}`)}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Строка навигационного меню корневого экрана «Колоды» — иконка, название,
// шеврон вправо; сама ничего не показывает про содержимое (число колод и
// т.п.) — это уже на экране, куда ведёт строка.
const NavRow = ({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) => {
  const { colors, radius, space, type } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.line,
        padding: space[4],
      }}
    >
      <Icon size={24} color={colors.ink} />
      <Text style={[type.title, { fontSize: 17, color: colors.ink, flex: 1 }]}>{label}</Text>
      <ChevronRight size={20} color={colors.inkMuted} />
    </Pressable>
  );
};

// Список своих колод (свои + добавленные официальные) — раньше был инлайн-
// секцией на корневом экране «Колоды» (ADR-35), теперь отдельный экран за
// строкой «Мои колоды».
const MyDecksScreen = ({
  onBack,
  onOpenUserDeck,
  onOpenOfficialDeck,
}: {
  onBack: () => void;
  onOpenUserDeck: (deckId: string) => void;
  onOpenOfficialDeck: (deck: MockDeck) => void;
}) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('decks');
  const db = useDb();
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [renamingDeck, setRenamingDeck] = useState<{ id: string; title: string } | null>(null);
  const [myVocabularyDeckId, setMyVocabularyDeckId] = useState<string | null>(null);
  // Один ключ на весь список — одновременно открыт максимум один свайп, тем
  // же приёмом, что и у слов внутри колоды (UserDeckDetail).
  const [revealedDeckKey, setRevealedDeckKey] = useState<string | null>(null);
  const { data: addedDeckIds } = useQuery(loadAddedDeckIds, { tables: ['user_deck'] });
  const { data: userDecks } = useQuery(loadUserDecks, { tables: ['deck', 'deck_item'] });

  // «Мой словарь» видна сразу, даже пустая — не ждём первого слова (get-or-
  // create тот же, что и при добавлении слова откуда угодно, просто вызван
  // раньше; повторный вызов при последующих словах — нет-оп). Id запоминаем
  // — по нему решаем, показывать ли жест удаления на строке (её саму удалить
  // нельзя).
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
  // одном месте, а не только по чипу «Добавлена» в каталоге.
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

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Тап вне открытой строки закрывает свайп — вложенные Pressable
          (строки колод, кнопки) перехватывают тач раньше и наружу не
          всплывают, но тап по пустому месту сюда доходит. disabled, когда
          нечего закрывать — иначе перехватывает responder везде, где под
          пальцем нет вложенного Pressable, и блокирует скролл. */}
      <Pressable
        style={{ flex: 1 }}
        onPress={() => setRevealedDeckKey(null)}
        disabled={revealedDeckKey === null}
      >
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

          <Text
            accessibilityRole="header"
            style={[type.displayL, { fontSize: 32, color: colors.ink }]}
          >
            {t('userDecks.title')}
          </Text>

          <View style={{ gap: space[3] }}>
            {(userDecks ?? []).map((deck) => {
              // «Мой словарь» удалить нельзя — жеста на этой строке нет вовсе.
              if (deck.id === myVocabularyDeckId) {
                return (
                  <MyDeckRow
                    key={deck.id}
                    title={deck.title}
                    itemCount={deck.itemCount}
                    onPress={() => onOpenUserDeck(deck.id)}
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
                    onPress={() => onOpenUserDeck(deck.id)}
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
                  onPress={() => onOpenOfficialDeck(deck)}
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
        </ScrollView>
      </Pressable>

      <CreateUserDeckModal
        visible={isCreatingDeck}
        onClose={() => setIsCreatingDeck(false)}
        onCreated={(deckId) => {
          setIsCreatingDeck(false);
          onOpenUserDeck(deckId);
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

// Экран одной категории каталога — список официальных колод с этой
// категорией (getDecksByCategory, ADR-35). Колода может быть в нескольких
// категориях сразу, поэтому может появиться на нескольких таких экранах.
const CategoryDetail = ({
  category,
  onBack,
  onOpenDeck,
}: {
  category: DeckCategory;
  onBack: () => void;
  onOpenDeck: (deck: MockDeck) => void;
}) => {
  const { colors, space, type } = useTheme();
  const { t } = useTranslation('decks');
  const { data: addedDeckIds } = useQuery(loadAddedDeckIds, { tables: ['user_deck'] });
  const decks = getDecksByCategory(DECKS, category);

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

        <Text
          accessibilityRole="header"
          style={[type.displayL, { fontSize: 32, color: colors.ink }]}
        >
          {t(`catalogCategories.${category}`)}
        </Text>

        {decks.length > 0 ? (
          <View style={{ gap: space[3] }}>
            {decks.map((deck) => (
              <DeckRow
                key={deck.id}
                deck={deck}
                isAdded={addedDeckIds?.has(deck.id) ?? false}
                onPress={() => onOpenDeck(deck)}
              />
            ))}
          </View>
        ) : (
          <Text style={[type.bodyS, { color: colors.inkMuted }]}>{t('categoryEmpty')}</Text>
        )}
      </ScrollView>
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
  const [wordForDeckPick, setWordForDeckPick] = useState<DeckWord | null>(null);
  const { data: addedItemIds } = useQuery(loadAddedDeckItemIds, { tables: ['card'] });

  // Своя колода, кроме «Мой словарь» — цели для «Добавить в колоду»
  // (WordPopup.tsx). Колода официальная (mocks/decks.ts), поэтому исключать
  // саму себя из списка не нужно — среди своих колод её и так не может быть.
  const [myVocabularyDeckId, setMyVocabularyDeckId] = useState<string | null>(null);
  useEffect(() => {
    void (async () => {
      const id = await getOrCreateMyVocabularyDeck(db, t('myVocabularyTitle', { ns: 'common' }));
      setMyVocabularyDeckId(id);
    })();
  }, [db, t]);
  const { data: userDecks } = useQuery(loadUserDecks, { tables: ['deck', 'deck_item'] });
  const deckTargets = (userDecks ?? []).filter((candidate) => candidate.id !== myVocabularyDeckId);

  const handleAdd = async () => {
    setIsAdding(true);
    await addDeckToUser(db, deck);
    setIsAdding(false);
  };

  const handleAddWord = async (word: DeckWord) => {
    await addSingleDeckWord(db, deck, word, t('myVocabularyTitle', { ns: 'common' }));
    toast.show({ message: t('wordAdded', { word: word.lemma }) });
  };

  const handlePickDeck = async (targetDeckId: string, targetDeckTitle: string) => {
    if (!wordForDeckPick) return;
    const word = wordForDeckPick;
    setWordForDeckPick(null);
    await addWordToUserDeck(db, targetDeckId, word, t('myVocabularyTitle', { ns: 'common' }));
    toast.show({
      message: t('userDecks.addToDeckSuccess', { word: word.lemma, deck: targetDeckTitle }),
    });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <SectionList
        contentContainerStyle={{ padding: space[5] }}
        // Виртуализация (не ScrollView + map по всем словам разом) — у
        // служебной колоды «Проверка партий» бывают тысячи карточек, без
        // неё экран подвисал на монтировании всех WordRow одновременно.
        sections={groupWords(deck.items).map((group) => ({
          title: group.category,
          data: group.items,
        }))}
        keyExtractor={(word) => `${word.itemType}:${word.itemId}`}
        ListHeaderComponent={
          <View style={{ gap: space[4], marginBottom: space[2] }}>
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
              <Text
                accessibilityRole="header"
                style={[type.displayL, { fontSize: 32, color: colors.ink }]}
              >
                {deck.title}
              </Text>
              {deck.context ? (
                <Text style={[type.body, { color: colors.inkMuted }]}>
                  {deck.context.situation}
                </Text>
              ) : null}
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text
            accessibilityRole="header"
            style={[
              type.button,
              { fontSize: 15, color: colors.ink, marginTop: space[4], marginBottom: space[2] },
            ]}
          >
            {t(`categories.${section.title}`)}
          </Text>
        )}
        renderItem={({ item: word, index, section }) => {
          const isFirst = index === 0;
          const isLast = index === section.data.length - 1;

          return (
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.line,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderTopWidth: isFirst ? 1 : 0,
                borderBottomWidth: isLast ? 1 : 0,
                borderTopLeftRadius: isFirst ? radius.md : 0,
                borderTopRightRadius: isFirst ? radius.md : 0,
                borderBottomLeftRadius: isLast ? radius.md : 0,
                borderBottomRightRadius: isLast ? radius.md : 0,
                overflow: 'hidden',
              }}
            >
              <WordRow
                word={word.lemma}
                ipa={word.ipa}
                cefr={word.cefr}
                translation={word.translation}
                last={isLast}
                // Вся колода уже добавлена — галочка/плюс на каждом слове
                // ничего не сообщают (по определению уже добавлено) и
                // выглядят как приглашение добавить то, что и так есть.
                added={isAdded ? undefined : isDeckWordAdded(addedItemIds ?? new Set(), word)}
                addLabel={isAdded ? undefined : t('addWord')}
                onAdd={isAdded ? undefined : () => void handleAddWord(word)}
                onPress={() => setSelectedWord(word)}
              />
            </View>
          );
        }}
      />

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
        onAddToDeck={
          selectedWord && deckTargets.length > 0
            ? () => {
                setWordForDeckPick(selectedWord);
                setSelectedWord(null);
              }
            : undefined
        }
        onClose={() => setSelectedWord(null)}
      />

      <DeckPickerModal
        visible={wordForDeckPick !== null}
        title={t('userDecks.addToDeckTitle')}
        emptyMessage={t('userDecks.moveEmpty')}
        decks={deckTargets}
        onPick={(deck) => void handlePickDeck(deck.id, deck.title)}
        onClose={() => setWordForDeckPick(null)}
      />
    </SafeAreaView>
  );
};
