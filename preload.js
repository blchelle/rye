const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onStartCountdown: (callback) => ipcRenderer.on('start-countdown', callback)
});
