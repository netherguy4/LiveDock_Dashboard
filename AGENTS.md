# AGENTS.md — LiveDock (monitoring-frontend)

Саморазмещаемый дашборд мониторинга серверов. Nuxt 4 SSR-приложение с Nitro-прокси до Go-бэкенда.

## Стек

| Категория | Технология |
|---|---|
| Фреймворк | Nuxt 4 (SSR включён) |
| UI | Vue 3.5, Composition API, `<script setup lang="ts">` |
| Язык | TypeScript 6.0 |
| Сборка | Vite (через Nuxt) |
| CSS | SCSS (sass-embedded), CSS custom properties, BEM |
| Стейт | Pinia 3 + pinia-plugin-persistedstate |
| Графики | Chart.js 4 + vue-chartjs 5 |
| Иконки | lucide-vue-next |
| Формы | vee-validate 4 + yup 1 |
| UI-примитивы | reka-ui 2, vue-sonner (тосты) |
| Утилиты | @vueuse/core |
| Линтинг | ESLint 10 (flat config) + @nuxt/eslint |
| Форматирование | Prettier 3.4 |
| Деплой | Vercel (Nitro preset) |
| Пакетный менеджер | Yarn 4.5.3 (node-modules linker) |

## Команды

```sh
yarn dev          # Запуск dev-сервера (--host, доступен по сети)
yarn build        # Production-сборка
yarn preview      # Превью production-сборки локально
yarn prod         # Запуск production-сервера напрямую
yarn generate     # Статическая генерация
yarn lint         # ESLint проверка
yarn lint:fix     # ESLint автофикс
yarn nuxt add     # Установка Nuxt-модуля
```

## Структура проекта

```
app/                    # Основной исходный код
  app.vue               # Корневой компонент: драйвер опроса, тосты, <NuxtPage>
  error.vue             # Страница ошибок (404, 500)
  assets/styles/        # SCSS стили
    base/               # reset, шрифты, токены, переходы, блоки
    utils/              # SCSS переменные, mixins, breakpoints
  components/           # Vue-компоненты, 4 уровня:
    blocks/             # Крупные составные блоки (DashboardHero, MetricsGrid…)
    cards/              # Карточки (StatCard, ContainerRow…)
    layout/             # Оболочка приложения (AppHeader, ThemeToggle, NavLinks…)
    ui/                 # Базовые примитивы (BaseButton, BaseCard, BaseBadge…)
  composables/          # Переиспользуемые функции (useApi, useTheme, useSparkline…)
  configs/              # Конфигурация (routes, polling)
  constants/            # Константы (статусы, ключи storage, пороги)
  layouts/              # Nuxt-лейауты (default.vue, auth.vue)
  middleware/           # Middleware маршрутов (auth.global.ts)
  pages/                # Файловый роутинг
    index.vue           # Дашборд (/)
    login.vue           # Логин (/login)
    containers/         # /containers, /containers/[name]
  plugins/              # Nuxt-плагины (Chart.js, color mode, Pinia persist)
  stores/               # Pinia-сторы (auth, containers, hosts, logs, metrics, requests, ui)
  utils/                # Утилиты (форматирование, схемы валидации)

server/                 # Nitro-бэкенд
  api/
    [...path].ts        # Прокси: /api/* → Go-бэкенд
    login.post.ts       # POST /api/login — сессионная аутентификация
    logout.post.ts      # POST /api/logout — сброс сессии
    me.get.ts           # GET /api/me — проверка статуса аутентификации
  middleware/
    auth.ts             # Серверный auth guard (проверка сессионной cookie)
  utils/
    session.ts          # HMAC-подписанная сессия

public/                 # Статические файлы (favicon.svg, robots.txt)
```

## Архитектура

### Поток данных

```
Браузер → Nuxt SSR (Nitro) → Go-бэкенд API
            ↑ Bearer-токен API_TOKEN
            ↑ Заголовки X-Mon-Url, X-Mon-Token для мультихостовой маршрутизации
```

- **Единый API-слой**: `useApi()` (в `app/composables/useApi.ts`) — обёртка над `$fetch`, все типизированные ответы там же.
- **Драйвер опроса**: живёт в `app.vue` — центральный таймер, дёргает обновления сторов через `actions.refresh*()`.
- **Страницы только рендерят**, никогда не инициируют загрузку данных самостоятельно.

