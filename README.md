# pms
Base PMS project

# Installation

**Checkout this repo (~2s):**
```sh
git clone https://github.com/nin-jin/pms.git ./pms && cd pms
```

# Develeper server

**Install node modules**
```sh
npm install
```

**Build dev server and start that (first ~1m, second ~10s):**
```sh
npm start
```

**Open simple ToDoMVC application (first ~4s, second ~0.3s):**

```sh
start http://localhost/mol/app/todomvc/
```

**Open $mol demos application (first ~11s, second ~0.5s):**

```sh
start http://localhost/mol/
```

# Manual building

* Execute `npm start mol/app/todomvc` to build ToDoMVC application (~13s).
* Execute `npm start mol` to build $mol demos application (~15s).

# Custom package

1. Create dir for your namespace. `my` in example.
2. Create dir for your module. `my/alert` in example.
3. Create module source file. `my/alert/alert.ts` with content `var $my_alert = msg => alert( msg )` in example.
4. Create dir for your application module. `my/app` in example.
5. Create application source file. `my/app/app.ts` with content `$my_alert( 'Hello, World!' )` in example.
6. Create application web entry point. `my/app/index.html` with content `<script src="-/web.js"></script><script src="-/web.test.js"></script>` in example.
7. Start developer server: `npm start`
8. Open your application. `http://localhost/my/app/` in example.
