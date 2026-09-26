import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../components/Chip';
import { ProgressBar } from '../components/ProgressBar';
import { ReviewPanel } from '../components/ReviewPanel';
import { TabBar, TabKey } from '../components/TabBar';
import { WordInput } from '../components/WordInput';
import { WordRow } from '../components/WordRow';
import { useTheme } from '../theme/ThemeProvider';

// Демо-данные. Дальше их заменят локальная база (SQLite) и FSRS.
const DEMO = {
  name: 'Алекс',
  streak: 12,
  due: 23,
  done: 12,
  goal: 30,
  learned: 486,
  queued: 8,
  recent: [
    { word: 'wander', tr: 'бродить, странствовать', when: 'сегодня' },
    { word: 'fierce', tr: 'свирепый, яростный', when: 'вчера' },
    { word: 'tenant', tr: 'арендатор, жилец', when: 'вчера' },
  ],
};

export function HomeScreen() {
  const { colors, radius, space, type } = useTheme();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<TabKey>('home');

  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: space[5], paddingTop: space[6], paddingBottom: space[6], gap: space[4] }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: space[3] }}>
          <View style={{ gap: 6, flexShrink: 1 }}>
            <Text style={[type.bodyS, { color: colors.inkMuted }]}>{today.charAt(0).toUpperCase() + today.slice(1)}</Text>
            <Text accessibilityRole="header" style={[type.displayL, { color: colors.ink }]}>
              Привет, {DEMO.name}
            </Text>
          </View>
          <Chip label={`${DEMO.streak} дней`} variant="streak" />
        </View>

        <WordInput value={query} onChangeText={setQuery} onSubmit={() => {/* F6: поиск в локальном словаре */}} />

        {DEMO.due > 0 ? (
          <ReviewPanel due={DEMO.due} minutes={Math.max(1, Math.round(DEMO.due * 0.25))} onStart={() => {/* F10 */}} />
        ) : null}

        <ProgressBar title="Цель дня" meta={`${DEMO.done} из ${DEMO.goal} карточек`} value={DEMO.done} max={DEMO.goal} />

        <View style={{ flexDirection: 'row', gap: space[2] }}>
          {[
            { n: DEMO.learned, label: 'слов выучено' },
            { n: DEMO.queued, label: 'новых в очереди' },
          ].map((s) => (
            <View key={s.label} style={{ flex: 1, backgroundColor: colors.surfaceSunken, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: space[4], gap: 2 }}>
              <Text style={[type.displayL, { fontSize: 24, lineHeight: 30, color: colors.ink }]}>{s.n}</Text>
              <Text style={[type.caption, { fontSize: 13, lineHeight: 18, color: colors.inkMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: space[2] }}>
          <Text accessibilityRole="header" style={[type.button, { fontSize: 15, color: colors.ink }]}>
            Недавно добавлены
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }}>
            {DEMO.recent.map((w, i) => (
              <WordRow key={w.word} word={w.word} translation={w.tr} when={w.when} last={i === DEMO.recent.length - 1} />
            ))}
          </View>
        </View>
      </ScrollView>
      <TabBar active={tab} onChange={setTab} />
    </SafeAreaView>
  );
}
