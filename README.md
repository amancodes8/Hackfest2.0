# Enterprise BRD AI Platform

Production-grade full-stack platform to transform raw business communication into enterprise BRDs.

## Stack
- Frontend: React 18 + Vite + Tailwind + Framer Motion + Zustand
- Backend: Node.js + Express + Multer + UUID + Gemini API (`@google/genai`)

## Quick Start
1. Copy environment variables:
   - `cp .env.example server/.env`
2. Set `GEMINI_API_KEY` in `server/.env`.
3. Install all dependencies:
   - `npm run install:all`
4. Start full platform:
   - `npm run dev`

Frontend: `http://localhost:5173`
Backend: `http://localhost:8000`

## API
- `POST /api/session`
- `POST /api/paste`
- `POST /api/upload`
- `POST /api/generate`
- `GET /api/progress?session_id=uuid`
- `GET /api/brd?session_id=uuid`
- `POST /api/chat`

## Notes
- Uploaded files support: `.txt`, `.md`, `.csv`
- BRD generation runs asynchronously with live stage progress
- Chatbot answers from generated BRD context
