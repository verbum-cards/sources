import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutAnimation, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Trash2 } from 'lucide-react-native';

import { Button } from '../../components/Button';
import { SwipeActions } from '../../components/SwipeActions';
import { WordNew } from '../../components/WordNew';
import { WordPopup } from '../../components/WordPopup';
import { WordRow } from '../../components/WordRow';
import type { PackWord } from '../../db/entities/dictionary/lookup';
import { useDb } from '../../hooks/use-db.hook';
import { useDictionaryDb } from '../../hooks/use-dictionary-db.hook';
import { useQuery } from '../../hooks/use-query.hook';
import { useToast } from '../../hooks/use-toast.hook';
import { useTheme } from '../../providers/theme.provider';
import {
  addWordToUserDeck,
  createUserDeck,
  getOrCreateMyVocabularyDeck,
  loadUserDeck,
  loadUserDecks,
  loadUserDeckWords,
  moveWordToDeck,
  removeWordFromUserDeck,
  renameUserDeck,
  type UserDeck,
} from './user-deck-logic';

// «Создать колоду» — только название, тело как у ProfileName (TextInput +
// сохранение), но в модалке, а не на постоянном экране: одноразовое
// действие, не нужен свой экран.
export const CreateUserDeckModal = ({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (deckId: string) => void;
}) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('decks');
  const db = useDb();
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setIsCreating(true);
    const deckId = await createUserDeck(db, trimmed);
    setIsCreating(false);
    setTitle('');
    onCreated(deckId);
  };

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
            <Text style={[type.title, { color: colors.ink }]}>{t('userDecks.createTitle')}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('userDecks.namePlaceholder')}
              placeholderTextColor={colors.inkMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => void handleCreate()}
              style={{
                height: 52,
                paddingHorizontal: space[4],
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: colors.lineStrong,
                backgroundColor: colors.paper,
                color: colors.ink,
                fontSize: 16,
              }}
            />
            <Button
              label={t('userDecks.create')}
              size="lg"
              block
              disabled={isCreating || title.trim().length === 0}
              onPress={() => void handleCreate()}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// Вторая иконка свайпа по своей колоде (decks.screen.tsx) — то же тело
// модалки, что и у создания, но с предзаполненным текущим названием и
// renameUserDeck вместо createUserDeck. deckId — снаружи (какую колоду
// переименовываем), не собственное состояние: сам компонент не решает,
// какая колода открыта.
export const RenameUserDeckModal = ({
  visible,
  deckId,
  currentTitle,
  onClose,
}: {
  visible: boolean;
  deckId: string | null;
  currentTitle: string;
  onClose: () => void;
}) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('decks');
  const db = useDb();
  const [title, setTitle] = useState(currentTitle);
  const [isSaving, setIsSaving] = useState(false);

  // Модалка не размонтируется между открытиями (одна на экран) — заново
  // подставляем текущее название колоды при каждом открытии, а не только
  // при первом монтировании.
  useEffect(() => {
    if (visible) setTitle(currentTitle);
  }, [visible, currentTitle]);

  const handleRename = async () => {
    const trimmed = title.trim();
    if (!trimmed || !deckId) return;

    setIsSaving(true);
    await renameUserDeck(db, deckId, trimmed);
    setIsSaving(false);
    onClose();
  };

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
            <Text style={[type.title, { color: colors.ink }]}>{t('userDecks.renameTitle')}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('userDecks.namePlaceholder')}
              placeholderTextColor={colors.inkMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => void handleRename()}
              style={{
                height: 52,
                paddingHorizontal: space[4],
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: colors.lineStrong,
                backgroundColor: colors.paper,
                color: colors.ink,
                fontSize: 16,
              }}
            />
            <Button
              label={t('userDecks.rename')}
              size="lg"
              block
              disabled={isSaving || title.trim().length === 0}
              onPress={() => void handleRename()}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// Длительность fade-анимации закрытия Modal (animationType="fade") — после
// выбора колоды ждём столько же, прежде чем анимировать исчезновение строки:
// раньше не получится увидеть анимацию за ещё не закрывшимся попапом.
const MODAL_CLOSE_MS = 300;

