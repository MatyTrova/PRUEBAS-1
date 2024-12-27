import json
import numpy as np
import pickle
import unicodedata
import re
from sklearn.feature_extraction.text import TfidfVectorizer

# Función para tokenizar el texto en español
def spanish_tokenizer(text):
    if not isinstance(text, str):
        return []
    text = text.lower()
    text = ''.join(c for c in unicodedata.normalize('NFD', text) 
                   if unicodedata.category(c) != 'Mn')
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\d+', '', text)
    return text.split()

# Función para entrenar el chatbot con datos en formato JSON
def train_chatbot(training_data_file='chatbot_data.json'):
    # Cargar los datos de entrenamiento desde el archivo JSON
    with open(training_data_file, 'r', encoding='utf-8') as f:
        training_data = json.load(f)
    
    # Inicializar listas para los textos de entrada y las respuestas asociadas
    input_texts = []
    input_to_conv = {}
    follow_up_map = {}
    
    # Iterar sobre las conversaciones para extraer los textos y las respuestas
    for idx, conv in enumerate(training_data["conversations"]):
        # Añadir el texto principal de la entrada
        input_texts.append(conv["input"])
        input_to_conv[conv["input"]] = idx
        
        # Añadir las alternativas (sin repeticiones)
        if "alternatives" in conv:
            for alt in conv["alternatives"]:
                if alt not in input_to_conv:
                    input_texts.append(alt)
                    input_to_conv[alt] = idx
        
        # Crear mapeo de 'follow_up' para respuestas adicionales
        if "follow_up" in conv:
            follow_up_map[conv["input"]] = conv["follow_up"]
    
    # Inicializar el vectorizador TF-IDF con un tokenizador en español
    vectorizer = TfidfVectorizer(
        tokenizer=spanish_tokenizer,
        min_df=1,         # Para incluir todas las palabras, incluso si se repiten solo una vez
        ngram_range=(1, 2)  # Utiliza unigramas y bigramas
    )
    tfidf_matrix = vectorizer.fit_transform(input_texts)
    
    # Guardar los componentes del modelo
    model_data = {
        'vectorizer': vectorizer,
        'tfidf_matrix': tfidf_matrix,
        'input_texts': input_texts,
        'input_to_conv': input_to_conv,
        'follow_up_map': follow_up_map
    }
    
    # Guardar el modelo entrenado en un archivo
    with open('chatbot_model.pkl', 'wb') as model_file:
        pickle.dump(model_data, model_file)
    
    print("Modelo entrenado y guardado con éxito.")

# Función para predecir la respuesta basada en la entrada del usuario
# Función para predecir la respuesta basada en la entrada del usuario
def predict_response(user_input, model_file='chatbot_model.pkl', training_data_file='chatbot_data.json'):
    # Cargar el modelo entrenado
    with open(model_file, 'rb') as model_file:
        model_data = pickle.load(model_file)

    # Cargar los datos de entrenamiento desde el archivo JSON
    with open(training_data_file, 'r', encoding='utf-8') as f:
        training_data = json.load(f)    
    
    # Preprocesar la entrada del usuario utilizando el tokenizador
    vectorizer = model_data['vectorizer']
    input_texts = model_data['input_texts']
    input_to_conv = model_data['input_to_conv']
    
    user_input_tfidf = vectorizer.transform([user_input])
    
    # Calcular la similitud de coseno entre la entrada del usuario y los textos entrenados
    cosine_similarities = np.dot(user_input_tfidf, model_data['tfidf_matrix'].T).toarray().flatten()
    best_match_index = cosine_similarities.argmax()  # Obtener el índice del texto más similar
    
    # Obtener el umbral de similitud (por ejemplo, 0.3) y verificar si la similitud es baja
    threshold = 0.3  # Puedes ajustar este valor según lo que consideres como una respuesta no adecuada
    if cosine_similarities[best_match_index] < threshold:
        # Elegir una respuesta aleatoria de las respuestas de fallback en los datos de entrenamiento
        fallback_responses = training_data.get("fallback_responses", [])
        if fallback_responses:
            return np.random.choice(fallback_responses)
        else:
            return "Lo siento, no estoy seguro de cómo responder a eso. ¿Puedes reformular tu pregunta?"

    # Obtener la respuesta asociada si la similitud es suficiente
    response_index = input_to_conv[input_texts[best_match_index]]
    response = training_data["conversations"][response_index]["responses"]
    
    # Seleccionar una respuesta aleatoria de las posibles respuestas
    return np.random.choice(response)


# Función para obtener posibles preguntas de seguimiento (follow-up)
def get_follow_up(user_input, model_file='chatbot_model.pkl'):
    # Cargar el modelo entrenado
    with open(model_file, 'rb') as model_file:
        model_data = pickle.load(model_file)
    
    input_texts = model_data['input_texts']
    input_to_conv = model_data['input_to_conv']
    follow_up_map = model_data['follow_up_map']
    
    # Encontrar el índice de la conversación más cercana
    user_input_tfidf = model_data['vectorizer'].transform([user_input])
    cosine_similarities = np.dot(user_input_tfidf, model_data['tfidf_matrix'].T).toarray().flatten()
    best_match_index = cosine_similarities.argmax()
    
    # Obtener la entrada más cercana y su mapeo de follow-up
    best_input = input_texts[best_match_index]
    follow_up = follow_up_map.get(best_input, [])
    
    return follow_up

# Entrenar el modelo con los datos
train_chatbot('chatbot_data.json')

# Predecir la respuesta basada en una entrada del usuario
user_input = "cuales son tus soft skills?"
response = predict_response(user_input)
print(f"Respuesta: {response}")

# Obtener posibles preguntas de seguimiento
follow_up_questions = get_follow_up(user_input)
print(f"Posibles preguntas de seguimiento: {follow_up_questions}")
