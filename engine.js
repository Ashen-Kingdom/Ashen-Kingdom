import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================
// ENGINE CONFIGURATION
// ============================================
export const CONFIG = {
    TERRAIN_SIZE: 400,
    TERRAIN_SEGMENTS: 128,
    SHADOW_MAP_SIZE: 4096,
    DAY_DURATION: 360, // 6 minutes = 6 hours compressed
    FOG_DENSITY: 0.015,
    WEATHER_PARTICLES: 8000,
    MAX_UNITS: 500,
    ALLIANCE_COLORS: {
        player: 0x4CAF50,
        allied: 0x2196F3,
        enemy: 0xf44336
    }
};

// ============================================
// HIGH-POLY GEOMETRY HELPERS
// ============================================
export function createHighPolySphere(radius, detail = 64) {
    return new THREE.SphereGeometry(radius, detail, detail);
}

export function createHighPolyCylinder(rt, rb, h, rs = 64, hs = 32) {
    return new THREE.CylinderGeometry(rt, rb, h, rs, hs);
}

export function createHighPolyPlane(w, h, ws = 128, hs = 128) {
    return new THREE.PlaneGeometry(w, h, ws, hs);
}

export function createPBRMaterial(params = {}) {
    return new THREE.MeshStandardMaterial({
        color: params.color || 0x888888,
        roughness: params.roughness ?? 0.7,
        metalness: params.metalness ?? 0.1,
        emissive: params.emissive || 0x000000,
        emissiveIntensity: params.emissiveIntensity ?? 1,
        transparent: params.transparent || false,
        opacity: params.opacity ?? 1,
        side: params.side || THREE.FrontSide,
        flatShading: false
    });
}

// ============================================
// MAIN ENGINE CLASS
// ============================================
export class GraphicsEngine {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.time = 0;
        this.dayTime = 0; // 0-1 cycle

        // Lighting
        this.sunLight = null;
        this.ambientLight = null;
        this.moonLight = null;
        this.windowLights = [];

        // Weather
        this.weatherSystem = null;
        this.currentWeather = 'clear'; // clear, rain, fog, storm
        this.weatherIntensity = 0;

        // Fog of War
        this.fogOfWar = null;
        this.fogTexture = null;
        this.fogContext = null;
        this.fogCanvas = null;

        // Terrain
        this.terrain = null;
        this.terrainHeightMap = null;

        // Alliance Territory
        this.territoryMeshes = [];
        this.watchtowers = [];

        // Particles
        this.particleSystems = [];

