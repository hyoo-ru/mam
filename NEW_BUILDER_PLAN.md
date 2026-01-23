# План рефакторинга MAM Builder

## Цель

Переписать сборщик MAM проектов, декомпозировав его на модули для упрощения поддержки и расширения.

## Критерий успеха

```bash
# 1. Старым сборщиком собрать новый
npm start mam/start

# 2. Новым собрать $hyoo_mol
node mam/start/-/node.js hyoo/mol
```

Если `$hyoo_mol` собирается и работает — задача выполнена.

---

## Исходные данные

### Текущий билдер (старый)

- **Расположение:** `mol/build/build.node.ts` (~1700 строк)
- **Архитектура:** Монолитная, всё в одном классе `$mol_build`
- **Проблемы:** Сложно поддерживать и расширять

### Наработки (ветка `new-builder-dev`)

Модульная структура в `mam/`:

```
mam/
├── _mam.drawio.svg     # Диаграмма архитектуры
├── readme.md
├── root/               # $mam_root - корень MAM проекта
│   └── root.ts
├── package/            # $mam_package - сборка пакета
│   └── package.ts
├── slice/              # Срезы (web/node, prod/test)
│   ├── slice.ts        # $mam_slice - базовый класс
│   ├── slice_web.ts    # $mam_slice_web, $mam_slice_web_prod, $mam_slice_web_test
│   └── slice_node.ts   # $mam_slice_node, $mam_slice_node_prod, $mam_slice_node_test
├── source/             # Извлечение зависимостей из исходников
│   ├── source.ts       # $mam_source - базовый класс
│   ├── source_dir.ts
│   ├── source_ts.ts
│   ├── source_js.ts
│   ├── source_css.ts
│   ├── source_glsl.ts
│   ├── source_meta_tree.ts
│   ├── source_view_ts.ts
│   ├── source_view_tree_ts.ts
│   ├── refs/           # Утилиты для извлечения ссылок
│   └── remarks/        # Утилиты для комментариев
├── convert/            # Транспиляция исходников
│   ├── convert.ts      # $mam_convert - базовый класс
│   ├── convert_ts.ts
│   ├── convert_view_tree.ts
│   ├── convert_meta_tree.ts
│   ├── convert_css.ts
│   ├── convert_glsl.ts
│   └── convert_bin.ts
├── bundle/             # Генерация бандлов
│   ├── bundle.ts       # $mam_bundle - базовый класс
│   ├── bundle_js.ts
│   ├── bundle_mjs.ts
│   ├── bundle_css.ts
│   ├── bundle_dts.ts
│   ├── bundle_locale.ts
│   ├── bundle_index_html.ts
│   ├── bundle_test_html.ts
│   ├── bundle_test_js.ts
│   ├── bundle_audit_js.ts
│   ├── bundle_view_tree.ts
│   ├── bundle_meta_tree.ts
│   ├── bundle_meta.ts
│   ├── bundle_package_json.ts
│   ├── bundle_readme.ts
│   └── bundle_files.ts
├── start/              # Точка входа
│   └── start.node.ts
└── test/               # Тестовый проект
    ├── root/
    ├── leaf/
    ├── branch/
    ├── cycle/
    └── assert/
```

---

## Архитектура нового билдера

### Типы плагинов

| Тип         | Класс          | Роль                                       |
| ----------- | -------------- | ------------------------------------------ |
| **Source**  | `$mam_source`  | Извлечение зависимостей из исходников      |
| **Convert** | `$mam_convert` | Транспиляция (TS→JS, view.tree→JS, CSS→JS) |
| **Bundle**  | `$mam_bundle`  | Объединение файлов в бандлы                |

### Ключевые сущности

| Сущность    | Класс          | Описание                                      |
| ----------- | -------------- | --------------------------------------------- |
| **Root**    | `$mam_root`    | Корень проекта, управляет TS-опциями          |
| **Package** | `$mam_package` | Пакет для сборки, обеспечивает ensure         |
| **Slice**   | `$mam_slice`   | Срез: фильтрация файлов (web/node, prod/test) |

### Поток данных

