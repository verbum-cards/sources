import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { WordInput } from '../components/WordInput';
import { WordRow } from '../components/WordRow';
import { findWordByLemma, searchWordsByPrefix } from '../dictionary/search';
import { useDb } from '../hooks/use-db.hook';
import type { DebugWord } from '../mocks/fsrs-debug-words';
import { useTheme } from '../providers/theme.provider';
import { splitAroundWord } from '../utilities/highlight-word';
import {
  addManualWord,
  addWordFromDictionary,
  isWordAlreadyAdded,
  undoAddedCard,
} from './word-add-logic';

const CONFIRMATION_DURATION_MS = 5000;

// Что показать под полем ввода вместо/помимо подсказок (docs/flows/f06.md).
// 'idle' — только подсказки (или ничего, если запрос короче 2 символов).
type Phase =
  | { kind: 'idle' }
  | { kind: 'preview'; word: DebugWord }
  | { kind: 'duplicate'; word: DebugWord }
  | { kind: 'manual'; lemma: string };

// F6 «Добавление слова за 5 секунд» — виджет на главном экране (не отдельный
// маршрут, поэтому без суффикса .screen: владеет БД-логикой как остальные
// screens/*, но встроен внутрь HomeScreen). Реального словаря ещё нет (T1.6) —
// источник подсказок/превью изолирован в dictionary/search.ts, сама запись в
// БД — в word-add-logic.ts; этот файл — только состояние экрана и вёрстка.
export const WordAddPanel = () => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('home');
  const db = useDb();
  const inputRef = useRef<TextInput>(null);
  const confirmationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [manualTranslation, setManualTranslation] = useState('');
  const [manualExample, setManualExample] = useState('');
  const [confirmation, setConfirmation] = useState<{ cardId: string } | null>(null);

  useEffect(
    () => () => {
      if (confirmationTimerRef.current) clearTimeout(confirmationTimerRef.current);
    },
    []
  );

  // Подсказки (шаг 2 флоу) видны, только пока запрос ещё не разрешён в
  // превью/дубликат/ручной ввод — как только это случилось, они уступают
  // место соответствующему блоку ниже.
  const suggestions = useMemo(
    () => (phase.kind === 'idle' ? searchWordsByPrefix(query) : []),
    [phase.kind, query]
  );

  const showConfirmation = useCallback((cardId: string) => {
    if (confirmationTimerRef.current) clearTimeout(confirmationTimerRef.current);
    setConfirmation({ cardId });
    confirmationTimerRef.current = setTimeout(() => {
      setConfirmation(null);
      confirmationTimerRef.current = null;
    }, CONFIRMATION_DURATION_MS);
  }, []);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    setPhase({ kind: 'idle' });
  }, []);

  // Шаг 3 флоу: тап по подсказке или Enter — точное совпадение леммы решает,
  // куда переходим (превью / «уже есть» / «не нашли»).
  const resolve = useCallback(
    async (rawLemma: string) => {
      const trimmed = rawLemma.trim();
      if (!trimmed) return;

      const found = findWordByLemma(trimmed);
      if (!found) {
        setPhase({ kind: 'manual', lemma: trimmed });

        return;
      }

      const duplicate = await isWordAlreadyAdded(db, found.itemId);
      setPhase(duplicate ? { kind: 'duplicate', word: found } : { kind: 'preview', word: found });
    },
    [db]
  );

  const handleSubmit = useCallback(() => {
    void resolve(query);
  }, [resolve, query]);

  const handleSuggestionPress = useCallback(
    (word: DebugWord) => {
      setQuery(word.lemma);
      void resolve(word.lemma);
    },
    [resolve]
  );

  const resetAfterAdd = useCallback(() => {
    setQuery('');
    setManualTranslation('');
    setManualExample('');
    setPhase({ kind: 'idle' });
    inputRef.current?.focus();
  }, []);

  const handleAddFromPreview = useCallback(async () => {
    if (phase.kind !== 'preview') return;

    const cardId = await addWordFromDictionary({ db, word: phase.word });
    showConfirmation(cardId);
    resetAfterAdd();
  }, [db, phase, showConfirmation, resetAfterAdd]);

  const handleAddManual = useCallback(async () => {
    if (phase.kind !== 'manual') return;
    const translation = manualTranslation.trim();
    if (!translation) return;

    const cardId = await addManualWord({
      db,
      lemma: phase.lemma,
      translation,
      example: manualExample,
    });
    showConfirmation(cardId);
    resetAfterAdd();
  }, [db, phase, manualTranslation, manualExample, showConfirmation, resetAfterAdd]);

  const handleUndo = useCallback(async () => {
    if (!confirmation) return;
    if (confirmationTimerRef.current) clearTimeout(confirmationTimerRef.current);
    confirmationTimerRef.current = null;
    const cardId = confirmation.cardId;
    setConfirmation(null);
    await undoAddedCard(db, cardId);
  }, [db, confirmation]);

  const previewExample =
    phase.kind === 'preview' ? splitAroundWord(phase.word.example, phase.word.lemma) : null;

  return (
    <View style={{ gap: space[3] }}>
      <WordInput
        ref={inputRef}
        value={query}
        onChangeText={handleChangeText}
        onSubmit={handleSubmit}
      />

      {suggestions.length > 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.line,
            overflow: 'hidden',
          }}
        >
          {suggestions.map((word, i, all) => (
            <WordRow
              key={word.itemId}
              word={word.lemma}
              translation={word.translation}
              last={i === all.length - 1}
              onPress={() => handleSuggestionPress(word)}
            />
          ))}
        </View>
      ) : null}

      {phase.kind === 'preview' && previewExample ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: space[5],
            gap: space[2],
          }}
        >
          <Text style={[type.title, { color: colors.ink }]}>{phase.word.lemma}</Text>
          <Text style={[type.body, { color: colors.inkMuted }]}>{phase.word.translation}</Text>
          <Text style={[type.bodyS, { color: colors.inkMuted }]}>
            {previewExample.before}
            {previewExample.match ? (
              <Text
                style={{
                  backgroundColor: colors.highlightSoft,
                  color: colors.ink,
                  borderRadius: radius.sm,
                }}
              >
                {previewExample.match}
              </Text>
            ) : null}
            {previewExample.after}
          </Text>
          <Button
            label={t('wordAdd.preview.addButton')}
            size="lg"
            block
            onPress={() => void handleAddFromPreview()}
          />
        </View>
      ) : null}

      {phase.kind === 'duplicate' ? (
        <View
          style={{
            backgroundColor: colors.signalSoft,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.signalSoft,
            padding: space[4],
            gap: 2,
          }}
        >
          <Text style={[type.button, { color: colors.ink }]}>{phase.word.lemma}</Text>
          <Text style={[type.bodyS, { color: colors.inkMuted }]}>{t('wordAdd.duplicate')}</Text>
        </View>
      ) : null}

      {phase.kind === 'manual' ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: space[5],
            gap: space[3],
          }}
        >
          <View style={{ gap: 2 }}>
            <Text style={[type.button, { color: colors.ink }]}>{phase.lemma}</Text>
            <Text style={[type.bodyS, { color: colors.inkMuted }]}>
              {t('wordAdd.notFound.title')}
            </Text>
          </View>

          <View style={{ gap: space[2] }}>
            <Text
              nativeID="manual-translation-label"
              style={[type.caption, { color: colors.inkMuted, fontSize: 14 }]}
            >
              {t('wordAdd.notFound.translationLabel')}
            </Text>
            <TextInput
              accessibilityLabelledBy="manual-translation-label"
              value={manualTranslation}
              onChangeText={setManualTranslation}
              placeholder={t('wordAdd.notFound.translationPlaceholder')}
              placeholderTextColor={colors.inkMuted}
              style={[
                type.body,
                {
                  height: 52,
                  paddingHorizontal: space[4],
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor: colors.lineStrong,
                  backgroundColor: colors.surface,
                  color: colors.ink,
                  fontSize: 16,
                },
              ]}
            />
          </View>

          <View style={{ gap: space[2] }}>
            <Text
              nativeID="manual-example-label"
              style={[type.caption, { color: colors.inkMuted, fontSize: 14 }]}
            >
              {t('wordAdd.notFound.exampleLabel')}
            </Text>
            <TextInput
              accessibilityLabelledBy="manual-example-label"
              value={manualExample}
              onChangeText={setManualExample}
              placeholder={t('wordAdd.notFound.examplePlaceholder')}
              placeholderTextColor={colors.inkMuted}
              style={[
                type.body,
                {
                  height: 52,
                  paddingHorizontal: space[4],
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor: colors.lineStrong,
                  backgroundColor: colors.surface,
                  color: colors.ink,
                  fontSize: 16,
                },
              ]}
            />
          </View>

          <Button
            label={t('wordAdd.notFound.addButton')}
            size="lg"
            block
            disabled={manualTranslation.trim().length === 0}
            onPress={() => void handleAddManual()}
          />
        </View>
      ) : null}

      {confirmation ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.highlightSoft,
            borderRadius: radius.md,
            paddingVertical: space[3],
            paddingHorizontal: space[4],
          }}
        >
          <Text style={[type.bodyS, { color: colors.ink }]}>{t('wordAdd.confirmation.added')}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('wordAdd.confirmation.undo')}
            onPress={() => void handleUndo()}
            style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text
              style={[
                type.button,
                { color: colors.ink, fontSize: 14, textDecorationLine: 'underline' },
              ]}
            >
              {t('wordAdd.confirmation.undo')}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};
