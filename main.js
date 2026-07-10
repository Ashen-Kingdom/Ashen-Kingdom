import { initEngine, animate } from './engine.js';
import { initGameplay } from './gameplay.js';
import { initUI } from './ui.js';

function startGame() {
  // Initialize Engine
  initEngine();

  // Initialize Gameplay Logic
  initGameplay();

  // Initialize UI
  initUI();

  // Animation Loop
  function loop() {
    requestAnimationFrame(loop);
    animate();
  }
  loop();
}

// Start Game
startGame();
