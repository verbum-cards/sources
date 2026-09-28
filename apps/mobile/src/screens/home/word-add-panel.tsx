import React, { useCallback, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';

import { Button } from '../../components/Button';
import { WordNew, type WordNewHandle } from '../../components/WordNew';
import type { PackWord } from '../../db/entities/dictionary/lookup';
import { useDb } from '../../hooks/use-db.hook';
import { useQuery } from '../../hooks/use-query.hook';
import { useToast } from '../../hooks/use-toast.hook';
import { useTheme } from '../../providers/theme.provider';
import { addManualWord, addWordFromDictionary, loadAddedItemIds } from './word-add-logic';

// Императивный доступ к фокусу поля — нужен пустому состоянию главного экрана
// (кнопка «Добавить слово»): переносить туда состояние WordNew не имеет
// смысла, а просто сфокусировать уже видимое поле ввода — самое простое.
export interface WordAddPanelHandle {
  focus: () => void;
}

// F6 «Добавление слова за 5 секунд» — виджет на главном экране (не отдельный
// маршрут, поэтому без суффикса .screen: владеет БД-логикой как остальные
// screens/*, но встроен внутрь HomeScreen). Поиск, подсказки, мгновенное
// добавление по значку «+» и превью по тапу/Enter — общий components/WordNew.tsx
// (та же логика, что и в своих колодах, screens/decks/user-deck.screen.tsx).
// Этот файл — только ветка «слова нет в словаре» (ручной перевод, специфична
// для главного экрана: свои колоды такого не допускают, ADR-29) и запись
// добавления в БД (word-add-logic.ts).
export const WordAddPanel = ({
  onFocus,
  ref,
}: {
  onFocus?: () => void;
  ref?: React.Ref<WordAddPanelHandle>;
}) => {
  const { colors, radius, space, type } = useTheme();
  const { t } = useTranslation('home');
  const db = useDb();
  const toast = useToast();
  const wordNewRef = useRef<WordNewHandle>(null);

  useImperativeHandle(ref, () => ({ focus: () => wordNewRef.current?.focus() }), []);

  const { data: addedItemIds } = useQuery(loadAddedItemIds, { tables: ['card'] });

  // Ветка «Не нашли такого слова» (docs/flows/f06.md) — включается через
  // onNotFound у WordNew (Enter/сабмит без точного совпадения в пакете).
  // null — форма скрыта.
  const [manualLemma, setManualLemma] = useState<string | null>(null);
  const [manualTranslation, setManualTranslation] = useState('');
  const [manualExample, setManualExample] = useState('');

  const handleAddFromDictionary = useCallback(
    async (word: PackWord) => {
      await addWordFromDictionary({
        db,
        word,
        myVocabularyTitle: t('myVocabularyTitle', { ns: 'common' }),
      });
    },
    [db, t]
  );

  const handleNotFound = useCallback((lemma: string) => {
    setManualLemma(lemma);
    setManualTranslation('');
    setManualExample('');
  }, []);

  const handleAddManual = useCallback(async () => {
    if (manualLemma === null) return;
    const translation = manualTranslation.trim();
    if (!translation) return;

    await addManualWord({
      db,
      lemma: manualLemma,
      translation,
      example: manualExample,
      myVocabularyTitle: t('myVocabularyTitle', { ns: 'common' }),
    });
    toast.show({ message: t('wordAdded', { word: manualLemma, ns: 'decks' }) });
    setManualLemma(null);
    setManualTranslation('');
    setManualExample('');
    wordNewRef.current?.clear();
    wordNewRef.current?.focus();
  }, [db, manualLemma, manualTranslation, manualExample, toast, t]);

  return (
    <View style={{ gap: space[1] }}>
      <WordNew
        ref={wordNewRef}
        onFocus={onFocus}
        onAddWord={handleAddFromDictionary}
        addedRefs={addedItemIds ?? new Set()}
        onNotFound={handleNotFound}
      />

      {manualLemma !== null ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: space[5],
            gap: space[3],
          }}
        >
          <View style={{ gap: 2 }}>
            <Text style={[type.button, { color: colors.ink }]}>{manualLemma}</Text>
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
    </View>
  );
};
