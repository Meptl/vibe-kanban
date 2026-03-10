const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vibeKanban', {
  focusAppWindow: () => ipcRenderer.send('app:focus-main-window'),
});
