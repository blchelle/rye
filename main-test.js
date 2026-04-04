const { app, BrowserWindow } = require('electron');
const path = require('path');

let reminderWindow = null;

function createReminderWindow() {
  if (reminderWindow) return;

  const { screen } = require('electron');
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  reminderWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    alwaysOnTop: true,
    closable: false,
    skipTaskbar: true,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  reminderWindow.loadFile('dist/index.html');

  reminderWindow.webContents.on('did-finish-load', () => {
    reminderWindow.webContents.send('start-countdown');
  });

  // Auto-close after 30 seconds
  setTimeout(() => {
    if (reminderWindow) {
      reminderWindow.destroy();
      reminderWindow = null;
      app.quit();
    }
  }, 30000);
}

app.whenReady().then(() => {
  console.log('Testing reminder window - will appear in 3 seconds...');
  setTimeout(createReminderWindow, 3000);
});

app.on('window-all-closed', () => {
  app.quit();
});
