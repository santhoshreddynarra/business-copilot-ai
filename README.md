# Business Copilot AI

Business Copilot AI is an enterprise-grade semantic search and knowledge management platform. 
It ingests business documents (PDF, DOCX, TXT), chunks and vectors them, and allows users to query their knowledge base using advanced semantic search (RAG pipeline).

## Architecture

The system uses a modern RAG (Retrieval-Augmented Generation) pipeline:
1. **Frontend (Next.js)**: Dashboard and Search interfaces
2. **Backend (Express + Prisma)**: Handles Auth, Document Management, and Pipeline orchestration
3. **AI Service (FastAPI)**: Extract text, chunk documents, generate embeddings, and interface with vector DB
4. **Vector DB (Qdrant)**: Stores embeddings for fast semantic similarity search
5. **Database (PostgreSQL)**: Stores user data, document metadata, processing jobs, and metrics

### RAG Pipeline (Phase 5)
- **Embedding Model**: `sentence-transformers` (`all-MiniLM-L6-v2`, 384 dimensions)
- **Vector Index**: Qdrant with Cosine distance
- **Flow**: Upload -> Extract -> Clean -> Chunk -> Embed -> Index -> Semantic Search

## Getting Started

Start all services using Docker Compose:

```bash
docker-compose up -d
```

### Services
- **Backend API**: `http://localhost:4000`
- **AI Service**: `http://localhost:8000`
- **Frontend App**: `http://localhost:3000` (Start manually in `packages/frontend`)
- **Qdrant Vector DB**: `http://localhost:6333`
- **PostgreSQL**: `localhost:5432`

## Testing

Run tests in the backend package:
```bash
cd packages/backend
npm run test
```
