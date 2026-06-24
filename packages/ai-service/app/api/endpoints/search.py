from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.embedder import generate_embeddings
from app.services.qdrant_db import get_qdrant_client, COLLECTION_NAME
from qdrant_client.http import models

router = APIRouter()
qdrant = get_qdrant_client()

class SearchQuery(BaseModel):
    query: str
    user_id: str
    document_id: Optional[str] = None
    top_k: int = 5

@router.post("/search")
def search_documents(request: SearchQuery):
    try:
        # Generate embedding for the search query
        query_vector = generate_embeddings([request.query])[0]
        
        # Build filter conditions
        must_conditions = [
            models.FieldCondition(
                key="user_id",
                match=models.MatchValue(value=request.user_id)
            )
        ]
        
        # Optional document isolation
        if request.document_id:
            must_conditions.append(
                models.FieldCondition(
                    key="document_id",
                    match=models.MatchValue(value=request.document_id)
                )
            )
            
        search_filter = models.Filter(must=must_conditions)
        
        # Execute search in Qdrant
        search_result = qdrant.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            query_filter=search_filter,
            limit=request.top_k
        )
        
        results = []
        for scored_point in search_result:
            results.append({
                "score": scored_point.score,
                "payload": scored_point.payload
            })
            
        return {"status": "success", "results": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
