const electron = require('electron')

// Module to control application life.
const app = electron.app

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
    const {Menu} = require('electron')

const template = [
    {
        label: 'View',
        submenu: [
            {
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click (item, focusedWindow) {
                    if (focusedWindow) focusedWindow.reload()
                }
            },{
                label: 'Toggle Developer Tools',
                accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                click (item, focusedWindow) {
                    if (focusedWindow) focusedWindow.webContents.toggleDevTools()
                }
            }
        ]
    },{
        role: 'window',
        submenu: [
            {role: 'minimize'},
            {role: 'close'},
            {type: 'separator'},
            {role: 'togglefullscreen'}
        ]
    },{
        role: 'help',
        submenu: [
            {
                label: 'Website',
                click () { require('electron').shell.openExternal('http://thierry.bugeat.com/myFeeds') }
            },{
                label: 'Git repository',
                click () { require('electron').shell.openExternal('https://framagit.org/thierry-bugeat/myFeeds') }
            },{
                label: 'Changelog',
                click () { require('electron').shell.openExternal('https://framagit.org/thierry-bugeat/myFeeds/blob/master/CHANGELOG') }
            },{
                type: 'separator'
            },{
                label: 'About',
                click () {
                    const {BrowserWindow} = require('electron')
                    let win = new BrowserWindow({width: 350, height: 300, frame: false})
                    win.on('closed', () => {win = null})
                    win.loadURL(`file://${__dirname}/electron/about.html`)
                    win.setMenu(null);
                    win.show();
                }
            }
        ]
    }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

  // Create the browser window.
  mainWindow = new BrowserWindow({width: 350, height: 650, icon: __dirname+'/www/img/icon-60.png'})

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/www/index.html`)

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
