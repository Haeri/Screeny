const electron 			= require('electron');
const BrowserWindow 	= electron.BrowserWindow;
const Menu 				= electron.Menu;
const Tray 				= electron.Tray;
const app				= electron.app;
const globalShortcut 	= electron.globalShortcut;

const fs 		= require('fs');
const url 		= require('url');
const path 		= require('path');

let mainWindow 	= null;
let tray 		= null

const FULL_SCREENSHOT_ACC 	= 'PrintScreen';
const SNIP_SCREENSHOT_ACC 	= 'CommandOrControl+PrintScreen';
const COLOR_PICKER_ACC 		= 'CommandOrControl+PageUp';

//app.commandLine.appendSwitch('high-dpi-support', 1)
//app.commandLine.appendSwitch('force-device-scale-factor', 1)


app.once('ready', function(){

	// Create new Window
	mainWindow = new BrowserWindow({
		frame: false,
		fullscreen: true,
		show: false,
		icon: './res/icon.png',
		webPreferences: {
			//zoomFactor: 1,
			//backgroundThrottling: false,
		},

	});

	// Load html into window
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}));


	// Show window
	mainWindow.once('ready-to-show', function() {
		// "Capture" key
		globalShortcut.register(FULL_SCREENSHOT_ACC, function() {
			mainWindow.webContents.executeJavaScript('ss.partCapture();');
		});

		// "Close" key
		globalShortcut.register('Escape', function() {
			console.log("HIDE");
			mainWindow.webContents.executeJavaScript('ss.hide();');
		});

		//mainWindow.webContents.openDevTools();
		mainWindow.webContents.setZoomFactor(0.8)
  	});

	mainWindow.once('closed', function() {
		mainWindow = null;
	});
    
    
	// Create try
	tray = new Tray('./res/icon.png');
	const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Full Screenshot',
        //acceleratior: 'CommandOrControl+L',
        click: function(){mainWindow.webContents.executeJavaScript('ss.partCapture();');}
      },
      {
        label: 'Snip Screenshot',
        //acceleratior: 'CommandOrControl+L',
        click: function(){mainWindow.webContents.executeJavaScript('ss.partCapture();');}
      },
      {
        label: 'Color Picker',
        //acceleratior: 'CommandOrControl+L',
        click: function(){mainWindow.webContents.executeJavaScript('ss.partCapture();');}
      },
      {
        label: 'Settings',
        //acceleratior: 'CommandOrControl+L',
        click: function(){mainWindow.webContents.executeJavaScript('console.log("open settings")');}
      },
      {
      	type: 'separator'
      },
      {
        role: 'quit'
      }

    ]);
	tray.setToolTip('Press ' + SNIP_SCREENSHOT_ACC + ' to take a partial screenshot');
	tray.setContextMenu(contextMenu);
});

app.once('will-quit', function() {
	globalShortcut.unregisterAll();
	console.log("Application Exited");
});