// Свайп вправо на слове (UserDeckDetail) — список своих колод, куда его
// можно перенести. «Мой словарь» и текущая колода в список не входят: в
// «Мой словарь» слово и так уже есть (addToMyVocabulary), а переносить в ту
// же колоду, где оно уже лежит, бессмысленно — вызывающий отфильтровывает
// оба случая до передачи `decks` сюда.
export const MoveWordModal = ({
  visible,
  word,
  fromDeckId,
  decks,
  onClose,
  onMoved,
}: {
  visible: boolean;
  word: PackWord | null;
  fromDeckId: string;
  decks: readonly UserDeck[];
  onClose: () => void;
  onMoved: (word: string, deckTitle: string) => void;
}) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('decks');
  const db = useDb();

  const handlePick = (deck: UserDeck) => {
    if (!word) return;
    const movedWord = word;
    // Само перемещение и анимация исчезновения строки — после того, как
    // попап закроется и перестанет закрывать собой список: иначе анимация
    // проигрывается за ещё открытой модалкой и её не видно.
    onClose();
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      void (async () => {
        await moveWordToDeck(db, fromDeckId, deck.id, movedWord.itemType, movedWord.itemId);
        onMoved(movedWord.lemma, deck.title);
      })();
    }, MODAL_CLOSE_MS);
  };

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
            <Text style={[type.title, { color: colors.ink }]}>{t('userDecks.moveTitle')}</Text>
            {decks.length > 0 ? (
              <View style={{ gap: space[2] }}>
                {decks.map((deck) => (
                  <Pressable
                    key={deck.id}
                    accessibilityRole="button"
                    onPress={() => handlePick(deck)}
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
              <Text style={[type.bodyS, { color: colors.inkMuted }]}>
                {t('userDecks.moveEmpty')}
              </Text>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export const UserDeckDetail = ({
  deckId,
  onBack,
  onStartSession,
}: {
  deckId: string;
  onBack: () => void;
  onStartSession: () => void;
}) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('decks');
  const db = useDb();
  const dictionaryDb = useDictionaryDb();
  const toast = useToast();

  const { data: deck } = useQuery((userDb) => loadUserDeck(userDb, deckId), { tables: ['deck'] });
  const { data: deckWords } = useQuery(
    (userDb) => loadUserDeckWords(userDb, dictionaryDb, deckId),
    { tables: ['deck_item', 'card', 'card_content'] }
  );
  const { data: allUserDecks } = useQuery(loadUserDecks, { tables: ['deck', 'deck_item'] });
  const addedRefs = new Set((deckWords ?? []).map((word) => `${word.itemType}:${word.itemId}`));

  const [selectedWord, setSelectedWord] = useState<PackWord | null>(null);
  // Один ключ на весь список слов колоды — одновременно открыт максимум один
  // SwipeActions: свайп по другой строке или тап вне уже открытой закрывают
  // предыдущую, а не добавляют вторую открытую поверх.
  const [revealedWordKey, setRevealedWordKey] = useState<string | null>(null);
  const [movingWord, setMovingWord] = useState<PackWord | null>(null);
  const [myVocabularyDeckId, setMyVocabularyDeckId] = useState<string | null>(null);

  // Тот же get-or-create, что и в decks.screen.tsx — нужен только id, чтобы
  // исключить «Мой словарь» из списка целей перемещения (она и так уже
  // содержит любое слово).
  useEffect(() => {
    void (async () => {
      const id = await getOrCreateMyVocabularyDeck(db, t('myVocabularyTitle', { ns: 'common' }));
      setMyVocabularyDeckId(id);
    })();
  }, [db, t]);

  const moveTargetDecks = (allUserDecks ?? []).filter(
    (candidate) => candidate.id !== deckId && candidate.id !== myVocabularyDeckId
  );

  const handleRemoveWord = (word: PackWord) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    void removeWordFromUserDeck(db, deckId, word.itemType, word.itemId);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Тап вне открытой строки (по пустому месту — вложенные Pressable
          вроде WordRow/кнопок забирают touch себе раньше) закрывает свайп.
          disabled, когда нечего закрывать — иначе перехватывает responder
          везде, где под пальцем нет вложенного Pressable, и блокирует скролл
          (тот же баг, что был в decks.screen.tsx). */}
      <Pressable
        style={{ flex: 1 }}
        onPress={() => setRevealedWordKey(null)}
        disabled={revealedWordKey === null}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: space[5], gap: space[4] }}
        >
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

          <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
            {deck?.title}
          </Text>

          <WordNew
            onAddWord={async (word) => {
              await addWordToUserDeck(db, deckId, word, t('myVocabularyTitle', { ns: 'common' }));
            }}
            addedRefs={addedRefs}
            decks={moveTargetDecks}
            onAddWordToDeck={async (word, targetDeckId) => {
              await addWordToUserDeck(
                db,
                targetDeckId,
                word,
                t('myVocabularyTitle', { ns: 'common' })
              );
            }}
          />

          <View style={{ gap: space[2] }}>
            <Text
              accessibilityRole="header"
              style={[type.button, { fontSize: 15, color: colors.ink }]}
            >
              {t('userDecks.wordsInDeck', { count: deckWords?.length ?? 0 })}
            </Text>
            {deckWords && deckWords.length > 0 ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.line,
                  overflow: 'hidden',
                }}
              >
                {deckWords.map((word, i, all) => {
                  const wordKey = `${word.itemType}:${word.itemId}`;

                  return (
                    <SwipeActions
                      key={wordKey}
                      actions={[
                        {
                          key: 'delete',
                          icon: Trash2,
                          label: t('userDecks.removeWord'),
                          color: colors.signalInk,
                          onPress: () => handleRemoveWord(word),
                        },
                      ]}
                      revealed={revealedWordKey === wordKey}
                      onReveal={() => setRevealedWordKey(wordKey)}
                      onHide={() =>
                        setRevealedWordKey((current) => (current === wordKey ? null : current))
                      }
                      onSwipeRight={() => setMovingWord(word)}
                    >
                      <WordRow
                        word={word.lemma}
                        ipa={word.ipa}
                        cefr={word.cefr}
                        translation={word.translation}
                        last={i === all.length - 1}
                        onPress={() => setSelectedWord(word)}
                      />
                    </SwipeActions>
                  );
                })}
              </View>
            ) : (
              <Text style={[type.bodyS, { color: colors.inkMuted }]}>{t('userDecks.empty')}</Text>
            )}
          </View>
        </ScrollView>
      </Pressable>

      {deckWords && deckWords.length > 0 ? (
        <View
          style={{
            padding: space[5],
            gap: space[2],
            borderTopLeftRadius: radius.md,
            borderTopRightRadius: radius.md,
            backgroundColor: colors.surface,
          }}
        >
          <Button label={t('userDecks.study')} size="lg" block onPress={onStartSession} />
        </View>
      ) : null}

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
        onClose={() => setSelectedWord(null)}
      />

      <MoveWordModal
        visible={movingWord !== null}
        word={movingWord}
        fromDeckId={deckId}
        decks={moveTargetDecks}
        onClose={() => setMovingWord(null)}
        onMoved={(word, deckTitle) => {
          toast.show({ message: t('userDecks.moveSuccess', { word, deck: deckTitle }) });
        }}
      />
    </SafeAreaView>
  );
};
