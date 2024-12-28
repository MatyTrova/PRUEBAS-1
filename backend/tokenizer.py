import unicodedata
import re

def spanish_tokenizer(text):
    if not isinstance(text, str):
        return []
    text = text.lower()
    text = ''.join(c for c in unicodedata.normalize('NFD', text) 
                   if unicodedata.category(c) != 'Mn')
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\d+', '', text)
    return text.split()