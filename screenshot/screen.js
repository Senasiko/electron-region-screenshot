const {
  ipcRenderer, clipboard, nativeImage, remote,
} = require('electron');
const fs = require('fs');

class Screen {
  constructor(cas, casMask, src, size) {
    this.canvas = document.getElementById(cas);
    this.canvasMask = document.getElementById(casMask);

    this.context = this.canvas.getContext('2d');
    this.contextMask = this.canvasMask.getContext('2d');

    this.width = size.width;
    this.height = size.height;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.image = document.getElementById('img');

    this.state = 'ready';
    this.cuted = false;
    this.isShowTool = false;

    this.tool = document.querySelectorAll('.tool')[0];
    this.tip = document.querySelectorAll('.tipNum')[0];

    this.leftTopCursor = document.querySelectorAll('.left_top')[0];
    this.rightTopCursor = document.querySelectorAll('.right_top')[0];
    this.leftBottomCursor = document.querySelectorAll('.left_bottom')[0];
    this.rightBottomCursor = document.querySelectorAll('.right_bottom')[0];

    this.createMask();

    this.createMaskImg();

    this.getMouse();

  }

  // 创建一个黑色透明蒙版画布
  createMask() {
    // 创建一个canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = this.width;
    maskCanvas.height = this.height;
    const maskCtx = maskCanvas.getContext('2d');
    maskCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    maskCtx.fillRect(0, 0, this.width, this.height);
    maskCtx.restore();
    // document.appendChild(maskCanvas)
    this.drawImg(maskCanvas);
  }

  createMaskImg() {
    this.maskImg = document.getElementById('maskImg');
    this.maskSvg = document.getElementById('maskSvg');
    this.maskRect = document.getElementById('maskRect');
    this.maskImg.setAttribute('href', this.image.src);
    this.createRect(0, 0, 0, 0);
  }

  // 画布上贴图
  drawImg(src) {
    this.context.drawImage(src, 0, 0, this.width, this.height);
  }

  // 获取鼠标位置
  getMouse() {
    const end = { x: 0, y: 0 };
    this.start = { x: 0, y: 0 };

    // 鼠标按下
    const down = (ev) => {
      document.onselectstart = function () {
        return false;
      };
      if (ev.target.dataset.done) {
        this.done();
        return false;
      } if (ev.target.dataset.save) {
        this.save();
        return false;
      } if (ev.target.dataset.cancel) {
        this.cancel();
        return false;
      } if (ev.target.dataset.close) {
        this.sendMsg('close');
        return false;
      } if (ev.target.dataset.drag) {
        this.state = 'draging';
        this.canvas_x = ev.clientX - this.canvasMask.offsetLeft;
        this.canvas_y = ev.clientY - this.canvasMask.offsetTop;
        document.addEventListener('mousemove', move, false);
        return false;
      } if (ev.target.dataset.zoom) {
        this.state = 'zooming';
        this.zoomOrigin = ev.target.dataset.placement;
        this.start.x = this.canvasMask.offsetLeft;
        this.start.y = this.canvasMask.offsetTop;
        this.start.width = this.canvasMask.width;
        this.start.height = this.canvasMask.height;
        document.addEventListener('mousemove', move, false);
        return false;
      }
      this.state = 'cuting';
      this.start.x = ev.pageX;
      this.start.y = ev.pageY;
      document.addEventListener('mousemove', move, false);
    }

    // 鼠标移动
    const move = (ev) => {
      
      if (!this.cuted) {
        this.cutEvent(ev.pageX, ev.pageY);
        return false;
      } if (this.state === 'draging') {
        this.dragEvent(ev.pageX, ev.pageY);
        return false;
      } if (this.state === 'zooming') {
        this.zoomEvent(ev.pageX, ev.pageY);
        return false;
      }
    }

    // 鼠标抬起
    const up = (ev) => {
      this.state === 'ready';
      if (!ev.target.dataset.done && !ev.target.dataset.cancel && !ev.target.dataset.save && !ev.target.dataset.close && !ev.target.dataset.drag && !ev.target.dataset.zoom) {
        end.x = ev.pageX;
        end.y = ev.pageY;
        document.removeEventListener('mousemove', move);
        this.isShowTool && this.showTool(end.x, end.y, this.start.x, this.start.y);
      } else {
        const _x = parseInt(this.canvasMask.style.left) + this.canvasMask.width;
        const _y = parseInt(this.canvasMask.style.top) + this.canvasMask.height;
        const x0 = parseInt(this.canvasMask.style.left);
        const y0 = parseInt(this.canvasMask.style.top);
        this.showTool(_x, _y, x0, y0);

        document.removeEventListener('mousemove', move);
      }
      return false;
    }


    // 记录上一次 down
    let hasDown = false;
    const click = (ev) => {
      if (ev.target.dataset.drag) {
        if (hasDown) {
          this.done();
          return;
        }
        hasDown = true;
        setTimeout(() => {
          hasDown = false;
        }, 200);
      }
    }

    document.addEventListener('mousedown', down, false);
    document.addEventListener('mouseup', up, false);
    document.addEventListener('click', click, false)

    return {
      end,
    };
  }

