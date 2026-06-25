import os
from qdrant_client import QdrantClient
from qdrant_client.http import models

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
COLLECTION_NAME = "document_chunks"
VECTOR_SIZE = 384 # all-MiniLM-L6-v2 dimension

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

def init_qdrant():
    try:
        client.get_collection(collection_name=COLLECTION_NAME)
    except Exception:
        # Collection doesn't exist, create it
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=VECTOR_SIZE,
                distance=models.Distance.COSINE
            )
        )
        # Create payload indexes for fast filtering
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="user_id",
            field_schema=models.PayloadSchemaType.KEYWORD
        )
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="document_id",
            field_schema=models.PayloadSchemaType.KEYWORD
        )

def get_qdrant_client():
    return client
