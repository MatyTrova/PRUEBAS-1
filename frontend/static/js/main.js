
// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('effectsCanvas');
    const effects = new VisualEffects(canvas);
    const themeManager = new ThemeManager(effects);

    // Manejar resize del canvas
    window.addEventListener('resize', () => {
        effects.resize();
        effects.stopAnimation();
        themeManager.updateTheme(themeManager.currentTheme);
    });

    // Renderizar proyectos
    const projectsContainer = document.getElementById('projects-container');
    projects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.className = 'project-card';
        projectElement.innerHTML = `
            <img src="${project.image}" alt="${project.title}">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="technologies">
                ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
            </div>
        `;
        projectsContainer.appendChild(projectElement);
    });

    // Manejar el formulario de contacto
    // const contactForm = document.getElementById('contact-form');
    // contactForm.addEventListener('submit', async (e) => {
    //     e.preventDefault();
    //     const email = document.getElementById('email').value;
    //     const message = document.getElementById('message').value;

    //     try {
    //         const response = await fetch('http://localhost:5000/api/contact', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ email, message })
    //         });

    //         if (response.ok) {
    //             alert('Mensaje enviado exitosamente');
    //             contactForm.reset();
    //         } else {
    //             throw new Error('Error al enviar el mensaje');
    //         }
    //     } catch (error) {
    //         alert('Error al enviar el mensaje: ' + error.message);
    //     }
    // });
});

// Seleccionar los elementos
const skillsSection = document.getElementById('skills');
const contacto = document.getElementById('contact');
const projectsSection = document.getElementById('projects');
const sectionTitle = document.querySelectorAll('.section-title'); // Cambiado a querySelectorAll

// Función para manejar el efecto de scroll
window.addEventListener('scroll', () => {
    const scrollPosition = window.pageYOffset;

    // Efecto de acercamiento en skillsSection y sus elementos internos
    if (scrollPosition >= skillsSection.offsetTop - window.innerHeight + 200) {
        skillsSection.classList.add('appear');
        document.querySelectorAll('.skill-card').forEach(card => {
            card.classList.add('appear');
        });
    } else {
        skillsSection.classList.remove('appear');
        document.querySelectorAll('.skill-card').forEach(card => {
            card.classList.remove('appear');
        });
    }

    // Efecto de acercamiento en projectsSection y en cada project-card
    if (scrollPosition >= projectsSection.offsetTop - window.innerHeight + 200) {
        projectsSection.classList.add('appear');
        document.querySelectorAll('.project-card').forEach(card => {
            card.classList.add('appear');
        });
    } else {
        projectsSection.classList.remove('appear');
        document.querySelectorAll('.project-card').forEach(card => {
            card.classList.remove('appear');
        });
    }

    // Efecto de acercamiento en projectsSection y en cada project-card
    if (scrollPosition >= contacto.offsetTop - window.innerHeight + 200) {
        contacto.classList.add('appear');
        document.querySelectorAll('.contact').forEach(card => {
            card.classList.add('appear');
        });
    } else {
        contacto.classList.remove('appear');
        document.querySelectorAll('.contact').forEach(card => {
            card.classList.remove('appear');
        });
    }

    // Efecto de acercamiento en sectionTitle
    sectionTitle.forEach(title => {
        if (scrollPosition >= title.parentElement.offsetTop - window.innerHeight + 200) {
            title.classList.add('appear');
        } else {
            title.classList.remove('appear');
        }
    });
});

// para el carrusel
class SkillsCarousel {
    constructor() {
        this.currentSlide = 0;
        this.slides = document.querySelectorAll('.carousel-slide');
        this.indicators = document.querySelectorAll('.indicator');
        this.prevButton = document.querySelector('.nav-button.prev');
        this.nextButton = document.querySelector('.nav-button.next');
        this.titleElement = document.getElementById('skills-title');
        
        this.totalSlides = this.slides.length;
        
        this.init();
    }
    
