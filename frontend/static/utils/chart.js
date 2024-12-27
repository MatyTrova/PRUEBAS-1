export function drawRadarChart(data, currentState, targetState = currentState, progress = 1) {
  const container = document.getElementById('radar-chart-container');
  const canvas = document.createElement('canvas');
  
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  const size = Math.min(containerWidth, containerHeight);
  
  canvas.width = size;
  canvas.height = size;
  container.innerHTML = '';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const radius = Math.min(width, height) * 0.30; // Aumentado de 0.3 a 0.35 para hacer el gráfico más grande
  const centerX = width / 2;
  const centerY = height / 2;
  const variables = data.map(item => item.variable);
  const maxValue = 100;

  drawGrid(ctx, centerX, centerY, radius, variables);
  drawLabels(ctx, centerX, centerY, radius, variables);

  const showBefore = progress === 1 ? currentState : 
    progress === 0 ? targetState : 
    currentState;

  drawData(ctx, centerX, centerY, radius, variables, data, maxValue, showBefore, progress);
  updateCards(data, showBefore);
}

function drawGrid(ctx, centerX, centerY, radius, variables) {
  // Guardar el contexto y crear una máscara circular para que el fondo quede dentro de la circunferencia
  ctx.save();
  
  // Dibujar el fondo dentro de la circunferencia
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';  // Color negro translúcido
  ctx.fill();

  // Ahora recortamos el área exterior al radar (máscara circular)
  ctx.clip();  // Recorta todo fuera de la circunferencia del gráfico
  
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';  // Color negro translúcido
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';  // Hacer que las uniones de las líneas sean redondeadas

  // Dibujar las líneas de la cuadrícula
  for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      const gridRadius = (i / 4) * radius;
      ctx.arc(centerX, centerY, gridRadius, 0, 2 * Math.PI);
      ctx.stroke();
  }

  // Dibujar las líneas radiales
  variables.forEach((_, index) => {
      ctx.beginPath();
      const angle = (index / variables.length) * 2 * Math.PI - Math.PI / 2;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
          centerX + radius * Math.cos(angle),
          centerY + radius * Math.sin(angle)
      );
      ctx.stroke();
  });
  
  ctx.restore(); // Restaurar el estado del contexto después de aplicar el recorte
}

function drawLabels(ctx, centerX, centerY, radius, variables) {
  ctx.font = 'bold 22px Inter'; // Aumentado de 14px a 19px
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Array de colores para las etiquetas
  const labelColors = ['#4F83CC', '#E65C00', '#9B4DFF', '#7ACF00'];

  const paddingFactor = 1.32; // Puedes ajustar este valor para mover las etiquetas más lejos o más cerca

  variables.forEach((variable, index) => {
      const angle = (index / variables.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * paddingFactor * Math.cos(angle); // Usar paddingFactor para aumentar la distancia
      const y = centerY + radius * paddingFactor * Math.sin(angle);
      
      // Establecer el color para esta etiqueta
      ctx.fillStyle = labelColors[index % labelColors.length]; // Asegura que se reutilicen colores si hay más etiquetas que colores
      
      const lines = variable.split('\n');
      const lineHeight = 20; // Aumentado de 18 a 20 para más espacio entre líneas
      lines.forEach((line, i) => {
          const yOffset = (i - (lines.length - 1) / 2) * lineHeight;
          ctx.fillText(line, x, y + yOffset);
      });
  });
}


function drawData(ctx, centerX, centerY, radius, variables, data, maxValue, showBefore, progress) {
  const colors = ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0'];
  
  ctx.beginPath();
  variables.forEach((_, index) => {
      const angle = (index / variables.length) * 2 * Math.PI - Math.PI / 2;
      const value = showBefore ? data[index].value1 : data[index].value2;
      const scaledValue = (value / maxValue) * radius * progress;
      const x = centerX + scaledValue * Math.cos(angle);
      const y = centerY + scaledValue * Math.sin(angle);
      
      if (index === 0) {
          ctx.moveTo(x, y);
      } else {
          ctx.lineTo(x, y);
      }
  });
  ctx.closePath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = showBefore ? '#4CAF50' : '#2196F3';
  ctx.stroke();
  ctx.fillStyle = showBefore ? 'rgba(76, 175, 80, 0.2)' : 'rgba(33, 150, 243, 0.2)';
  ctx.fill();
}

function updateCards(data, showBefore) {
  const cardsContainer = document.querySelector('.cards-container-radar');
  if (!cardsContainer) return;

  data.forEach((item, index) => {
      const value = showBefore ? item.value1 : item.value2;
      const card = cardsContainer.children[index];
      if (card) {
          const valueElement = card.querySelector('.variable-value');
          if (valueElement) {
              valueElement.textContent = `${value}%`;
          }
      }
  });
}
