import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.getElementById("game");
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x97d7ef, 40, 150);
scene.background = new THREE.Color(0x97d7ef);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 800);
camera.position.set(46, 38, 46);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 4, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.enableRotate = true;
controls.minDistance = 28;
controls.maxDistance = 100;
controls.minPolarAngle = Math.PI * 0.22;
controls.maxPolarAngle = Math.PI * 0.55;
controls.autoRotate = false;
controls.rotateSpeed = 0.45;
controls.zoomSpeed = 0.9;

const amb = new THREE.AmbientLight(0xeaf5ff, 1.3);
scene.add(amb);

const sun = new THREE.DirectionalLight(0xfff4dd, 2.5);
sun.position.set(50, 80, 35);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 220;
sun.shadow.camera.left = -90;
sun.shadow.camera.right = 90;
sun.shadow.camera.top = 90;
sun.shadow.camera.bottom = -90;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x8bc8ff, 0.55);
fill.position.set(-40, 35, -25);
scene.add(fill);

function makeCanvasTexture(drawFn, size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  drawFn(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

const grassTex = makeCanvasTexture((ctx, s) => {
  ctx.fillStyle = "#4f9e46";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 2800; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    const g = 120 + Math.random() * 70;
    const b = 35 + Math.random() * 20;
    ctx.fillStyle = `rgba(${40 + Math.random() * 30},${g},${b},${0.10 + Math.random() * 0.10})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.beginPath();
    ctx.arc(Math.random() * s, Math.random() * s, 3 + Math.random() * 12, 0, Math.PI * 2);
    ctx.fill();
  }
});

const roadTex = makeCanvasTexture((ctx, s) => {
  ctx.fillStyle = "#9d7a54";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 5200; i++) {
    const v = 115 + Math.random() * 50;
    ctx.fillStyle = `rgba(${v},${v - 10},${v - 24},${0.08 + Math.random() * 0.10})`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
  }
  ctx.strokeStyle = "rgba(86,62,34,0.28)";
  ctx.lineWidth = 10;
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.moveTo(0, s * Math.random());
    ctx.quadraticCurveTo(s * 0.35, s * Math.random(), s, s * Math.random());
    ctx.stroke();
  }
});

const stoneTex = makeCanvasTexture((ctx, s) => {
  ctx.fillStyle = "#bfc5cf";
  ctx.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 32) {
    for (let x = 0; x < s; x += 32) {
      const offset = ((y / 32) % 2) * 16;
      ctx.fillStyle = `hsl(${210 + Math.random() * 18}, 11%, ${68 + Math.random() * 10}%)`;
      ctx.fillRect(x + offset, y, 30, 30);
      ctx.strokeStyle = "rgba(70,90,110,0.16)";
      ctx.strokeRect(x + offset + 0.5, y + 0.5, 29, 29);
    }
  }
});

const roofTex = makeCanvasTexture((ctx, s) => {
  ctx.fillStyle = "#4067d8";
  ctx.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 20) {
    for (let x = 0; x < s; x += 20) {
      ctx.fillStyle = y % 40 === 0 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
      ctx.fillRect(x, y, 20, 20);
    }
  }
});

const waterTex = makeCanvasTexture((ctx, s) => {
  ctx.fillStyle = "#41a7e8";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 700; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.08})`;
    ctx.beginPath();
    const x = Math.random() * s;
    const y = Math.random() * s;
    ctx.moveTo(x, y);
    ctx.lineTo(x + 8 + Math.random() * 24, y + 2 + Math.random() * 5);
    ctx.stroke();
  }
});

grassTex.repeat.set(26, 26);
roadTex.repeat.set(8, 8);
stoneTex.repeat.set(3, 3);
roofTex.repeat.set(2, 2);
waterTex.repeat.set(4, 4);

function mat(color, rough = 0.9, metal = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}

function addGround() {
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(95, 64),
    new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(118, 72),
    new THREE.MeshStandardMaterial({
      map: waterTex,
      color: 0x69ccff,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92,
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.08;
  water.receiveShadow = true;
  scene.add(water);

  const shore = new THREE.Mesh(
    new THREE.RingGeometry(94, 98, 72),
    new THREE.MeshStandardMaterial({ color: 0xc8b17a, roughness: 1 })
  );
  shore.rotation.x = -Math.PI / 2;
  shore.position.y = 0.02;
  scene.add(shore);

  const central = new THREE.Mesh(
    new THREE.CircleGeometry(33, 64),
    new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.95 })
  );
  central.rotation.x = -Math.PI / 2;
  central.position.y = 0.07;
  scene.add(central);
}

function makeRoad(start, end, width = 3.1) {
  const dir = new THREE.Vector3().subVectors(end, start);
  const len = dir.length();
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(len, width),
    new THREE.MeshStandardMaterial({ map: roadTex, roughness: 1 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.copy(start).add(end).multiplyScalar(0.5);
  road.position.y = 0.08;
  road.lookAt(end);
  road.rotateX(-Math.PI / 2);
  road.receiveShadow = true;
  scene.add(road);
}

function makeTree(x, z, scale = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25 * scale, 0.35 * scale, 2.1 * scale, 6),
    mat(0x7d5533, 1)
  );
  trunk.position.set(x, 1.05 * scale, z);
  trunk.castShadow = true;
  trunk.receiveShadow = true;

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(1.25 * scale, 3.2 * scale, 8),
    mat(0x2c8f43, 1)
  );
  crown.position.set(x, 3.3 * scale, z);
  crown.castShadow = true;
  crown.receiveShadow = true;

  scene.add(trunk, crown);
}

