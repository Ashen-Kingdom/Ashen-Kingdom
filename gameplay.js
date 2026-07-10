import { 
  addSoldier, 
  addHero, 
  addBuilding, 
  addWeather, 
  updateWeather, 
  addFogOfWar, 
  clearFogArea, 
  addDragonBoss, 
  attackTarget, 
  addResourceNode, 
  addAllianceGrid, 
  showThreatAlert, 
  addOptimizedMesh, 
  enableTouchControls 
} from './engine.js';
import { initUI } from './ui.js';

export function initGameplay() {
  console.log("Gameplay initialized: Full System ready.");

  // Soldiers
  addSoldier("Cavalry", {x: 0, y: 5, z: 0});
  addSoldier("Infantry", {x: 20, y: 5, z: -10});
  addSoldier("Flying", {x: -20, y: 15, z: 10});
  addSoldier("Mage", {x: 10, y: 5, z: 20});

  // Hero
  addHero("Commander of Light", {x: 0, y: 10, z: 50});

  // Buildings
  addBuilding("Hospital", {x: -50, y: 8, z: 0});
  addBuilding("Watchtower", {x: 60, y: 15, z: -30});
  addBuilding("Tavern", {x: -30, y: 6, z: 40});
  addBuilding("Forge", {x: 40, y: 6, z: 20});

  // Weather
  addWeather("Rain");
  addWeather("Fog");

  // Fog of War
  addFogOfWar();
  setTimeout(() => clearFogArea(0, 0, 100), 5000);

  // Dragon Boss
  addDragonBoss({x: 0, y: 30, z: -100});
  setTimeout(() => attackTarget("Cavalry", "Dragon Boss"), 7000);

  // Resource Nodes
  addResourceNode("Farm", {x: -80, y: 5, z: 20});
  addResourceNode("GoldVein", {x: 100, y: 5, z: -50});

  // Alliance Grid + Threat Alerts
  addAllianceGrid();
  setTimeout(() => {
    showThreatAlert("Enemy scouts spotted near Watchtower!");
  }, 10000);

  // Optimized Meshes (LOD)
  addOptimizedMesh("Soldier", {x: 30, y: 5, z: 30});
  addOptimizedMesh("Building", {x: -100, y: 8, z: -20});

  // Touch Controls
  enableTouchControls();

  // HUD & Rewards
  initUI();
}
