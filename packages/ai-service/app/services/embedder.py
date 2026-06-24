import os
from openai import OpenAI

# Initialize the OpenAI client
# It automatically picks up the OPENAI_API_KEY environment variable
client = OpenAI()

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    
    response = client.embeddings.create(
        input=texts,
        model="text-embedding-3-small"
    )
    
    # Extract the embeddings from the response
    return [data.embedding for data in response.data]