```
$mam_root
    │
    ▼
$mam_package.ensure() ─── git clone/pull если нужно
    │
    ▼
$mam_slice.graph() ─┬─ $mam_source.deps()     ─── зависимости
                    └─ $mam_convert.generated() ── сгенерированные файлы
    │
    ▼
$mam_slice.files() ─── отсортированный граф
    │
    ▼
$mam_bundle.generated() ─── генерация бандлов
```

---

## Статус наработок

### ✅ Реализовано (в new-builder-dev)

- [x] Базовые классы: `$mam_root`, `$mam_package`, `$mam_slice`, `$mam_source`, `$mam_convert`, `$mam_bundle`
- [x] Слайсы: web_prod, web_test, node_prod, node_test
- [x] Sources: dir, ts, js, css, glsl, meta_tree, view_ts, view_tree_ts
- [x] Converts: ts, view_tree, meta_tree, css, glsl, bin
- [x] Bundles: js, mjs, css, dts, locale, index_html, test_html, test_js, audit_js, view_tree, meta_tree, meta, package_json, readme, files
- [x] Граф зависимостей с разрывом циклов
- [x] Точка входа `mam/start`
- [x] Тестовый проект `mam/test`
- [x] Сборка самого себя работает: `npm start mam/start`

### ❌ Не работает / Не проверено

- [ ] Сборка `hyoo/mol` — основной критерий
- [ ] Возможно не все edge cases обработаны
- [ ] Возможно не все типы файлов поддержаны
- [ ] Server mode (HTTP сервер для разработки)

---

## План работ

### Фаза 0: Подготовка (текущий шаг)

- [x] Изучить текущий билдер `mol/build`
- [x] Изучить наработки `new-builder-dev`
- [x] Составить план
- [ ] Перенести наработки из `new-builder-dev` в текущую ветку `new_builder`

### Фаза 1: Базовая сборка hyoo/mol

1. [ ] Перенести файлы из `new-builder-dev`
2. [ ] Собрать новый билдер старым: `npm start mam/start`
3. [ ] Попробовать собрать `hyoo/mol`: `node mam/start/-/node.js hyoo/mol`
4. [ ] Исправить ошибки до успешной сборки
5. [ ] Проверить работоспособность собранного `hyoo/mol`

### Фаза 2: Полная функциональность

1. [ ] Сравнить выходные файлы старого и нового билдера
2. [ ] Добавить недостающие бандлы (если есть)
3. [ ] Поддержка всех типов файлов из старого билдера
4. [ ] Cordova сборка (если нужна)

### Фаза 3: Server mode

1. [ ] Реализовать HTTP сервер для dev-режима
2. [ ] Hot-reload / watch mode
3. [ ] Lazy compilation по запросу

### Фаза 4: Оптимизации

1. [ ] Tree-shaking для NPM модулей
2. [ ] Упростить использование ESM/CJS
3. [ ] Кэширование

---

## Команды для работы

```bash
# Перейти в директорию проекта
cd dev_mam

# Текущая ветка
git branch  # должна быть new_builder

# Посмотреть наработки из new-builder-dev
git show new-builder-dev:mam/root/root.ts

# Перенести все файлы mam/ из new-builder-dev
git checkout new-builder-dev -- mam/

# Собрать новый билдер старым
npm start mam/start

# Собрать hyoo/mol новым билдером
node mam/start/-/node.js hyoo/mol

# Сравнить результаты
diff -r mol/-/ hyoo/mol/-/
```

---

## Соглашения по коду (MAM Style)

- Namespace: `namespace $ { ... }`
- Классы: `$mam_*`, `$mol_*`
- Декораторы: `@$mol_mem`, `@$mol_mem_key`, `@$mol_action`
- Константы через `$mol_const()`
- Реактивность через `$mol_wire` / `$mol_mem`
- Файлы: `name.ts`, `name.node.ts`, `name.web.ts`, `name.test.ts`

---

## Заметки

- **Реактивность**: Все вычисления кешируются через `@$mol_mem`
- **Граф зависимостей**: `$mol_graph` с разрывом циклов через приоритеты
- **Файловая система**: Реактивная через `$mol_file`
- **Ensure**: Автоматический git clone/pull при отсутствии пакета
