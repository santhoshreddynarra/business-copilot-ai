from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.embedder import generate_embeddings
from app.services.qdrant_db import get_qdrant_client, COLLECTION_NAME
from qdrant_client.http import models
import uuid

router = APIRouter()
qdrant = get_qdrant_client()

class ChunkInput(BaseModel):
    id: str
    content: str
    chunk_index: int
    metadata: dict

class VectorizeRequest(BaseModel):
    user_id: str
    document_id: str
    chunks: list[ChunkInput]

@router.post("/vectorize")
def vectorize_document(request: VectorizeRequest):
    try:
        # Extract texts for embedding
        texts = [chunk.content for chunk in request.chunks]
        
        # Generate embeddings in one batch
        embeddings = generate_embeddings(texts)
        
        # Prepare Qdrant points
        points = []
        for i, chunk in enumerate(request.chunks):
            # We use a deterministically generated UUID or just let Qdrant generate it
            # But Qdrant requires UUID or UInt64 for IDs. Let's generate a UUID from chunk ID.
            point_id = str(uuid.uuid5(uuid.NAMESPACE_OID, chunk.id))
            
            payload = {
                "user_id": request.user_id,
                "document_id": request.document_id,
                "chunk_index": chunk.chunk_index,
                "chunk_id": chunk.id,
                "content": chunk.content,
                "metadata": chunk.metadata
            }
            
            points.append(
                models.PointStruct(
                    id=point_id,
                    vector=embeddings[i],
                    payload=payload
                )
            )
            
        # Upsert into Qdrant
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )
        
        return {"status": "success", "vectorized_chunks": len(points)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
