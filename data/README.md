# data/

Исходные данные для конвейера словаря (skill `dictionary-pipeline`, этап 1
«Исходный список»). Не редактируется руками — файлы собираются скриптами из
`apps/api/scripts/dictionary/`.

## cefr_seed.csv

Список английских слов (лемма, часть речи, уровень CEFR) — сырьё для
следующего этапа конвейера (разбор на значения через LLM), не готовый
контент: без перевода, определения и примеров.

Собран `apps/api/scripts/dictionary/build-seed.ts` (`npm run build-seed --workspace=@cards/api`)
из двух источников одного GitHub-репозитория
[openlanguageprofiles/olp-en-cefrj](https://github.com/openlanguageprofiles/olp-en-cefrj):

| Источник (колонка `source`) | Уровни | Файл | Лицензия |
|---|---|---|---|
| `cefr-j` | A1–B2 | `cefrj-vocabulary-profile-1.5.csv` | Условия Tono Laboratory (TUFS) — исследовательское и коммерческое использование бесплатно, обязательна атрибуция |
| `octanove` | C1–C2 | `octanove-vocabulary-profile-c1c2-1.0.csv` | CC BY-SA 4.0 |

Октанов (C1–C2) собирается, но не используется до сборки полного пакета
словаря (стартовый пакет — 5 000 слов, см. skill `dictionary-pipeline`) —
уровень `expectedCefr` в `build-seed.ts` не про порядок использования, только
про то, какие значения `cefr` считать корректными для источника.

Колонки: `lemma, pos, ipaUs, ipaUk, cefr, source, license` (не `headword`, как
в самих исходниках — переименовано под поле, которое уже использует остальная
модель словаря в `apps/mobile`/`@cards/contracts`, чтобы дальше по конвейеру
не маппить одно имя поля в другое).

### ipaUs / ipaUk

Обе транскрипции — не от LLM, а из
[open-dict-data/ipa-dict](https://github.com/open-dict-data/ipa-dict) (MIT,
`apps/api/scripts/dictionary/ipa-dict.ts`, файлы `data/en_US.txt`/`en_UK.txt`
того репозитория) — уже готовый IPA, не ARPAbet, конвертировать самим не
нужно. Раньше (первая версия этого файла) IPA бралась из
[CMUdict](https://github.com/cmusphinx/cmudict) + своя таблица ARPAbet→IPA —
только американское произношение и с менее точной расстановкой ударения
(перед гласной, не перед слогом); переключились на ipa-dict, когда
понадобился ещё и британский вариант — он сразу даёт оба и точнее, решение
задокументировано в ADR-34 (`docs/decisions.md`).

Покрытие: US — 96% (9546 из 9895), UK — 92% (9102 из 9895). Слова, которых
нет в источнике, и фразы, где не нашлось хотя бы одно слово, — с пустым
полем, не с частичной/неверной транскрипцией.

Британский вариант (`ipaUk`) заметно ближе к стилю уже существующих
мок-слов (`apps/mobile/src/mocks/words.ts` — тоже британские: «wander» →
`ˈwɒndə`), чем американский: «wander» → `ipaUs: ˈwɑndɝ`, `ipaUk: wˈɒndɐ`.

Пересобрать: `cd apps/api && npm run build-seed`. Скрипт каждый раз тянет
файлы заново из GitHub — сеть обязательна, локального кэша исходников нет.

## cefr_seed_prepared.csv

Вход для этапа 2 конвейера («Разбор на значения через LLM») — один ряд на
пару (lemma, pos), не на строку `cefr_seed.csv`. Нужен, потому что одна и та
же пара встречается в источниках сразу на двух уровнях CEFR (117 случаев;
например «plane» — A1 у CEFR-J как «самолёт», C2 у Octanove как «плоскость» —
разные значения, не опечатка). Строки группы схлопываются в одну: `seedLevel`
— минимальный уровень группы, `ipaUs`/`ipaUk` — из строки с этим уровнем.
Один LLM-вызов на слово вместо одного на строку, без потери сложного значения
— промпт уже просит до 4 значений на слово, от частого к редкому, каждое со
своим level.

Собран `apps/api/scripts/dictionary/prepare-llm-inputs.ts`
(`npm run prepare-llm-inputs --workspace=@cards/api`) из уже готового
`cefr_seed.csv` — без сети, повторно данные не скачивает.

Колонки: `lemma, pos, seedLevel, ipaUs, ipaUk`.

9895 строк `cefr_seed.csv` → 9777 слов (118 схлопнутых дублей).

## decks/

Источник правды для официальных колод (ADR-35) — куратор (skill
deck-authoring) правит файлы здесь, не `apps/mobile/src/mocks/decks.ts`. Один
json на тему (`decks/firstSteps-deck.json`, `decks/travel.json`,
`decks/work.json`, ...) — имя файла ни на что не влияет, это только удобство
куратора: колода с несколькими `categories` может лежать в любом из файлов,
где её удобнее держать. Формат каждого файла — массив колод `{ id, lang,
nativeLang, title, categories, type, importance, context?, items }`, где
`items` — ссылки на слова по лемме (`{lemma, importance}`), не готовые данные
слова — само слово (перевод, примеры, IPA) берётся из `WORDS`
(`apps/mobile/src/mocks/words.ts`) на этапе сборки. `categories` — значения
`DeckCategorySchema` (`@cards/contracts`), колода может быть в нескольких
сразу; пустой массив — не категория (так у служебной «Проверки партий»,
`decks/review.json`, `REVIEW_DECK_ID`). `importance` (1–3) — порядок показа
колоды внутри категории (`decks.screen.tsx::CategoryDetail` сортирует по
убыванию), та же шкала, что у `items[].importance` (слова внутри колоды),
просто уровнем выше.

Заводя новую колоду, можно оставить `"id": ""` и `"context": {"situation":
"", "roles": {}, "register": "", "branches": [], "cultureNotes": []}` —
сборка сама проставит id (один раз, дальше он стабилен между сборками) и
уберёт context-заготовку, если он не заполнен (реальный сценарий с
ролями/register нужен не всем колодам, только диалоговым вроде «Ресторан»,
FR-49).

Собирается и проверяется `apps/api/scripts/dictionary/build-decks.ts`
(`npm run build-decks --workspace=@cards/api`) — без сети: схема (zod),
уникальность `id` по всем файлам сразу, что каждая `lemma` реально есть в
`WORDS`, что слово (itemId) не встречается в двух колодах сразу. Результат —
`apps/mobile/src/mocks/decks-data.json`, который `mocks/decks.ts` импортирует
и резолвит в полные `DeckWord` (`wordByLemma`). `apps/mobile` не может
импортировать `data/` напрямую — Metro резолвит модули только внутри своего
root, поэтому нужен этот промежуточный, уже провалидированный файл внутри
`apps/mobile/src`.

`apps/api/scripts/dictionary/generate-senses.ts` сам дописывает сюда леммы
успешно сгенерированных слов — в items `decks/review.json` — и пересобирает
`decks-data.json` тем же `buildDecksData()`.
