# 🔮 온라인 사주 서비스 (saju-project)

생년월일시를 입력하면 사주팔자(연주·월주·일주·시주)를 계산해주는 웹 서비스입니다.
한국천문연구원(KASI) 데이터를 기반으로 절기·음력을 정확히 반영하여 계산합니다.

## ✨ 주요 기능

- 양력 생년월일시 입력을 통한 사주 4기둥(연주/월주/일주/시주) 계산
- 진태양시 보정, 야자시/조자시 구분 등 명리학 정확도 반영
- 조회 기록 저장 및 최근 기록 조회
- 반응형 웹 UI

## 🛠 기술 스택

**Backend**
- Python, FastAPI
- SQLAlchemy (ORM), MySQL (AWS RDS)
- [korean-saju](https://pypi.org/project/korean-saju/) — 사주 계산 엔진

**Frontend**
- React (Vite)
- Tailwind CSS

**Infra**
- AWS EC2, RDS, Route53
- Nginx, Let's Encrypt (HTTPS)

## 📁 프로젝트 구조

saju-project/
├── main.py # FastAPI 앱, 라우터
├── saju.py # 사주 계산 로직
├── database.py # DB 연결 설정
├── models.py # DB 테이블 모델
├── requirements.txt
└── saju-frontend/ # React 프론트엔드
├── src/
│ ├── App.jsx
│ └── ...
└── package.json

## 🚀 실행 방법

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# .env 파일 생성 후 DATABASE_URL 설정
uvicorn main:app --reload
```

### Frontend

```bash
cd saju-frontend
npm install
npm run dev
```

## 📖 API 문서

백엔드 서버 실행 후 `/docs`에서 Swagger UI로 전체 API 명세를 확인할 수 있습니다.

## 👥 팀

| 이름 | 역할 |
|---|---|
| 유영환 | Backend, Infra/DevOps (AWS 배포) |
| 조형진 | Frontend |

## 📄 License

MIT
