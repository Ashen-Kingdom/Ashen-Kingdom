import * as THREE from "three";
import scene from "./scene.js";

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2);
sunLight.position.set(10, 20, 10);

scene.add(sunLight);
