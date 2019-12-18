'use strict';

var electron = require('electron');

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
function capturer() {
    return __awaiter(this, void 0, void 0, function* () {
        const cursorPoint = screen.getCursorScreenPoint();
        const currentScreen = screen.getDisplayNearestPoint({ x: cursorPoint.x, y: cursorPoint.y });
        try {
            const sources = yield electron.desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: {
                    width: currentScreen.size.width * currentScreen.scaleFactor,
                    height: currentScreen.size.height * currentScreen.scaleFactor,
                }
            });
            const source = sources.find(source => parseInt(source.display_id) === currentScreen.id);
            if (source) {
                electron.ipcRenderer.send('capturer-page', {
                    type: 'success',
                    data: source.thumbnail.toDataURL()
                });
            }
            else
                throw new Error('screen error');
        }
        catch (e) {
            throw e;
        }
    });
}
capturer();