  // 绘制选区
  createRect(x, y, _x, _y, data) {
    this.maskRect.setAttribute('x',  _x);
    this.maskRect.setAttribute('y', _y);
    this.maskRect.setAttribute('width', x - _x);
    this.maskRect.setAttribute('height', y - _y);

    this.isShowTool = true;

    this.hideTool();
  }

  // 设置canvasmask位置及边框
  maskShow(x, y, _x, _y) {
    this.canvasMask.style.display = 'block';
    this.canvasMask.style.border = '1px solid #FFF';
    this.canvasMask.style.left = `${_x < x ? _x : x}px`;
    this.canvasMask.style.top = `${_y < y ? _y - 1 : y - 1}px`;
    this.canvasMask.width = x - _x;
    this.canvasMask.height = y - _y;
  }

  // 清空画布
  clearCtx() {
    this.contextMask.clearRect(0, 0, this.width, this.height);
    this.canvasMask.style.display = 'none';
    this.canvasMask.style.border = 'none';
  }

  clearMask() {
    this.maskRect.setAttribute('x', 0);
    this.maskRect.setAttribute('y', 0);
    this.maskRect.setAttribute('width', 0);
    this.maskRect.setAttribute('height', 0);
  }

  createImageData() {
    const width = this.canvasMask.width * devicePixelRatio;
    const height = this.canvasMask.height * devicePixelRatio;
    const x = parseInt(this.canvasMask.style.left) * devicePixelRatio;
    const y = parseInt(this.canvasMask.style.top) * devicePixelRatio;

    const canvas = document.createElement('canvas');
    canvas.width = this.width * devicePixelRatio;
    canvas.height = this.height * devicePixelRatio;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.image, 0, 0);
    return this.RGBA2ImageData(ctx.getImageData(x, y, width, height));
  }

  // 矩阵图转base64
  RGBA2ImageData(__imgMat) {
    const { width } = __imgMat;
    const { height } = __imgMat;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    imgData.data.set(__imgMat.data);
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
  }

  // 选区数值提示
  tipShow(x, y, _x, _y) {
    this.tip.innerHTML = `${Math.abs(x - _x)}×${Math.abs(y - _y)}`;
    this.tip.style.display = 'inline-block';
    this.tip.style.left = `${_x < x ? _x : x}px`;
    let t = (_y < y ? _y - 20 : y - 20);
    if (t < 5) {
      t = _y;
    }
    this.tip.style.top = `${t}px`;
  }

  // 隐藏选区提示
  tipHide() {
    this.tip.style.display = 'none';
  }

  // 选区完成显示工具栏
  showTool(x, y, _x, _y) {
    this.tool.style.display = 'block';
    this.tool.style.left = `${_x < x ? x - 110 : _x}px`;
    if ((this.height - y) < 50 && !(_y < 21)) {
      this.tool.style.top = `${_y - 21}px`;
    } else if ((this.height - y) < 50 && _y < 21) {
      this.tool.style.top = `${_y}px`;
    } else {
      this.tool.style.top = `${y + 3}px`;
    }
    this.cuted = true;
    this.isShowTool = false;


    // 这个方法不应该放在这里，与工具栏解耦
    this.showCursor(x, y, _x, _y);
  }

  // 显示缩放框
  showCursor(x, y, _x, _y) {
    this.leftTopCursor.style.top = `${_y}px`;
    this.leftTopCursor.style.left = `${_x}px`;

    this.rightTopCursor.style.top = `${_y}px`;
    this.rightTopCursor.style.left = `${x - 15}px`;

    this.leftBottomCursor.style.top = `${y - 15}px`;
    this.leftBottomCursor.style.left = `${_x}px`;

    this.rightBottomCursor.style.left = `${x - 15}px`;
    this.rightBottomCursor.style.top = `${y - 15}px`;

    this.leftTopCursor.style.display = 'block';
    this.rightTopCursor.style.display = 'block';
    this.leftBottomCursor.style.display = 'block';
    this.rightBottomCursor.style.display = 'block';
  }

  // 隐藏工具栏
  hideTool() {
    this.tool.style.display = 'none';
    this.leftTopCursor.style.display = 'none';
    this.rightTopCursor.style.display = 'none';
    this.leftBottomCursor.style.display = 'none';
    this.rightBottomCursor.style.display = 'none';
  }

  cutEvent(x, y) {
    this.clearCtx();

    let startX = this.start.x;
    let startY = this.start.y;
    let endX = x;
    let endY = y;
    if (endX < startX) [startX, endX] = [endX, startX];
    if (endY < startY) [startY, endY] = [endY, startY];
    this.createRect(endX, endY, startX, startY);
    this.maskShow(endX, endY, startX, startY);
    this.tipShow(endX, endY, startX, startY);
  }
  // 拖拽动作
  dragEvent(x, y) {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    const l = x - this.canvas_x; // 将距离变量存起来进行判断
    const t = y - this.canvas_y; // 将距离变量存起来进行判断

    if (l < 0) {
      this.canvasMask.style.left = `${0}px`;
    } else if (l > (w - this.canvasMask.width)) {
      this.canvasMask.style.left = `${w - this.canvasMask.width}px`;
    } else {
      this.canvasMask.style.left = `${l}px`;
    }
    if (t < 0) {
      this.canvasMask.style.top = `${0}px`;
    } else if (t > h - this.canvasMask.height) {
      this.canvasMask.style.top = `${h - this.canvasMask.height}px`;
    } else {
      this.canvasMask.style.top = `${t}px`;
    }
    // 设置选区
    const _x = parseInt(this.canvasMask.style.left) + this.canvasMask.width;
    const _y = parseInt(this.canvasMask.style.top) + this.canvasMask.height;
    const x0 = parseInt(this.canvasMask.style.left);
    const y0 = parseInt(this.canvasMask.style.top);

    // 重新绘制选区
    this.createRect(_x, _y, x0, y0, true);
    // 隐藏工具栏
    this.hideTool();
    this.tipShow(_x, _y, x0, y0);
  }

  zoomEvent(pageX, pageY) {
    let {x: leftTopX, y: leftTopY, width, height } = this.start;
    let position = [];
    switch (this.zoomOrigin) {
      case 'left-top': position = [pageX, pageY, leftTopX + width, leftTopY + height]; break;
      case 'right-top': position = [leftTopX, pageY, pageX, leftTopY + height]; break;
      case 'left-bottom': position = [pageX, leftTopY, leftTopX + width, pageY]; break;
      case 'right-bottom': position = [leftTopX, leftTopY, pageX, pageY]; break;
      default: break;
    }
    this.clearCtx();

    let [startX, startY, endX, endY] = position;
    if (endX < startX) [startX, endX] = [endX, startX];
    if (endY < startY) [startY, endY] = [endY, startY];

    this.createRect(endX, endY, startX, startY);
    this.maskShow(endX, endY, startX, startY);
    this.tipShow(endX, endY, startX, startY);

  }

  // 取消操作
  cancel() {
    this.cuted = false;
    this.state = 'ready';
    this.clearCtx();
    this.clearMask();
    this.hideTool();
    this.tipHide();
  }

  // 完成写入剪切板
  done() {
    const imgData = this.createImageData();
    clipboard.writeImage(nativeImage.createFromDataURL(imgData));
    this.sendMsg('success', { path: null, base64: imgData });
  }

  // 保存制定路径
  save() {
    const imgData = this.createImageData();
    remote.getCurrentWindow().setAlwaysOnTop(false);
    remote.dialog.showSaveDialog({ defaultPath: `截图_${dateFormat()}.png`, filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }] }, (pathStr) => {
      if (pathStr) {
        fs.writeFile(pathStr, new Buffer(imgData.replace('data:image/png;base64,', ''), 'base64'), () => {
          this.sendMsg('save', { path: pathStr, base64: imgData });
        });
      } else {
        remote.getCurrentWindow().setAlwaysOnTop(true);
      }
    });
  }
  // 通信
  sendMsg(type, msg) {
    ipcRenderer.send('screenshot-page', { type, message: msg });
  }
}

function dateFormat() {
  const now = new Date();
  return `${now.getFullYear()}${now.getMonth() + 1}${now.getDay()}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
}

window.cut = (width, height) => {
  new Screen('canvas', 'canvasMask', img, { width, height });
}
