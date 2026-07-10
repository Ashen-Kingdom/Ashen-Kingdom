import { createRenderer } from "./engine.js";
import { createScene } from "./scene.js";
import { createCamera } from "./camera.js";
import { createWorld } from "./world.js";

try {

    const canvas = document.getElementById("game");

    const renderer = createRenderer(canvas);
    const { scene } = createScene();
    const camera = createCamera();

    createWorld(scene);

    const clock = new THREE.Clock();

    function resize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", resize);
    resize();

    function animate() {
        requestAnimationFrame(animate);

        clock.getDelta();

        renderer.render(scene, camera);
    }

    animate();

} catch (e) {

    alert(e.message);

}
