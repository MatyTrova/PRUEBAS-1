// GRÁFICO DE RADAR
import { generateData } from '../utils/data.js';
import { drawRadarChart } from '../utils/chart.js';


// Initialize the app
const app = document.querySelector('#app');

// Create toggle switch
const toggleWrapper = document.createElement('div');
toggleWrapper.className = 'toggle-wrapper';
toggleWrapper.innerHTML = `
  <label class="toggle">
    <input type="checkbox">
    <span class="slider"></span>
  </label>
`;

// Create container for chart
const container = document.createElement('div');
container.id = 'radar-chart-container';

// Create cards container
const cardsContainer = document.createElement('div');
cardsContainer.className = 'cards-container-radar';

// Generate initial data
const data = generateData();

// Create cards for each variable
data.forEach(item => {
  const card = document.createElement('div');
  card.className = 'variable-card';
  card.innerHTML = `
    <h3 class="variable-name">${item.variable}</h3>
    <p class="variable-value">${item.value1}%</p>
  `;
  cardsContainer.appendChild(card);
});

// Add elements to the DOM
app.appendChild(toggleWrapper);
app.appendChild(container);
app.appendChild(cardsContainer);

let currentState = true;
let animationFrame;

function animate(targetState) {
  const startTime = performance.now();
  const duration = 500;

  // Actualizar el estado inmediatamente para reflejar el cambio en los datos
  currentState = targetState;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeProgress = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    drawRadarChart(data, currentState, targetState, easeProgress);

    if (progress < 1) {
      animationFrame = requestAnimationFrame(update);
    }
  }

  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(update);
}

// Setup toggle functionality with animation
const toggleInput = document.querySelector('.toggle input');
toggleInput.addEventListener('change', () => {
  const targetState = !toggleInput.checked;
  animate(targetState);
});

// Handle window resize
window.addEventListener('resize', () => {
  drawRadarChart(data, currentState);
});

// Initial render
drawRadarChart(data, true);