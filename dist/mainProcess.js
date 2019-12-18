'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var electron = require('electron');

const initMain = (winContent) => {
    let screenshotContent;
    // 接收截图工具信号
    electron.ipcMain.on('screenshot-page', (event, message) => {
        screenshotContent = event.sender;
        switch (message.type) {
            case 'close':
                winContent.send('quit-cut');
                break;
            case 'save':
                // winContent.send('screenshot-success', message);
                break;
            case 'success':
                winContent.send('screenshot-success', message);
                break;
            case 'ready':
                winContent.send('screenshot-ready', message);
                break;
        }
    });
    // 接收捕获桌面的信号
    electron.ipcMain.on('capturer-page', (e, message) => {
        var _a, _b;
        switch (message.type) {
            case 'success':
                if (!((_a = screenshotContent) === null || _a === void 0 ? void 0 : _a.isDestroyed()))
                    (_b = screenshotContent) === null || _b === void 0 ? void 0 : _b.send('capturer-data', message.data);
                const win = electron.BrowserWindow.fromWebContents(e.sender);
                if (!win.isDestroyed())
                    win.close();
                console.log(electron.BrowserWindow.getAllWindows().map(w => !w.isDestroyed()).length);
                break;
        }
    });
};

exports.initMain = initMain;
