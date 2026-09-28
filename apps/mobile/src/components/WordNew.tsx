import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';

import {
  findPackWordByLemma,
  searchPackWordsByPrefix,
  type PackWord,
} from '../db/entities/dictionary/lookup';
import { useDictionaryDb } from '../hooks/use-dictionary-db.hook';
import { useToast } from '../hooks/use-toast.hook';
import { useTheme } from '../providers/theme.provider';
import { WordPopup } from './WordPopup';
import { WordRow } from './WordRow';

const SEARCH_DEBOUNCE_MS = 250;

// Императивный доступ извне — нужен главному экрану: пустое состояние
// (кнопка «Добавить слово», home.screen.tsx) фокусирует поле.
export interface WordNewHandle {
  focus: () => void;
  clear: () => void;
}

interface Props {
  // Само добавление — экран решает сам: своя колода зовёт addWordToUserDeck,
  // главный экран — addWordToUserDeck с id «Моего словаря».
  onAddWord: (word: PackWord) => Promise<void>;
  // itemType:itemId уже добавленных слов — не создавать вторую карточку и
  // показывать их в подсказках последними.
  addedRefs: ReadonlySet<string>;
  // Прячет пустое состояние главного экрана, если тапнули прямо в поле
  // (home.screen.tsx) — decks его не передают.
  onFocus?: () => void;
  ref?: React.Ref<WordNewHandle>;
}

// Добавление нового слова — общая логика для своих колод
// (screens/decks/user-deck.screen.tsx) и главного экрана
// (screens/home/home.screen.tsx): поиск по пакету словаря с дебаунсом
// (≤300мс, apps/mobile/CLAUDE.md), список подсказок со значком «+»
// (мгновенное добавление) и превью по тапу на строку/Enter с кнопкой
// «Сохранить» в попапе. Слово, которого нет в пакете (Enter/сабмит без
// точного совпадения) — пока без ручного ввода перевода: раньше был на
// главном экране, временно убран.
export const WordNew = ({ onAddWord, addedRefs, onFocus, ref }: Props) => {
  const { colors, radius, space } = useTheme();
  const { t } = useTranslation('decks');
  const dictionaryDb = useDictionaryDb();
  const toast = useToast();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<readonly PackWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<PackWord | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => setQuery(''),
    }),
    []
  );

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
    await onAddWord(word);
    setQuery('');
    toast.show({ message: t('wordAdded', { word: word.lemma }) });
  };

  // Enter/сабмит: точное совпадение — превью (как тап по строке); слова нет
  // в пакете — нет-оп (ручного ввода пока нет).
  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const found = await findPackWordByLemma(dictionaryDb, trimmed);
    if (found) {
      setSelectedWord(found);
    }
  };

  // Уже добавленные — в конец списка саджестов: сначала только новые слова,
  // которые действительно можно добавить.
  const sortedResults = [...results].sort((a, b) => {
    const aAdded = addedRefs.has(`${a.itemType}:${a.itemId}`);
    const bAdded = addedRefs.has(`${b.itemType}:${b.itemId}`);

    return Number(aAdded) - Number(bAdded);
  });

  return (
    <View style={{ gap: space[4] }}>
      <TextInput
        ref={inputRef}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => void handleSubmit()}
        onFocus={onFocus}
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
    </View>
  );
};
