import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ecbf1);
scene.fog = new THREE.Fog(0x8ecbf1, 90, 240);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(70, 72, 70);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("game"), antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 48;
controls.maxDistance = 120;
controls.maxPolarAngle = Math.PI * 0.55;
controls.minPolarAngle = Math.PI * 0.28;
controls.target.set(0, 8, 0);

const loader = new THREE.TextureLoader();

function makeCanvasTexture(drawFn, size = 512) {
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
  ctx.fillStyle = "#4f9a49";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const g = 90 + Math.random() * 80;
    ctx.fillStyle = `rgba(${40 + Math.random()*20},${g},${40 + Math.random()*20},${0.06 + Math.random()*0.05})`;
    ctx.fillRect(x, y, 2 + Math.random() * 4, 2 + Math.random() * 4);
  }
  ctx.strokeStyle = "rgba(20,60,20,.12)";
  for (let i = 0; i < 280; i++) {
    ctx.beginPath();
    const x = Math.random() * s, y = Math.random() * s;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.random() * 16 - 8, y + Math.random() * 16 - 8);
    ctx.stroke();
  }
});
grassTex.repeat.set(7, 7);

const roadTex = makeCanvasTexture((ctx, s) => {
  ctx.fillStyle = "#b19b7b";
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = "#8c7a60";
  for (let i = 0; i < 700; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const n = 12 + Math.random() * 18;
    ctx.fillRect(x, y, n, n * 0.25);
  }
  ctx.strokeStyle = "rgba(255,255,255,.14)";
  for (let i = 0; i < 45; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random()*s, Math.random()*s);
    ctx.lineTo(Math.random()*s, Math.random()*s);
    ctx.stroke();
  }
});
roadTex.repeat.set(1, 1);

const stoneTex = makeCanvasTexture((ctx, s) => {
  ctx.fillStyle = "#bfc2c8";
  ctx.fillRect(0, 0, s, s);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const w = s / 16;
      const h = s / 16;
      const pad = 2;
      const xx = x * w, yy = y * h;
      ctx.fillStyle = `rgb(${170 + Math.random()*45},${170 + Math.random()*45},${175 + Math.random()*40})`;
      ctx.fillRect(xx + pad, yy + pad, w - pad * 2, h - pad * 2);
      ctx.strokeStyle = "rgba(70,70,70,.2)";
      ctx.strokeRect(xx + pad, yy + pad, w - pad * 2, h - pad * 2);
    }
  }
});
stoneTex.repeat.set(1, 1);

const woodTex = makeCanvasTexture((ctx, s) => {
  ctx.fillStyle = "#8a6438";
  ctx.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 8) {
    const g = 120 + Math.random() * 30;
    ctx.fillStyle = `rgb(${110 + Math.random()*30},${80 + Math.random()*15},${40 + Math.random()*10})`;
    ctx.fillRect(0, y, s, 4);
  }
});
woodTex.repeat.set(1, 1);

const waterTex = makeCanvasTexture((ctx, s) => {
  const grad = ctx.createLinearGradient(0, 0, s, s);
  grad.addColorStop(0, "#2f82be");
  grad.addColorStop(1, "#1a5c95");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = "rgba(255,255,255,.14)";
  for (let i = 0; i < 120; i++) {
    ctx.beginPath();
    const y = Math.random() * s;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(s * 0.2, y + 4, s * 0.65, y - 4, s, y);
    ctx.stroke();
  }
});
waterTex.repeat.set(6, 6);

function createTerrain() {
  const geo = new THREE.PlaneGeometry(260, 260, 120, 120);
  const pos = geo.attributes.position;
  const center = new THREE.Vector2(0, 0);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getY(i);
    const d = Math.sqrt(x * x + z * z);
    let h = Math.sin(x * 0.06) * 1.2 + Math.cos(z * 0.05) * 1.0;
    h += Math.sin((x + z) * 0.03) * 1.6;
    h += Math.cos(Math.sqrt((x-50)*(x-50)+(z+32)*(z+32)) * 0.06) * 1.3;
    h += Math.cos(Math.sqrt((x+62)*(x+62)+(z-44)*(z-44)) * 0.06) * 1.0;
    if (d < 24) h *= 0.35;
    if (d > 88) h *= 0.7;
    pos.setZ(i, h + Math.max(0, (d - 75) * 0.13));
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ map: grassTex, color: 0x93d36a, roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

function createWaterRing() {
  const geo = new THREE.RingGeometry(112, 130, 96);
  const mat = new THREE.MeshStandardMaterial({
    map: waterTex,
    color: 0x2f7bb5,
    transparent: true,
    opacity: 0.96,
    roughness: 0.25,
    metalness: 0.05,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -1.35;
  ring.receiveShadow = true;
  scene.add(ring);
  return ring;
}

function createMountains() {
  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x767c83, roughness: 1, metalness: 0 });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf0f5fb, roughness: 1, metalness: 0 });
  for (let i = 0; i < 42; i++) {
    const r = 125 + Math.random() * 35;
    const ang = (i / 42) * Math.PI * 2 + (Math.random() * 0.18);
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r;
    const h = 22 + Math.random() * 25;
    const geo = new THREE.ConeGeometry(8 + Math.random() * 8, h, 6 + Math.floor(Math.random() * 4));
    const m = new THREE.Mesh(geo, mountainMat);
    m.position.set(x, h * 0.5 - 1, z);
    m.rotation.y = Math.random() * Math.PI;
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);

    const snow = new THREE.Mesh(new THREE.ConeGeometry(6 + Math.random() * 3, h * 0.35, 6), snowMat);
    snow.position.set(x, h * 0.62 + 4, z);
    snow.rotation.y = Math.random() * Math.PI;
    snow.castShadow = true;
    scene.add(snow);
  }
}

