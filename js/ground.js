import * as THREE from "three";
import scene from "./scene.js";

const geometry = new THREE.PlaneGeometry(200, 200, 100, 100);

const material = new THREE.MeshStandardMaterial({
    color: 0x4f8f3a,
    roughness: 1
});

const ground = new THREE.Mesh(geometry, material);

ground.rotation.x = -Math.PI / 2;

ground.receiveShadow = true;

scene.add(ground);

export default ground;
