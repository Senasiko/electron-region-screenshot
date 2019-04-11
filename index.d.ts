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

export const initMain: (webContent: WebContents, options?: MainOptions) => void;
export const screenshot: () => ScreenshotImgData;
