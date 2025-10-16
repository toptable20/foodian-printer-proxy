// main.js
import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import electron from 'electron';
import { startProxyServer } from './proxy.js';

// Windows 콘솔 UTF-8 인코딩 설정
process.env.PYTHONIOENCODING = 'utf-8';
process.env.LANG = 'ko_KR.UTF-8';

// ✅ 현재 실행 중인 파일 경로 계산
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// // ✅ Electron 윈도우 생성
// function createWindow() {
// 	const win = new BrowserWindow({
// 		width: 800,
// 		height: 600,
// 		webPreferences: {
// 			contextIsolation: true,
// 		},
// 	});

// 	win.loadURL('https://localhost:9443/health');
// }

let tray = null;

app.whenReady().then(() => {
	startProxyServer();

	const iconPath = path.join(process.cwd(), 'icon.png');
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

	tray.setToolTip('Goyoo 3D 프린터 프록시 실행 중');
	tray.setContextMenu(contextMenu);
});
