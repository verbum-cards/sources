# Источник: CEFR-J Vocabulary Profile

- Репозиторий: https://github.com/openlanguageprofiles/olp-en-cefrj
- Коммит: `d4e45b75b38f27b30dfc5c44d8c571aec7e7092f` (2020-03-25, ветка `master`, последний коммит в репозитории на момент скачивания — 2026-09-27)
- Файл: `cefrj-vocabulary-profile-1.5.csv` (CEFR-J Vocabulary Profile, версия 1.5), скопирован без изменений
- Колонки исходного файла: `headword,pos,CEFR,CoreInventory 1,CoreInventory 2,Threshold`. Для `data/cefr_seed.csv` используются только `headword`, `pos`, `CEFR`

## Условия использования (дословно из README репозитория)

> CEFR-J vocabulary and grammar profile datasets can be used for research and commercial purposes with no charge, provided that you cite the dataset properly. The copyright belongs to Tono Laboratory at TUFS (Tokyo University of Foreign Studies). Neither CEFR-J nor Open Language Profiles is responsible or liable for any inaccuracies in the dataset or any damage resulting from using the dataset.

Бесплатно, включая коммерческое использование, при условии корректного цитирования. Правообладатель — Tono Laboratory, Tokyo University of Foreign Studies (TUFS).

## Обязательное цитирование

> The CEFR-J Wordlist Version 1.5. Compiled by Yukio Tono, Tokyo University of Foreign Studies. Retrieved from http://www.cefr-j.org/download.html on 1/20/2020.

Эту строку нужно указать там, где продукт публично перечисляет источники словарных данных (страница «О словаре»/лицензии — вне рамок T1.6, отдельная задача владельца «документ по лицензиям», см. `docs/backlog/week-01.md`).

## Octanove Vocabulary Profile C1/C2 (не используется в T1.6)

В том же репозитории и коммите лежит `octanove-vocabulary-profile-c1c2-1.0.csv` (headword, pos, CEFR, notes — уровни C1/C2, автор Octanove Labs). Он **не скопирован** в `data/vendor/` — по решению владельца T1.6 ограничен CEFR-J (A1–B2), пилот на 500 слов покрывает только эти уровни. Octanove нужен на этапе 6 конвейера (полный пакет 20 000 слов, где появятся C1–C2) — тогда его нужно будет скачать из того же репозитория и явно решить вопрос лицензии:

> The Octanove Vocabulary Profile for C1/C2 levels can be used under a Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0).

CC BY-SA 4.0 требует не только авторства, но и распространения производных данных (то есть части `cefr_seed.csv`, собранной из Octanove) на тех же условиях — это отдельное решение, а не техническая деталь, поэтому здесь только зафиксировано, не решено.
