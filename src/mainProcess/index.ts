
import { ipcMain, WebContents, BrowserWindow } from 'electron';

export const initMain = (winContent: WebContents) => {
  let screenshotContent: WebContents | undefined;
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
        break;
      default:
        break;
    }
  });
  // 接收捕获桌面的信号
  ipcMain.on('capturer-page', (e, message) => {
    switch (message.type) {
      case 'success': 
        if (screenshotContent && !screenshotContent.isDestroyed()) screenshotContent?.send('capturer-data', message.data);
        const win = BrowserWindow.fromWebContents(e.sender)
        // if (!win.isDestroyed()) win.close();
        break;
    }
  });
}
