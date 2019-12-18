const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { initMain } = require('../dist/index');

app.on('ready', () => {
  const win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    }
  });
  win.loadFile(path.resolve(__dirname, './renderer.html'));
  win.webContents.openDevTools();
  initMain(win.webContents);
  Menu.setApplicationMenu(Menu.buildFromTemplate([{
    label: '编辑',
    submenu: [
      {
        accelerator: 'Esc',
        label: '取消截图',
        click: () => {
          win.webContents.send('quit-cut', BrowserWindow.getAllWindows().map(w => w.id));
        },
      },
    ],
  }]));
})
