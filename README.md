# electron-region-screenshot
region screenshot for electron, transform from [shotScreen](https://github.com/chong0808/shotScreen)

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

