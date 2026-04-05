const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onStartCountdown: (callback) => ipcRenderer.on('start-countdown', (event, data) => callback(event, data)),
  dismissReminder: () => ipcRenderer.invoke('dismiss-reminder')
});
