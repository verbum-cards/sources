---
name: weekly-report
description: "Еженедельный отчёт о прогрессе проекта Cards против плана на 12 недель — что сделано за неделю, что в работе, что ждёт решений владельца, риски для контрольных точек M1–M4 и беты. Публикуется отдельным issue с меткой report. Используй для еженедельного отчёта, сводки по проекту, «как у нас дела», «успеваем ли к бете»."
allowed-tools: Read, Grep, Glob, Bash(gh issue:*), Bash(gh pr:*), Bash(gh api:*), Bash(gh label:*)
---

# Еженедельный отчёт

## 1. Данные

```bash
# milestones «Неделя NN»: открытые и закрытые задачи, сроки
gh api repos/{owner}/{repo}/milestones?state=all --paginate --jq '.[] | {title, open_issues, closed_issues, due_on, state}'
# закрыто за 7 дней
gh issue list --state closed --search "closed:>=$(date -u -d '7 days ago' +%F) -label:report" --json number,title,labels,milestone
# в работе и на ревью
gh pr list --state open --json number,title,labels,createdAt,isDraft
# ждут владельца продукта
gh issue list --state open --label needs-info --json number,title,updatedAt
gh issue list --state open --label triage:done --json number,title,labels,milestone   # ждут метку ready
gh issue list --state open --label needs-design --json number,title,comments
gh issue list --state open --label type:owner --json number,title,milestone
# заблокированные и критичные
gh issue list --state open --label blocked --json number,title
gh issue list --state open --label type:bug --label p1 --json number,title
```

Прочитай `docs/plan.md`: какая сейчас неделя (по milestone с ближайшим будущим сроком) и какие контрольные точки впереди.

## 2. Оценка

- Для текущей недели: доля закрытых задач `p1` в её milestone.
- Для ближайшей контрольной точки (M1–M4 или старт беты): какие задачи на критическом пути ещё открыты; успеваем / под риском / не успеваем.
- PR, которые ждут merge дольше 2 дней, и `needs-info`, которые ждут ответа дольше 2 дней, — отдельным списком: это главное, что тормозит проект.
- Задачи владельца (`type:owner`) с прошедшим сроком — тоже риск (например, аккаунты магазинов к неделе 11).

## 3. Публикация

Создай issue с меткой `report` (создай метку, если её нет):

```bash
gh issue create --title "Отчёт: неделя NN ($(date -u +%d.%m))" --label report --body-file <файл>
```

Формат:

```markdown
**Итог недели:** одна фраза — успеваем / есть риск / отстаём.

**Сделано** (N задач)
- #… …

**В работе и на ревью**
- PR #… … — ждёт: ревью / merge / правки

**Ждёт ваших решений**
- #… нужен ответ (ждёт N дней)
- #… готово к работе — поставить `ready`?
- #… план архитектора — согласовать
- PR #… — проверить на телефоне и влить

**Контрольная точка:** M… — неделя NN. Статус: … Критический путь: #…, #…

**Риски**
- …

**Предложение на следующую неделю:** 3–5 задач, которые стоит взять в работу первыми, и почему.
```

Коротко, по-русски, только факты из GitHub и документов. Не меняй метки и статусы задач — только создай отчёт.
