const { ipcMain } = require('electron');
module.exports = {
  initMain: (winContent, obj) => {
    // 接收截图工具信号
    ipcMain.on('screenshot-page', (sender, message) => {
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
        default:
          break;
      }
    });
  }
}
