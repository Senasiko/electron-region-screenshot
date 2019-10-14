const { remote, desktopCapturer, ipcRenderer } = require('electron');
const { screen } = remote;
const url = require('url');
const path = require('path');
const clipRenderUrl = '../screenshot/screen.html';
const { BrowserWindow } = remote;
const ipc = ipcRenderer;
let win = null;
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

/**
 * 截取屏幕资源
 */
function capturer(screen) {
  return new Promise(((resolve) => {
    desktopCapturer.getSources(
      { 
        types: ['screen'], 
        thumbnailSize: { 
          width: screen.size.width * screen.scaleFactor, 
          height: screen.size.height * screen.scaleFactor, 
        } 
      }, (error, sources) => {
        if (error) console.error(error);
        resolve(sources.find(source => parseInt(source.display_id) === screen.id).thumbnail.toDataURL());
      });
  }));
}

function screenshot(event, arg) {
  if (_resolve && _reject) {
    return Promise.reject(new Error('is cutting'));
  }
  if (!win) {
    const cursorPoint = screen.getCursorScreenPoint();
    const currentScreen = screen.getDisplayNearestPoint({ x: cursorPoint.x, y: cursorPoint.y });
    capturer(currentScreen).then((imgData) => {
      win = createChildWin(clipRenderUrl, {
        x: currentScreen.bounds.x,
        y: currentScreen.bounds.y,
        ...currentScreen.size,
      });
      win.on('closed', () => {
        win = null;
      });
      win.on('ready-to-show', () => {
        win.show();
        win.focus();
      });
      win.webContents.executeJavaScript(`;document.getElementById('img').src = '${imgData}';window.cut(${currentScreen.size.width}, ${currentScreen.size.height});`);
      // win.webContents.openDevTools()
    });
    return new Promise((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });
  }
  return Promise.reject(new Error('is cutting'));

}

let _resolve = null;

let _reject = null;

ipc.on('shortcut-capture', (event, arg) => {
  screenshot(event, arg);
});
ipc.on('screenshot-success', (event, arg) => {
  reset();
  _resolve && _resolve(arg.message);
  _resolve = null;
});

// 接受截图退出事件
ipc.on('quit-cut', (message) => {
  reset();
  _reject && _reject();
  _reject = null;
});

module.exports = {
  screenshot: screenshot,
};
