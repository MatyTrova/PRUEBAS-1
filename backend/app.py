from flask import Flask, jsonify, request, send_from_directory, render_template, redirect, url_for, session
from flask_cors import CORS
from flask_caching import Cache
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from textblob import TextBlob
from datetime import datetime, timedelta
from collections import deque
import numpy as np
import torch
import json
import os
import warnings
import unicodedata
import re
import pandas as pd
import requests
from requests.auth import HTTPBasicAuth
import io
from werkzeug.security import generate_password_hash, check_password_hash
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField
from wtforms.validators import DataRequired, Email, Length
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import bleach
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask_wtf.csrf import CSRFProtect
import pickle
# En tu archivo Flask, modifica estas líneas
from flask_wtf.csrf import CSRFProtect, generate_csrf
import random
import re
from functools import lru_cache
import gunicorn


warnings.filterwarnings("ignore", category=UserWarning)

app = Flask(__name__, static_folder='../frontend/static')
CORS(app)
cache = Cache(app, config={'CACHE_TYPE': 'simple'})
app.config['SECRET_KEY'] = 'tu_clave_secreta'
csrf = CSRFProtect(app)

# Agrega esta nueva ruta para obtener el token CSRF
@app.route('/api/get-csrf-token')
def get_csrf_token():
    token = generate_csrf()
    return jsonify({'csrf_token': token})

@app.route('/')
@csrf.exempt  # Esto exime a esta ruta de la protección CSRF
@cache.cached(timeout=300)  # Cachear por 5 minutos
def index():
    form = ContactForm()  # Crear una instancia del    
    # return send_from_directory('../frontend', 'index.html', form=form)
    return render_template('index.html', form=form)  # Pasar el formulario al contexto

@app.route('/<path:filename>')
@csrf.exempt  # Esto exime a esta ruta de la protección CSRF
def serve_html(filename):
    return send_from_directory('../frontend', filename)
    
@app.route('/static/<path:path>')
@csrf.exempt  # Esto exime a esta ruta de la protección CSRF
def serve_static(path):
    response = send_from_directory('../frontend/static', path)
    response.headers['Cache-Control'] = 'public, max-age=31536000'
    return response

# Para enviar correos
class ContactForm(FlaskForm):
    correo = StringField('Correo Electrónico', [
        DataRequired(), 
        Email(message='Email inválido'),
        Length(max=120)
    ])
    mensaje = TextAreaField('Mensaje', [
        DataRequired(),
        Length(min=10, max=1600)
    ])

@app.route('/send', methods=['POST'])
def send_email():
    form = ContactForm(request.form)
    if form.validate():
        # Obtener los datos del formulario
        email = bleach.clean(request.form.get('correo'))
        message = bleach.clean(request.form.get('mensaje'))

        try:
            sender_email = "paginaweb301@gmail.com"
            receiver_email = "trovattomatias97@gmail.com"
            password = "lhec dvux sopu xseu"  # Si usas Gmail, configura una contraseña de app

            msg = MIMEMultipart()
            msg['From'] = sender_email
            msg['To'] = receiver_email
            msg['Subject'] = 'Nuevo mensaje desde el formulario de contacto'
            msg.attach(MIMEText(f"Mensaje de {email}:\n\n{message}", 'plain', 'utf-8'))

            with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
                server.login(sender_email, password)
                server.sendmail(sender_email, receiver_email, msg.as_string())

            return render_template('response.html',
                success=True,
                title='¡Mensaje Enviado!',
                message='Gracias por tu mensaje. Te responderé a la brevedad 😊.'
            )
        
        except Exception as e:
            # En caso de error al enviar el correo
            return render_template('response.html',
                success=False,
                title='Error al Enviar',
                message=f'Ocurrió un error al enviar el mensaje: {str(e)}'
            )
    else:
        # Mostrar errores de validación
        errors = []
        for field, field_errors in form.errors.items():
            errors.extend(field_errors)
        
        return render_template('response.html',
            success=False,
            title='Error al enviar',
            message='Por favor corrige los siguientes errores: ' + ', '.join(errors)
        )

# PARA EL CHATBOT
@cache.memoize(timeout=3600)  # Cachear por 1 hora
def load_model_and_data():
    with open("chatbot_model.pkl", 'rb') as model_file:
        model_data = pickle.load(model_file)
    
    with open('chatbot_data.json', 'r', encoding='utf-8') as f:
        training_data = json.load(f)
        
    return model_data, training_data

# Compilar las expresiones regulares una sola vez
WORD_PATTERN = re.compile(r'\w+')
NUMBER_PATTERN = re.compile(r'\d+')

@lru_cache(maxsize=1000)  # Cachear los últimos 1000 inputs procesados
def spanish_tokenizer(text):
    if not isinstance(text, str):
        return []
    text = text.lower()
    text = ''.join(c for c in unicodedata.normalize('NFD', text) 
                   if unicodedata.category(c) != 'Mn')
    text = WORD_PATTERN.findall(text)
    return [word for word in text if not NUMBER_PATTERN.match(word)]

# Función para predecir la respuesta basada en la entrada del usuario
def predict_response(user_input):
    # Cargar el modelo entrenado
    model_data, training_data = load_model_and_data()  
    
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
        fallback_responses = training_data.get("fallbacks", [])
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
def get_follow_up(user_input):
    # Cargar el modelo entrenado
    model_data, training_data = load_model_and_data()  
    
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

# Modifica tu ruta de chat para eximir de CSRF si lo prefieres
@app.route('/api/chat', methods=['POST'])
@csrf.exempt  # Esto exime a esta ruta de la protección CSRF
def chat():
    try:
        if not request.is_json:
            return jsonify({"error": "Solicitud debe ser JSON"}), 400
        
        data = request.json
        user_input = data.get('question', '').strip()
        
        # Aquí va tu lógica existente
        respuesta = predict_response(user_input)
        # Obtener posibles preguntas de seguimiento
        follow_up = get_follow_up(user_input)

        intro_phrases = [
            "También puedes preguntarme:",
            "Otras preguntas que podrías hacerme:",
            "Aquí tienes algunas ideas:",
            "¿Te interesa saber sobre esto también?"
        ]
        if len(follow_up) > 0:
            # Selecciona una frase aleatoria del listado
            intro = random.choice(intro_phrases)
            # Construye la respuesta con la introducción en negrita y los follow-ups normales
            response = f"{respuesta}.<br><br><strong>{intro}</strong><br>"
            response += "".join(f"- {item}<br>" for item in follow_up)
        else:
            response = f"{respuesta}"
          

        return jsonify({
            "success": True,
            "response": response
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
    

# Configuración de caché para archivos estáticos
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000  # 1 año en segundos

@app.after_request
def add_header(response):
    if 'Cache-Control' not in response.headers:
        response.headers['Cache-Control'] = 'public, max-age=31536000'
    return response


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Render asigna el puerto dinámicamente
    app.run(host='0.0.0.0', port=port)
    

