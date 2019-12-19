'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var electron = require('electron');

let screenshotContent;
let imgPath;
function reset() {
    screenshotContent = undefined;
    imgPath = undefined;
}
const initMain = (winContent) => {
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
                if (imgPath) {
                    event.sender.send('capturer-data', imgPath);
                    reset();
                }
                break;
        }
    });
    // 接收捕获桌面的信号
    electron.ipcMain.on('capturer-data', (e, message) => {
        if (screenshotContent && !screenshotContent.isDestroyed()) {
            screenshotContent.send('capturer-data', message);
            reset();
        }
        else
            imgPath = message;
    });
};

exports.initMain = initMain;
