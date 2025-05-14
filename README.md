<p align="center">
<img src="https://raw.githubusercontent.com/dariuszdawidowski/total-popup/main/total-popup-logo.png">
</p>
<h1 align="center">
Total Popup
</h1>
<p align="center">
JavaScript popup library. 
</p>
<p align="center">
v0.6.4
</p>

[![build](https://github.com/dariuszdawidowski/total-popup/actions/workflows/build.yml/badge.svg)](https://github.com/dariuszdawidowski/total-popup/actions/workflows/build.yml)
[![npm](https://img.shields.io/npm/v/total-popup)](https://www.npmjs.com/package/total-popup)
[![license](https://img.shields.io/github/license/dariuszdawidowski/total-popup?color=9cf)](./LICENSE)

# About

Allows to open resizable and draggable popup window with optional tabs.

Minimalistic, clean, simple and powerful.

No dependencies, only demo depends on external Lorem Ipsum generator.

# Features

- Actions: drag, resize, minimize, maximize
- Optional tabs
- Vanilla JavaScript/ES8
- No dependencies

# Usage

Quick start:

```javascript
const popup = new TotalPopupWindow({
    content: 'Hello World'
});
```

For further information look into 'examples/' directory for self-explanatory code.

# Build minified bundle file

```bash
npm install
npm run build
```
Note: This is browser-centric vanilla JavaScript library, npm is only used to minify and bundle files.

# Load from CDN

https://unpkg.com/total-popup@latest/dist/total-popup.js

# Credits

Dariusz Dawidowski\
Maksym Godovanetz\
Third party library "Foobar ipsum" is used for demo https://www.npmjs.com/package/foobar-ipsum