function makeRock(x, z, scale = 1) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.6 * scale, 0),
    mat(0x7f878f, 0.95)
  );
  rock.position.set(x, 0.45 * scale, z);
  rock.rotation.set(Math.random(), Math.random(), Math.random());
  rock.castShadow = true;
  scene.add(rock);
}

function makeFlag(x, z, h = 6, color = 0x395fd8) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, h, 8),
    mat(0xe6e2da, 0.6)
  );
  pole.position.set(x, h / 2, z);
  pole.castShadow = true;
  scene.add(pole);

  const cloth = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.7, 10, 2),
    new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.85, metalness: 0.02 })
  );
  cloth.position.set(x + 0.62, h - 0.7, z);
  cloth.rotation.y = -Math.PI / 2;
  cloth.castShadow = true;
  cloth.userData.waveSeed = Math.random() * 10;
  scene.add(cloth);
  flags.push(cloth);
}

function buildCastle() {
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(9.5, 11, 6, 8),
    new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.95 })
  );
  base.position.y = 3;
  base.castShadow = base.receiveShadow = true;
  scene.add(base);

  const keep = new THREE.Mesh(
    new THREE.CylinderGeometry(5.4, 5.8, 9, 8),
    new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.92 })
  );
  keep.position.y = 8.5;
  keep.castShadow = true;
  scene.add(keep);

  const roof = new THREE.Mesh(
    new THREE.CylinderGeometry(0, 6.6, 5.8, 8),
    new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.9 })
  );
  roof.position.y = 14.0;
  roof.castShadow = true;
  scene.add(roof);

  const towerGeo = new THREE.CylinderGeometry(1.7, 2.1, 10, 8);
  const towerPos = [
    [-8.3, 0, -8.3], [8.3, 0, -8.3], [-8.3, 0, 8.3], [8.3, 0, 8.3]
  ];
  towerPos.forEach(([x, y, z]) => {
    const t = new THREE.Mesh(towerGeo, new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.93 }));
    t.position.set(x, 5.2, z);
    t.castShadow = true;
    scene.add(t);

    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, 4.6, 8),
      new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.9 })
    );
    cap.position.set(x, 12.0, z);
    cap.castShadow = true;
    scene.add(cap);
  });

  const gate = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 4.4, 1.2),
    mat(0x7a5031, 1)
  );
  gate.position.set(0, 2.3, 11.1);
  gate.castShadow = true;
  scene.add(gate);

  const wallRing = new THREE.Mesh(
    new THREE.TorusGeometry(12.7, 0.9, 10, 8),
    new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.95 })
  );
  wallRing.rotation.x = Math.PI / 2;
  wallRing.position.y = 2.4;
  wallRing.castShadow = true;
  scene.add(wallRing);

  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2;
    const x = Math.cos(angle) * 22;
    const z = Math.sin(angle) * 22;
    makeFlag(x, z, 6.4, i % 2 ? 0xc94d3f : 0x325bd8);
  }
}

