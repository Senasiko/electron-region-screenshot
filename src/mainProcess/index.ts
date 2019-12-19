
import { ipcMain, WebContents, BrowserWindow } from 'electron';

let screenshotContent: WebContents | undefined;
let imgPath: string | undefined;

function reset() {
  screenshotContent = undefined;
  imgPath = undefined;
}

export const initMain = (winContent: WebContents) => {
  // 接收截图工具信号
  ipcMain.on('screenshot-page', (event, message) => {
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
      default:
        break;
    }
  });
  // 接收捕获桌面的信号
  ipcMain.on('capturer-data', (e, message) => {
    if (screenshotContent && !screenshotContent.isDestroyed()) {
      screenshotContent.send('capturer-data', message);
      reset();
    } else imgPath = message;
  });
}
