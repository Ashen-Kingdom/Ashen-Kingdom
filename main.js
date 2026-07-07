import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
60,
window.innerWidth/window.innerHeight,
0.1,
1000
);

camera.position.set(20,20,20);

const renderer = new THREE.WebGLRenderer({
antialias:true
});

renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);

controls.enableDamping=true;

const light=new THREE.DirectionalLight(0xffffff,2);
light.position.set(20,20,10);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff,1));

const ground=new THREE.Mesh(
new THREE.PlaneGeometry(100,100),
new THREE.MeshStandardMaterial({
color:0x4caf50
})
);

ground.rotation.x=-Math.PI/2;

scene.add(ground);

const castle=new THREE.Mesh(
new THREE.BoxGeometry(4,5,4),
new THREE.MeshStandardMaterial({
color:0xcccccc
})
);

castle.position.y=2.5;

scene.add(castle);

function animate(){

requestAnimationFrame(animate);

controls.update();

renderer.render(scene,camera);

}

animate();

window.addEventListener("resize",()=>{

camera.aspect=window.innerWidth/window.innerHeight;

camera.updateProjectionMatrix();

renderer.setSize(window.innerWidth,window.innerHeight);

});
