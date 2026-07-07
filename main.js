import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Sky } from "three/addons/objects/Sky.js";

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

// ---------- Scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ecdf7);
scene.fog = new THREE.Fog(0xaad8ff, 120, 350);

// ---------- Camera ----------
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(65, 45, 65);

// ---------- Controls ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.47;
controls.minDistance = 20;
controls.maxDistance = 120;
controls.target.set(0, 8, 0);

// ---------- Lights ----------
scene.add(new THREE.HemisphereLight(0xd8f2ff, 0x4d6c40, 1.4));

const sun = new THREE.DirectionalLight(0xfff6dd, 3.0);
sun.position.set(120, 160, 60);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -120;
sun.shadow.camera.right = 120;
sun.shadow.camera.top = 120;
sun.shadow.camera.bottom = -120;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 400;
scene.add(sun);

// ---------- Sky ----------
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms.turbidity.value = 3;
skyUniforms.rayleigh.value = 1.8;
skyUniforms.mieCoefficient.value = 0.004;
skyUniforms.mieDirectionalG.value = 0.8;

const sunVector = new THREE.Vector3();
sunVector.setFromSphericalCoords(
  1,
  THREE.MathUtils.degToRad(70),
  THREE.MathUtils.degToRad(180)
);
sky.material.uniforms.sunPosition.value.copy(sunVector);

// ---------- Terrain ----------
const terrainGeometry = new THREE.PlaneGeometry(300, 300, 300, 300);
terrainGeometry.rotateX(-Math.PI / 2);

const pos = terrainGeometry.attributes.position;
const colors = [];
const color = new THREE.Color();

for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const z = pos.getZ(i);

  let h = 0;
  h += Math.sin(x * 0.04) * 3;
  h += Math.cos(z * 0.05) * 2;
  h += Math.sin((x + z) * 0.03) * 4;
  h += Math.cos((x - z) * 0.02) * 2;

  pos.setY(i, h);

  if (h < -1.5) color.set(0xd7c790);
  else if (h < 2) color.set(0x5ea84d);
  else if (h < 8) color.set(0x43863f);
  else if (h < 14) color.set(0x777777);
  else color.set(0xe8e8e8);

  colors.push(color.r, color.g, color.b);
}

terrainGeometry.setAttribute(
  "color",
  new THREE.Float32BufferAttribute(colors, 3)
);
terrainGeometry.computeVertexNormals();

const terrain = new THREE.Mesh(
  terrainGeometry,
  new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    metalness: 0
  })
);
terrain.receiveShadow = true;
scene.add(terrain);

// ---------- Water plane ----------
const water = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshStandardMaterial({
    color: 0x4ea9d8,
    roughness: 0.15,
    metalness: 0.02,
    transparent: true,
    opacity: 0.72
  })
);
water.rotation.x = -Math.PI / 2;
water.position.y = -2.2;
scene.add(water);

// ---------- Mountains ----------
for (let i = 0; i < 40; i++) {
  const mountain = new THREE.Mesh(
    new THREE.ConeGeometry(6 + Math.random() * 10, 18 + Math.random() * 20, 8),
    new THREE.MeshStandardMaterial({ color: 0x8a8f93, roughness: 1 })
  );
  const angle = Math.random() * Math.PI * 2;
  const radius = 120 + Math.random() * 40;
  mountain.position.set(
    Math.cos(angle) * radius,
    8,
    Math.sin(angle) * radius
  );
  mountain.castShadow = true;
  mountain.receiveShadow = true;
  scene.add(mountain);
}

// ---------- Castle ----------
const castle = new THREE.Group();
const stone = new THREE.MeshStandardMaterial({
  color: 0xc6c4bf,
  roughness: 0.95
});

const keep = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 18), stone);
keep.position.y = 7;
keep.castShadow = true;
keep.receiveShadow = true;
castle.add(keep);

const upper = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), stone);
upper.position.y = 19;
upper.castShadow = true;
castle.add(upper);

const keepRoof = new THREE.Mesh(
  new THREE.ConeGeometry(8, 8, 4),
  new THREE.MeshStandardMaterial({ color: 0x235fcb, roughness: 0.8 })
);
keepRoof.position.y = 28;
keepRoof.rotation.y = Math.PI / 4;
keepRoof.castShadow = true;
castle.add(keepRoof);

function createTower(x, z) {
  const tower = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.8, 16, 18),
    stone
  );
  body.position.y = 8;
  body.castShadow = true;
  body.receiveShadow = true;
  tower.add(body);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.2, 6, 18),
    new THREE.MeshStandardMaterial({ color: 0x215fd8 })
  );
  roof.position.y = 19;
  roof.castShadow = true;
  tower.add(roof);

  tower.position.set(x, 0, z);
  castle.add(tower);
}

createTower(-12, -12);
createTower(12, -12);
createTower(-12, 12);
createTower(12, 12);

function wall(x, y, z, sx, sy, sz) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), stone);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  castle.add(mesh);
}

