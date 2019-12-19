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
      await this.performMacOSCapture(destFolder, outputPath, index);
    }
    return outputPath;
  }

  performMacOSCapture(destFolder: string, outputPath: string, index: number) {

    const paths: string[] = [];
    for (let i = 0; i <= index; i++) {
      if (i === index) paths.push(outputPath);
      else paths.push(path.join(destFolder, `${i}.png`))
    }
    const process = spawn('screencapture', paths)

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