function building(x, z, sx, sz, style = 0) {
  const group = new THREE.Group();
  const baseColor = style === 0 ? 0xd1c2a2 : style === 1 ? 0xbfa77f : 0xd8d6d0;
  const roofColor = style === 2 ? 0x8b3d2e : 0x4456c9;

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(sx, 3.2, sz),
    new THREE.MeshStandardMaterial({ color: baseColor, map: stoneTex, roughness: 0.96 })
  );
  base.position.y = 1.6;
  base.castShadow = base.receiveShadow = true;
  group.add(base);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(sx, sz) * 0.55, 2.6, 4),
    new THREE.MeshStandardMaterial({ color: roofColor, map: roofTex, roughness: 0.92 })
  );
  roof.position.y = 4.0;
  roof.rotation.y = Math.PI * 0.25;
  roof.castShadow = true;
  group.add(roof);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 1.6, 0.12),
    mat(0x684224, 1)
  );
  door.position.set(0, 0.9, sz / 2 + 0.07);
  group.add(door);

  if (style === 1) {
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 2.0, 0.8),
      mat(0x8b7c73, 0.9)
    );
    chimney.position.set(-sx * 0.26, 3.5, -sz * 0.18);
    chimney.castShadow = true;
    group.add(chimney);
  }

  if (style === 2) {
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(sx * 0.17, sx * 0.23, 4.8, 6),
      new THREE.MeshStandardMaterial({ color: 0xcfc8b8, map: stoneTex, roughness: 0.95 })
    );
    tower.position.set(sx * 0.33, 2.6, -sz * 0.18);
    tower.castShadow = true;
    group.add(tower);

    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(sx * 0.24, 2.0, 6),
      new THREE.MeshStandardMaterial({ color: roofColor, map: roofTex, roughness: 0.88 })
    );
    cap.position.set(sx * 0.33, 5.2, -sz * 0.18);
    cap.castShadow = true;
    group.add(cap);
  }

  group.position.set(x, 0.08, z);
  scene.add(group);
}

function decorateCentralArea() {
  makeRoad(new THREE.Vector3(0, 0, 11), new THREE.Vector3(0, 0, 42), 3.4);
  makeRoad(new THREE.Vector3(0, 0, -11), new THREE.Vector3(0, 0, -40), 3.4);
  makeRoad(new THREE.Vector3(11, 0, 0), new THREE.Vector3(44, 0, 0), 3.4);
  makeRoad(new THREE.Vector3(-11, 0, 0), new THREE.Vector3(-44, 0, 0), 3.4);
  makeRoad(new THREE.Vector3(8, 0, 8), new THREE.Vector3(28, 0, 28), 3.0);
  makeRoad(new THREE.Vector3(-8, 0, 8), new THREE.Vector3(-28, 0, 28), 3.0);
  makeRoad(new THREE.Vector3(8, 0, -8), new THREE.Vector3(28, 0, -28), 3.0);
  makeRoad(new THREE.Vector3(-8, 0, -8), new THREE.Vector3(-28, 0, -28), 3.0);

  building(0, 34, 6.2, 5.6, 0);
  building(-32, 6, 5.8, 5.2, 1);
  building(31, 6, 5.8, 5.2, 2);
  building(-22, -22, 6.4, 5.2, 0);
  building(0, -30, 7.0, 5.3, 1);
  building(24, -22, 5.8, 5.6, 2);
  building(35, 20, 6.2, 5.4, 0);
  building(-36, 20, 6.0, 5.2, 2);
  building(16, 34, 5.5, 5.0, 1);

  const shrine = new THREE.Mesh(
    new THREE.CylinderGeometry(3.5, 4.4, 3.0, 8),
    new THREE.MeshStandardMaterial({ color: 0x9db9d2, map: stoneTex, roughness: 0.95 })
  );
  shrine.position.set(-42, 1.5, -2);
  shrine.castShadow = shrine.receiveShadow = true;
  scene.add(shrine);

  const well = new THREE.Mesh(
    new THREE.CylinderGeometry(2.7, 2.7, 2.0, 10),
    new THREE.MeshStandardMaterial({ color: 0x98a7b2, map: stoneTex, roughness: 0.94 })
  );
  well.position.set(40, 1.0, -10);
  well.castShadow = well.receiveShadow = true;
  scene.add(well);

  const wellWater = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 0.35, 10),
    new THREE.MeshStandardMaterial({ color: 0x51bdf0, transparent: true, opacity: 0.9, roughness: 0.2 })
  );
  wellWater.position.set(40, 1.8, -10);
  scene.add(wellWater);
}

