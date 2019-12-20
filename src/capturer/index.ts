import { remote, Display } from "electron";
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

const { screen } = remote;

interface ScreenshotBounds {
  x: number,
  y: number,
  width: number,
  height: number,
}

export class ScreenshotTaker {

  bounds: ScreenshotBounds;

  outputPath: string = '';

  currentScreen: Display;

  constructor() {

    const cursorPoint = screen.getCursorScreenPoint();
    this.currentScreen = screen.getDisplayNearestPoint({ x: cursorPoint.x, y: cursorPoint.y });
    if (process.platform === 'win32') this.bounds = this.getWindowsBounds();
    else this.bounds = this.getMacBounds(); 
  }

  getMacBounds(): ScreenshotBounds {
    return this.currentScreen.bounds;
  }

  getWindowsBounds(): ScreenshotBounds {
    const allDisplays = screen.getAllDisplays().sort((a, b) => a.bounds.x === b.bounds.x ? a.bounds.y - b.bounds.y : a.bounds.x - b.bounds.x);
    const lastDisplay = allDisplays[allDisplays.length - 1];
    return {
      x: 0,
      y: 0,
      width: lastDisplay.bounds.x + lastDisplay.bounds.width,
      height: lastDisplay.bounds.y + lastDisplay.bounds.height,
    }
  }

  async start(): Promise<string> {
    const index = screen.getAllDisplays().findIndex(s => s.id === this.currentScreen.id)
    const fileName = `cap_${index}.png`;
    const destFolder = remote.app.getPath('userData');
    this.outputPath = path.join(destFolder, fileName);
    const platform = process.platform;
    if (platform === 'win32') {
      await this.performWindowsCapture(this.outputPath);
    }
    if (platform === 'darwin') {
      await this.performMacOSCapture(this.outputPath, index);
    }
    return this.outputPath;
  }

  clear() {
    fs.unlink(this.outputPath, () => {});
  }

  performMacOSCapture(outputPath: string, index: number) {
    const process = spawn('screencapture', [
      '-x',
      '-D',
      `${index + 1}`,
      outputPath,
    ])

    return this.waitCapturer(process);
  }
  performWindowsCapture(outputPath: string) {
    const process = spawn(this.fixPathForAsar(path.join(__dirname, 'nircmd.exe')), [
      'savescreenshotfull',
      outputPath
    ]);
    return this.waitCapturer(process);
  }

  waitCapturer(process: ChildProcessWithoutNullStreams) {
    let resolve: Function;
    let reject: Function;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    })
    process.on('exit', () => { resolve() })
    process.on('error', (e) => { reject(e) })
    return promise;
  }

  isUsingAsar(): boolean {
    return 'electron' in process.versions && !!process.mainModule && process.mainModule.filename.includes('app.asar');
  }

  fixPathForAsar(path: string): string {
    return this.isUsingAsar() ? path.replace('app.asar', 'app.asar.unpacked') : path;
  }
}
