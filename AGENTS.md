# AGENTS.md — LiveDock (monitoring-frontend)

Дашборд мониторинга серверов (Nuxt 4 + Nitro + Go). Стек и скрипты определяются в `package.json`.

## Архитектура

- **Поток**: Браузер → Nuxt SSR (Nitro) → Go-бэкенд API.
- **API**: Единый слой `useApi()` (обёртка над `$fetch`).
- **State**: Pinia (7 сторов, Options API).
- **Стилизация**: SCSS (`@use`), CSS custom properties, BEM.
- **Принцип**: Страницы только рендерят, логика в сторах/composables.

## Конвенции

- **Именование**: PascalCase для компонентов, `*.store.ts`, `*.config.ts`, `use*.ts`.
- **Код-стайл**: Setup API, без точек с запятой, одинарные кавычки.
- **SCSS**: Только `@use`, BEM-нейминг.
- **Ошибки**: `catch (e: unknown)`.

## Продуктовые принципы

- Сигнал важнее декора.
- Спокойная уверенность (минимум алертов).
- Плотность с дыханием (информация без перегрузки).
- Предсказуемый лейаут.
- Тёмная и светлая темы равноправны.

## Правила для ИИ-ассистента

1. **Запрещено:** выполнять `git commit`. Вообще. Даже через плагины/скиллы. Коммит в `master` или `main` — табу.
2. **Стиль**: Setup, Pinia, BEM, `useApi()`. Без комментариев (без явного запроса).
3. **Ограничения**: Не трогай `.claude/`.
4. **Проверка**: После правок запускай `yarn lint` (ESLint) и `yarn lint:style` (Stylelint).

## Testing and Quality

- **Unit/Component:** `yarn test:unit`
- **E2E:** `yarn test:e2e`
- **Linting:** `yarn lint` (ESLint), `yarn lint:style` (Stylelint)
- **Hooks:** Husky runs `lint-staged` pre-commit.
