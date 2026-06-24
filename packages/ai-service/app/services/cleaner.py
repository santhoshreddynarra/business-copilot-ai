import re

def clean_text(text: str) -> str:
    # Remove null bytes
    text = text.replace('\x00', '')
    # Replace multiple spaces with a single space
    text = re.sub(r'[ \t]+', ' ', text)
    # Replace 3 or more newlines with exactly 2 newlines (paragraph boundary)
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Strip leading/trailing whitespace
    return text.strip()
