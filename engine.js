export function addSoldier(type, position) {
  let geometry, material, mesh;
  switch(type) {
    case "Cavalry":
      geometry = new THREE.SphereGeometry(5, 64, 64); // High Poly
      material = new THREE.MeshStandardMaterial({ color: 0x8B0000, metalness: 0.6, roughness: 0.4 });
      break;
    case "Infantry":
      geometry = new THREE.BoxGeometry(8, 12, 8, 64, 64, 64);
      material = new THREE.MeshStandardMaterial({ color: 0x2F4F4F, metalness: 0.3, roughness: 0.7 });
      break;
    case "Flying":
      geometry = new THREE.ConeGeometry(6, 20, 64);
      material = new THREE.MeshStandardMaterial({ color: 0x4682B4, emissive: 0x0000ff, emissiveIntensity: 0.5 });
      break;
    case "Mage":
      geometry = new THREE.CylinderGeometry(4, 4, 15, 64);
      material = new THREE.MeshStandardMaterial({ color: 0x9932CC, emissive: 0x551A8B, emissiveIntensity: 0.7 });
      break;
  }
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = true;
  scene.add(mesh);
}

export function addHero(name, position) {
  const geometry = new THREE.TorusKnotGeometry(10, 3, 128, 32); // High Poly Hero Mesh
  const material = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 1, roughness: 0.2, emissive: 0xFF8C00 });
  const hero = new THREE.Mesh(geometry, material);
  hero.position.set(position.x, position.y, position.z);
  hero.castShadow = true;
  scene.add(hero);
}
