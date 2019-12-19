import { remote } from "electron";
import path from 'path';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

export class ScreenshotTaker {

  async start(index: number): Promise<string> {
    const fileName = `cap_${index}.png`;
    const destFolder = remote.app.getPath('userData');
    const outputPath = path.join(destFolder, fileName);
    const platform = process.platform;
    if (platform === 'win32') {
      await this.performWindowsCapture(outputPath);
    }
    if (platform === 'darwin') {
      await this.performMacOSCapture(outputPath, index);
    }
    return outputPath;
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
    const process = spawn(path.join(__dirname, 'nircmd.exe'), [
      'savescreenshotwin',
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
    process.on('error', () => { reject() })
    return promise;
  }
}
