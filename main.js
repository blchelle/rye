const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { execSync } = require('child_process');

const store = new Store({
  defaults: {
    reminderInterval: 30,
    breakDuration: 30,
    isPaused: false,
    ignoreWhenScreenRecording: true,
    workingHours: {
      enabled: false,
      startTime: '09:00',
      endTime: '17:00'
    }
  }
});

let reminderWindow = null;
let settingsWindow = null;
let tray = null;
let nextReminderTimeout = null;

function isWithinWorkingHours() {
  const settings = store.get('workingHours');
  if (!settings.enabled) return true;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = settings.startTime.split(':').map(Number);
  const [endHour, endMin] = settings.endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

function isScreenBeingCaptured() {
  if (process.platform !== 'darwin') return false;

  try {
    // Check for native screen recording apps
    const appCheck = execSync(
      'pgrep -l screencaptureui || pgrep -l "QuickTime Player" || pgrep -l OBS || true',
      { encoding: 'utf8', timeout: 300 }
    );

    // Check for browser video capture (Google Meet, Zoom web, etc.)
    const videoCaptureCheck = execSync(
      'pgrep -fl "VideoCaptureService|video_capture" || true',
      { encoding: 'utf8', timeout: 300 }
    );

    return appCheck.trim().length > 0 || videoCaptureCheck.trim().length > 0;
  } catch (error) {
    console.log('Screen capture check failed:', error);
    return false;
  }
}

function getNextReminderTime() {
  const interval = store.get('reminderInterval');
  const workingHours = store.get('workingHours');

  if (!isWithinWorkingHours() && workingHours.enabled) {
    const now = new Date();
    const [startHour, startMin] = workingHours.startTime.split(':').map(Number);

    const nextStart = new Date();
    nextStart.setHours(startHour, startMin, 0, 0);

    if (nextStart <= now) {
      nextStart.setDate(nextStart.getDate() + 1);
    }

    return nextStart - now;
  }

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

  if (store.get('ignoreWhenScreenRecording') && isScreenBeingCaptured()) {
    console.log('Screen recording detected, skipping reminder');
    return;
  }

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

  const breakDuration = store.get('breakDuration');

  reminderWindow.webContents.on('did-finish-load', () => {
    reminderWindow.webContents.send('start-countdown', { duration: breakDuration });
  });

  setTimeout(() => {
    if (reminderWindow) {
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

ipcMain.handle('save-settings', (event, newSettings) => {
  const workingHours = newSettings.workingHours;

  if (workingHours.enabled) {
    const [startHour, startMin] = workingHours.startTime.split(':').map(Number);
    const [endHour, endMin] = workingHours.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      throw new Error('End time must be after start time');
    }
  }

  store.set(newSettings);
  rescheduleReminders();
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