wall(0, 6, -12, 20, 6, 2);
wall(0, 6, 12, 20, 6, 2);
wall(-12, 6, 0, 2, 6, 20);
wall(12, 6, 0, 2, 6, 20);

const gate = new THREE.Mesh(
  new THREE.BoxGeometry(4, 6, 1),
  new THREE.MeshStandardMaterial({ color: 0x5d4023 })
);
gate.position.set(0, 3, 12.6);
gate.castShadow = true;
castle.add(gate);

castle.position.y = 3;
scene.add(castle);

// ---------- Village ----------
const village = new THREE.Group();
scene.add(village);

const wood = new THREE.MeshStandardMaterial({ color: 0x6d4b2b, roughness: 1 });
const wallMat = new THREE.MeshStandardMaterial({ color: 0xd9ceb9, roughness: 1 });
const roofMat = new THREE.MeshStandardMaterial({ color: 0x9b4d2f, roughness: 1 });

function createHouse(x, z, s = 1) {
  const house = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(6 * s, 4 * s, 5 * s),
    wallMat
  );
  base.position.y = 2 * s;
  base.castShadow = true;
  base.receiveShadow = true;
  house.add(base);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(4.8 * s, 3.5 * s, 4),
    roofMat
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 5.5 * s;
  roof.castShadow = true;
  house.add(roof);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 0.2),
    wood
  );
  door.position.set(0, 1, 2.6 * s);
  house.add(door);

  for (let i = -1; i <= 1; i += 2) {
    const win = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.1),
      new THREE.MeshStandardMaterial({
        color: 0x8fd9ff,
        emissive: 0x225577
      })
    );
    win.position.set(i * 1.8, 2.4, 2.55 * s);
    house.add(win);
  }

  house.position.set(x, 0, z);
  village.add(house);
}

createHouse(-35, -20, 1);
createHouse(-28, -10, 1.1);
createHouse(-40, 0, 0.9);
createHouse(30, -18, 1);
createHouse(38, -6, 1.2);
createHouse(28, 8, 1);
createHouse(-26, 18, 1);
createHouse(22, 22, 1);

const windmill = new THREE.Group();
const body = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 10, 12), wallMat);
body.position.y = 5;
body.castShadow = true;
windmill.add(body);

const millRoof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 4, 12), roofMat);
millRoof.position.y = 12;
millRoof.castShadow = true;
windmill.add(millRoof);

for (let i = 0; i < 4; i++) {
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.25, 6, 0.4), wood);
  blade.position.set(0, 9, 2.4);
  blade.rotation.z = i * Math.PI / 2;
  windmill.add(blade);
}
windmill.position.set(42, 0, 28);
scene.add(windmill);

for (let i = 0; i < 8; i++) {
  const farm = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.3, 6),
    new THREE.MeshStandardMaterial({ color: 0x8a6435 })
  );
  farm.position.set(48, 0.15, -20 + i * 8);
  scene.add(farm);
}

// ---------- Forest ----------
const forest = new THREE.Group();
scene.add(forest);

const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6d4728, roughness: 1 });
const leafDark = new THREE.MeshStandardMaterial({ color: 0x2f7c39, roughness: 1 });
const leafLight = new THREE.MeshStandardMaterial({ color: 0x45a652, roughness: 1 });

function createTree(x, z, scale = 1) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25 * scale, 0.35 * scale, 2.5 * scale, 8),
    trunkMat
  );
  trunk.position.y = 1.2 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  const leaves1 = new THREE.Mesh(
    new THREE.ConeGeometry(1.6 * scale, 3 * scale, 10),
    leafDark
  );
  leaves1.position.y = 3.2 * scale;
  leaves1.castShadow = true;
  tree.add(leaves1);

  const leaves2 = new THREE.Mesh(
    new THREE.ConeGeometry(1.2 * scale, 2.3 * scale, 10),
    leafLight
  );
  leaves2.position.y = 4.5 * scale;
  leaves2.castShadow = true;
  tree.add(leaves2);

  tree.position.set(x, 0, z);
  forest.add(tree);
}

for (let i = 0; i < 180; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 55 + Math.random() * 90;
  createTree(
    Math.cos(angle) * radius,
    Math.sin(angle) * radius,
    0.8 + Math.random() * 0.5
  );
}

// ---------- Bushes / Rocks / Flowers / Grass ----------
const bushMat = new THREE.MeshStandardMaterial({ color: 0x3d8b45 });

for (let i = 0; i < 120; i++) {
  const bush = new THREE.Mesh(
    new THREE.SphereGeometry(0.6 + Math.random() * 0.5, 8, 8),
    bushMat
  );
  bush.position.set(
    (Math.random() - 0.5) * 180,
    0.4,
    (Math.random() - 0.5) * 180
  );
  bush.castShadow = true;
  scene.add(bush);
}

const rockMat = new THREE.MeshStandardMaterial({ color: 0x7d8488, roughness: 1 });

