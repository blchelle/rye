const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { exec } = require('child_process');

const SYSTEM_SOUNDS = [
  { name: 'Glass', file: 'Glass.aiff' },
  { name: 'Blow', file: 'Blow.aiff' },
  { name: 'Bottle', file: 'Bottle.aiff' },
  { name: 'Frog', file: 'Frog.aiff' },
  { name: 'Funk', file: 'Funk.aiff' },
  { name: 'Hero', file: 'Hero.aiff' },
  { name: 'Morse', file: 'Morse.aiff' },
  { name: 'Ping', file: 'Ping.aiff' },
  { name: 'Pop', file: 'Pop.aiff' },
  { name: 'Purr', file: 'Purr.aiff' },
  { name: 'Sosumi', file: 'Sosumi.aiff' },
  { name: 'Submarine', file: 'Submarine.aiff' },
  { name: 'Tink', file: 'Tink.aiff' }
];

const store = new Store({
  defaults: {
    reminderInterval: 20,
    breakDuration: 20,
    isPaused: false,
    showDismissButton: true,
    completionSound: 'Blow.aiff'
  }
});

let reminderWindow = null;
let settingsWindow = null;
let tray = null;
let nextReminderTimeout = null;


function getNextReminderTime() {
  const interval = store.get('reminderInterval');
  const now = new Date();
  const currentMinutes = now.getMinutes();
  const currentSeconds = now.getSeconds();
  const currentMs = now.getMilliseconds();

  let nextMinute;
  if (interval === 60) {
    nextMinute = 60;
  } else {
    for (let i = 0; i < 60; i += interval) {
      if (i > currentMinutes) {
        nextMinute = i;
        break;
      }
    }
    if (!nextMinute) {
      nextMinute = 60;
    }
  }

  const minutesUntilNext = nextMinute === 60
    ? 60 - currentMinutes
    : nextMinute - currentMinutes;

  return (minutesUntilNext * 60 - currentSeconds) * 1000 - currentMs;
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

  reminderWindow.setContentProtection(true);
  reminderWindow.loadFile('dist/index.html');

  const breakDuration = store.get('breakDuration');
  const showDismissButton = store.get('showDismissButton');

  reminderWindow.webContents.on('did-finish-load', () => {
    reminderWindow.webContents.send('start-countdown', {
      duration: breakDuration,
      showDismissButton
    });
  });

  setTimeout(() => {
    if (reminderWindow) {
      if (process.platform === 'darwin') {
        const soundFile = store.get('completionSound') || 'Glass.aiff';
        exec(`afplay /System/Library/Sounds/${soundFile}`);
      }
      reminderWindow.destroy();
      reminderWindow = null;
    }
  }, breakDuration * 1000);
}

function scheduleNextReminder() {
  if (nextReminderTimeout) {
    clearTimeout(nextReminderTimeout);
    nextReminderTimeout = null;
  }

  if (store.get('isPaused')) {
    console.log('Reminders paused');
    updateTrayMenu();
    return;
  }

  const msUntilNext = getNextReminderTime();
  console.log(`Next reminder in ${Math.floor(msUntilNext / 1000)} seconds`);

  nextReminderTimeout = setTimeout(() => {
    if (!store.get('isPaused')) {
      createReminderWindow();
    }
    scheduleNextReminder();
  }, msUntilNext);

  updateTrayMenu();
}

function rescheduleReminders() {
  scheduleNextReminder();
}

function getNextReminderText() {
  if (store.get('isPaused')) {
    return 'Next reminder: Paused';
  }

  if (!nextReminderTimeout) {
    return 'Next reminder: Calculating...';
  }

  const msUntilNext = getNextReminderTime();
  const minutes = Math.ceil(msUntilNext / 60000);

  return `Next reminder: ${minutes}m`;
}

function updateTrayMenu() {
  if (!tray) return;

  const isPaused = store.get('isPaused');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Settings...',
      click: createSettingsWindow
    },
    {
      label: 'Test Alert',
      click: createReminderWindow
    },
    { type: 'separator' },
    {
      label: 'Pause Reminders',
      type: 'checkbox',
      checked: isPaused,
      click: () => {
        store.set('isPaused', !isPaused);
        rescheduleReminders();
      }
    },
    { type: 'separator' },
    {
      label: getNextReminderText(),
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function createTray() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'build', 'trayTemplate.png')
    : path.join(__dirname, 'build', 'trayTemplate.png');

  let icon;

  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch (e) {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Rye - Eye Rest Reminder');
  updateTrayMenu();

  setInterval(() => {
    updateTrayMenu();
  }, 60000);
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 600,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-settings.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadFile('dist/settings.html');

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

ipcMain.handle('get-settings', () => {
  return store.store;
});

ipcMain.handle('get-system-sounds', () => {
  return SYSTEM_SOUNDS;
});

ipcMain.handle('preview-sound', (_event, soundFile) => {
  if (process.platform === 'darwin') {
    exec(`afplay /System/Library/Sounds/${soundFile}`);
  }
});

ipcMain.handle('save-settings', (event, newSettings) => {
  store.set(newSettings);
  rescheduleReminders();
});

ipcMain.handle('dismiss-reminder', () => {
  if (reminderWindow) {
    reminderWindow.destroy();
    reminderWindow = null;
  }
});

app.whenReady().then(() => {
  createTray();
  scheduleNextReminder();
});

app.on('window-all-closed', () => {
  // Don't quit app when reminder window closes
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
