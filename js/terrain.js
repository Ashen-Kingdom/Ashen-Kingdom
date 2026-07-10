export function createTerrain() {

    const geometry = new THREE.PlaneGeometry(
        300,
        300,
        100,
        100
    );

    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
        color: 0x6cab4f,
        roughness: 0.95,
        metalness: 0.02
    });

    const terrain = new THREE.Mesh(geometry, material);

    terrain.receiveShadow = true;

    terrain.name = "Terrain";

    return terrain;
}
