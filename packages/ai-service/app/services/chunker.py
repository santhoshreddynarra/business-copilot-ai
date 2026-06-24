from langchain.text_splitter import RecursiveCharacterTextSplitter

def chunk_text(text: str, filename: str) -> list[dict]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""]
    )
    
    docs = splitter.create_documents([text], metadatas=[{"source": filename}])
    
    chunks = []
    for i, doc in enumerate(docs):
        chunks.append({
            "content": doc.page_content,
            "chunk_index": i,
            "metadata": doc.metadata,
            "char_length": len(doc.page_content)
        })
        
    return chunks
