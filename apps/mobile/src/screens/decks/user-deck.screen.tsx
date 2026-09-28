import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { Button } from '../../components/Button';
import { WordPopup } from '../../components/WordPopup';
import { WordRow } from '../../components/WordRow';
import type { PackWord } from '../../db/entities/dictionary/lookup';
import { searchPackWordsByPrefix } from '../../db/entities/dictionary/lookup';
import { useDb } from '../../hooks/use-db.hook';
import { useDictionaryDb } from '../../hooks/use-dictionary-db.hook';
import { useQuery } from '../../hooks/use-query.hook';
import { useToast } from '../../hooks/use-toast.hook';
import { useTheme } from '../../providers/theme.provider';
import { addWordToUserDeck, createUserDeck, loadUserDeckWords } from './user-deck-logic';

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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
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

const SEARCH_DEBOUNCE_MS = 250;

export const UserDeckDetail = ({ deckId, onBack }: { deckId: string; onBack: () => void }) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('decks');
  const db = useDb();
  const dictionaryDb = useDictionaryDb();
  const toast = useToast();

  const { data: deckWords } = useQuery(
    (userDb) => loadUserDeckWords(userDb, dictionaryDb, deckId),
    { tables: ['deck_item', 'card', 'card_content'] }
  );
  const addedRefs = new Set((deckWords ?? []).map((word) => `${word.itemType}:${word.itemId}`));

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<readonly PackWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<PackWord | null>(null);

  // Дебаунс — тот же бюджет превью слова (≤300мс, apps/mobile/CLAUDE.md), но
  // здесь запрос идёт в пакет словаря, а не в моки, поэтому не мгновенно.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);

      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        const words = await searchPackWordsByPrefix(dictionaryDb, query);
        if (!cancelled) setResults(words);
      })();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, dictionaryDb]);

  const handleAddWord = async (word: PackWord) => {
    await addWordToUserDeck(db, deckId, word, t('myVocabularyTitle', { ns: 'common' }));
    setQuery('');
    toast.show({ message: t('wordAdded', { word: word.lemma }) });
  };

  // Уже добавленные — в конец списка саджестов: сначала только новые слова,
  // которые действительно можно добавить.
  const sortedResults = [...results].sort((a, b) => {
    const aAdded = addedRefs.has(`${a.itemType}:${a.itemId}`);
    const bAdded = addedRefs.has(`${b.itemType}:${b.itemId}`);

    return Number(aAdded) - Number(bAdded);
  });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
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

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('userDecks.searchPlaceholder')}
          placeholderTextColor={colors.inkMuted}
          style={{
            height: 52,
            paddingHorizontal: space[4],
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: colors.lineStrong,
            backgroundColor: colors.surface,
            color: colors.ink,
            fontSize: 16,
          }}
        />

        {sortedResults.length > 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.line,
              overflow: 'hidden',
            }}
          >
            {sortedResults.map((word, i, all) => (
              <WordRow
                key={`${word.itemType}:${word.itemId}`}
                word={word.lemma}
                ipa={word.ipa}
                cefr={word.cefr}
                translation={word.translation}
                last={i === all.length - 1}
                added={addedRefs.has(`${word.itemType}:${word.itemId}`)}
                addLabel={t('addWord')}
                onAdd={() => void handleAddWord(word)}
                onPress={() => setSelectedWord(word)}
              />
            ))}
          </View>
        ) : null}

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
              {deckWords.map((word, i, all) => (
                <WordRow
                  key={`${word.itemType}:${word.itemId}`}
                  word={word.lemma}
                  ipa={word.ipa}
                  cefr={word.cefr}
                  translation={word.translation}
                  last={i === all.length - 1}
                  onPress={() => setSelectedWord(word)}
                />
              ))}
            </View>
          ) : (
            <Text style={[type.bodyS, { color: colors.inkMuted }]}>{t('userDecks.empty')}</Text>
          )}
        </View>
      </ScrollView>

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
        onSave={
          selectedWord && !addedRefs.has(`${selectedWord.itemType}:${selectedWord.itemId}`)
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
