const { app, BrowserWindow } = require('electron');
const path = require('path');

let reminderWindow = null;

function getNextReminderTime() {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const milliseconds = now.getMilliseconds();

  // Calculate minutes until next 30-min mark
  const minutesUntilNext = minutes < 30 ? 30 - minutes : 60 - minutes;

  // Convert to milliseconds, subtract elapsed seconds/ms in current minute
  const msUntilNext = (minutesUntilNext * 60 * 1000) - (seconds * 1000) - milliseconds;

  return msUntilNext;
}

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
    }
  }, 30000);
}

function scheduleNextReminder() {
  const msUntilNext = getNextReminderTime();

  console.log(`Next reminder in ${Math.floor(msUntilNext / 1000)} seconds`);

  setTimeout(() => {
    createReminderWindow();
    scheduleNextReminder();
  }, msUntilNext);
}

app.whenReady().then(() => {
  scheduleNextReminder();
});

app.on('window-all-closed', () => {
  // Don't quit app when reminder window closes
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