function createTree(x, z, scale = 1) {
  const trunkGeo = new THREE.CylinderGeometry(0.35 * scale, 0.45 * scale, 3.2 * scale, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6d4826, roughness: 1 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(x, 1.6 * scale, z);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  scene.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e8d3c, roughness: 1 });
  const leaf1 = new THREE.Mesh(new THREE.ConeGeometry(1.5 * scale, 3.8 * scale, 7), leafMat);
  leaf1.position.set(x, 4.4 * scale, z);
  leaf1.castShadow = true;
  scene.add(leaf1);

  const leaf2 = new THREE.Mesh(new THREE.ConeGeometry(1.25 * scale, 3.0 * scale, 7), leafMat);
  leaf2.position.set(x, 5.3 * scale, z);
  leaf2.castShadow = true;
  scene.add(leaf2);
}

function createBush(x, z, s = 1) {
  const bush = new THREE.Mesh(
    new THREE.SphereGeometry(0.9 * s, 7, 6),
    new THREE.MeshStandardMaterial({ color: 0x2f9a46, roughness: 1 })
  );
  bush.position.set(x, 0.75 * s, z);
  bush.castShadow = true;
  scene.add(bush);
}

function createRock(x, z, s = 1) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.8 * s, 0),
    new THREE.MeshStandardMaterial({ color: 0x80848d, roughness: 1 })
  );
  rock.position.set(x, 0.6 * s, z);
  rock.rotation.set(Math.random(), Math.random(), Math.random());
  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);
}

function createFlag(poleHeight = 6, flagColor = 0x2f6db8) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, poleHeight, 6),
    new THREE.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.85 })
  );
  pole.position.y = poleHeight / 2;
  pole.castShadow = true;
  group.add(pole);

  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 1.1, 10, 2),
    new THREE.MeshStandardMaterial({ color: flagColor, side: THREE.DoubleSide, roughness: 0.9 })
  );
  flag.position.set(0.95, poleHeight - 0.9, 0);
  flag.rotation.y = Math.PI / 2;
  group.add(flag);

  group.userData.flag = flag;
  return group;
}

function createCastle() {
  const castle = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ map: stoneTex, color: 0xd1d3d6, roughness: 1 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2c5baf, roughness: 0.85 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc89b30, roughness: 0.5, metalness: 0.15 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(20, 5.5, 18), wallMat);
  base.position.y = 2.75;
  base.castShadow = true;
  base.receiveShadow = true;
  castle.add(base);

  const inner = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 10), wallMat);
  inner.position.set(0, 6.6, 0);
  inner.castShadow = true;
  castle.add(inner);

  const keep = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.8, 12, 8), wallMat);
  keep.position.y = 11.8;
  keep.castShadow = true;
  keep.receiveShadow = true;
  castle.add(keep);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 5.2, 8), roofMat);
  roof.position.y = 18.5;
  roof.castShadow = true;
  castle.add(roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.8, 0.7), new THREE.MeshStandardMaterial({ color: 0x5f3a1a, roughness: 1 }));
  door.position.set(0, 2.2, 9.1);
  castle.add(door);

  const stairs = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.2, 4), new THREE.MeshStandardMaterial({ color: 0xaeb2b8, roughness: 1 }));
  stairs.position.set(0, 0.6, 10.5);
  stairs.castShadow = true;
  castle.add(stairs);

  const moat = new THREE.Mesh(
    new THREE.TorusGeometry(13.5, 1.2, 8, 48),
    new THREE.MeshStandardMaterial({ color: 0x2b74a3, roughness: 0.2, metalness: 0.05, transparent: true, opacity: 0.88 })
  );
  moat.rotation.x = Math.PI / 2;
  moat.position.y = 0.2;
  castle.add(moat);

  const towers = [
    [-8.6, 6.1, -7.6], [8.6, 6.1, -7.6], [-8.6, 6.1, 7.6], [8.6, 6.1, 7.6]
  ];
  for (const [x, y, z] of towers) {
    const t = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 9.5, 8), wallMat);
    body.castShadow = true;
    body.receiveShadow = true;
    t.add(body);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.6, 8), roofMat);
    cap.position.y = 6.9;
    cap.castShadow = true;
    t.add(cap);

    const trim = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.15, 6, 16), goldMat);
    trim.rotation.x = Math.PI / 2;
    trim.position.y = 2.2;
    t.add(trim);

    const flag = createFlag(4.5, 0x2f6db8);
    flag.position.set(0, 8.0, 0);
    t.add(flag);

    t.position.set(x, y, z);
    castle.add(t);
  }

  const banner = createFlag(9, 0xb83b2f);
  banner.position.set(0, 4.8, -9.8);
  banner.rotation.y = Math.PI;
  castle.add(banner);

  return castle;
}

