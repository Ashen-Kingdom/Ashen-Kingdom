import { addSoldier, addHero } from './engine.js';

export function initGameplay() {
  console.log("Gameplay initialized: Soldiers and Heroes ready.");

  // Example soldiers
  addSoldier("Cavalry", {x: 0, y: 5, z: 0});
  addSoldier("Infantry", {x: 20, y: 5, z: -10});
  addSoldier("Flying", {x: -20, y: 15, z: 10});
  addSoldier("Mage", {x: 10, y: 5, z: 20});

  // Example hero
  addHero("Commander of Light", {x: 0, y: 10, z: 50});
}
