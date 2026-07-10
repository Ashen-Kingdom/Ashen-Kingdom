export function createCamera() {

    const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );

    // Initial strategy-game view
    camera.position.set(0, 25, 35);
    camera.lookAt(0, 0, 0);

    return camera;
}
