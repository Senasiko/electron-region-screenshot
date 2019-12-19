'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var electron = require('electron');
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

const screenshot = require('desktop-screenshot');
class ScreenshotTaker {
    start(index) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = `cap_${index}.png`;
            const destFolder = electron.remote.app.getPath('userData');
            const outputPath = path.join(destFolder, fileName);
            const platform = process.platform;
            if (platform === 'win32') {
                yield this.performWindowsCapture(outputPath);
            }
            if (platform === 'darwin') {
                yield this.performMacOSCapture(destFolder, outputPath, index);
            }
            return outputPath;
        });
    }
    performMacOSCapture(destFolder, outputPath, index) {
        const paths = [];
        for (let i = 0; i <= index; i++) {
            if (i === index)
                paths.push(outputPath);
            else
                paths.push(path.join(destFolder, `${i}.png`));
        }
        const process = child_process.spawn('screencapture', paths);
        return this.waitCapturer(process);
    }
    performWindowsCapture(outputPath) {
        const process = child_process.spawn(path.join(__dirname, 'nircmd.exe'), [
            'savescreenshotwin',
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

exports.ScreenshotTaker = ScreenshotTaker;
