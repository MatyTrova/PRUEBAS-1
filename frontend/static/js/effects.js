class VisualEffects {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        this.animationFrame = null;
        this.lastShootingStar = 0;
        this.shootingStarInterval = 1500; // Intervalo entre estrellas fugaces
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Función auxiliar para dibujar una estrella
    drawStar(x, y, size, opacity, color) {
        this.ctx.beginPath();
        this.ctx.fillStyle = `rgba(${color}, ${opacity})`;
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
    }

    startStars() {
        this.stopAnimation();
        
        // Colores suaves para las estrellas
        const starColors = {
            white: '255, 255, 255',
            red: '255, 180, 180',
            yellow: '255, 255, 180',
            blue: '180, 180, 255',
            orange: '255, 200, 180',
            lightBlue: '180, 220, 255'
        };
        
        // Estrellas estáticas
        const staticStars = Array.from({length: 150}, () => ({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 2 + 0.5,
            baseOpacity: Math.random() * 0.3 + 0.5, // Aumentada la opacidad base
            twinkleSpeed: Math.random() * 0.005 + 0.002, // Reducida la velocidad de parpadeo
            twinklePhase: Math.random() * Math.PI * 2,
            color: Object.values(starColors)[Math.floor(Math.random() * Object.keys(starColors).length)]
        }));

        let shootingStars = [];

        // Modifica createShootingStar() para que solo vaya de derecha a izquierda
        const createShootingStar = () => {
            const direction = Math.random() > 0.5 ? 'vertical' : 'horizontal';
            const speedMultiplier = Math.random();
            // Velocidad base diferente según el tipo de estrella
            const baseSpeed = speedMultiplier < 0.3 ? 6 : // Muy rápidas (30% de probabilidad)
                             speedMultiplier < 0.7 ? 4 : // Velocidad media (40% de probabilidad)
                             2; // Lentas (30% de probabilidad)
        
            if (direction === 'vertical') {
                return {
                    x: Math.random() * this.canvas.width,
                    y: -20,
                    speed: baseSpeed + Math.random() * 2,
                    angle: Math.PI/4 + (Math.random() * Math.PI/6),
                    direction,
                    trail: speedMultiplier < 0.3 ? 1.5 : 1 // Estela más larga para las rápidas
                };
            } else {
                return {
                    x: -20, // Siempre empieza desde la izquierda
                    y: Math.random() * (this.canvas.height / 3),
                    speed: baseSpeed + Math.random() * 2,
                    angle: -Math.PI/6 + (Math.random() * Math.PI/3), // Ángulo aleatorio hacia la derecha
                    direction,
                    trail: speedMultiplier < 0.3 ? 1.5 : 1
                };
            }
        };

        const animate = (timestamp) => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Dibujar estrellas estáticas con parpadeo
            staticStars.forEach(star => {
                // En la función animate, reduce la intensidad del parpadeo
                const twinkle = Math.sin(timestamp * star.twinkleSpeed + star.twinklePhase);
                const opacity = star.baseOpacity + twinkle * 0.2; // Reducido de 0.2 a 0.1
                this.drawStar(star.x, star.y, star.size, opacity, star.color);
            });

            // Manejar estrellas fugaces
            if (timestamp - this.lastShootingStar > this.shootingStarInterval) {
                shootingStars.push(createShootingStar());
                this.lastShootingStar = timestamp;
            }

            shootingStars = shootingStars.filter(star => {
                this.ctx.beginPath();
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.lineWidth = 2;
                this.ctx.moveTo(star.x, star.y);

                if (star.direction === 'vertical') {
                    star.x += Math.cos(star.angle) * star.speed;
                    star.y += Math.sin(star.angle) * star.speed;
                } else {
                    star.x += Math.cos(star.angle) * star.speed;
                    star.y += Math.sin(star.angle) * star.speed * 0.2;
                }

                this.ctx.lineTo(star.x, star.y);
                this.ctx.stroke();

                return star.y < this.canvas.height + 20 && 
                       star.x > -20 && 
                       star.x < this.canvas.width + 20;
            });

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate(0);
    }

    // Función para dibujar una nube específica
    startClouds() {
        this.stopAnimation();
        const clouds = Array.from({ length: 9 }, () => ({
            x: Math.random() * this.canvas.width,
            y: Math.random() * (this.canvas.height / 2),
            width: 100 + Math.random() * 100,
            speed: 0.2 + Math.random() * 0.3,
            opacity: Math.random() * 0.3 + 0.1,
            size: Math.random() * 0.6 + 0.7,
            oscillationSpeed: Math.random() * 0.2 + 0.1,
            oscillationPhase: Math.random() * Math.PI * 2
        }));

        const animate = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            clouds.forEach(cloud => {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;

                // Definir la escala de la nube
                const radiusScale = cloud.size;
                this.ctx.beginPath();

                // Dibujar círculos para la parte superior de la nube en una distribución más alargada
                this.ctx.arc(cloud.x + 20 * radiusScale, cloud.y, 25 * radiusScale, 0, Math.PI * 2); // Círculo izquierdo
                this.ctx.arc(cloud.x + 55 * radiusScale, cloud.y - 7 * radiusScale, 40 * radiusScale, 0, Math.PI * 2); // Círculo grande superior central
                this.ctx.arc(cloud.x + 90 * radiusScale, cloud.y, 25 * radiusScale, 0, Math.PI * 2); // Círculo derecho

                // Ajustar la altura de los círculos inferiores y aumentar el espaciado para hacer la nube más ovalada
                this.ctx.arc(cloud.x + 35 * radiusScale, cloud.y + 5 * radiusScale, 32 * radiusScale, 0, Math.PI * 2); // Círculo inferior izquierdo (más arriba)
                this.ctx.arc(cloud.x + 75 * radiusScale, cloud.y + 5 * radiusScale, 32 * radiusScale, 0, Math.PI * 2); // Círculo inferior derecho (más arriba)

                // Rellenar la forma de la nube
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'; // Color blanco con un toque de transparencia para suavizar
                this.ctx.fill();
                this.ctx.closePath();


                // Oscilación vertical para simular "flotación"
                cloud.y += Math.sin(cloud.oscillationPhase) * cloud.oscillationSpeed;
                cloud.oscillationPhase += 0.02;

                // Movimiento horizontal de la nube
                cloud.x += cloud.speed;
                if (cloud.x > this.canvas.width + 100) {
                    // Reiniciar posición y propiedades de la nube cuando sale del canvas
                    cloud.x = -100;
                    cloud.y = Math.random() * (this.canvas.height / 2);
                    cloud.opacity = Math.random() * 0.3 + 0.1;
                    cloud.size = Math.random() * 0.6 + 0.7;
                    cloud.oscillationSpeed = Math.random() * 0.5 + 0.2;
                    cloud.oscillationPhase = Math.random() * Math.PI * 2;
                }
            });

            // Iniciar la siguiente animación
            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

}