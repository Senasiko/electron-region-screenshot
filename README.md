# electron-region-screenshot
region screenshot for electron.
## usage
```
npm install electron-region-screenshot
```
in mainProcess.js
```
import { initMain } from 'electron-region-screenshot';

app.on('ready', () => {
  const win = new BrowserWindow();
  initMain(win.webContents);
})
```
in renderProcess.js
```
import { screenshot } from 'electron-region-screenshot';
screenshot().then(({ base64 } => {
  console.log(base64);
});
```
## notice
when use in Windows. add the snippet in `package.json`
```json
...
 "build": {
    ...
    "asarUnpack": [
      "*.exe"
    ],
    ...
 }
...
```
