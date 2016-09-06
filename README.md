# pms-stub
Simple PMS project

# Installation

1. Checkout this repo

# Develeper server

1. Execute `npm start` to start dev server with auto building.
2. Open `http://localhost/mol/app/todomvc/` to view simple ToDoMVC application.
3. Open `http://localhost/mol/` to view all demos.

# Manual building

1. Execute `npm start mol/app/todomvc` to build ToDoMVC application.
2. Execute `npm start mol` to build all demos application.

# Custom project

1. Create dir for your namespace. `my` in example.
2. Create dir for your module. `my/alert` in example.
3. Create module source file. `my/alert/alert.ts` with content `var $my_alert = msg => alert( msg )` in example.
4. Create dir for your application module. `my/app` in example.
5. Create application source file. `my/app/app.ts` with content `$my_alert( 'Hello, World!' )` in example.
6. Create application web entry point. `my/app/index.html` with content `<script src="-/web.js"></script><script src="-/web.test.js"></script>` in example.
7. Start developer server: `npm start`
8. Open your application. `http://localhost/my/app/` in example.
