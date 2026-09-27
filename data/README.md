# data/ — конвейер словаря (T1.6)

См. `.claude/skills/dictionary-pipeline/SKILL.md` для полного описания этапов и `apps/api/scripts/dictionary/README.md` для того, как запускать скрипты.

## Структура

- `vendor/cefr-j/` — исходные файлы источников CEFR, скопированы без изменений; происхождение и лицензии — `vendor/cefr-j/SOURCE.md`.
- `cefr_seed.csv` — исходный список слов для конвейера (headword, pos, cefr, source, license). Собирается из `vendor/cefr-j/` скриптом `apps/api/scripts/dictionary/build-seed.ts` (детерминированно, без сети — файл уже скачан и зафиксирован).
- `runs/<run_id>/` — артефакты одного прогона конвейера:
  - `selection.csv` — отбор слов по темам (headword, pos, cefr, topic, in_seed);
  - `senses.json`, `expressions.json` — черновики значений/выражений от LLM (`status: unverified`);
  - `raw/` — сырые ответы LLM по каждому слову, кеш для ретраев (не коммитится, см. `.gitignore`);
  - `senses.valid.json`, `rejected.json` — результат валидации;
  - `editor.csv` — выгрузка для редактора;
  - `report.json`, `report.md` — отчёт о прогоне (слова, значения, ошибки, токены, стоимость).

## Источники и лицензии

| Источник | Уровни | Условия | Статус в T1.6 |
| --- | --- | --- | --- |
| CEFR-J Vocabulary Profile 1.5 | A1–B2 | Бесплатно, включая коммерческое использование, при обязательном цитировании | Используется (`vendor/cefr-j/`) |
| Octanove Vocabulary Profile C1/C2 | C1–C2 | CC BY-SA 4.0 (авторство + те же условия для производных данных) | Отложено до сборки полного пакета (этап 6 SKILL.md) — решение владельца по лицензии ещё не принято |
| LLM (разбор на значения, примеры, переводы) | — | Собственные данные, `status: unverified` до проверки редактором | Используется |

Полный текст условий и обязательное цитирование CEFR-J — в `vendor/cefr-j/SOURCE.md`. Это относится к «документу по лицензиям», который отдельно ведёт владелец продукта (см. `docs/backlog/week-01.md`, раздел «Задачи владельца продукта»).

## data/senses_sample.json — почему его здесь нет

Формат черновика значения задокументирован схемой `apps/api/scripts/dictionary/schema.ts` (`DraftSenseSchema`, `DraftExpressionSchema`) и примером в `apps/api/scripts/dictionary/README.md`. Отдельный файл `data/senses_sample.json` с реальными словами сознательно не создан вручную: это контент, который должен появиться из настоящего прогона конвейера через LLM (с реальным учётом стоимости и токенов), а не быть придуман при реализации кода. Он появится в `data/runs/<run_id>/senses.json` после первого прогона, когда будет доступен `OPENAI_API_KEY`.
