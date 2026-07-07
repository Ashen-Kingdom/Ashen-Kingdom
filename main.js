import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Water } from "three/addons/objects/Water.js";
import { Sky } from "three/addons/objects/Sky.js";

// =======================
// Renderer
// =======================

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

// =======================
// Scene
// =======================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ecdf7);

scene.fog = new THREE.Fog(
    0xaad8ff,
    120,
    350
);

// =======================
// Camera
// =======================

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(
    65,
    45,
    65
);

// =======================
// Orbit Camera
// =======================

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.08;

controls.maxPolarAngle = Math.PI * 0.47;
controls.minDistance = 20;
controls.maxDistance = 120;

controls.target.set(
    0,
    8,
    0);

// =======================
// Hemisphere Light
// =======================

const hemi = new THREE.HemisphereLight(
    0xd8f2ff,
    0x4d6c40,
    1.4
);

scene.add(hemi);

// =======================
// Sun Light
// =======================

const sun = new THREE.DirectionalLight(
    0xfff6dd,
    3.0
);

sun.position.set(
    120,
    160,
    60
);

sun.castShadow = true;

sun.shadow.mapSize.width = 4096;
sun.shadow.mapSize.height = 4096;

sun.shadow.camera.left = -120;
sun.shadow.camera.right = 120;
sun.shadow.camera.top = 120;
sun.shadow.camera.bottom = -120;

scene.add(sun);

// =======================
// Sky
// =======================

const sky = new Sky();

sky.scale.setScalar(
    450000
);

scene.add(sky);

const skyUniforms =
    sky.material.uniforms;

skyUniforms.turbidity.value = 3;
skyUniforms.rayleigh.value = 1.8;
skyUniforms.mieCoefficient.value = 0.004;
skyUniforms.mieDirectionalG.value = 0.8;

const sunVector =
    new THREE.Vector3();

const phi =
    THREE.MathUtils.degToRad(
        70
    );

const theta =
    THREE.MathUtils.degToRad(
        180
    );

sunVector.setFromSphericalCoords(
    1,
    phi,
    theta
);

sky.material.uniforms.sunPosition.value.copy(
    sunVector
);

// =======================
// Terrain
// =======================

const terrainGeometry =
new THREE.PlaneGeometry(
    300,
    300,
    300,
    300
);

terrainGeometry.rotateX(
    -Math.PI / 2
);

const position =
terrainGeometry.attributes.position;

for(let i=0;i<position.count;i++){

    const x=position.getX(i);
    const z=position.getZ(i);

    let h=0;

    h+=Math.sin(x*0.04)*3;
    h+=Math.cos(z*0.05)*2;
    h+=Math.sin((x+z)*0.03)*4;
    h+=Math.cos((x-z)*0.02)*2;

    position.setY(i,h);

}

terrainGeometry.computeVertexNormals();

const terrainMaterial =
new THREE.MeshStandardMaterial({

    color:0x4d9a55,

    roughness:1,

    metalness:0

});

const terrain =
new THREE.Mesh(
terrainGeometry,
terrainMaterial
);

terrain.receiveShadow=true;
terrain.castShadow=true;

scene.add(terrain);
