import * as THREE from 'three';
import GraphicsEngine, { CONFIG } from './engine.js';
import { GameState, UnitFactory } from './gameplay.js';
import UIController from './ui.js';

// ============================================
// MAIN GAME CLASS
// ============================================
class GrandStrategyGame {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.engine = null;
        this.game = null;
        this.ui = null;

        // 3D object collections
        this.unitMeshes = [];
        this.resourceMeshes = [];
        this.buildingMeshes = {};
        this.marchLines = [];
        this.scoutMesh = null;
        this.dragonMesh = null;
        this.hospitalMesh = null;
        this.tavernMesh = null;

        // Game loop
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedDelta = 1 / 60;

        this.init();
    }

    async init() {
        this.updateLoading(10);

        // Initialize engine
        this.engine = new GraphicsEngine(this.container);
        this.updateLoading(25);

        // Initialize game state
        this.game = new GameState();
        this.updateLoading(40);

        // Initialize UI
        this.ui = new UIController(this.game, this.engine);
        window.ui = this.ui; // Expose for onclick handlers
        this.updateLoading(55);

        // Create 3D world
        await this.createWorld();
        this.updateLoading(80);

        // Setup game callbacks
        this.setupCallbacks();
        this.updateLoading(95);

        // Start loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));

        // Handle resize
        window.addEventListener('resize', () => this.engine.resize());

        this.updateLoading(100);
        setTimeout(() => this.ui.hideLoading(), 500);

        // Initial notifications
        setTimeout(() => {
            this.game.showNotification('Welcome to Grand Strategy 3D!', 'success');
            this.game.showNotification('Your kingdom awaits, Commander.', 'info');
        }, 1000);
    }

    updateLoading(progress) {
        if (this.ui) this.ui.showLoading(progress);
    }

    async createWorld() {
        // Create alliance territory
        this.engine.createAllianceTerritory(0, 0, 60, CONFIG.ALLIANCE_COLORS.player, 'player');

        // Create watchtowers
        this.game.watchtowers.forEach(t => {
            this.engine.createAllianceTerritory(t.x, t.z, 25, CONFIG.ALLIANCE_COLORS.player, 'player');
        });

        // Create resource nodes
        this.game.resourceNodes.forEach(node => {
            const mesh = UnitFactory.createResourceNode(node.type, node.color, node.scale);
            mesh.position.set(node.x, this.engine.getTerrainHeight(node.x, node.z), node.z);
            mesh.name = `resource_${node.id}`;
            this.engine.scene.add(mesh);
            this.resourceMeshes.push(mesh);
        });

        // Create city buildings
        // Hospital
        this.hospitalMesh = UnitFactory.createHospitalBuilding();
        this.hospitalMesh.position.set(-15, this.engine.getTerrainHeight(-15, -15), -15);
        this.engine.scene.add(this.hospitalMesh);

        // Tavern
        this.tavernMesh = UnitFactory.createTavernBuilding();
        this.tavernMesh.position.set(15, this.engine.getTerrainHeight(15, -15), -15);
        this.engine.scene.add(this.tavernMesh);

        // Create sample units
        this.spawnUnitArmy('infantry', 20, -20, 20, 5);
        this.spawnUnitArmy('cavalry', 15, 20, 20, 8);
        this.spawnUnitArmy('flying', 5, 0, 30, 15);

        // Create dragon boss
        this.dragonMesh = UnitFactory.createDragonBoss();
        this.dragonMesh.position.set(
            this.game.dragonBoss.position.x,
            this.game.dragonBoss.position.y,
            this.game.dragonBoss.position.z
        );
        this.engine.scene.add(this.dragonMesh);

        // Create scout unit (hidden initially)
        this.scoutMesh = UnitFactory.createScoutUnit();
        this.scoutMesh.position.set(0, -100, 0);
        this.engine.scene.add(this.scoutMesh);

        // Add some decorative elements
        this.createDecorations();
    }

    spawnUnitArmy(type, count, centerX, centerZ, spacing) {
        const factory = type === 'infantry' ? UnitFactory.createInfantry :
                       type === 'cavalry' ? UnitFactory.createCavalry :
                       UnitFactory.createFlying;

        for (let i = 0; i < count; i++) {
            const unit = factory.call(UnitFactory);
            const offsetX = (Math.random() - 0.5) * spacing * Math.sqrt(count);
            const offsetZ = (Math.random() - 0.5) * spacing * Math.sqrt(count);
            const x = centerX + offsetX;
            const z = centerZ + offsetZ;
            const y = type === 'flying' ? 15 + Math.random() * 10 : this.engine.getTerrainHeight(x, z);

            unit.position.set(x, y, z);
            unit.rotation.y = Math.random() * Math.PI * 2;
            unit.name = `${type}_${i}`;
            this.engine.scene.add(unit);
            this.unitMeshes.push({ mesh: unit, type, originalY: y, offset: Math.random() * Math.PI * 2 });
        }
    }

    createDecorations() {
        // Random rocks and trees
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 50 + Math.random() * 100;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const y = this.engine.getTerrainHeight(x, z);

            if (Math.random() > 0.5) {
                // Rock
                const rockGeo = new THREE.DodecahedronGeometry(0.5 + Math.random(), 2);
                const rockMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.95 });
                const rock = new THREE.Mesh(rockGeo, rockMat);
                rock.position.set(x, y + 0.3, z);
                rock.scale.set(1 + Math.random(), 0.5 + Math.random() * 0.5, 1 + Math.random());
                this.engine.scene.add(rock);
            } else {
                // Small tree
                const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, 1.5, 16);
                const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.set(x, y + 0.75, z);
                this.engine.scene.add(trunk);

                const foliageGeo = new THREE.SphereGeometry(0.6, 16, 16);
                const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32 });
                const foliage = new THREE.Mesh(foliageGeo, foliageMat);
                foliage.position.set(x, y + 2, z);
                this.engine.scene.add(foliage);
            }
        }
    }

    setupCallbacks() {
        // Fog reveal callback
        this.game.onRevealFog = (x, z, radius) => {
            this.engine.revealFogArea(x, z, radius);
        };

        // Notification callback
        this.game.onNotification = (text, type) => {
            this.ui.showNotification(text, type);
        };

        // Context menu click-away
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#context-menu') && !e.target.closest('canvas')) {
                this.ui.hideContextMenu();
            }
        });
    }

    // ============================================
    // GAME LOOP
    // ============================================
    gameLoop(currentTime) {
        requestAnimationFrame((t) => this.gameLoop(t));

        const frameTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        this.accumulator += frameTime;

        // Fixed timestep updates
        while (this.accumulator >= this.fixedDelta) {
            this.update(this.fixedDelta);
            this.accumulator -= this.fixedDelta;
        }

        // Render
        const cycle = this.engine.update(frameTime);

        // Update weather based on game time
        const weather = this.game.getWeather();
        this.engine.setWeather(weather.type, weather.intensity);

        // Update 3D animations
        this.updateAnimations(frameTime);
    }

    update(deltaTime) {
        // Update game logic
        this.game.update(deltaTime);

        // Update unit animations
        this.updateUnitAnimations(deltaTime);

        // Update marching armies visualization
        this.updateMarchingArmies(deltaTime);

        // Update scout
        this.updateScout(deltaTime);

        // Update dragon boss
        this.updateDragonBoss(deltaTime);

        // Update hospital windows at night
        this.updateBuildingWindows();

        // Check for enemy incursions (random)
        if (Math.random() < 0.0001) {
            this.triggerThreatAlert();
        }
    }

    updateAnimations(deltaTime) {
        const time = this.engine.time;

        // Animate flying units
        this.unitMeshes.forEach(unit => {
            if (unit.type === 'flying') {
                unit.mesh.position.y = unit.originalY + Math.sin(time * 2 + unit.offset) * 2;
                // Flap wings
                unit.mesh.children.forEach(child => {
                    if (child.name === 'wing') {
                        child.rotation.z = Math.sin(time * 5 + unit.offset) * 0.3;
                    }
                });
            } else if (unit.type === 'cavalry') {
                // Slight bobbing
                unit.mesh.position.y = unit.originalY + Math.sin(time * 3 + unit.offset) * 0.1;
            }
        });

        // Animate water
        if (this.engine.water) {
            const positions = this.engine.water.geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i); // Actually Z in world
                const wave = Math.sin(x * 0.1 + time) * Math.cos(y * 0.1 + time * 0.7) * 0.3;
                positions.setZ(i, wave);
            }
            positions.needsUpdate = true;
        }

        // Animate resource nodes (subtle glow pulse)
        this.resourceMeshes.forEach((mesh, i) => {
            const pulse = 1 + Math.sin(time * 2 + i) * 0.05;
            mesh.scale.setScalar(mesh.userData?.baseScale || 1 * pulse);
        });
    }

    updateUnitAnimations(deltaTime) {
        // Combat particles from active combats
        this.game.activeCombats.forEach(combat => {
            if (Math.random() < 0.3) {
                const pos = new THREE.Vector3(
                    combat.position.x + (Math.random() - 0.5) * 10,
                    2 + Math.random() * 5,
                    combat.position.z + (Math.random() - 0.5) * 10
                );
                const color = Math.random() > 0.5 ? 0xff4400 : 0xffaa00;
                this.engine.spawnParticleBurst(pos, color, 20, 'explosion');

                // Spawn damage text
                if (Math.random() < 0.2) {
                    const damage = Math.floor(100 + Math.random() * 500);
                    const isCrit = Math.random() < 0.1;
                    this.engine.spawnDamageText(pos, damage, isCrit);
                }
            }
        });

        // Dragon boss ambient particles
        if (this.game.dragonBoss.active && this.dragonMesh) {
            if (Math.random() < 0.1) {
                const pos = new THREE.Vector3(
                    this.dragonMesh.position.x + (Math.random() - 0.5) * 8,
                    this.dragonMesh.position.y + Math.random() * 6,
                    this.dragonMesh.position.z + (Math.random() - 0.5) * 8
                );
                this.engine.spawnParticleBurst(pos, 0xff4400, 15, 'explosion');
            }

            // Animate dragon
            this.dragonMesh.rotation.y = Math.sin(this.engine.time * 0.2) * 0.1;
            this.dragonMesh.position.y = this.game.dragonBoss.position.y + Math.sin(this.engine.time * 0.5) * 2;

            // Flap wings
            this.dragonMesh.children.forEach(child => {
                if (child.name === 'bossWing') {
                    child.rotation.x = (child.position.z > 0 ? 1 : -1) * Math.PI / 6 + 
                                      Math.sin(this.engine.time * 1.5) * 0.2;
                }
            });

            // Pulse core
            const core = this.dragonMesh.getObjectByName('bossCore');
            if (core) {
                const pulse = 1 + Math.sin(this.engine.time * 3) * 0.2;
                core.scale.setScalar(pulse);
                core.material.emissiveIntensity = 2 + Math.sin(this.engine.time * 3) * 0.5;
            }
        }
    }

    updateMarchingArmies(deltaTime) {
        // Remove old march lines
        this.marchLines.forEach(line => {
            this.engine.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.marchLines = [];

        // Draw march lines for active armies
        this.game.marchingArmies.forEach(army => {
            const start = new THREE.Vector3(army.fromX, 1, army.fromZ);
            const end = new THREE.Vector3(army.toX, 1, army.toZ);
            const current = new THREE.Vector3().lerpVectors(start, end, army.progress);

            // Draw path line
            const points = [start, end];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ 
                color: army.mission === 'attack' ? 0xff0000 : 0x00ff00,
                transparent: true,
                opacity: 0.3
            });
            const line = new THREE.Line(geometry, material);
            this.engine.scene.add(line);
            this.marchLines.push(line);

            // Draw moving unit dot
            const dotGeo = new THREE.SphereGeometry(0.5, 16, 16);
            const dotMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
            const dot = new THREE.Mesh(dotGeo, dotMat);
            dot.position.copy(current);
            this.engine.scene.add(dot);
            this.marchLines.push(dot);
        });
    }

    updateScout(deltaTime) {
        if (this.game.scout.state === 'scouting' && this.scoutMesh) {
            const start = new THREE.Vector3(0, 2, 0);
            const end = new THREE.Vector3(this.game.scout.targetX, 2, this.game.scout.targetZ);
            const progress = this.game.scout.progress;

            this.scoutMesh.position.lerpVectors(start, end, progress);
            this.scoutMesh.position.y = 2 + Math.sin(this.engine.time * 10) * 0.5;

            // Animate cloak
            this.scoutMesh.children.forEach(child => {
                if (child.name === 'cloak') {
                    child.rotation.z = Math.sin(this.engine.time * 8) * 0.3;
                }
            });

            // Reveal fog along path
            if (Math.random() < 0.3) {
                this.engine.revealFogArea(this.scoutMesh.position.x, this.scoutMesh.position.z, 15);
            }
        } else if (this.game.scout.state === 'idle') {
            this.scoutMesh.position.set(0, -100, 0);
        }
    }

    updateDragonBoss(deltaTime) {
        if (!this.game.dragonBoss.active || !this.dragonMesh) return;

        // Check for nearby attacks (simplified)
        // In a real game, this would check for player armies in range
    }

    updateBuildingWindows() {
        const isNight = this.engine.dayTime > 0.7 || this.engine.dayTime < 0.1;

        // Update hospital windows
        if (this.hospitalMesh) {
            this.hospitalMesh.children.forEach(child => {
                if (child.name === 'window') {
                    child.material.emissiveIntensity = isNight ? 1.5 : 0.2;
                    child.material.emissive.setHex(isNight ? 0xffaa33 : 0x224466);
                }
            });
        }

        // Position window lights near buildings
        if (isNight && this.hospitalMesh) {
            const pos = this.hospitalMesh.position;
            this.engine.windowLights.forEach((light, i) => {
                const angle = (i / 8) * Math.PI * 2;
                light.position.set(
                    pos.x + Math.cos(angle) * 5,
                    pos.y + 5,
                    pos.z + Math.sin(angle) * 5
                );
            });
        }
    }

    triggerThreatAlert() {
        const alert = document.getElementById('threat-alert');
        alert.classList.remove('hidden');
        setTimeout(() => alert.classList.add('hidden'), 5000);

        // Flash territory border
        this.engine.watchtowers.forEach(tower => {
            const originalColor = tower.beacon.material.color.getHex();
            tower.beacon.material.color.setHex(0xff0000);
            tower.beacon.material.emissive.setHex(0xff0000);
            setTimeout(() => {
                tower.beacon.material.color.setHex(originalColor);
                tower.beacon.material.emissive.setHex(originalColor);
            }, 3000);
        });
    }

    // ============================================
    // COMBAT COMMANDS (exposed for UI)
    // ============================================
    attackDragon(troopType, count) {
        const result = this.game.attackDragonBoss(troopType, count);
        if (result) {
            this.engine.spawnParticleBurst(
                new THREE.Vector3(this.dragonMesh.position.x, this.dragonMesh.position.y + 5, this.dragonMesh.position.z),
                0xff0000, 100, 'explosion'
            );
            this.engine.spawnDamageText(
                new THREE.Vector3(this.dragonMesh.position.x, this.dragonMesh.position.y + 10, this.dragonMesh.position.z),
                result.damage, true
            );
            return true;
        }
        return false;
    }

    dispatchToDragon(troopType, count) {
        return this.game.dispatchArmy(troopType, count, this.game.dragonBoss.position.x, this.game.dragonBoss.position.z, 'attack');
    }
}

// ============================================
// INITIALIZE
// ============================================
const game = new GrandStrategyGame();
window.game = game; // Expose for debugging

// Add CSS animation for chest shake
const style = document.createElement('style');
style.textContent = `
    @keyframes chestShake {
        0%, 100% { transform: rotate(0deg) scale(1); }
        20% { transform: rotate(-10deg) scale(1.1); }
        40% { transform: rotate(10deg) scale(1.1); }
        60% { transform: rotate(-5deg) scale(1.05); }
        80% { transform: rotate(5deg) scale(1.05); }
    }
`;
document.head.appendChild(style);

export default GrandStrategyGame;