        // Damage text overlays
        this.damageTexts = [];

        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupCamera();
        this.setupControls();
        this.setupLighting();
        this.setupTerrain();
        this.setupFogOfWar();
        this.setupWeather();
        this.setupSkybox();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(60, 50, 60);
        this.camera.lookAt(0, 0, 0);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 200;
        this.controls.target.set(0, 0, 0);
    }

    setupLighting() {
        // Ambient base
        this.ambientLight = new THREE.AmbientLight(0x404080, 0.3);
        this.scene.add(this.ambientLight);

        // Hemisphere for sky/ground bounce
        this.hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x362d1d, 0.4);
        this.scene.add(this.hemiLight);

        // Main sun (directional with shadows)
        this.sunLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
        this.sunLight.position.set(100, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = CONFIG.SHADOW_MAP_SIZE;
        this.sunLight.shadow.mapSize.height = CONFIG.SHADOW_MAP_SIZE;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 300;
        this.sunLight.shadow.camera.left = -150;
        this.sunLight.shadow.camera.right = 150;
        this.sunLight.shadow.camera.top = 150;
        this.sunLight.shadow.camera.bottom = -150;
        this.sunLight.shadow.bias = -0.0005;
        this.sunLight.shadow.normalBias = 0.02;
        this.scene.add(this.sunLight);

        // Moon light (night time)
        this.moonLight = new THREE.DirectionalLight(0x4466aa, 0.0);
        this.moonLight.position.set(-100, 100, -50);
        this.scene.add(this.moonLight);

        // Window glow lights (for night)
        for (let i = 0; i < 8; i++) {
            const light = new THREE.PointLight(0xffaa33, 0, 15);
            light.position.set(0, -100, 0); // Hidden initially
            this.scene.add(light);
            this.windowLights.push(light);
        }
    }

    setupTerrain() {
        const size = CONFIG.TERRAIN_SIZE;
        const segs = CONFIG.TERRAIN_SEGMENTS;
        const geo = createHighPolyPlane(size, size, segs, segs);

        // Generate heightmap with multiple octaves
        const pos = geo.attributes.position;
        this.terrainHeightMap = new Float32Array(pos.count);

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i); // Actually Z in world
            const dist = Math.sqrt(x*x + y*y);

            // Multi-octave noise simulation
            let h = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 3;
            h += Math.sin(x * 0.12 + 1.5) * Math.cos(y * 0.08 + 0.7) * 2;
            h += Math.sin(x * 0.25) * Math.cos(y * 0.2) * 1;
            h += (Math.random() - 0.5) * 0.3; // Micro detail

            // Flatten center for city
            const cityRadius = 30;
            if (dist < cityRadius) {
                h *= (dist / cityRadius);
            }

            // Create mountain ridges
            const ridge = Math.abs(Math.sin(x * 0.03) * Math.cos(y * 0.04));
            if (dist > 50) h += ridge * 8 * Math.min(1, (dist - 50) / 50);

            pos.setZ(i, h);
            this.terrainHeightMap[i] = h;
        }

        geo.computeVertexNormals();

        // PBR terrain material
        const mat = createPBRMaterial({
            color: 0x4a6741,
            roughness: 0.9,
            metalness: 0.0
        });

        this.terrain = new THREE.Mesh(geo, mat);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.terrain.name = 'terrain';
        this.scene.add(this.terrain);

        // Add water plane at low elevation
        const waterGeo = new THREE.PlaneGeometry(size * 1.5, size * 1.5, 64, 64);
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x1a4a6a,
            transparent: true,
            opacity: 0.7,
            roughness: 0.1,
            metalness: 0.8
        });
        this.water = new THREE.Mesh(waterGeo, waterMat);
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = -3;
        this.scene.add(this.water);
    }

    getTerrainHeight(x, z) {
        if (!this.terrain) return 0;
        // Simple bilinear interpolation from heightmap
        const size = CONFIG.TERRAIN_SIZE;
        const segs = CONFIG.TERRAIN_SEGMENTS;
        const u = (x / size + 0.5) * segs;
        const v = (z / size + 0.5) * segs;
        const i = Math.floor(v) * (segs + 1) + Math.floor(u);
        return this.terrainHeightMap[Math.max(0, Math.min(i, this.terrainHeightMap.length - 1))] || 0;
    }

    setupFogOfWar() {
        const size = CONFIG.TERRAIN_SIZE;
        const texSize = 512;
        this.fogCanvas = document.createElement('canvas');
        this.fogCanvas.width = texSize;
        this.fogCanvas.height = texSize;
        this.fogContext = this.fogCanvas.getContext('2d');

        // Fill with black (unexplored)
        this.fogContext.fillStyle = '#000000';
        this.fogContext.fillRect(0, 0, texSize, texSize);

        this.fogTexture = new THREE.CanvasTexture(this.fogCanvas);
        this.fogTexture.minFilter = THREE.LinearFilter;
        this.fogTexture.magFilter = THREE.LinearFilter;

        const fogGeo = new THREE.PlaneGeometry(size, size);
        const fogMat = new THREE.MeshBasicMaterial({
            map: this.fogTexture,
            transparent: true,
            opacity: 0.85,
            depthWrite: false
        });

        this.fogOfWar = new THREE.Mesh(fogGeo, fogMat);
        this.fogOfWar.rotation.x = -Math.PI / 2;
        this.fogOfWar.position.y = 0.5;
        this.fogOfWar.name = 'fogOfWar';
        this.scene.add(this.fogOfWar);

        // Reveal starting area
        this.revealFogArea(0, 0, 80);
    }

    revealFogArea(worldX, worldZ, radius) {
        if (!this.fogContext) return;
        const texSize = 512;
        const size = CONFIG.TERRAIN_SIZE;
        const cx = ((worldX / size) + 0.5) * texSize;
        const cy = ((-worldZ / size) + 0.5) * texSize;
        const r = (radius / size) * texSize;

        const grad = this.fogContext.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.7, 'rgba(0,0,0,0.3)');
        grad.addColorStop(1, 'rgba(0,0,0,0.85)');

        this.fogContext.globalCompositeOperation = 'destination-out';
        this.fogContext.fillStyle = grad;
        this.fogContext.beginPath();
        this.fogContext.arc(cx, cy, r, 0, Math.PI * 2);
        this.fogContext.fill();
        this.fogContext.globalCompositeOperation = 'source-over';

        if (this.fogTexture) this.fogTexture.needsUpdate = true;
    }

    setupWeather() {
        // Rain particle system
        const rainCount = CONFIG.WEATHER_PARTICLES;
        const rainGeo = new THREE.BufferGeometry();
        const rainPos = new Float32Array(rainCount * 3);
        const rainVel = new Float32Array(rainCount);

        for (let i = 0; i < rainCount; i++) {
            rainPos[i * 3] = (Math.random() - 0.5) * 200;
            rainPos[i * 3 + 1] = Math.random() * 80 + 20;
            rainPos[i * 3 + 2] = (Math.random() - 0.5) * 200;
            rainVel[i] = 0.5 + Math.random() * 0.5;
        }

        rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));

        const rainMat = new THREE.PointsMaterial({
            color: 0x88aabb,
            size: 0.3,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });

        this.rainSystem = new THREE.Points(rainGeo, rainMat);
        this.rainSystem.name = 'rain';
        this.scene.add(this.rainSystem);
        this.rainVelocities = rainVel;

        // Fog particles (volumetric feel)
        const fogCount = 2000;
        const fogGeo = new THREE.BufferGeometry();
        const fogPos = new Float32Array(fogCount * 3);
        for (let i = 0; i < fogCount; i++) {
            fogPos[i * 3] = (Math.random() - 0.5) * 300;
            fogPos[i * 3 + 1] = Math.random() * 10;
            fogPos[i * 3 + 2] = (Math.random() - 0.5) * 300;
        }
        fogGeo.setAttribute('position', new THREE.BufferAttribute(fogPos, 3));

        const fogMat = new THREE.PointsMaterial({
            color: 0xcccccc,
            size: 2.0,
            transparent: true,
            opacity: 0,
            blending: THREE.NormalBlending,
            depthWrite: false
        });

        this.fogParticles = new THREE.Points(fogGeo, fogMat);
        this.fogParticles.name = 'fogParticles';
        this.scene.add(this.fogParticles);
    }

    setWeather(type, intensity = 1) {
        this.currentWeather = type;
        this.weatherIntensity = intensity;

        if (type === 'rain' || type === 'storm') {
            this.rainSystem.material.opacity = 0.6 * intensity;
        } else {
            this.rainSystem.material.opacity = 0;
        }

        if (type === 'fog' || type === 'storm') {
            this.fogParticles.material.opacity = 0.3 * intensity;
            this.scene.fog = new THREE.FogExp2(0x8899aa, 0.008 * intensity);
        } else {
            this.fogParticles.material.opacity = 0;
            this.scene.fog = null;
        }
    }

    setupSkybox() {
        // Procedural sky dome
        const skyGeo = createHighPolySphere(400, 32);
        const skyMat = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide,
            fog: false
        });
        this.sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(this.sky);
    }

    updateDayNightCycle(deltaTime) {
        this.dayTime += deltaTime / CONFIG.DAY_DURATION;
        this.dayTime %= 1;

        const t = this.dayTime;
        const sunAngle = t * Math.PI * 2 - Math.PI / 2;
        const sunHeight = Math.sin(sunAngle);
        const sunX = Math.cos(sunAngle) * 100;
        const sunY = Math.max(sunHeight * 100, -10);
        const sunZ = Math.sin(sunAngle * 0.3) * 50;

        this.sunLight.position.set(sunX, sunY, sunZ);
        this.moonLight.position.set(-sunX, Math.max(-sunY, 20), -sunZ);

        // Color transitions
        let sunColor, sunIntensity, ambientColor, ambientIntensity, skyColor;
        let windowIntensity = 0;

        if (t < 0.2) { // Dawn (0-1.2h)
            const p = t / 0.2;
            sunColor = new THREE.Color().lerpColors(new THREE.Color(0xff6633), new THREE.Color(0xfff5e6), p);
            sunIntensity = 0.5 + p * 1.5;
            ambientColor = new THREE.Color().lerpColors(new THREE.Color(0x1a1a3a), new THREE.Color(0x404080), p);
            ambientIntensity = 0.2 + p * 0.2;
            skyColor = new THREE.Color().lerpColors(new THREE.Color(0x0d1b2a), new THREE.Color(0x87CEEB), p);
        } else if (t < 0.5) { // Day (1.2-3h)
            const p = (t - 0.2) / 0.3;
            sunColor = new THREE.Color().lerpColors(new THREE.Color(0xfff5e6), new THREE.Color(0xffffff), Math.sin(p * Math.PI));
            sunIntensity = 2.0 + Math.sin(p * Math.PI) * 0.5;
            ambientColor = new THREE.Color(0x87CEEB);
            ambientIntensity = 0.5;
            skyColor = new THREE.Color(0x87CEEB);
        } else if (t < 0.7) { // Dusk (3-4.2h)
            const p = (t - 0.5) / 0.2;
            sunColor = new THREE.Color().lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xff6633), p);
            sunIntensity = 2.5 - p * 2.0;
            ambientColor = new THREE.Color().lerpColors(new THREE.Color(0x87CEEB), new THREE.Color(0x2a1a4a), p);
            ambientIntensity = 0.5 - p * 0.2;
            skyColor = new THREE.Color().lerpColors(new THREE.Color(0x87CEEB), new THREE.Color(0x2d1b4e), p);
        } else { // Night (4.2-6h)
            const p = (t - 0.7) / 0.3;
            sunColor = new THREE.Color(0xff6633);
            sunIntensity = Math.max(0, 0.5 - p * 0.5);
            ambientColor = new THREE.Color().lerpColors(new THREE.Color(0x2a1a4a), new THREE.Color(0x0a0a20), p);
            ambientIntensity = 0.2;
            skyColor = new THREE.Color().lerpColors(new THREE.Color(0x2d1b4e), new THREE.Color(0x050510), p);
            windowIntensity = 1.5;
        }

        this.sunLight.color.copy(sunColor);
        this.sunLight.intensity = sunIntensity;
        this.ambientLight.color.copy(ambientColor);
        this.ambientLight.intensity = ambientIntensity;
        this.sky.material.color.copy(skyColor);

        // Moon intensity inverse to sun
        this.moonLight.intensity = (t > 0.6) ? (t - 0.6) / 0.4 * 0.8 : 0;

        // Window lights at night
        this.windowLights.forEach((light, i) => {
            light.intensity = windowIntensity * (0.8 + Math.sin(this.time * 2 + i) * 0.2);
        });

        return { time: t, isNight: t > 0.7 || t < 0.1 };
    }

    updateWeather(deltaTime) {
        if (this.currentWeather === 'rain' || this.currentWeather === 'storm') {
            const positions = this.rainSystem.geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                let y = positions.getY(i);
                y -= this.rainVelocities[i] * (this.currentWeather === 'storm' ? 2 : 1);
                if (y < 0) {
                    y = 80 + Math.random() * 20;
                    positions.setX(i, (Math.random() - 0.5) * 200);
                    positions.setZ(i, (Math.random() - 0.5) * 200);
                }
                positions.setY(i, y);
            }
            positions.needsUpdate = true;
        }

        if (this.currentWeather === 'fog' || this.currentWeather === 'storm') {
            const positions = this.fogParticles.geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                let x = positions.getX(i) + Math.sin(this.time + i) * 0.02;
                let z = positions.getZ(i) + Math.cos(this.time + i * 0.5) * 0.02;
                positions.setX(i, x);
                positions.setZ(i, z);
            }
            positions.needsUpdate = true;
        }
    }

    createAllianceTerritory(centerX, centerZ, radius, color, allianceId) {
        // Create watchtower
        const towerGroup = new THREE.Group();

        // Tower base - high poly cylinder
        const baseGeo = createHighPolyCylinder(2, 2.5, 12, 32, 16);
        const baseMat = createPBRMaterial({ color: 0x5a4a3a, roughness: 0.8 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 6;
        base.castShadow = true;
        towerGroup.add(base);

        // Tower top
        const topGeo = createHighPolyCylinder(3, 2, 4, 32, 8);
        const topMat = createPBRMaterial({ color: 0x6b5a4a, roughness: 0.7 });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.y = 14;
        top.castShadow = true;
        towerGroup.add(top);

        // Roof
        const roofGeo = createHighPolyCylinder(0.2, 3.5, 4, 32, 8);
        const roofMat = createPBRMaterial({ color: 0x8b0000, roughness: 0.6 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 17;
        towerGroup.add(roof);

        // Beacon light
        const beaconGeo = createHighPolySphere(0.5, 16);
        const beaconMat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 2
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.y = 19;
        towerGroup.add(beacon);

        // Beacon point light
        const beaconLight = new THREE.PointLight(color, 2, 30);
        beaconLight.position.y = 19;
        towerGroup.add(beaconLight);

        // Territory boundary - semi-transparent grid
        const boundaryGeo = new THREE.RingGeometry(radius - 1, radius + 1, 64);
        const boundaryMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const boundary = new THREE.Mesh(boundaryGeo, boundaryMat);
        boundary.rotation.x = -Math.PI / 2;
        boundary.position.y = 0.2;
        towerGroup.add(boundary);

        // Grid lines
        const gridHelper = new THREE.PolarGridHelper(radius, 16, 8, 64, color, color);
        gridHelper.position.y = 0.1;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.15;
        towerGroup.add(gridHelper);

        towerGroup.position.set(centerX, this.getTerrainHeight(centerX, centerZ), centerZ);
        this.scene.add(towerGroup);

        this.watchtowers.push({
            mesh: towerGroup,
            allianceId,
            radius,
            center: new THREE.Vector3(centerX, 0, centerZ),
            beacon,
            beaconLight,
            color
        });

        return towerGroup;
    }

    spawnParticleBurst(position, color, count = 50, type = 'explosion') {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];
        const lifetimes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed = 2 + Math.random() * 8;

            velocities.push({
                x: Math.sin(phi) * Math.cos(theta) * speed,
                y: Math.cos(phi) * speed + (type === 'explosion' ? 5 : 0),
                z: Math.sin(phi) * Math.sin(theta) * speed
            });

            lifetimes[i] = 1.0 + Math.random() * 1.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: color,
            size: type === 'explosion' ? 0.8 : 0.4,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        this.particleSystems.push({
            mesh: particles,
            velocities,
            lifetimes,
            maxLifetimes: [...lifetimes],
            time: 0
        });
    }

    spawnDamageText(position, damage, isCrit = false, isHeal = false) {
        // Create a DOM element for damage text
        const el = document.createElement('div');
        el.className = `damage-float ${isCrit ? 'crit' : ''} ${isHeal ? 'heal' : ''}`;
        el.textContent = isHeal ? `+${damage}` : `-${damage}`;
        document.body.appendChild(el);

        // Project 3D position to screen
        const updatePosition = () => {
            const vec = position.clone();
            vec.project(this.camera);
            const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-vec.y * 0.5 + 0.5) * window.innerHeight;
            el.style.left = x + 'px';
            el.style.top = y + 'px';
        };

        updatePosition();

        this.damageTexts.push({
            element: el,
            position,
            life: 1.5,
            updatePosition
        });
    }

    updateParticles(deltaTime) {
        for (let i = this.particleSystems.length - 1; i >= 0; i--) {
            const sys = this.particleSystems[i];
            sys.time += deltaTime;

            const positions = sys.mesh.geometry.attributes.position;
            let alive = false;

            for (let j = 0; j < sys.lifetimes.length; j++) {
                sys.lifetimes[j] -= deltaTime;
                if (sys.lifetimes[j] > 0) {
                    alive = true;
                    const idx = j * 3;
                    positions.array[idx] += sys.velocities[j].x * deltaTime;
                    positions.array[idx + 1] += sys.velocities[j].y * deltaTime;
                    positions.array[idx + 2] += sys.velocities[j].z * deltaTime;
                    sys.velocities[j].y -= 9.8 * deltaTime; // Gravity
                }
            }

            positions.needsUpdate = true;
            sys.mesh.material.opacity = Math.max(0, Math.min(1, 
                sys.lifetimes.reduce((a, b) => a + (b > 0 ? b / sys.maxLifetimes[sys.lifetimes.indexOf(b)] : 0), 0) / sys.lifetimes.length
            ));

            if (!alive || sys.time > 3) {
                this.scene.remove(sys.mesh);
                sys.mesh.geometry.dispose();
                sys.mesh.material.dispose();
                this.particleSystems.splice(i, 1);
            }
        }
    }

    updateDamageTexts(deltaTime) {
        for (let i = this.damageTexts.length - 1; i >= 0; i--) {
            const dt = this.damageTexts[i];
            dt.life -= deltaTime;
            dt.updatePosition();

            if (dt.life <= 0) {
                dt.element.remove();
                this.damageTexts.splice(i, 1);
            }
        }
    }

    update(deltaTime) {
        this.time += deltaTime;
        const cycle = this.updateDayNightCycle(deltaTime);
        this.updateWeather(deltaTime);
        this.updateParticles(deltaTime);
        this.updateDamageTexts(deltaTime);

        // Animate water
        if (this.water) {
            this.water.position.y = -3 + Math.sin(this.time * 0.5) * 0.2;
        }

        // Animate watchtower beacons
        this.watchtowers.forEach(tower => {
            const pulse = 1 + Math.sin(this.time * 3) * 0.3;
            tower.beacon.scale.setScalar(pulse);
            tower.beaconLight.intensity = 2 * pulse;
        });

        this.controls.update();
        this.renderer.render(this.scene, this.camera);

        return cycle;
    }

    resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    raycast(screenX, screenY) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(
            (screenX / window.innerWidth) * 2 - 1,
            -(screenY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(mouse, this.camera);
        return raycaster.intersectObjects(this.scene.children, true);
    }

    worldToScreen(position) {
        const vec = position.clone();
        vec.project(this.camera);
        return {
            x: (vec.x * 0.5 + 0.5) * window.innerWidth,
            y: (-vec.y * 0.5 + 0.5) * window.innerHeight
        };
    }
}

export default GraphicsEngine;
