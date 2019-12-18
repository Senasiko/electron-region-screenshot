'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var electron = require('electron');
var url = _interopDefault(require('url'));
var path = _interopDefault(require('path'));

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const { screen, BrowserWindow } = electron.remote;
const clipRenderUrl = './screenshot/screen.html';
const capturerUrl = './capturer/capturer.html';
const ipc = electron.ipcRenderer;
let win = null;
let _resolve = null;
let _reject = null;
/**
 * 创建截屏窗口
 */
function createChildWin(_url, opts) {
    let config = {
        alwaysOnTop: true,
        show: false,
        transparent: true,
        frame: false,
        movable: false,
        resizable: false,
        fullscreen: process.platform === 'win32' || undefined,
        enableLargerThanScreen: true,
        hasShadow: false,
        width: opts.width,
        height: opts.height,
        x: opts.x,
        y: opts.y,
        webPreferences: {
            nodeIntegration: true,
        }
    };
    config = Object.assign(config, opts);
    const _win = new BrowserWindow(config);
    _win.loadURL(url.format({
        pathname: path.join(__dirname, _url),
        protocol: 'file',
        slashes: true,
    }));
    if (process.platform === 'darwin') {
        // _win.webContents.openDevTools();
        // return _win
        _win.setAlwaysOnTop(true, 'screen-saver');
        _win.setVisibleOnAllWorkspaces(true);
        _win.setFullScreenable(false);
        _win.show();
        _win.setVisibleOnAllWorkspaces(false);
    }
    return _win;
}
function reset() {
    win && win.close();
    win = null;
}
function createCapturerWin() {
    const win = new BrowserWindow({
        show: false,
        frame: false,
        width: 0,
        height: 0,
        webPreferences: {
            nodeIntegration: true,
        }
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, capturerUrl),
        protocol: 'file',
        slashes: true,
    }));
    return win;
    // win.webContents.openDevTools()
}
// async function capturer(screen: Display) {
//   try {
//     const sources = await desktopCapturer.getSources(
//       {
//         types: ['screen'],
//         thumbnailSize: {
//           width: screen.size.width * screen.scaleFactor,
//           height: screen.size.height * screen.scaleFactor,
//         }
//       });
//     return sources.find(source => parseInt(source.display_id) === screen.id)?.thumbnail.toDataURL();
//   } catch (e) {
//     throw e
//   }
// }
function screenshot() {
    return __awaiter(this, void 0, void 0, function* () {
        if (_resolve && _reject) {
            console.log('has rr');
            return Promise.reject(new Error('is cutting'));
        }
        const promise = new Promise((resolve, reject) => {
            _resolve = resolve;
            _reject = reject;
        });
        if (!win || win.isDestroyed()) {
            const cursorPoint = screen.getCursorScreenPoint();
            const currentScreen = screen.getDisplayNearestPoint({ x: cursorPoint.x, y: cursorPoint.y });
            const capturerWin = createCapturerWin();
            console.time('ca');
            console.log('ca start');
            // capturerWin.webContents.on('did-finish-load', () => {
            console.log('ready');
            win = createChildWin(clipRenderUrl, Object.assign({ x: currentScreen.bounds.x, y: currentScreen.bounds.y }, currentScreen.size));
            win.on('closed', () => {
                win = null;
            });
            win.on('ready-to-show', () => {
                var _a, _b;
                (_a = win) === null || _a === void 0 ? void 0 : _a.show();
                (_b = win) === null || _b === void 0 ? void 0 : _b.focus();
            });
            // ipc.once('screenshot-ready', () => {
            // capturer(currentScreen).then((imageData) => {
            //   win?.webContents.executeJavaScript(`;window.setImgUrl('${imageData}');`);
            // });
            // });
            win.webContents.executeJavaScript(`;window.cut(${currentScreen.size.width}, ${currentScreen.size.height});`);
            console.timeEnd('ca');
            // })
            // await new Promise(r => setTimeout(r, 50));
            return promise;
        }
        return Promise.reject(new Error('is cutting'));
    });
}
ipc.on('shortcut-capture', (event, arg) => {
    screenshot();
});
ipc.on('screenshot-success', (event, arg) => {
    reset();
    _resolve && _resolve(arg.message);
    _resolve = null;
    _reject = null;
});
// 接受截图退出事件
ipc.on('quit-cut', (e, arg) => {
    reset();
    _reject && _reject();
    _reject = null;
    _resolve = null;
});
module.exports = {
    screenshot: screenshot,
};
