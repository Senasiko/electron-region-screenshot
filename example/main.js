const { app, BrowserWindow } = require('electron');
const path = require('path');
const { initMain } = require('../index');

app.on('ready', () => {
  const win = new BrowserWindow();
  win.loadFile(path.resolve(__dirname, './renderer.html'));
  win.webContents.openDevTools();
  initMain(win.webContents);
})
