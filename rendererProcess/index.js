const { remote, desktopCapturer, ipcRenderer, screen } = require('electron');
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
    fullscreen: true,
  };
  if (process.platform === 'darwin') {
    config.simpleFullscreen = true;
  }
  config = Object.assign(config, opts);
  const _win = new BrowserWindow(config);
  _win.loadURL(url.format({
    pathname: path.join(__dirname, _url),
    protocol: 'file',
    slashes: true,
  }));

  return _win;
}

function reset() {
  if (process.platform === 'darwin') {
    win && win.setSimpleFullScreen(false);
  }
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
    const currentWindowBounds = remote.getCurrentWindow().getBounds();
    const currentScreen = screen.getDisplayNearestPoint({ x: currentWindowBounds.x, y: currentWindowBounds.y });
    let currentScreenX = 0;
    let isOver = false;
    screen.getAllDisplays().forEach((display) => {
      if (isOver) return;
      if (display.id === currentScreen.id) {
        isOver = true;
        return;
      }
      currentScreenX += display.size.width;
    });
    capturer(currentScreen).then((imgData) => {
      console.log(currentScreenX);
      win = createChildWin(clipRenderUrl, {
        x: currentScreenX,
        y: 0,
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