### Стейт-менеджмент (Pinia)

7 доменных сторов, все на Options API:

| Стор | Назначение |
|---|---|
| `auth` | Сессия, логин/логаут |
| `containers` | Статусы контейнеров, persist |
| `hosts` | Информация о хостах |
| `logs` | Логи контейнеров |
| `metrics` | Метрики системы (CPU, память, диск, сеть) |
| `requests` | HTTP-запросы/статистика |
| `ui` | Настройки UI (тема, раскрытие сайдбара), persist |

Persist: `ui.store` и `containers.store` используют `pinia-plugin-persistedstate` с выборочным сохранением ключей.

### Роутинг и аутентификация

- **Файловый роутинг** в `app/pages/`
- **Глобальный middleware** (`auth.global.ts`) — срабатывает при каждой клиентской навигации, проверяет `auth.store.isAuthenticated`
- **Серверный middleware** (`server/middleware/auth.ts`) — проверяет сессионные куки на стороне сервера
- Публичные пути: `/login`, `/api/login`, `/api/logout`, `/api/me`, статические файлы

### Стилизация

- **CSS custom properties** для тем (светлая/тёмная через `.theme--dark` на `<html>`)
- **SCSS переменные** для нетематизируемых значений (z-index, переходы, шрифты)
- **Mobile-first** breakpoints: sm(640), md(768), lg(1024), xl(1280), 2xl(1536)
- Глобальный prepend SCSS: `@use` для `_variables.scss`, `_mixins.scss`, `_breakpoints.scss`
- **BEM-нейминг**: `.block__element--modifier`

## Конвенции кода

### Именование

- **Компоненты**: PascalCase `.vue`, путь не используется как префикс (настройка `pathPrefix: false`)
- **Сторы**: `*.store.ts`
- **Конфиги**: `*.config.ts`
- **Схемы валидации**: `*.schema.ts`
- **Composables**: `use*.ts`
- **Константы**: PascalCase для значений, `as const`

### Код-стайл (Prettier + ESLint)

- Без точек с запятой, одинарные кавычки
- Висячие запятые во всех конструкциях
- Длина строки 100, отступ 2 пробела
- `<script setup lang="ts">` во всех компонентах
- Без JSDoc/комментариев без явного запроса
- Обработка ошибок: `catch (e: unknown)` → `e instanceof Error ? e.message : String(e)`
- `no-console` — warn (разрешены `.warn`, `.error`)
- `@typescript-eslint/no-explicit-any` — warn
- `vue/multi-word-component-names` — off

### Работа с SCSS

- Никаких `@import` — только `@use`
- Auto-prepend глобальных утилит не требует ручных импортов переменных/mixin'ов в компонентах

## Переменные окружения

См. `.env.example`:

| Переменная | Назначение |
|---|---|
| `BACKEND_URL` | URL Go-бэкенда |
| `API_TOKEN` | Bearer-токен для API |
| `LOGIN` | Логин (по умолчанию `admin`) |
| `PASSWORD` | Пароль |
| `SESSION_SECRET` | Секрет для HMAC-подписи сессии |

| `NITRO_PRESET` | Пресет деплоя (по умолчанию `vercel`) |

## Продуктовые принципы

- **Сигнал важнее декора.** Каждый видимый элемент должен сокращать время до диагноза.
- **Спокойная уверенность.** Интерфейс должен ощущаться как подконтрольная система — не постоянные алерты.
- **Плотность с дыханием.** Много информации без перегрузки — жёсткая иерархия, щедрые отступы на уровне секций.
- **Предсказуемый лейаут.** Пользователь смотрит на дашборд часто — элементы не должны перемещаться.
- **Тёмная и светлая темы равноправны.**

## Важные замечания для ИИ-ассистента

1. **README.md отсутствует.** Продуктовая документация в `PRODUCT.md`.
2. **Тестов нет.** Нет vitest, нет `*.test.*` или `*.spec.*` файлов.
3. **Без комментариев.** Не добавляй JSDoc и комментарии в код, если пользователь явно не попросит.
4. **Не меняй стиль кода.** Следуй существующим паттернам: `<script setup lang="ts">`, Pinia Options API, BEM для стилей, `useApi()` для запросов.
5. **Не трогай `.claude/`** — она в `.gitignore`, это локальные настройки Claude Code.
6. **После изменений** запускай `yarn lint` для проверки.
