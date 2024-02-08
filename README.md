# MAM

**M**am owns language-**A**gnostic **M**odules.
This is the base **MAM** project.

# Articles

- [MAM: сборка фронтенда без боли](https://habhub.hyoo.ru/#!author=nin-jin/repo=HabHub/article=18) (in Russian, see [automatic English translation](https://translate.google.com/translate?hl=ru&sl=ru&tl=en&u=https://habhub.hyoo.ru/#!author=nin-jin/repo=HabHub/article=18))
- [Step-by-step tutorial](https://github.com/hyoo-ru/HabHub/issues/4) (in Russian, see [automatic English translation](https://translate.google.com/translate?hl=ru&sl=ru&tl=en&u=https://github.com/hyoo-ru/HabHub/issues/4))

# Features

* **Agnostic modules.** Module is a directory with the mixed source files (JS, TS, CSS, JSON, HTML, Tree, images, etc).
* **Automatic dependency tracking.** You don't need import/export - simply use the namespaced names according to the directory structure, like `$mol_button_major` / `$jin.time.moment` in `*.JAM.JS`/`*.TS` or `--mol_theme_back` / `[mol_page_title]` / `.my-header-avatar` in `*.CSS`.
* **Development server with automatic bundling on request**. Will be bundled only if you use it.
* **Build any module as standalone bundle**. You can develop thousand of modules in one project.
* **Cordova project generation**. Simply add `config.xml` to the module, and `-cordova` dir with the cordova project will be generated.

# Cloud usage

[![Gitpod Online Dev Workspace](https://img.shields.io/badge/Gitpod-Online--Dev--Workspace-blue?logo=gitpod)](https://gitpod.io/#https://github.com/hyoo-ru/mam)


# Installation

**Checkout this repo (~2s):**

```sh
git clone https://github.com/hyoo-ru/mam.git ./mam && cd mam
```

## Linux limits

`$mol_build` and typescript uses inotify by default on Linux to monitor directories for changes. It's not uncommon to encounter a system limit on the number of files you can monitor.

/etc/sysctl.d/20-watch.conf

```
fs.inotify.max_user_watches=524288
fs.file-max=500000
```

# Development server

**Install node modules and build dev server from actual sources**

```sh
npm install
```

**Start dev server:**

```sh
npm start
```

**Open simple $mol based ToDoMVC application:**

```sh
start http://localhost:9080/hyoo/todomvc/-/test.html
```

# Manual build

* Execute `npm start hyoo/todomvc` to build standalone ToDoMVC application at `hyoo/todomvc/-`.
* Execute `npm start mol/regexp` to build standalone $mol_regexp library at `mol/regexp/-`.

# NPM Integration

## Publish to NPM

```sh
npm start mol/regexp
npm publish mol/regexp/-
```

## Usage from NPM

### Import to CJS

```js
const { $mol_regexp: RE } = require( 'mol_regexp' )
```

### Import to ESM

```js
import { $mol_regexp as RE } from 'mol_regexp'
```

### NodeJS dependencies

Using `$node` namespace you can auto-install and dynamically lazy load any NPM packages:

```js
const isOdd = $node['is-odd']( '123' )
```

### Bundling NPM dependencies

If possible, try to use the existing MAM ecosystem implementations. You can bundle the NPM packages as well via an adapter like:

```ts
// lib/ramda/ramda.ts
namespace $ {
	export let $lib_ramda = require('ramda/src/index.js') as typeof import('ramda')
}
```

# Custom package

[Video tutorial](https://www.youtube.com/watch?v=PyK3if5sgN0)

1. Create dir for your namespace: `my` in example.
2. Create dir for your module: `my/alert` in example.
3. Create module source file: `my/alert/alert.ts` with content `function $my_alert( msg : string ) { alert( msg ) }` in example.
4. Create dir for your application module: `my/app` in example.
5. Create application source file: `my/app/app.ts` with content `$my_alert( 'Hello, World!' )` in example.
6. Create application web entry point: `my/app/index.html` with content `<script src="-/web.js"></script>` in example.
7. Start development server: `npm start`
8. Open your application: `http://localhost:9080/my/app/-/test.html` in example.

# MAM based projects

- See https://github.com/hyoo-ru?q=hyoo.ru

