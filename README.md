# Foodian Printer Proxy

로컬 네트워크 3D 프린터를 HTTPS 웹앱(goyoo.co.kr, foodian.co.kr)에서 안전하게 제어할 수 있는 로컬 프록시입니다.

---

## 🚀 주요 기능

- HTTPS 로컬 프록시 (https://localhost:9443)
- Mixed Content / CORS 해결
- 트레이 아이콘 백그라운드 실행
- 자동 부팅 실행
- 상태 확인 API (`/health`)

---

## ⚙️ 설치 및 실행

### 1️⃣ 종속성 설치

```bash
npm install
```

### 2️⃣ SSL 인증서 생성 (개발용)

```bash
openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -days 365 -out cert.pem
```

3️⃣ 프록시 서버 실행

```bash
npm start
```

4️⃣ 빌드 (Windows 실행파일 생성)

```bash
npm run build
```

빌드 후 dist/Goyoo Printer Proxy Setup.exe 생성

---

## 🌐 API 목록

| 경로      | 메서드 | 설명                       |
| --------- | ------ | -------------------------- |
| `/health` | GET    | 프록시 서버 상태 확인      |
| `/status` | GET    | 프록시 및 프린터 상태 확인 |
| `/print`  | POST   | 프린터로 출력 명령 전송    |

예시:

```bash
curl https://localhost:9443/health --insecure
```

---

## 💡 웹앱 연동 예시

```javascript
const res = await fetch('https://localhost:9443/health');
const data = await res.json();
console.log(data); // { status: 'running' }
```
