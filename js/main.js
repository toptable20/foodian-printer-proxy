// main.js
import { app, Tray, Menu, nativeImage, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import electron from 'electron';
import { startProxyServer } from './proxy.js';

app.on("window-all-closed", () => {
  app.quit();
});

// Windows 콘솔 UTF-8 인코딩 설정
process.env.PYTHONIOENCODING = 'utf-8';
process.env.LANG = 'ko_KR.UTF-8';

// ✅ 현재 실행 중인 파일 경로 계산
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;

process.on("uncaughtException", err => {
  console.error("🔥 UNCAUGHT:", err.stack);
});


// ✅ Electron 윈도우 생성
function createWindow() {
	win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			webSecurity: false, // SSL 인증서 오류 무시
		},
	});
	win.loadFile(path.join(__dirname, '../html/index.html'));
	// win.webContents.openDevTools();
}

let tray = null;

if (!app.isPackaged) {
	// 개발 환경 (npm start)
	app.setAsDefaultProtocolClient(
		"FoodianPrinterProxy",
		process.execPath,
		[path.resolve(process.argv[1])]
	);
} else {
	// 설치된 exe
	app.setAsDefaultProtocolClient("FoodianPrinterProxy"); // FoodianPrinterProxy://open
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
	app.quit();
} else {
	app.on("second-instance", () => { 
		if (win) { 
			if (win.isMinimized()) win.restore();
			win.focus();
		}
	});

	app.whenReady().then(() => {
		startProxyServer();
		createWindow();

		ipcMain.on('open-external', (event, url) => {
			shell.openExternal(url);
		});

		const iconPath = path.join(process.cwd(), '/css/image/icon.png');
		const trayIcon = nativeImage.createFromPath(iconPath);
		tray = new Tray(trayIcon);

		const contextMenu = Menu.buildFromTemplate([
			{ label: '서버 상태: 실행 중 ✅', enabled: false },
			{
				label: '상태 확인 (브라우저에서 열기)',
				click: () => {
					electron.shell.openExternal('https://localhost:9443/health');
				},
			},
			{ type: 'separator' },
			{
				label: '종료',
				click: () => app.quit(),
			},
		]);

		tray.setToolTip('Foodian 3D 프린터 프록시 실행 중');
		tray.setContextMenu(contextMenu);
	});
}
