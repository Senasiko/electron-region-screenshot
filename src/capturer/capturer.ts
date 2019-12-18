
import { remote, desktopCapturer, ipcRenderer } from 'electron';
const { screen } = remote;

async function capturer() {
  const cursorPoint = screen.getCursorScreenPoint();
  const currentScreen = screen.getDisplayNearestPoint({ x: cursorPoint.x, y: cursorPoint.y });
  try {
    const sources = await desktopCapturer.getSources(
      {
        types: ['screen'],
        thumbnailSize: {
          width: currentScreen.size.width * currentScreen.scaleFactor,
          height: currentScreen.size.height * currentScreen.scaleFactor,
        }
      });
    const source = sources.find(source => parseInt(source.display_id) === currentScreen.id)
    if (source) {
      ipcRenderer.send('capturer-page', {
        type: 'success',
        data: source.thumbnail.toDataURL()
      });
    }
    else throw new Error('screen error')
  } catch (e) {
    throw e
  }
}

capturer();
