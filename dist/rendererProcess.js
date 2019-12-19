'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var electron = require('electron');
var url = _interopDefault(require('url'));
var path = _interopDefault(require('path'));
var child_process = require('child_process');

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

const { screen } = electron.remote;
class ScreenshotTaker {
    constructor() {
        const cursorPoint = screen.getCursorScreenPoint();
        this.currentScreen = screen.getDisplayNearestPoint({ x: cursorPoint.x, y: cursorPoint.y });
        if (process.platform === 'win32')
            this.bounds = this.getWindowsBounds();
        else
            this.bounds = this.getMacBounds();
    }
    getMacBounds() {
        return this.currentScreen.bounds;
    }
    getWindowsBounds() {
        const allDisplays = screen.getAllDisplays().sort((a, b) => a.bounds.x - b.bounds.x);
        const lastDisplay = allDisplays[allDisplays.length - 1];
        console.log(lastDisplay);
        return {
            x: 0,
            y: 0,
            width: lastDisplay.bounds.x + lastDisplay.bounds.width,
            height: lastDisplay.bounds.y + lastDisplay.bounds.height,
        };
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            const index = screen.getAllDisplays().findIndex(s => s.id === this.currentScreen.id);
            const fileName = `cap_${index}.png`;
            const destFolder = electron.remote.app.getPath('userData');
            const outputPath = path.join(destFolder, fileName);
            const platform = process.platform;
            if (platform === 'win32') {
                yield this.performWindowsCapture(outputPath);
            }
            if (platform === 'darwin') {
                yield this.performMacOSCapture(outputPath, index);
            }
            return outputPath;
        });
    }
    performMacOSCapture(outputPath, index) {
        const process = child_process.spawn('screencapture', [
            '-x',
            '-D',
            `${index + 1}`,
            outputPath,
        ]);
        return this.waitCapturer(process);
    }
    performWindowsCapture(outputPath) {
        const process = child_process.spawn(path.join(__dirname, 'nircmd.exe'), [
            'savescreenshotfull',
            outputPath
        ]);
        return this.waitCapturer(process);
    }
    waitCapturer(process) {
        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        process.on('exit', () => { resolve(); });
        process.on('error', () => { reject(); });
        return promise;
    }
}

const { screen: screen$1, BrowserWindow } = electron.remote;
const clipRenderUrl = './screenshot/screen.html';
// const capturerUrl = './capturer/capturer.html'
const ipc = electron.ipcRenderer;
let win = null;
let _resolve = null;
let _reject = null;
/**
 * 创建截屏窗口
 */
function createChildWin(_url, opts) {
    console.log(opts.width, opts.height);
    let config = {
        // alwaysOnTop: true,
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
    _win.setBounds({
        width: opts.width,
        height: opts.height,
    });
    _win.loadURL(url.format({
        pathname: path.join(__dirname, _url),
        protocol: 'file',
        slashes: true,
    }));
    if (process.platform === 'darwin') {
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
            try {
                const taker = new ScreenshotTaker();
                // const capturerWin = createCapturerWin();
                console.log(taker.bounds);
                taker.start().then((path) => {
                    electron.ipcRenderer.send('capturer-data', path);
                });
                win = createChildWin(clipRenderUrl, taker.bounds);
                win.on('closed', () => {
                    win = null;
                });
                win.on('ready-to-show', () => {
                    var _a, _b;
                    (_a = win) === null || _a === void 0 ? void 0 : _a.show();
                    (_b = win) === null || _b === void 0 ? void 0 : _b.focus();
                });
                win.webContents.executeJavaScript(`;window.cut(${taker.bounds.width}, ${taker.bounds.height});`);
                return promise;
            }
            catch (e) {
                _reject && _reject(e);
                reset();
                return;
            }
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
