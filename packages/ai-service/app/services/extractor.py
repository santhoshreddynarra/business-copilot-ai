import pdfplumber
import docx
import io

def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join([paragraph.text for paragraph in doc.paragraphs])

def extract_text_from_txt(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode('utf-8')
    except UnicodeDecodeError:
        return file_bytes.decode('windows-1252', errors='replace')

def extract_text(file_bytes: bytes, filename: str, mimetype: str) -> str:
    if mimetype == 'application/pdf' or filename.lower().endswith('.pdf'):
        return extract_text_from_pdf(file_bytes)
    elif mimetype == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or filename.lower().endswith('.docx'):
        return extract_text_from_docx(file_bytes)
    elif mimetype == 'text/plain' or filename.lower().endswith('.txt'):
        return extract_text_from_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {mimetype}")
