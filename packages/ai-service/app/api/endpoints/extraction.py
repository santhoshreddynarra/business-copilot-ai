from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.extractor import extract_text
from app.services.cleaner import clean_text
from app.services.chunker import chunk_text

router = APIRouter()

@router.post("/extract-and-chunk")
async def extract_and_chunk(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        raw_text = extract_text(file_bytes, file.filename, file.content_type)
        cleaned_text = clean_text(raw_text)
        chunks = chunk_text(cleaned_text, file.filename)
        
        return {
            "raw_text": raw_text,
            "clean_text": cleaned_text,
            "word_count": len(cleaned_text.split()),
            "chunks": chunks
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
