const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("petApi", {
  setClickThrough: (shouldIgnore) => {
    ipcRenderer.send("pet:set-click-through", shouldIgnore);
  },
  quit: () => {
    ipcRenderer.send("pet:quit");
  }
});
