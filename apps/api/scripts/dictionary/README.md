# Конвейер словаря (T1.6)

Реализует этапы 1–4 `.claude/skills/dictionary-pipeline/SKILL.md` (сбор seed, отбор по темам, разбор на значения через LLM, валидация, выгрузка редактору) и отчёт о прогоне. Этапы 5–6 (импорт проверенного редактором, сборка пакетов SQLite) — отдельная задача, не реализованы здесь.

## Перед первым запуском

1. `OPENAI_API_KEY` — в `.env` в корне репозитория (см. `.env.example`) или в переменных окружения. Без него `run.ts` останавливается до вызова LLM. Скрипты сами не парсят `.env` (нет зависимости на `dotenv`) — `.env` подгружается флагом Node `--env-file-if-exists`, см. команды ниже и npm-скрипты `dictionary:*` в `package.json` (там флаг уже встроен).
2. `apps/api/scripts/dictionary/pricing.json` — добавьте цену модели, которую собираетесь использовать: `"<model>": { "inputPer1M": ..., "outputPer1M": ... }` ($ за 1M токенов). Без записи `report.ts`/`run.ts` упадут с понятной ошибкой (`MissingPriceError`) — стоимость не должна тихо посчитаться нулём.

### Выбор модели для пилота: `gpt-4o-mini`

Задача — структурированный JSON (JSON mode), не творческая генерация: разбить слово на значения, дать русский перевод 1–4 слова и короткий оригинальный пример. Это ближе к разметке/извлечению, чем к сложному рассуждению, поэтому дорогая топовая модель избыточна, а дешёвая mini-модель с хорошей поддержкой JSON-режима — разумный баланс, особенно учитывая, что на полном словаре (5000/20000 слов) стоимость будет расти линейно от количества слов. `gpt-4o-mini` — модель, широко используемая именно для такого класса задач (структурированное извлечение, короткие переводы/примеры), с нативной поддержкой `response_format: {type: "json_object"}` (используется в `lib/llm-client.ts`).

Цена в `pricing.json` ($0.15 / 1M input, $0.60 / 1M output) — цена `gpt-4o-mini`, действующая на 2026 год; подтверждена владельцем продукта веб-поиском (несколько независимых источников) при принятии решения о пилоте.

3. `data/cefr_seed.csv` уже собран (`npm run dictionary:build-seed` — пересобрать не нужно, пока не меняется источник в `data/vendor/cefr-j/`).

## Команды

```bash
cd apps/api

# Пересобрать data/cefr_seed.csv из data/vendor/cefr-j/ (редко, вручную)
npm run dictionary:build-seed

# Пробный прогон на небольшой выборке — сначала всегда так, до трат на полные 500 слов
npm run dictionary:run -- \
  --topics=restaurant,hotel,airport,directions \
  --model=<model> \
  --run-id=2026-w1-pilot \
  --limit=25

# Полный прогон приёмки T1.6 (500 слов по темам) — только после подтверждения по пилоту
npm run dictionary:run -- \
  --topics=restaurant,hotel,airport,directions \
  --model=<model> \
  --run-id=2026-w1-full \
  --limit=500
```

Без npm-обёртки (эквивалентно): `node --env-file-if-exists=../../.env --import tsx scripts/dictionary/run.ts --topics=... --model=... --run-id=... --limit=...`.

`run.ts` — оркестратор всех шагов (отбор → разбор → валидация → выгрузка → отчёт). Каждый шаг также запускается отдельно (`select-topic.ts`, `parse-senses.ts`, `validate.ts`, `export-editor.ts`, `report.ts` — у каждого свой `--run-id` и CLI-справка при запуске без аргументов), например для повторной валидации без пересчёта LLM.

Результаты — `data/runs/<run-id>/` (см. `data/README.md`). Повторный запуск `parse-senses`/`run` с тем же `--run-id` переиспользует кеш `raw/` — уже посчитанные слова не пересчитываются и не переоплачиваются.

## Формат данных

- `data/cefr_seed.csv`: `headword,pos,cefr,source,license`.
- `data/runs/<id>/selection.csv`: `headword,pos,cefr,topic,in_seed` — слова с `in_seed=false` не имеют лицензированного уровня и дальше по конвейеру не идут.
- `data/runs/<id>/senses.json` / `senses.valid.json`: массив `DraftSense` (`apps/api/scripts/dictionary/schema.ts`) — `senseId, lemma, pos, ipa, cefr, cefrSource (cefr-j|llm), tags, ru, example, highlight, exampleRu, source: 'llm', status: 'unverified', model, runId`.
- `data/runs/<id>/editor.csv`: `sense_id, lemma, pos, cefr, tags, ru, example, example_ru, source, status, editor_note` — редактор меняет `ru, example, example_ru, cefr, tags, status (verified/rejected)` и пишет `editor_note`.
- `data/runs/<id>/rejected.json`: записи, не прошедшие валидацию, с причиной (`reason`) — не идут в CSV редактору.
- `data/runs/<id>/report.json` / `report.md`: слова/значения на входе-выходе, ошибки по причинам, время, токены, стоимость, стоимость на 1000 слов, экстраполяция на 5000/20000.

Полное описание правил — `.claude/skills/dictionary-pipeline/SKILL.md`; промпт разбора на значения — дословно `.claude/skills/dictionary-pipeline/references/prompt.md`; список тегов — `.claude/skills/dictionary-pipeline/references/tags.md` (читается кодом напрямую, `lib/tags.ts`, отдельно не дублируется).
