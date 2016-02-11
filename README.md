# pms-stub
Simple PMS project

# Installation

1. Checkout this repo
2. Execute `npm install` to install builder

# Building

1. Execute `npm start build mol` to download [mol](https://github.com/nin-jin/mol) project and build them.
2. Or execute `npm start build mol/app/todo` to build only todo demo application.

# Serving

1. Execute `npm start serve` to serve this repo.
2. Open `http://localhost/mol/` to view all mol(ecule)s.
2. Open `http://localhost/mol/app/todo/` to view simple todo application.

# Custom project

1. Create dir for your namespace. `my` in example.
2. Create dir for your module. `my/alert` in example.
3. Create module source file. `my/alert/alert.ts` with content `var $my_alert = msg => alert( msg )` in example.
4. Create dir for your application module. `my/app` in example.
5. Create application source file. `my/app/app.ts` with content `$my_alert( 'Hello, World!' )` in example.
6. Build your application. `npm start build my/app` in example.
7. Create application web entry point. `my/app/index.html` with content `<script src="-mix/index.env=web.stage=test.js"></script>` in example.
8. Start static web server. `npm start serve` in example.
9. Open your application. `http://localhost/my/app/` in example.
