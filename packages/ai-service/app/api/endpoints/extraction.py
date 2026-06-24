from fastapi import APIRouter

router = APIRouter()

@router.post("/extract-and-chunk")
def extract_and_chunk():
    return {"message": "Placeholder for extraction and chunking"}
