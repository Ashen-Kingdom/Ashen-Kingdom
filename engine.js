import * as THREE from 'three';

let scene, camera, renderer, sunLight;
let rainParticles, fog;

export function initEngine() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 2000);
  camera.position.set(0, 50, 150);

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("game-canvas") });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  // Lighting
  sunLight = new THREE.DirectionalLight(0xffffff, 1);
  sunLight.position.set(100, 200, 100);
  sunLight.castShadow = true;
  scene.add(sunLight);

  const ambient = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambient);

  // Ground
  const groundGeo = new THREE.PlaneGeometry(2000, 2000);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  scene.add(ground);
}

export function animate() {
  renderer.render(scene, camera);
}

export function addSoldier(type, position) {
  const geometry = new THREE.BoxGeometry(8, 12, 8);
  const material = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
  const soldier = new THREE.Mesh(geometry, material);
  soldier.position.set(position.x, position.y, position.z);
  soldier.castShadow = true;
  scene.add(soldier);
}

export function addHero(name, position) {
  const geometry = new THREE.SphereGeometry(10, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
  const hero = new THREE.Mesh(geometry, material);
  hero.position.set(position.x, position.y, position.z);
  hero.castShadow = true;
  scene.add(hero);
}

export function addBuilding(type, position) {
  const geometry = new THREE.BoxGeometry(20, 15, 20);
  const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const building = new THREE.Mesh(geometry, material);
  building.position.set(position.x, position.y, position.z);
  building.castShadow = true;
  scene.add(building);
}

export function addWeather(type) {
  switch(type) {
    case "Rain":
      const rainGeo = new THREE.BufferGeometry();
      const rainCount = 5000;
      const rainPositions = [];
      for (let i = 0; i < rainCount; i++) {
        rainPositions.push(
          Math.random() * 1000 - 500,
          Math.random() * 500,
          Math.random() * 1000 - 500
        );
      }
      rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(rainPositions, 3));
      const rainMat = new THREE.PointsMaterial({ color: 0x87CEEB, size: 0.5 });
      rainParticles = new THREE.Points(rainGeo, rainMat);
      scene.add(rainParticles);
      break;

    case "Fog":
      fog = new THREE.FogExp2(0x111111, 0.002);
      scene.fog = fog;
      break;

    case "Storm":
      sunLight.color.set(0x5555ff);
      sunLight.intensity = 2;
      break;
  }
}

export function updateWeather() {
  if (rainParticles) {
    rainParticles.rotation.y += 0.002;
  }
}

export function addFogOfWar() {
  const fogGeo = new THREE.PlaneGeometry(1000, 1000, 1, 1);
  const fogMat = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.7, transparent: true });
  const fogPlane = new THREE.Mesh(fogGeo, fogMat);
  fogPlane.rotation.x = -Math.PI/2;
  fogPlane.position.y = 0.1;
  scene.add(fogPlane);
}

export function clearFogArea(x, z, radius) {
  console.log(`Fog cleared at (${x}, ${z}) with radius ${radius}`);
}

export function addDragonBoss(position) {
  const geometry = new THREE.SphereGeometry(30, 64, 64);
  const material = new THREE.MeshStandardMaterial({
    color: 0x8B0000,
    emissive: 0xFF4500,
    emissiveIntensity: 0.8,
    metalness: 0.5,
    roughness: 0.4
  });
  const dragon = new THREE.Mesh(geometry, material);
  dragon.position.set(position.x, position.y, position.z);
  dragon.castShadow = true;
  scene.add(dragon);
}

export function attackTarget(attacker, target) {
  console.log(`${attacker} attacks ${target}!`);
}

export function addResourceNode(type, position) {
  let geometry, material;
  switch(type) {
    case "Farm":
      geometry = new THREE.BoxGeometry(15, 5, 15);
      material = new THREE.MeshStandardMaterial({ color: 0x32CD32 });
      break;
    case "GoldVein":
      geometry = new THREE.SphereGeometry(10, 32, 32);
      material = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 1 });
      break;
  }
  const node = new THREE.Mesh(geometry, material);
  node.position.set(position.x, position.y, position.z);
  node.castShadow = true;
  scene.add(node);
}

export function addAllianceGrid(size = 500, step = 50) {
  const gridHelper = new THREE.GridHelper(size, step, 0x00ff00, 0x00ff00);
  scene.add(gridHelper);
}

export function showThreatAlert(message) {
  console.log("⚔️ Threat Alert:", message);
}

export function addOptimizedMesh(type, position) {
  const highGeo = new THREE.BoxGeometry(20, 20, 20, 32, 32, 32);
  const lowGeo = new THREE.BoxGeometry(20, 20, 20, 8, 8, 8);
  const material = new THREE.MeshStandardMaterial({ color: 0x4682B4 });

  const lod = new THREE.LOD();
  lod.addLevel(new THREE.Mesh(highGeo, material), 0);
  lod.addLevel(new THREE.Mesh(lowGeo, material), 100);
  lod.position.set(position.x, position.y, position.z);
  scene.add(lod);
}

export function enableTouchControls() {
  const canvas = document.querySelector("canvas");
  let selectedUnit = null;

  canvas.addEventListener("touchstart", (e) => {
    selectedUnit = "Cavalry";
    console.log("Touch start: Cavalry selected");
  });

  canvas.addEventListener("touchmove", (e) => {
    if (!selectedUnit) return;
    console.log("Dragging unit:", selectedUnit);
  });

  canvas.addEventListener("touchend", (e) => {
    if (!selectedUnit) return;
    console.log("Dropped unit:", selectedUnit, "→ Attack Dragon Boss");
    attackTarget(selectedUnit, "Dragon Boss");
    selectedUnit = null;
  });
}
