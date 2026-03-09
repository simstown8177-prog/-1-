
# 스토리북 운영 시스템

Firebase Firestore를 공유 저장소로 사용하는 Vite 프로젝트입니다.

## 실행

npm install
cp .env.example .env.local
npm run dev

`.env.local`에는 Firebase Web App 설정값을 넣어야 합니다.

필수 환경변수:
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

## Firestore

- 컬렉션 이름: `tasks`
- 문서 필드: `title`, `owner`, `store`, `year`, `month`, `startDay`, `endDay`, `memo`, `percent`, `createdAt`, `updatedAt`

개발 중 빠르게 확인하려면 Firestore Database를 만들고 적절한 보안 규칙을 설정해야 합니다.

## 배포

vercel.com 접속 → Import Project → GitHub → Deploy
