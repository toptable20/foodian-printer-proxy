// proxy.js
import express from 'express';
import https from 'https';
import fs from 'fs';
import fetch from 'node-fetch';
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';

// Windows 콘솔 UTF-8 인코딩 설정
if (process.platform === 'win32') {
	process.stdout.setDefaultEncoding('utf8');
	process.stderr.setDefaultEncoding('utf8');
}

const app = express();
app.use(express.json());

// multer 설정 (메모리에 파일 저장)
const upload = multer({ storage: multer.memoryStorage() });

// ✅ CORS 허용 설정
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*'); // 모든 출처 허용
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});

// ✅ 현재 실행 중인 파일 경로 계산
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ key, cert 절대경로 지정 (빌드 후에도 정상 인식)
const keyPath = path.join(__dirname, '../cert/key.pem');
const certPath = path.join(__dirname, '../cert/cert.pem');

// 🔐 HTTPS 인증서 로드
const options = {
	key: fs.readFileSync(keyPath),
	cert: fs.readFileSync(certPath),
};

// 서버 상태 확인 API
app.get('/health', (req, res) => {
	res.json({ status: 'running' });
});

// ✅ 상태 확인 API
// 프린터 URL 쿼리 파라미터로 전달 필요
app.get('/status', async (req, res) => {
	try {
		// 프린터가 응답하는지 확인
		const PRINTER_URL = req.query.printerUrl;
		if (!PRINTER_URL) {
			console.error('❌ /status - printerUrl 쿼리 파라미터 누락');
			return res
				.status(400)
				.json({ error: 'printerUrl 쿼리 파라미터가 필요합니다.' });
		}
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 1500);

		let statusText;
		try {
			const response = await fetch(`${PRINTER_URL}/server/info`, { signal: controller.signal });
			statusText = await response.text();
		} catch (err) {
			if (err.name === 'AbortError') {
				throw new Error('Time OUT!!!');
			} else {
				throw err;
			}
		} finally {
			clearTimeout(timeoutId);
		}
		res.status(200).json({
			proxy: 'ok',
			printer: 'ok',
			message: statusText,
		});
	} catch (e) {
		console.error('status - printer connect fail:', e.message);
		res.status(500).json({
			proxy: 'ok',
			printer: 'unreachable',
			message: 'printer connect fail',
			error: e.message
		});
	}
});

// GCode 업로드 + 프린트 시작 API
// 프린터 IP, 포트, 파일명, GCode 내용(body) 전달 필요
app.post('/upload', upload.single('file'), async (req, res) => {
	try {
		// GCode 업로드
		const PRINTER_URL = req.query.printerUrl;
		if (!PRINTER_URL) {
			console.error('❌ /upload - printerUrl 쿼리 파라미터 누락');
			return res
				.status(400)
				.json({ error: 'printerUrl 쿼리 파라미터가 필요합니다.' });
		}

		const file = req.file;
		if (!file) {
			console.error('❌ /upload - file 데이터 누락');
			return res.status(400).json({ error: 'file이 필요합니다.' });
		}

		const formData = new FormData();
		// multer로 받은 파일을 Blob으로 변환하여 전송
		const blob = new Blob([file.buffer], { type: 'application/octet-stream' });
		formData.append('file', blob, file.originalname);

		const result = await fetch(`${PRINTER_URL}/server/files/upload`, {
			method: 'POST',
			body: formData,
		});
		if (result.status === 403) {
			console.error('❌ /upload - 업로드 실패: 이미 출력 진행 중');
			return res.status(403).json({ error: '이미 출력 진행 중' });
		} else if (!result.ok) {
			console.error(`❌ /upload - 업로드 실패: HTTP ${result.status}`);
			return res.status(result.status).json({ error: '업로드 실패' });
		}

		// 업로드 후 프린트 시작
		const GCODE_FILE_NAME = encodeURIComponent(file.originalname);
		const startResponse = await fetch(
			`${PRINTER_URL}/printer/print/start?filename=${GCODE_FILE_NAME}`,
			{
				method: 'POST',
			},
		);
		if (result.status === 403) {
			console.error('❌ /upload - 프린트 시작 실패: 이미 출력 진행 중');
			return res.status(403).json({ error: '이미 출력 진행 중' });
		} else if (!startResponse.ok) {
			console.error(
				`❌ /upload - 프린트 시작 실패: HTTP ${startResponse.status}`,
			);
			return res
				.status(startResponse.status)
				.json({ error: '프린트 시작 실패' });
		}
		res.send(startResponse);
	} catch (err) {
		console.error('❌ 프린터 통신 실패:', err);
		res.status(500).send('프린터와 통신 실패');
	}
});

// 서버 시작 함수 export
export function startProxyServer() {
	let port = 9443;
	https.createServer(options, app).listen(port, () => {
		console.log('Local HTTPS proxy running at https://localhost:'+port);
	});
}
