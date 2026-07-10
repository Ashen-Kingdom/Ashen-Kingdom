export function createScene() {

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0x87ceeb);

    scene.fog = new THREE.Fog(0x87ceeb, 180, 500);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Sun
    const sun = new THREE.DirectionalLight(0xffffff, 2);

    sun.position.set(40, 60, 20);
    sun.castShadow = true;

    sun.shadow.mapSize.set(2048, 2048);

    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 300;

    scene.add(sun);

    return {
        scene,
        ambientLight,
        sun
    };
}