for (let i = 0; i < 100; i++) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.8),
    rockMat
  );
  rock.position.set(
    (Math.random() - 0.5) * 220,
    0.5,
    (Math.random() - 0.5) * 220
  );
  rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  rock.castShadow = true;
  scene.add(rock);
}

const flowerMat = new THREE.MeshStandardMaterial({ color: 0xff66aa, emissive: 0x220011 });

for (let i = 0; i < 250; i++) {
  const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), flowerMat);
  flower.position.set(
    (Math.random() - 0.5) * 180,
    0.06,
    (Math.random() - 0.5) * 180
  );
  scene.add(flower);
}

const grassMat = new THREE.MeshStandardMaterial({
  color: 0x58b84e,
  side: THREE.DoubleSide
});

for (let i = 0; i < 500; i++) {
  const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.8), grassMat);
  blade.position.set(
    (Math.random() - 0.5) * 200,
    0.4,
    (Math.random() - 0.5) * 200
  );
  blade.rotation.y = Math.random() * Math.PI;
  scene.add(blade);
}

// ---------- Roads / Bridge ----------
const roadMat = new THREE.MeshStandardMaterial({ color: 0xa28663, roughness: 1 });

function createRoad(points) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 180, 1.6, 10, false);
  const mesh = new THREE.Mesh(geometry, roadMat);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

createRoad([
  new THREE.Vector3(-70, 0, -40),
  new THREE.Vector3(-40, 0, -15),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(30, 0, 18),
  new THREE.Vector3(70, 0, 35)
]);

createRoad([
  new THREE.Vector3(-50, 0, 50),
  new THREE.Vector3(-20, 0, 25),
  new THREE.Vector3(5, 0, 5),
  new THREE.Vector3(40, 0, -25)
]);

const bridge = new THREE.Group();
const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xb9b6b1, roughness: 1 });

const deck = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 6), bridgeMat);
deck.position.y = 2;
deck.castShadow = true;
bridge.add(deck);

for (let i = -1; i <= 1; i += 2) {
  const rail = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 0.4), bridgeMat);
  rail.position.set(0, 3, i * 3);
  bridge.add(rail);
}

bridge.position.set(22, 0, -10);
scene.add(bridge);

// ---------- Flags ----------
const flagMat = new THREE.MeshStandardMaterial({
  color: 0x2968ff,
  side: THREE.DoubleSide
});
const kingdomFlags = [];

function createFlag(x, z) {
  const group = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 6),
    new THREE.MeshStandardMaterial({ color: 0xc6b88f })
  );
  pole.position.y = 3;
  group.add(pole);

  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1), flagMat);
  cloth.position.set(0.8, 5, 0);
  group.add(cloth);

  group.position.set(x, 0, z);
  scene.add(group);
  kingdomFlags.push(cloth);
}

createFlag(-10, -10);
createFlag(10, -10);
createFlag(-10, 10);
createFlag(10, 10);
createFlag(0, 18);

// ---------- Lamps ----------
for (let i = 0; i < 10; i++) {
  const lamp = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 3),
    new THREE.MeshStandardMaterial({ color: 0x55412c })
  );
  pole.position.y = 1.5;
  lamp.add(pole);

  const glow = new THREE.PointLight(0xffdd88, 2, 16);
  glow.position.y = 3.2;
  lamp.add(glow);

  lamp.position.set(-30 + i * 7, 0, 8);
  scene.add(lamp);
}

// ---------- Birds ----------
const birds = [];
for (let i = 0; i < 18; i++) {
  const bird = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  bird.position.set(
    (Math.random() - 0.5) * 80,
    25 + Math.random() * 15,
    (Math.random() - 0.5) * 80
  );
  scene.add(bird);
  birds.push(bird);
}

// ---------- Clouds ----------
const clouds = [];
for (let i = 0; i < 20; i++) {
  const cloud = new THREE.Group();
  for (let j = 0; j < 5; j++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(2 + Math.random() * 1.5, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.82
      })
    );
    puff.position.set(j * 2, Math.random(), Math.random());
    cloud.add(puff);
  }
  cloud.position.set(-120 + i * 14, 38 + Math.random() * 8, -50 + Math.random() * 80);
  scene.add(cloud);
  clouds.push(cloud);
}

// ---------- Animation ----------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  water.position.y = -2.2 + Math.sin(t * 0.5) * 0.03;
  castle.rotation.y = Math.sin(t * 0.2) * 0.01;
  windmill.rotation.y = t * 0.8;

  kingdomFlags.forEach((f, i) => {
    f.rotation.y = Math.sin(t * 2 + i) * 0.15;
  });

  birds.forEach((b, i) => {
    b.position.x += 0.05;
    b.position.y += Math.sin(t * 2 + i) * 0.01;
    if (b.position.x > 90) b.position.x = -90;
  });

  clouds.forEach((c) => {
    c.position.x += 0.01;
    if (c.position.x > 130) c.position.x = -130;
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

// ---------- Resize ----------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