function createHouse(x, z, scale = 1, type = 0) {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ map: stoneTex, color: type === 0 ? 0xe1d4ba : 0xcdb89a, roughness: 1 });
  const roofMat = new THREE.MeshStandardMaterial({ color: type === 0 ? 0x7f5130 : 0x6f3e24, roughness: 0.95 });
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, color: 0x8a6338, roughness: 1 });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(4.4 * scale, 2.8 * scale, 4.4 * scale),
    wallMat
  );
  body.position.y = 1.4 * scale;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.5 * scale, 2.8 * scale, 4),
    roofMat
  );
  roof.position.y = 4.0 * scale;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 1.4 * scale, 0.18 * scale), woodMat);
  door.position.set(0, 0.8 * scale, 2.32 * scale);
  group.add(door);

  const smoke = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 * scale, 0.25 * scale, 1.2 * scale, 6),
    new THREE.MeshStandardMaterial({ color: 0x6a6f78, roughness: 1, transparent: true, opacity: 0.75 })
  );
  smoke.position.set(-0.9 * scale, 4.6 * scale, -0.7 * scale);
  group.add(smoke);

  group.position.set(x, 0, z);
  group.rotation.y = (Math.random() * Math.PI) / 2;
  group.castShadow = true;
  scene.add(group);
  return group;
}

function createMill(x, z) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.8, 3.2, 4.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xcdb894, roughness: 1 })
  );
  base.position.y = 2.25;
  base.castShadow = true;
  g.add(base);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.4, 2.8, 8),
    new THREE.MeshStandardMaterial({ color: 0x6d4a2a, roughness: 0.95 })
  );
  roof.position.y = 5.1;
  roof.castShadow = true;
  g.add(roof);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.7, 8),
    new THREE.MeshStandardMaterial({ color: 0x6a4a2a })
  );
  hub.position.set(0, 4.2, 1.9);
  hub.rotation.z = Math.PI / 2;
  g.add(hub);

  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xd8c39a, roughness: 1 });
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.6, 0.5), bladeMat);
    blade.position.set(0, 4.2, 1.9);
    blade.rotation.z = Math.PI / 2;
    blade.rotation.y = (i * Math.PI) / 2;
    blade.position.x = Math.cos((i * Math.PI) / 2) * 1.8;
    blade.position.y = 4.2;
    blade.position.z = Math.sin((i * Math.PI) / 2) * 1.8;
    blade.castShadow = true;
    g.add(blade);
  }

  g.position.set(x, 0, z);
  scene.add(g);
  return g;
}

function createMine(x, z) {
  const g = new THREE.Group();
  const stone = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 2.5, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x8a8f98, roughness: 1 })
  );
  stone.position.y = 1.25;
  stone.castShadow = true;
  g.add(stone);

  const opening = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.4, 2.0, 8),
    new THREE.MeshStandardMaterial({ color: 0x3f2d1f, roughness: 1 })
  );
  opening.rotation.z = Math.PI / 2;
  opening.position.set(0, 1.2, 2.2);
  g.add(opening);

  g.position.set(x, 0, z);
  scene.add(g);
  return g;
}

function createRoad(x1, z1, x2, z2, width = 5.5) {
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.4, len),
    new THREE.MeshStandardMaterial({ map: roadTex, color: 0xc7b090, roughness: 1 })
  );
  road.position.set((x1 + x2) / 2, 0.15, (z1 + z2) / 2);
  road.rotation.y = Math.atan2(dx, dz);
  road.receiveShadow = true;
  scene.add(road);
  return road;
}