    init() {
        this.prevButton.addEventListener('click', () => this.navigate('prev'));
        this.nextButton.addEventListener('click', () => this.navigate('next'));
        
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });
        
        this.updateNavigationState();
    }
    
    navigate(direction) {
        let nextSlide;
        
        if (direction === 'next') {
            nextSlide = (this.currentSlide + 1) % this.totalSlides;
        } else {
            nextSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        }
        
        this.goToSlide(nextSlide);
    }
    
    goToSlide(index) {
        // Actualizar título con fade
        this.updateTitle(index);
        
        // Actualizar slides
        this.slides[this.currentSlide].classList.remove('active');
        this.indicators[this.currentSlide].classList.remove('active');
        
        this.slides[index].classList.add('active');
        this.indicators[index].classList.add('active');
        
        this.currentSlide = index;
        this.updateNavigationState();
    }
    
    updateTitle(index) {
        const newTitle = this.slides[index].dataset.title;
        
        // Animación de fade para el título
        this.titleElement.style.opacity = '0';
        setTimeout(() => {
            this.titleElement.textContent = newTitle;
            this.titleElement.style.opacity = '1';
        }, 300);
    }
    
    updateNavigationState() {
        this.prevButton.disabled = this.currentSlide === 0;
        this.nextButton.disabled = this.currentSlide === this.totalSlides - 1;
    }
}

// Inicializar el carrusel cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const carousel = new SkillsCarousel();
});


let csrfToken = null;

async function getCsrfToken() {
    if (!csrfToken) {
        const response = await fetch('/api/get-csrf-token');
        const data = await response.json();
        csrfToken = data.csrf_token;
    }
    return csrfToken;
}


// PARA LA PARTE INICIAL
// Primero, incluye Chart.js en tu HTML
// <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
function initChatbot() {
    
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    async function handleMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
    
        try {
            chatInput.disabled = true;
            sendButton.disabled = true;
    
            addMessage(text, 'user');
            chatInput.value = '';
    
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'message bot typing';
            typingIndicator.textContent = '...';
            chatMessages.appendChild(typingIndicator);
    
            // Imprimir los datos que se están enviando
            console.log('Enviando datos:', { question: text });
            
            // Obtener el token CSRF antes de hacer la solicitud
            const token = await getCsrfToken();
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'  // Agregar esta línea
                },
                body: JSON.stringify({ question: text })
            });
            
            // Imprimir la respuesta completa
            console.log('Respuesta completa:', response);
            
            // Si la respuesta no es OK, mostrar el texto de la respuesta
            if (!response.ok) {
                const responseText = await response.text();
                console.error('Respuesta no OK:', responseText);
                throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
            }
    
            const data = await response.json();
            console.log('Datos recibidos:', data);
            
            chatMessages.removeChild(typingIndicator);
            
            if (data.success) {
                addMessage(data.response, 'bot');
            } else {
                const errorMessage = data.error || 'Error al procesar tu mensaje';
                addMessage(`Lo siento, ${errorMessage}. ¿Podrías intentarlo de nuevo?`, 'bot error');
            }
    
        } catch (error) {
            console.error('Error detallado:', error);
            addMessage("Disculpa, parece que hay un problema de conexión. Puedes contactarme haciendo click <a href='#contact' style='color: #00B7B7;'target='_blank'>aquí</a>", 'bot error');
        } finally {
            chatInput.disabled = false;
            sendButton.disabled = false;
            chatInput.focus();
        }
    }

    function addMessage(text, type) {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        
        const textElement = document.createElement('p');
        textElement.innerHTML = text.replace(/\n/g, '<br>');
        message.appendChild(textElement);
        
        chatMessages.appendChild(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendButton.addEventListener('click', handleMessage);
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleMessage();
        }
    });

    chatInput.focus();
    
    addMessage("<strong>¡Hola! ¿Cómo estás? 👋 </strong><br><br>Soy un chatbot creado para responder todas las preguntas <a href='#about' style='color: #00B7B7;'target='_blank'>sobre mí</a>. Puedo contarte sobre mis habilidades, proyectos y todo lo relacionado con mi trabajo.<br><br>¿Qué te gustaría saber?", 'bot');
}

document.addEventListener('DOMContentLoaded', initChatbot);
