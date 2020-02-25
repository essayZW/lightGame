const electron  = require('electron');
const App = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;

let window;     // 父窗口
function createMainWindow(width = 400, height = 450){
    window = new BrowserWindow({
        width : width,
        height : height,
        maxHeight : height,
        maxWidth : width,
        minHeight : height,
        minWidth : width,
        resizable : false,
        webPreferences : {
            nodeIntegration : true
        },
        frame : false
    });
    //   加载文件
    window.loadFile('./static/index.html');
    // window.webContents.openDevTools();
}

App.whenReady().then(createMainWindow);

// 得到游戏关卡内容
ipc.on('get-game-content', (event, message) => {
    const gameContent = require('./config').getGameContentArray();
    event.sender.send('game-content-reply', gameContent);
});

// 退出游戏
ipc.on('quit-game', () => {
    let windows = BrowserWindow.getAllWindows();
    for(let i = 0; i < windows.length; i ++){
        windows[i].close();
    }
    App.quit();
});

// 最小化窗口
ipc.on('minimize-window', () => {
    let windows = BrowserWindow.getAllWindows();
    for(let i = 0; i < windows.length; i ++){
        windows[i].minimize();
    }
});

// 显示关于窗口
let aboutWin;
let aboutWinFlag = false;
ipc.on('create-about-window', () => {
    if(aboutWinFlag) {
        if(aboutWin.isMinimized()){
            aboutWin.maximize();
        }
        aboutWin.focus(); 
        return;
    }
    aboutWin = new BrowserWindow({
        width : 250,
        height: 300,
        autoHideMenuBar : true,
        resizable : false,
        parent : window,
        webPreferences : {
            nodeIntegration : true
        }
    });
    aboutWin.loadFile('./static/about.html');
    // aboutWin.webContents.openDevTools();
    aboutWinFlag = true;
    // 子窗口永远在顶层
    // aboutWin.setAlwaysOnTop(true);

    aboutWin.on('closed', () => {
        aboutWinFlag = false;
    });
});