# Модель данных

Языковая пара — не набор данных, а настройка «изучаемый + родной язык». Данные хранятся по языкам и связываются через значения и концепты: N языков = N словарей, а не N² пар.

## Общий контент (сервер и пакет словаря на устройстве, пользователи не меняют)

| Сущность | Ключевые поля |
|---|---|
| `lexeme` | id, lang, lemma, pos, ipa, audio_url, frequency_rank |
| `sense` | id, lexeme_id, concept_id, cefr (A1–C2), tags[] (темы), frequency_rank, status (verified / unverified) |
| `expression` | id, lang, text, cefr, tags[] (ситуации), audio_url, concept_ids[] |
| `concept` | id — независимый от языка смысл; не грубее самого точного языка |
| `translation` | id, target_type (sense/expression), target_id, lang, text, source (dictionary / llm / via_concept), verified |
| `example` | id, sense_id или expression_id, lang (изучаемый), text, highlight_range, audio_url |
| `example_translation` | example_id, lang (родной), text |
| `deck` | id, lang, native_lang, title, goal_tags[], type (official / user / shared), context (см. ниже) |
| `deck_item` | deck_id, item_type (sense/expression), item_id, cefr, position, importance |

### Контекст колоды (FR-49)

`deck.context` — JSON: `situation`, `roles` (кто ученик, кто собеседник, цели сторон), `register`, `branches[]` (ветки сценария), `culture_notes[]`. Целевой словарь — это `deck_item` с уровнями. Всё это позже станет входом для генерации LLM-уроков.

## Пользовательские данные (на устройстве, синхронизируются; всё с `user_id`)

| Сущность | Ключевые поля |
|---|---|
| `user_profile` | user_id, native_lang, target_lang, level, goals[], daily_minutes, new_per_day, waitlist_langs[] |
| `card` | id (UUID v7), user_id, item_type, item_id, source_deck_id, overrides (личные правки полей), state (new / learning / review / suspended / known), created_at, deleted_at |
| `review_log` | id, card_id, user_id, rating, reviewed_at, elapsed_ms, device_id — **только добавление** |
| `user_deck` | user_id, deck_id, added_at, fast_mode |

Состояние FSRS карточки (stability, difficulty, due) — производное: пересчитывается из `review_log`, хранится на устройстве как кеш.

## Уровни CEFR

Уровень — у `sense` и `expression`. Источники: CEFR-J (A1–B2), Octanove (C1–C2) — уровень у пары «слово + часть речи», поэтому он становится уровнем самого простого значения, остальные значения размечаются LLM и проверяются редактором. См. `data/README.md`.

Подбор новых слов «чуть выше уровня»: для B1 ~70% значений B2, ~20% пробелов B1, ~10% C1; для B2 — ~70% C1, ~20% пробелов B2, ~10% фразовых глаголов и выражений. Автокалибровка: 3+ «Знаю это слово» из 5 → уровень выше.

## Пакеты словаря на устройстве (FR-31)

| Пакет | Слов | На устройстве | Загрузка |
|---|---|---|---|
| Стартовый | 5 000 | ~4 МБ | Внутри приложения |
| Основной | 20 000 | ~15 МБ | В фоне после первого запуска (~5 МБ сжатый) |

Формат — SQLite. Обновления — дельтами. Аудио не входит в пакет: скачивается при первом прослушивании и кешируется.
