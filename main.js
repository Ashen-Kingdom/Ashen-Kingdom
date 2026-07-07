import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera
const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(18, 18, 18);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2, 0);
controls.enableDamping = true;

// Lights
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(20, 30, 10);
sun.castShadow = true;
scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));

// Ground
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: 0x4fa34f })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Castle base
const castle = new THREE.Mesh(
    new THREE.BoxGeometry(6, 4, 6),
    new THREE.MeshStandardMaterial({ color: 0xbdbdbd })
);
castle.position.y = 2;
castle.castShadow = true;
scene.add(castle);

// Towers
const towerGeo = new THREE.CylinderGeometry(0.8,0.8,6,16);
const towerMat = new THREE.MeshStandardMaterial({color:0x999999});

[
[-3,3,-3],
[3,3,-3],
[-3,3,3],
[3,3,3]
].forEach(pos=>{
const t=new THREE.Mesh(towerGeo,towerMat);
t.position.set(...pos);
t.castShadow=true;
scene.add(t);
});

// Trees
function tree(x,z){

const trunk=new THREE.Mesh(
new THREE.CylinderGeometry(0.2,0.25,1.2),
new THREE.MeshStandardMaterial({color:0x6b4423})
);

trunk.position.set(x,0.6,z);
scene.add(trunk);

const leaves=new THREE.Mesh(
new THREE.ConeGeometry(0.9,2,8),
new THREE.MeshStandardMaterial({color:0x1e8f3d})
);

leaves.position.set(x,2,z);
leaves.castShadow=true;
scene.add(leaves);

}

for(let i=0;i<35;i++){

const x=(Math.random()-0.5)*80;
const z=(Math.random()-0.5)*80;

if(Math.abs(x)<8 && Math.abs(z)<8) continue;

tree(x,z);

}

// Rocks
for(let i=0;i<25;i++){

const rock=new THREE.Mesh(
new THREE.DodecahedronGeometry(Math.random()*0.4+0.3),
new THREE.MeshStandardMaterial({color:0x777777})
);

rock.position.set(
(Math.random()-0.5)*90,
0.35,
(Math.random()-0.5)*90
);

rock.castShadow=true;

scene.add(rock);

}

// Animate
function animate(){

requestAnimationFrame(animate);

controls.update();

renderer.render(scene,camera);

}

animate();

// Resize
window.addEventListener("resize",()=>{

camera.aspect=window.innerWidth/window.innerHeight;

camera.updateProjectionMatrix();

renderer.setSize(window.innerWidth,window.innerHeight);

});
