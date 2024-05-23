const { ipcMain } = require("electron");
const { app, desktopCapturer, BrowserWindow, Menu } = require("electron/main");
const path = require("node:path");
let availableScreens, mainWindow;

const sendSelectedScreen = (screen) => {
  mainWindow.webContents.send("SET_SOURCE_ID", screen.id);
};
const createTray = () => {
  const screensMenu = availableScreens.map((screen) => {
    return { label: screen.name, click: () => sendSelectedScreen(screen) };
  });
  const menu = Menu.buildFromTemplate([
    { label: app.name, submenu: [{ role: "quit" }] },
    { label: "Screens", submenu: screensMenu },
  ]);
  Menu.setApplicationMenu(menu);
};
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  ipcMain.on("set-size", (event, size) => {
    const { width, height } = size;
    try {
      mainWindow.setSize(width, height, true);
    } catch (error) {
      console.error("error while setting size", error);
    }
  });
  mainWindow.loadURL("http://localhost:4000/");
  mainWindow.setPosition(0, 0);
  desktopCapturer
    .getSources({
      types: ["screen", "window"],
    })
    .then((sources) => {
      availableScreens = sources;
      createTray();
      sources.forEach((source) => {
        if (source.name == "Entire screen") {
          mainWindow.webContents.send("SET_SOURCE_ID", source.id);
          return;
        }
      });
    });
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
