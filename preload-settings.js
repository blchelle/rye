const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getSystemSounds: () => ipcRenderer.invoke('get-system-sounds'),
  previewSound: (soundFile) => ipcRenderer.invoke('preview-sound', soundFile)
});
