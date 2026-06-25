from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import extraction, vector, search
from app.services.qdrant_service import init_qdrant, get_qdrant_client

app = FastAPI(title="Business Copilot AI - Service")

@app.on_event("startup")
def startup_event():
    init_qdrant()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extraction.router, prefix="/api/v1")
app.include_router(vector.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/vector/health")
def vector_health_check():
    client = get_qdrant_client()
    try:
        client.get_collections()
        qdrant_status = "connected"
    except Exception:
        qdrant_status = "disconnected"
    return {"status": "ok", "qdrant": qdrant_status, "model_loaded": True}
