import { createTerrain } from "./terrain.js";

export function createWorld(scene) {

    const terrain = createTerrain();

    scene.add(terrain);

    return {
        terrain
    };

}
