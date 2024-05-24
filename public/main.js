const { ipcMain } = require("electron");
const {
  app,
  desktopCapturer,
  BrowserWindow,
  Menu,
  powerMonitor,
} = require("electron/main");
const path = require("node:path");
const express = require("express");
const expressApp = express();
const cors = require("cors");
const robot = require("robotjs");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { screen } = require("electron");

expressApp.use(express.static(__dirname));
expressApp.get("/", function (req, res) {
  console.log("req path...", req.path);
  res.sendfile("index.html");
});
expressApp.set("port", 4000);
expressApp.use(cors({ origin: "*" }));
expressApp.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Request methods you wish to allow
  res.setHeader("Access-Control-Allow-Methods", "*");
  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  // res.setHeader("Access-Control-Allow-Credentials", true);
  // Pass to next layer of middleware
  next();
});
const httpServer = createServer(expressApp);
httpServer.listen(4000, "0.0.0.0");
httpServer.on("error", (error) => console.error("error", error));
httpServer.on("listening", () => console.log("listening"));

let availableScreens, mainWindow, clientSelectedScreen, displays;

const io = new Server(httpServer, { origin: "*" });
const connections = io.of("/remote-ctrl");
connections.on("connection", (socket) => {
  console.log("connection established");

  socket.on("offer", (sdp) => {
    console.log("routing offer");
    // send to the electron app
    socket.broadcast.emit("offer", sdp);
  });

  socket.on("answer", (sdp) => {
    console.log("routing answer");
    // send to the electron app
    socket.broadcast.emit("answer", sdp);
  });

  socket.on("icecandidate", (icecandidate) => {
    socket.broadcast.emit("icecandidate", icecandidate);
  });

  socket.on("selectedScreen", (selectedScreen) => {
    clientSelectedScreen = selectedScreen;
    socket.broadcast.emit("selectedScreen", clientSelectedScreen);
  });

  socket.on("mouse_move", ({ clientX, clientY, clientWidth, clientHeight }) => {
    const {
      displaySize: { width, height },
    } = clientSelectedScreen;
    const ratioX = width / clientWidth;
    const ratioY = height / clientHeight;
    const hostX = clientX * ratioX;
    const hostY = clientY * ratioY;
    robot.moveMouse(hostX, hostY);
  });

  socket.on("mouse_click", (button) => {
    robot.mouseClick("left", false);
  });
});

const sendSelectedScreen = (item) => {
  const displaySize = displays.filter(
    (display) => `${display.id}` === item.display_id
  )[0].size;

  mainWindow.webContents.send("SET_SOURCE_ID", {
    id: item.id,
    displaySize,
  });
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
  mainWindow.webContents.openDevTools();
  ipcMain.on("set-size", (event, size) => {
    const { width, height } = size;
    try {
      !isNaN(height) && mainWindow.setSize(width, height, true);
    } catch (error) {
      console.error("error while setting size", error);
    }
  });
  mainWindow.loadURL("http://localhost:4000/");
  displays = screen.getAllDisplays();
  mainWindow.setPosition(0, 0);
  desktopCapturer
    .getSources({
      types: ["screen", "window"],
    })
    .then((sources) => {
      sendSelectedScreen(sources[0]);
      availableScreens = sources;
      createTray();
      // sources.forEach((source) => {
      //   if (source.name == "Entire screen") {
      //     mainWindow.webContents.send("SET_SOURCE_ID", {source.id, displaySize});
      //     return;
      //   }
      // });
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