function surroundWithNature() {
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2 + (Math.random() * 0.35);
    const r = 54 + Math.random() * 24;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.random() < 0.75) makeTree(x, z, 1 + Math.random() * 0.8);
    else makeRock(x, z, 0.9 + Math.random() * 1.5);
  }

  for (let i = 0; i < 14; i++) {
    const x = -50 + Math.random() * 100;
    const z = -50 + Math.random() * 100;
    if (Math.hypot(x, z) < 20) continue;
    makeTree(x, z, 0.8 + Math.random() * 0.5);
  }

  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x7f8e90, roughness: 1 });
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const r = 95 + Math.random() * 10;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const m = new THREE.Mesh(
      new THREE.ConeGeometry(10 + Math.random() * 16, 28 + Math.random() * 20, 6),
      mountainMat
    );
    m.position.set(x, 11, z);
    m.rotation.y = Math.random() * Math.PI;
    m.castShadow = true;
    scene.add(m);
  }
}

function addCloud(x, y, z, s = 1) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.9 });
  const sizes = [2.7, 3.7, 3.0, 2.2, 2.4];
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(sizes[i] * s, 10, 10), material);
    p.position.set((i - 2) * 2.8 * s, (i % 2) * 0.6 * s, Math.sin(i) * 0.5 * s);
    group.add(p);
  }
  group.position.set(x, y, z);
  scene.add(group);
  clouds.push(group);
}

const flags = [];
const clouds = [];

function populateSky() {
  addCloud(-48, 42, -24, 1.0);
  addCloud(-15, 50, 22, 1.2);
  addCloud(30, 45, -18, 1.1);
  addCloud(55, 55, 25, 0.9);
  addCloud(-3, 58, 48, 1.3);
}

addGround();
buildCastle();
decorateCentralArea();
surroundWithNature();
populateSky();

const ambientGlow = new THREE.PointLight(0xcfefff, 1.0, 120, 2);
ambientGlow.position.set(0, 30, 0);
scene.add(ambientGlow);

const clock = new THREE.Clock();

function animate() {
  const t = clock.getElapsedTime();

  controls.update();

  for (let i = 0; i < flags.length; i++) {
    const f = flags[i];
    const s = f.userData.waveSeed;
    const pos = f.geometry.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      const y = pos.getY(j);
      const x = pos.getX(j);
      pos.setZ(j, Math.sin(t * 4.2 + s + x * 4.5 + y * 2.2) * 0.08);
    }
    pos.needsUpdate = true;
    f.geometry.computeVertexNormals();
  }

  clouds.forEach((c, idx) => {
    c.position.x += Math.sin(t * 0.1 + idx) * 0.0018;
    c.position.z += Math.cos(t * 0.08 + idx) * 0.0012;
    c.rotation.y = Math.sin(t * 0.06 + idx) * 0.03;
  });

  waterTex.offset.x = (t * 0.008) % 1;
  waterTex.offset.y = (t * 0.004) % 1;
  grassTex.offset.x = (t * 0.0015) % 1;
  roadTex.offset.x = (t * 0.003) % 1;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
});
