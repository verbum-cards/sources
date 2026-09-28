# apps/mobile — CLAUDE.md

Мобильное приложение: Expo + React Native + TypeScript. Общие правила — в корневом `CLAUDE.md`.

## Стек

- Expo (актуальный SDK), EAS Build и EAS Submit, EAS Update для беты.
- expo-sqlite — локальная база; ts-fsrs — интервалы повторения.
- Reanimated — анимации; react-native-gesture-handler — жесты (свайпы; `GestureHandlerRootView` в `App.tsx`, ADR-31); lucide-react-native — иконки; шрифты Unbounded и Onest через @expo-google-fonts.
- Тема — `@cards/tokens`, типы — `@cards/contracts`.

## Структура (целевая)

```
src/
  theme/        ThemeProvider (светлая / тёмная / системная) поверх @cards/tokens
  components/   Button, Chip, ProgressBar, WordInput, ReviewPanel, WordRow, TabBar, StudyCard
  screens/      Home, Session, SessionSummary, Onboarding/*, Decks, Deck, Profile
  db/           схема, миграции, запросы
  dictionary/   поиск, нормализация, подсказки
  scheduler/    FSRS, очередь, лимит новых
  sync/         клиент протокола из docs/sync-protocol.md
  i18n/         строки интерфейса
```

## Правила

- Минимальный iOS — 16.4 (ограничение Expo SDK); не добавлять библиотеки, которые его поднимают.
- Экран работает без сети; сеть — только для синхронизации, редких слов и аудио.
- Бюджеты: холодный старт ≤ 1,5 с, превью слова ≤ 300 мс, переход к следующей карточке ≤ 100 мс.
- Эталон экранов — прототипы (ссылка в `docs/README.md`).
- Идентификаторы для bundle и package: `ios.bundleIdentifier` и `android.package` выбирает владелец продукта; не менять после первой загрузки в магазины.

## Стартовый код

`starter/` — каркас, собранный до монорепозитория: тема, 7 компонентов, главный экран на демо-данных. Задача T1.3 переносит его в Expo-проект и удаляет папку.
