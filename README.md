# Business Copilot AI

<div align="center">

![Business Copilot AI](https://img.shields.io/badge/Business%20Copilot-AI-6366f1?style=for-the-badge&logo=openai&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-dc143c?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**An enterprise-grade AI-powered knowledge management and semantic search platform.**  
Upload business documents, index them via a full RAG pipeline, and query your knowledge base with natural language.

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API Docs](#-api-reference) · [Contributing](#-contributing)

</div>

---

## ✨ Features

- 📄 **Document Ingestion** — Upload PDF, DOCX, and TXT files up to 50MB
- 🔍 **Semantic Search** — Vector similarity search powered by `sentence-transformers` and Qdrant
- 🤖 **RAG Pipeline** — Full Retrieval-Augmented Generation: Extract → Clean → Chunk → Embed → Index → Search
- 🔐 **Enterprise Auth** — JWT-based auth with refresh token rotation and RBAC (Admin / Manager / Analyst / Viewer)
- 🏢 **Multi-Tenant** — Tenant-scoped document storage and search results
- 📊 **Analytics Dashboard** — Real-time metrics on documents, searches, and system health
- 🛡️ **Security Hardened** — Helmet headers, rate limiting, Zod input validation

---

## 🏗 Architecture

```
┌─────────────────┐      ┌────────────────────┐      ┌──────────────────────┐
│   Next.js 15    │ ───▶ │  Express Backend    │ ───▶ │  FastAPI AI Service  │
│   (Frontend)    │      │  (Node.js + Prisma) │      │  (Python)            │
│  localhost:3000 │      │  localhost:4000     │      │  localhost:8000      │
└─────────────────┘      └────────────────────┘      └──────────────────────┘
                                  │                             │
                         ┌────────▼────────┐         ┌────────▼────────┐
                         │   PostgreSQL    │         │   Qdrant        │
                         │  (Metadata DB)  │         │  (Vector DB)    │
                         │  localhost:5432 │         │  localhost:6333 │
                         └─────────────────┘         └─────────────────┘
```

### RAG Pipeline

```
Upload → Extract Text → Clean → Chunk (512 tokens, 50 overlap)
      → Embed (all-MiniLM-L6-v2, 384 dims) → Index in Qdrant
      → Semantic Search → Ranked Results with Source Citations
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React, TanStack Query, Lucide Icons |
| Backend | Node.js, Express 5, Prisma ORM, TypeScript |
| AI Service | Python, FastAPI, sentence-transformers, PyMuPDF |
| Vector DB | Qdrant |
| Database | PostgreSQL 15 |
| Auth | JWT (RS256), bcrypt, refresh token rotation |
| Infra | Docker, Docker Compose |

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js 20+](https://nodejs.org/)
- [Python 3.10+](https://www.python.org/) (for local AI service dev)

### 1. Clone the repository

```bash
git clone https://github.com/santhoshreddynarra/business-copilot-ai.git
cd business-copilot-ai
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your secrets
```

Key variables to configure:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/business_copilot
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
```

### 3. Start infrastructure with Docker

```bash
docker-compose up -d postgres qdrant
```

### 4. Run database migrations

```bash
cd packages/backend
npx prisma migrate dev
npx prisma db seed   # Optional: load demo data
```

### 5. Start services

**Backend:**
```bash
cd packages/backend
npm install
npm run dev
```

**AI Service:**
```bash
cd packages/ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd packages/frontend
npm install
npm run dev
```

Or start everything at once:

```bash
docker-compose up -d
```

### 6. Open the app

Navigate to [http://localhost:3000](http://localhost:3000) and register your account. The **first registered user** automatically gets the `ADMIN` role.

---

## 📁 Project Structure

```
business-copilot-ai/
├── packages/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── controllers/   # Request handlers
│   │   │   ├── services/      # Business logic
│   │   │   ├── middleware/    # Auth, RBAC, error handling
│   │   │   ├── routes/        # API route definitions
│   │   │   ├── validators/    # Zod schemas
│   │   │   └── utils/         # Prisma client, helpers
│   │   └── prisma/            # Schema & migrations
│   ├── frontend/         # Next.js web app
│   │   └── src/
│   │       ├── app/           # App Router pages
│   │       ├── components/    # Reusable UI components
│   │       └── lib/           # API client, utilities
│   └── ai-service/       # FastAPI AI microservice
│       └── app/
│           ├── routers/       # API endpoints
│           └── services/      # Pipeline logic
├── docker-compose.yml
└── README.md
```

---

## 🔐 Authentication & RBAC

The platform uses JWT-based authentication with role-based access control:

| Role | Permissions |
|------|-------------|
| `ADMIN` | Full access — manage users, delete docs, view all tenants |
| `MANAGER` | Upload & process documents, view analytics |
| `ANALYST` | Search and view documents |
| `VIEWER` | Read-only search access |

**Token Strategy:**
- **Access Token**: 15-minute expiry (JWT, HS256)
- **Refresh Token**: 7-day expiry, stored in DB for revocation

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Register a new user |
| `POST` | `/api/auth/login` | ❌ | Login and get tokens |
| `POST` | `/api/auth/refresh` | ❌ | Rotate refresh token |
| `POST` | `/api/auth/logout` | ✅ | Invalidate session |
| `GET` | `/api/auth/me` | ✅ | Get current user profile |
| `GET` | `/api/documents` | ✅ | List user's documents |
| `POST` | `/api/documents/upload` | ✅ MANAGER+ | Upload a document |
| `POST` | `/api/documents/:id/process` | ✅ MANAGER+ | Trigger RAG pipeline |
| `DELETE` | `/api/documents/:id` | ✅ ADMIN | Delete document |
| `POST` | `/api/search` | ✅ | Semantic search |
| `GET` | `/api/search/metrics` | ✅ | Search analytics |
| `GET` | `/api/system/health` | ❌ | System health check |

---

## 🧪 Testing

```bash
# Backend unit + integration tests
cd packages/backend
npm test

# Run with coverage
npm test -- --coverage
```

---

## 🤝 Contributing

---

## 🙌 Contributors

- **Santhosh Reddy Narra** – Project Owner
- **Antigravity AI** – Stabilization and bug fixes (automated contributions)
- **[Your Name]** – Contributor (add yourself here)

See the full list in [CONTRIBUTORS.md](CONTRIBUTORS.md).

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