function createRiverCurve() {
  const riverMat = new THREE.MeshStandardMaterial({
    color: 0x2d86c9,
    roughness: 0.15,
    metalness: 0.05,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide
  });
  const pts = [];
  for (let i = 0; i < 14; i++) {
    pts.push(new THREE.Vector2(-118 + i * 18, Math.sin(i * 0.7) * 10 + (i > 6 ? 8 : -12)));
  }
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, -0.5, p.y)));
  const geo = new THREE.TubeGeometry(curve, 200, 2.7, 8, false);
  const river = new THREE.Mesh(geo, riverMat);
  river.receiveShadow = true;
  scene.add(river);
  return river;
}

createTerrain();
createWaterRing();
createMountains();
createRiverCurve();

const castle = createCastle();
castle.position.set(0, 0, 0);
scene.add(castle);

createRoad(0, 10.5, 0, 42, 6);
createRoad(0, -12, -40, -12, 6);
createRoad(0, -12, 40, -12, 6);
createRoad(-12, 0, -50, 32, 5.5);
createRoad(12, 0, 50, 30, 5.5);

const buildings = [];
buildings.push(createHouse(-28, -12, 1.1, 0));
buildings.push(createHouse(28, -12, 1.1, 1));
buildings.push(createHouse(-28, 18, 1.0, 0));
buildings.push(createHouse(28, 18, 1.0, 1));
buildings.push(createHouse(-44, 28, 0.95, 0));
buildings.push(createHouse(44, 28, 0.95, 0));
buildings.push(createHouse(-42, -36, 1.0, 1));
buildings.push(createHouse(42, -36, 1.0, 0));
buildings.push(createMill(34, 2));
buildings.push(createMine(-36, 2));

const decor = [];
for (let i = 0; i < 80; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 72 + Math.random() * 40;
  const x = Math.cos(angle) * radius + (Math.random() * 6 - 3);
  const z = Math.sin(angle) * radius + (Math.random() * 6 - 3);
  if (Math.abs(x) < 18 && Math.abs(z) < 18) continue;
  const pick = Math.random();
  if (pick < 0.48) createTree(x, z, 0.9 + Math.random() * 0.7);
  else if (pick < 0.7) createBush(x, z, 0.8 + Math.random() * 0.7);
  else createRock(x, z, 0.9 + Math.random() * 1.2);
}

for (let i = 0; i < 14; i++) {
  const flag = createFlag(5, i % 2 === 0 ? 0x2f6db8 : 0xb83b2f);
  flag.position.set(Math.cos(i / 14 * Math.PI * 2) * 22, 0, Math.sin(i / 14 * Math.PI * 2) * 22);
  scene.add(flag);
  decor.push(flag);
}

const keyLight = new THREE.DirectionalLight(0xfff5df, 2.8);
keyLight.position.set(90, 140, 70);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 400;
keyLight.shadow.camera.left = -140;
keyLight.shadow.camera.right = 140;
keyLight.shadow.camera.top = 140;
keyLight.shadow.camera.bottom = -140;
scene.add(keyLight);

const fill = new THREE.DirectionalLight(0xbfdcff, 0.8);
fill.position.set(-80, 60, -40);
scene.add(fill);

const ambient = new THREE.AmbientLight(0x88a0aa, 1.0);
scene.add(ambient);

const skyGlow = new THREE.Mesh(
  new THREE.SphereGeometry(240, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0x8ecbf1, side: THREE.BackSide })
);
scene.add(skyGlow);

let t = 0;
function animate() {
  requestAnimationFrame(animate);
  t += 0.01;

  castle.rotation.y = Math.sin(t * 0.06) * 0.02;
  controls.update();

  // wave flags
  scene.traverse((obj) => {
    if (obj.isMesh && obj.geometry && obj.geometry.type === "PlaneGeometry" && obj.material && obj.material.color) {
      const arr = obj.geometry.attributes.position;
      for (let i = 0; i < arr.count; i++) {
        const x = arr.getX(i);
        const y = arr.getY(i);
        arr.setZ(i, Math.sin((x * 2.5) + t * 4 + y * 0.4) * 0.08);
      }
      arr.needsUpdate = true;
      obj.geometry.computeVertexNormals();
    }
  });

  // water subtle rotation
  scene.children.forEach((o) => {
    if (o.type === "Mesh" && o.geometry && o.geometry.type === "RingGeometry") {
      o.material.map.offset.x = t * 0.01;
    }
  });

  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
});
