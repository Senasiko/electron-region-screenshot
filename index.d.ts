import { WebContents } from 'electron';

export interface MainOptions {
  quit?: string;
  shotKey?: string;
  cancelShot?: string;
}

export interface ScreenshotImgData {
  path: string | null;
  base64: string;
}

export interface Screenshot {
  initMain: (webContent: WebContents, options?: MainOptions) => void;
  screenshot: () => ScreenshotImgData;
}

export default Screenshot;
