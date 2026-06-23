const { app, BrowserWindow, screen, ipcMain } = require("electron");
const path = require("path");

let petWindow;

function createPetWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  petWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  petWindow.setIgnoreMouseEvents(true, { forward: true });
  petWindow.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(createPetWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("pet:set-click-through", (_event, shouldIgnore) => {
  if (!petWindow) return;
  petWindow.setIgnoreMouseEvents(shouldIgnore, { forward: true });
});

ipcMain.on("pet:quit", () => {
  app.quit();
});
