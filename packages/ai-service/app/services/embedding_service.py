import os
from sentence_transformers import SentenceTransformer

# Load the model globally so it's loaded only once
model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
model = None

def get_model():
    global model
    if model is None:
        model = SentenceTransformer(model_name)
    return model

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    
    m = get_model()
    # Generate embeddings in batches
    embeddings = m.encode(texts, batch_size=32, convert_to_numpy=True)
    
    # Convert numpy arrays to lists
    return embeddings.tolist()
