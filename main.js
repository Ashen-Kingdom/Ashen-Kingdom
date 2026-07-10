import { initEngine, animate } from './engine.js';
import { initUI } from './ui.js';
import { initGameplay } from './gameplay.js';

window.onload = () => {
  initEngine();
  initUI();
  initGameplay();
  animate();
};
