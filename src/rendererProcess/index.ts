
import { remote, desktopCapturer, ipcRenderer, BrowserWindowConstructorOptions } from 'electron';
import url from 'url';
import path from 'path';
const { screen, BrowserWindow } = remote;
const clipRenderUrl = './screenshot/screen.html'
const capturerUrl = './capturer/capturer.html'
const ipc = ipcRenderer;
let win: Electron.BrowserWindow | null = null;
let _resolve: Function | null = null;
let _reject: Function | null = null;
/**
 * 创建截屏窗口
 */
function createChildWin(_url: string, opts: BrowserWindowConstructorOptions) {
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
    const cursorPoint = screen.getCursorScreenPoint();
    const currentScreen = screen.getDisplayNearestPoint({ x: cursorPoint.x, y: cursorPoint.y });
    const capturerWin = createCapturerWin();
    console.time('ca');
    console.log('ca start');
    // capturerWin.webContents.on('did-finish-load', () => {
      console.log('ready');
      win = createChildWin(clipRenderUrl, {
        x: currentScreen.bounds.x,
        y: currentScreen.bounds.y,
        ...currentScreen.size,
      });
      win.on('closed', () => {
        win = null;
      });
      win.on('ready-to-show', () => {
        win?.show();
        win?.focus();
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
    return promise
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