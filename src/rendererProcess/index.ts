
import { remote, ipcRenderer, BrowserWindowConstructorOptions, desktopCapturer, ipcMain } from 'electron';
import url from 'url';
import path from 'path';
import { ScreenshotTaker } from '../capturer';
const { screen, BrowserWindow } = remote;
const clipRenderUrl = './screenshot/screen.html'
// const capturerUrl = './capturer/capturer.html'
const ipc = ipcRenderer;
let win: Electron.BrowserWindow | null = null;
let _resolve: Function | null = null;
let _reject: Function | null = null;
/**
 * 创建截屏窗口
 */
function createChildWin(_url: string, opts: BrowserWindowConstructorOptions) {
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
  })
  _win.loadURL(url.format({
    pathname: path.join(__dirname, _url),
    protocol: 'file',
    slashes: true,
  }));
  if (process.platform === 'darwin') {
    _win.setAlwaysOnTop(true, 'screen-saver')
    _win.setVisibleOnAllWorkspaces(true)
    _win.setFullScreenable(false)
    _win.show()
    _win.setVisibleOnAllWorkspaces(false)
  }
  return _win;
}

function reset() {
  win && win.close();
  win = null;
}

async function screenshot() {
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
        ipcRenderer.send('capturer-data', path)
      });
      win = createChildWin(clipRenderUrl, taker.bounds);
      win.on('closed', () => {
        win = null;
      });
      win.on('ready-to-show', () => {
        win?.show();
        win?.focus();
      });
      win.webContents.executeJavaScript(`;window.cut(${taker.bounds.width}, ${taker.bounds.height});`);
      return promise
    } catch (e) {
      _reject && _reject(e);
      reset();
      return
    }    
  }
  return Promise.reject(new Error('is cutting'));
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
