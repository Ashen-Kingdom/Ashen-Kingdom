import scene from "./scene.js";
import camera from "./camera.js";
import renderer from "./renderer.js";

function animate() {

    requestAnimationFrame(animate);

    renderer.render(scene, camera);

}

animate();
