"use strict";

const { app, BrowserWindow, session } = require("electron");
require("electron-reload")(__dirname, {
  electron: require("electron")
});

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      csp: "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    }
  });

  win.loadFile("src/render/index.html");

  win.webContents.openDevTools();

  win.on("closed", () => {
    win = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    creacreateWindow();
  }
});
