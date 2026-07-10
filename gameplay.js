import * as THREE from 'three';
import { createHighPolySphere, createHighPolyCylinder, createPBRMaterial } from './engine.js';

// ============================================
// GAME STATE
// ============================================
export class GameState {
    constructor() {
        this.resources = { gold: 2450000, food: 1890000, wood: 980000, stone: 650000, gems: 2450 };
        this.resourceRates = { gold: 12500, food: 8200, wood: 5100, stone: 3800 };
        this.troops = { infantry: 12450, cavalry: 8230, archer: 6100, flying: 1250 };
        this.troopCapacity = { infantry: 20000, cavalry: 20000, archer: 20000, flying: 15000 };
        this.wounded = [];
        this.hospitalCapacity = 2000;
        this.hospitalLevel = 8;

        this.buildings = {
            castle: { level: 15, upgrading: false, finishTime: 0 },
            barracks: { level: 12, upgrading: false, finishTime: 0 },
            hospital: { level: 8, upgrading: false, finishTime: 0 },
            academy: { level: 6, upgrading: false, finishTime: 0 },
            tavern: { level: 10, upgrading: false, finishTime: 0 },
            scout: { level: 5, upgrading: false, finishTime: 0 },
            farm: { level: 14, upgrading: false, finishTime: 0 },
            mine: { level: 11, upgrading: false, finishTime: 0 }
        };

        this.buildQueue = [];
        this.commanders = [];
        this.ownedCommanders = [];
        this.skillPoints = 12;

        this.alliance = { name: 'Dragon Slayers', tag: '[DRG]', power: 89200000, rank: 42 };
        this.territory = { centerX: 0, centerZ: 0, radius: 60 };
        this.watchtowers = [
            { id: 1, x: 40, z: 40, active: true },
            { id: 2, x: -40, z: 40, active: true },
            { id: 3, x: 40, z: -40, active: true },
            { id: 4, x: -40, z: -40, active: true }
        ];

        this.scout = { state: 'idle', progress: 0, targetX: 0, targetZ: 0, startTime: 0, duration: 900 };

        this.resourceNodes = [];
        this.marchingArmies = [];
        this.activeCombats = [];

        this.dragonBoss = {
            health: 10000000,
            maxHealth: 10000000,
            tier: 1,
            position: { x: 120, y: 30, z: 120 },
            active: true,
            abilities: ['Fire Breath', 'Wing Gust', 'Tail Slam']
        };

        this.dailyRewards = {
            streak: 7,
            lastClaim: 0,
            claimed: [true, true, true, true, true, true, false],
            canClaim: true
        };

        this.tokens = 15;
        this.notifications = [];
        this.gameTime = 6 * 3600; // 6:00 AM in seconds

        this.generateResourceNodes();
        this.generateCommanders();
    }

    generateResourceNodes() {
        const types = [
            { type: 'gold', icon: '🪙', color: 0xFFD700, scale: 1.5 },
            { type: 'food', icon: '🌾', color: 0x8BC34A, scale: 1.2 },
            { type: 'wood', icon: '🪵', color: 0x795548, scale: 1.3 },
            { type: 'stone', icon: '🪨', color: 0x9E9E9E, scale: 1.0 }
        ];

        for (let i = 0; i < 30; i++) {
            const t = types[Math.floor(Math.random() * types.length)];
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 120;
            this.resourceNodes.push({
                id: i,
                type: t.type,
                x: Math.cos(angle) * dist,
                z: Math.sin(angle) * dist,
                amount: 50000 + Math.floor(Math.random() * 150000),
                maxAmount: 200000,
                regenRate: 100,
                color: t.color,
                scale: t.scale,
                gathering: false,
                gatherer: null
            });
        }
    }

    generateCommanders() {
        const names = ['Aldric', 'Seraphina', 'Grommash', 'Lyanna', 'Thorin', 'Isolde', 'Cassius', 'Elena'];
        const classes = ['Cavalry', 'Infantry', 'Archer', 'Flying', 'Mixed'];
        const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];

        for (let i = 0; i < names.length; i++) {
            this.commanders.push({
                id: i,
                name: names[i],
                class: classes[i % classes.length],
                rarity: rarities[Math.min(i, rarities.length - 1)],
                level: 1 + Math.floor(Math.random() * 40),
                skills: this.generateSkillTree(i),
                owned: i < 3
            });
        }
        this.ownedCommanders = this.commanders.filter(c => c.owned);
    }

    generateSkillTree(commanderId) {
        const skills = [];
        const types = [
            { name: 'Cavalry Speed', effect: 'speed', value: 10, icon: '⚡' },
            { name: 'Archer Attack', effect: 'attack', value: 5, icon: '⚔️' },
            { name: 'Infantry Defense', effect: 'defense', value: 8, icon: '🛡️' },
            { name: 'Gathering Boost', effect: 'gather', value: 15, icon: '🌾' },
            { name: 'Healing Speed', effect: 'heal', value: 12, icon: '🏥' },
            { name: 'Dragon Damage', effect: 'boss', value: 20, icon: '🐉' },
            { name: 'Troop Capacity', effect: 'capacity', value: 10, icon: '👥' },
            { name: 'Resource Production', effect: 'production', value: 10, icon: '⚙️' }
        ];

        // Create tree structure
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                const t = types[(row * 3 + col + commanderId) % types.length];
                skills.push({
                    id: `c${commanderId}_r${row}_c${col}`,
                    name: t.name,
                    effect: t.effect,
                    value: t.value,
                    icon: t.icon,
                    row,
                    col,
                    unlocked: row === 0 && col === 1,
                    purchased: row === 0 && col === 1,
                    requires: row > 0 ? [`c${commanderId}_r${row-1}_c${col}`] : [],
                    cost: (row + 1) * 2
                });
            }
        }
        return skills;
    }

    update(deltaTime) {
        // Update game time (6 hours compressed)
        this.gameTime += deltaTime * 6;
        if (this.gameTime >= 24 * 3600) this.gameTime = 0;

        // Resource generation
        const hours = deltaTime / 3600;
        this.resources.gold += this.resourceRates.gold * hours;
        this.resources.food += this.resourceRates.food * hours;
        this.resources.wood += this.resourceRates.wood * hours;
        this.resources.stone += this.resourceRates.stone * hours;

        // Cap resources
        const caps = { gold: 5000000, food: 3000000, wood: 2000000, stone: 1500000, gems: 50000 };
        for (const key in this.resources) {
            if (this.resources[key] > (caps[key] || Infinity)) this.resources[key] = caps[key];
        }

        // Update build queue
        this.updateBuildQueue(deltaTime);

        // Update wounded healing
        this.updateHealing(deltaTime);

        // Update marching armies
        this.updateMarchingArmies(deltaTime);

        // Update active combats
        this.updateCombats(deltaTime);

        // Update scout
        this.updateScout(deltaTime);

        // Update resource node regen
        this.resourceNodes.forEach(node => {
            if (node.amount < node.maxAmount) {
                node.amount = Math.min(node.maxAmount, node.amount + node.regenRate * hours);
            }
        });

        // Update dragon boss
        if (this.dragonBoss.active && this.dragonBoss.health < this.dragonBoss.maxHealth) {
            this.dragonBoss.health = Math.min(this.dragonBoss.maxHealth, this.dragonBoss.health + 5000 * deltaTime);
        }
    }

    updateBuildQueue(deltaTime) {
        const now = Date.now() / 1000;
        this.buildQueue = this.buildQueue.filter(q => {
            const remaining = q.finishTime - now;
            if (remaining <= 0) {
                this.buildings[q.building].level++;
                this.buildings[q.building].upgrading = false;
                this.showNotification(`${q.building.charAt(0).toUpperCase() + q.building.slice(1)} upgraded to Level ${this.buildings[q.building].level}!`, 'success');
                return false;
            }
            q.remaining = remaining;
            return true;
        });
    }

    updateHealing(deltaTime) {
        const healRate = 50 * this.hospitalLevel * deltaTime; // troops per second
        let healed = 0;

        for (let i = this.wounded.length - 1; i >= 0; i--) {
            const w = this.wounded[i];
            if (w.healing) {
                const amount = Math.min(w.count, healRate);
                w.count -= amount;
                healed += amount;

                if (w.count <= 0) {
                    this.troops[w.type] += w.originalCount;
                    this.wounded.splice(i, 1);
                }
            }
        }
    }

    updateMarchingArmies(deltaTime) {
        for (let i = this.marchingArmies.length - 1; i >= 0; i--) {
            const army = this.marchingArmies[i];
            army.progress += deltaTime / army.duration;

            if (army.progress >= 1) {
                // Arrived at destination
                if (army.mission === 'gather') {
                    this.startGathering(army);
                } else if (army.mission === 'attack') {
                    this.startCombat(army);
                } else if (army.mission === 'return') {
                    this.completeReturn(army);
                }
                this.marchingArmies.splice(i, 1);
            }
        }
    }

    startGathering(army) {
        const node = this.resourceNodes.find(n => n.id === army.targetId);
        if (!node || node.amount <= 0) return;

        const gatherTime = 30; // seconds
        const gatherAmount = Math.min(node.amount, army.troopCount * 10);

        setTimeout(() => {
            node.amount -= gatherAmount;
            this.resources[node.type] += gatherAmount;

            // Return march
            this.marchingArmies.push({
                id: army.id,
                fromX: army.toX,
                fromZ: army.toZ,
                toX: 0,
                toZ: 0,
                progress: 0,
                duration: army.duration,
                mission: 'return',
                troopCount: army.troopCount,
                payload: { type: node.type, amount: gatherAmount },
                type: army.type
            });
        }, gatherTime * 1000);
    }

    startCombat(army) {
        // Simplified combat
        const enemyTroops = Math.floor(5000 + Math.random() * 15000);
        this.activeCombats.push({
            id: army.id,
            friendlyTroops: army.troopCount,
            enemyTroops: enemyTroops,
            friendlyMax: army.troopCount,
            enemyMax: enemyTroops,
            duration: 60,
            elapsed: 0,
            type: army.type,
            position: { x: army.toX, y: 0, z: army.toZ }
        });
    }

    updateCombats(deltaTime) {
        for (let i = this.activeCombats.length - 1; i >= 0; i--) {
            const combat = this.activeCombats[i];
            combat.elapsed += deltaTime;

            const progress = combat.elapsed / combat.duration;
            const friendlyLoss = Math.floor(combat.friendlyMax * progress * 0.3);
            const enemyLoss = Math.floor(combat.enemyMax * progress * 0.4);

            combat.friendlyTroops = Math.max(0, combat.friendlyMax - friendlyLoss);
            combat.enemyTroops = Math.max(0, combat.enemyMax - enemyLoss);

            if (combat.elapsed >= combat.duration || combat.friendlyTroops <= 0 || combat.enemyTroops <= 0) {
                // Combat ended
                if (combat.friendlyTroops > 0) {
                    // Victory - 70% of losses are wounded
                    const totalLosses = combat.friendlyMax - combat.friendlyTroops;
                    const wounded = Math.floor(totalLosses * 0.7);
                    const dead = totalLosses - wounded;

                    if (wounded > 0) {
                        this.addWounded(combat.type, wounded);
                    }
                    this.troops[combat.type] -= dead;
                    this.showNotification(`Victory! ${dead} lost, ${wounded} wounded.`, 'success');
                } else {
                    this.showNotification('Defeat! Your forces were overwhelmed.', 'danger');
                }
                this.activeCombats.splice(i, 1);
            }
        }
    }

    completeReturn(army) {
        if (army.payload) {
            this.resources[army.payload.type] += army.payload.amount;
            this.showNotification(`Gathering complete: +${army.payload.amount.toLocaleString()} ${army.payload.type}`, 'success');
        }
    }

    updateScout(deltaTime) {
        if (this.scout.state === 'scouting') {
            this.scout.progress += deltaTime / this.scout.duration;
            if (this.scout.progress >= 1) {
                this.scout.state = 'idle';
                this.scout.progress = 0;
                this.revealFogAt(this.scout.targetX, this.scout.targetZ, 40);
                this.showNotification('Scout returned with intelligence!', 'info');
            }
        }
    }

    revealFogAt(x, z, radius) {
        // This will be called by the engine
        if (this.onRevealFog) this.onRevealFog(x, z, radius);
    }

    addWounded(type, count) {
        const currentWounded = this.wounded.reduce((sum, w) => sum + w.count, 0);
        if (currentWounded + count > this.hospitalCapacity) {
            count = this.hospitalCapacity - currentWounded;
        }
        if (count <= 0) return;

        const existing = this.wounded.find(w => w.type === type && !w.healing);
        if (existing) {
            existing.count += count;
            existing.originalCount += count;
        } else {
            this.wounded.push({
                type,
                count,
                originalCount: count,
                healing: false,
                healTime: count * 2 / this.hospitalLevel
            });
        }
    }

    healWounded(type, instant = false) {
        const w = this.wounded.find(w => w.type === type);
        if (!w) return false;

        if (instant) {
            const cost = Math.ceil(w.count / 100);
            if (this.resources.gems < cost) return false;
            this.resources.gems -= cost;
            this.troops[type] += w.count;
            const idx = this.wounded.indexOf(w);
            this.wounded.splice(idx, 1);
            return true;
        } else {
            const foodCost = w.count * 2;
            if (this.resources.food < foodCost) return false;
            this.resources.food -= foodCost;
            w.healing = true;
            return true;
        }
    }

    dispatchArmy(type, count, targetX, targetZ, mission) {
        if (this.troops[type] < count) return false;

        const dist = Math.sqrt(targetX * targetX + targetZ * targetZ);
        const speed = mission === 'scout' ? 80 : (type === 'cavalry' ? 30 : type === 'flying' ? 50 : 20);
        const duration = dist / speed;

        if (mission !== 'scout') {
            this.troops[type] -= count;
        }

        this.marchingArmies.push({
            id: Date.now(),
            fromX: 0,
            fromZ: 0,
            toX: targetX,
            toZ: targetZ,
            progress: 0,
            duration,
            mission,
            troopCount: count,
            type,
            targetId: mission === 'gather' ? this.findNearestNode(targetX, targetZ) : null
        });

        return true;
    }

    findNearestNode(x, z) {
        let nearest = null;
        let minDist = Infinity;
        this.resourceNodes.forEach(node => {
            const d = Math.sqrt((node.x - x) ** 2 + (node.z - z) ** 2);
            if (d < minDist) { minDist = d; nearest = node.id; }
        });
        return nearest;
    }

    attackDragonBoss(troopType, count) {
        if (this.troops[troopType] < count) return false;
        this.troops[troopType] -= count;

        const damage = count * (5 + Math.random() * 5);
        this.dragonBoss.health -= damage;

        if (this.dragonBoss.health <= 0) {
            this.dragonBoss.health = 0;
            this.dragonBoss.active = false;
            this.showNotification('Dragon Boss Defeated! Legendary rewards acquired!', 'success');
            this.resources.gems += 500;
            this.tokens += 5;
        } else if (this.dragonBoss.health < this.dragonBoss.maxHealth * 0.5 && this.dragonBoss.tier === 1) {
            this.dragonBoss.tier = 2;
            this.showNotification('Dragon Boss Enraged! Tier II activated!', 'warning');
        }

        return { damage, remaining: this.dragonBoss.health };
    }

    performGacha(draws) {
        if (this.tokens < draws) return null;
        this.tokens -= draws;

        const results = [];
        const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];
        const weights = draws === 10 ? [0.5, 0.3, 0.15, 0.05] : [0.6, 0.25, 0.12, 0.03];

        for (let i = 0; i < draws; i++) {
            const roll = Math.random();
            let cum = 0;
            let rarity = 'Common';
            for (let j = 0; j < weights.length; j++) {
                cum += weights[j];
                if (roll < cum) { rarity = rarities[j]; break; }
            }

            const available = this.commanders.filter(c => c.rarity === rarity && !c.owned);
            if (available.length === 0) {
                // Give duplicate shards instead
                results.push({ type: 'shards', rarity, amount: rarity === 'Legendary' ? 10 : 5 });
            } else {
                const commander = available[Math.floor(Math.random() * available.length)];
                commander.owned = true;
                this.ownedCommanders.push(commander);
                results.push({ type: 'commander', commander });
            }
        }

        return results;
    }

    unlockSkill(commanderId, skillId) {
        const commander = this.commanders.find(c => c.id === commanderId);
        if (!commander) return false;

        const skill = commander.skills.find(s => s.id === skillId);
        if (!skill || skill.purchased || !skill.unlocked) return false;
        if (this.skillPoints < skill.cost) return false;

        this.skillPoints -= skill.cost;
        skill.purchased = true;

        // Unlock next row skills
        const nextRow = skill.row + 1;
        commander.skills.filter(s => s.row === nextRow && s.col === skill.col).forEach(s => {
            s.unlocked = true;
        });

        return true;
    }

    claimDailyReward() {
        if (!this.dailyRewards.canClaim) return false;

        const day = this.dailyRewards.claimed.findIndex(c => !c);
        if (day === -1) return false;

        this.dailyRewards.claimed[day] = true;
        this.dailyRewards.streak++;
        this.dailyRewards.canClaim = false;
        this.dailyRewards.lastClaim = Date.now();

        const rewards = [
            { gold: 10000, food: 5000 },
            { wood: 8000, stone: 5000 },
            { gems: 100 },
            { tokens: 1 },
            { gold: 50000, food: 30000 },
            { gems: 300 },
            { tokens: 5, gems: 500 } // 7th day bonus
        ];

        const reward = rewards[Math.min(day, rewards.length - 1)];
        for (const [key, val] of Object.entries(reward)) {
            this.resources[key] = (this.resources[key] || 0) + val;
        }

        return reward;
    }

    showNotification(text, type = 'info') {
        this.notifications.push({ text, type, time: Date.now() });
        if (this.onNotification) this.onNotification(text, type);
    }

    getFormattedTime() {
        const totalSeconds = Math.floor(this.gameTime);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    getWeather() {
        const hour = this.gameTime / 3600;
        if (hour > 2 && hour < 3.5) return { type: 'rain', intensity: 0.7 };
        if (hour > 4 && hour < 5) return { type: 'fog', intensity: 0.5 };
        return { type: 'clear', intensity: 0 };
    }

    isInTerritory(x, z) {
        const dx = x - this.territory.centerX;
        const dz = z - this.territory.centerZ;
        return Math.sqrt(dx*dx + dz*dz) <= this.territory.radius;
    }
}

// ============================================
// UNIT MESH BUILDERS
// ============================================
export class UnitFactory {
    static createInfantry() {
        const group = new THREE.Group();

        // Body - high poly cylinder
        const bodyGeo = createHighPolyCylinder(0.4, 0.5, 1.2, 32, 16);
        const bodyMat = createPBRMaterial({ color: 0x4a5568, roughness: 0.6, metalness: 0.3 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);

        // Head
        const headGeo = createHighPolySphere(0.3, 32);
        const headMat = createPBRMaterial({ color: 0xdeb887, roughness: 0.8 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.5;
        head.castShadow = true;
        group.add(head);

        // Helmet
        const helmGeo = createHighPolyCylinder(0.35, 0.45, 0.4, 32, 8);
        const helmMat = createPBRMaterial({ color: 0x708090, roughness: 0.3, metalness: 0.8 });
        const helm = new THREE.Mesh(helmGeo, helmMat);
        helm.position.y = 1.7;
        group.add(helm);

        // Shield
        const shieldGeo = createHighPolyCylinder(0.6, 0.6, 0.1, 32, 4);
        const shieldMat = createPBRMaterial({ color: 0x8b4513, roughness: 0.7 });
        const shield = new THREE.Mesh(shieldGeo, shieldMat);
        shield.position.set(0.5, 0.8, 0.3);
        shield.rotation.z = Math.PI / 2;
        group.add(shield);

        // Spear
        const spearGeo = createHighPolyCylinder(0.03, 0.03, 2.5, 8, 8);
        const spearMat = createPBRMaterial({ color: 0x696969, roughness: 0.3, metalness: 0.9 });
        const spear = new THREE.Mesh(spearGeo, spearMat);
        spear.position.set(-0.4, 1.2, 0.3);
        group.add(spear);

        group.userData = { type: 'infantry', speed: 8, health: 100, attack: 15 };
        return group;
    }

    static createCavalry() {
        const group = new THREE.Group();

        // Horse body
        const horseBodyGeo = createHighPolyCylinder(0.5, 0.7, 1.6, 32, 16);
        const horseMat = createPBRMaterial({ color: 0x8b4513, roughness: 0.8 });
        const horseBody = new THREE.Mesh(horseBodyGeo, horseMat);
        horseBody.rotation.z = Math.PI / 2;
        horseBody.position.y = 1.0;
        horseBody.castShadow = true;
        group.add(horseBody);

        // Horse head
        const headGeo = createHighPolySphere(0.35, 32);
        const head = new THREE.Mesh(headGeo, horseMat);
        head.position.set(1.0, 1.6, 0);
        head.castShadow = true;
        group.add(head);

        // Legs
        for (let i = 0; i < 4; i++) {
            const legGeo = createHighPolyCylinder(0.12, 0.1, 0.8, 16, 8);
            const leg = new THREE.Mesh(legGeo, horseMat);
            const x = i < 2 ? 0.6 : -0.6;
            const z = i % 2 === 0 ? 0.3 : -0.3;
            leg.position.set(x, 0.4, z);
            group.add(leg);
        }

        // Rider
        const riderBody = createHighPolyCylinder(0.35, 0.4, 1.0, 32, 12);
        const riderMat = createPBRMaterial({ color: 0x2c3e50, roughness: 0.6, metalness: 0.4 });
        const rider = new THREE.Mesh(riderBody, riderMat);
        rider.position.set(-0.2, 1.8, 0);
        group.add(rider);

        // Lance
        const lanceGeo = createHighPolyCylinder(0.04, 0.02, 3.0, 8, 8);
        const lanceMat = createPBRMaterial({ color: 0xc0c0c0, roughness: 0.2, metalness: 0.95 });
        const lance = new THREE.Mesh(lanceGeo, lanceMat);
        lance.position.set(0.5, 2.0, 0.4);
        lance.rotation.z = -Math.PI / 6;
        group.add(lance);

        group.userData = { type: 'cavalry', speed: 18, health: 80, attack: 25 };
        return group;
    }

    static createFlying() {
        const group = new THREE.Group();

        // Griffin body
        const bodyGeo = createHighPolySphere(0.6, 48);
        const bodyMat = createPBRMaterial({ color: 0xd4af37, roughness: 0.5, metalness: 0.2 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(1.5, 0.8, 1);
        body.castShadow = true;
        group.add(body);

        // Wings
        for (let side of [-1, 1]) {
            const wingGeo = new THREE.PlaneGeometry(2.5, 1.2, 32, 16);
            const wingMat = createPBRMaterial({ 
                color: 0xf5f5dc, 
                roughness: 0.9,
                transparent: true,
                opacity: 0.95,
                side: THREE.DoubleSide
            });
            const wing = new THREE.Mesh(wingGeo, wingMat);
            wing.position.set(side * 1.5, 0.2, 0);
            wing.rotation.y = side * Math.PI / 4;
            wing.name = 'wing';
            group.add(wing);
        }

        // Head
        const headGeo = createHighPolySphere(0.35, 32);
        const headMat = createPBRMaterial({ color: 0xe8d5b7, roughness: 0.7 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(1.0, 0.3, 0);
        group.add(head);

        // Beak
        const beakGeo = createHighPolyCylinder(0.05, 0.15, 0.4, 16, 8);
        const beakMat = createPBRMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 });
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.position.set(1.3, 0.3, 0);
        beak.rotation.z = -Math.PI / 2;
        group.add(beak);

        // Rider
        const riderGeo = createHighPolyCylinder(0.3, 0.35, 0.9, 24, 8);
        const riderMat = createPBRMaterial({ color: 0x4169e1, roughness: 0.6 });
        const rider = new THREE.Mesh(riderGeo, riderMat);
        rider.position.set(-0.3, 0.6, 0);
        group.add(rider);

        group.userData = { type: 'flying', speed: 25, health: 60, attack: 20, flying: true };
        return group;
    }

    static createDragonBoss() {
        const group = new THREE.Group();

        // Main body - massive high-poly ellipsoid
        const bodyGeo = createHighPolySphere(4, 64);
        const bodyMat = createPBRMaterial({ 
            color: 0x8b0000, 
            roughness: 0.4, 
            metalness: 0.3,
            emissive: 0x330000,
            emissiveIntensity: 0.5
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(2, 1, 1.2);
        body.castShadow = true;
        group.add(body);

        // Neck segments
        for (let i = 0; i < 5; i++) {
            const segGeo = createHighPolySphere(1.5 - i * 0.2, 32);
            const seg = new THREE.Mesh(segGeo, bodyMat);
            seg.position.set(6 + i * 2, 2 + i * 1.5, 0);
            seg.castShadow = true;
            group.add(seg);
        }

        // Head
        const headGeo = createHighPolySphere(2, 48);
        const headMat = createPBRMaterial({ 
            color: 0xa00000, 
            roughness: 0.3, 
            metalness: 0.4,
            emissive: 0x440000,
            emissiveIntensity: 0.8
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(16, 9, 0);
        head.scale.set(1.5, 1, 1.2);
        head.castShadow = true;
        group.add(head);

        // Eyes - glowing
        for (let side of [-1, 1]) {
            const eyeGeo = createHighPolySphere(0.4, 16);
            const eyeMat = new THREE.MeshStandardMaterial({
                color: 0xff4400,
                emissive: 0xff6600,
                emissiveIntensity: 3
            });
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(16.8, 9.5, side * 0.8);
            group.add(eye);
        }

        // Wings - massive
        for (let side of [-1, 1]) {
            const wingGeo = new THREE.PlaneGeometry(15, 8, 64, 32);
            const wingMat = createPBRMaterial({
                color: 0x4a0000,
                roughness: 0.6,
                metalness: 0.2,
                transparent: true,
                opacity: 0.95,
                side: THREE.DoubleSide
            });
            const wing = new THREE.Mesh(wingGeo, wingMat);
            wing.position.set(0, 3, side * 8);
            wing.rotation.x = side * Math.PI / 6;
            wing.name = 'bossWing';
            group.add(wing);
        }

        // Tail segments
        for (let i = 0; i < 8; i++) {
            const tailGeo = createHighPolySphere(1.2 - i * 0.12, 24);
            const tail = new THREE.Mesh(tailGeo, bodyMat);
            tail.position.set(-5 - i * 2, -1 - i * 0.3, Math.sin(i) * 0.5);
            tail.castShadow = true;
            group.add(tail);
        }

        // Spikes along back
        for (let i = 0; i < 10; i++) {
            const spikeGeo = createHighPolyCylinder(0.1, 0.3, 1.5, 8, 4);
            const spikeMat = createPBRMaterial({ color: 0x2a0000, roughness: 0.5, metalness: 0.5 });
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            spike.position.set(-4 + i * 1.8, 3, 0);
            group.add(spike);
        }

        // Core glow
        const coreGeo = createHighPolySphere(1, 32);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0xff2200,
            emissive: 0xff4400,
            emissiveIntensity: 2,
            transparent: true,
            opacity: 0.8
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0, 1, 0);
        core.name = 'bossCore';
        group.add(core);

        // Core point light
        const coreLight = new THREE.PointLight(0xff4400, 5, 50);
        coreLight.position.set(0, 1, 0);
        group.add(coreLight);

        group.userData = { type: 'dragonBoss', health: 10000000, maxHealth: 10000000 };
        return group;
    }

    static createResourceNode(type, color, scale) {
        const group = new THREE.Group();

        if (type === 'gold') {
            // Gold vein - crystalline structure
            for (let i = 0; i < 8; i++) {
                const crystalGeo = createHighPolyCylinder(0.1, 0.6, 1 + Math.random(), 16, 8);
                const crystalMat = createPBRMaterial({ 
                    color: 0xFFD700, 
                    roughness: 0.2, 
                    metalness: 0.9,
                    emissive: 0x332200,
                    emissiveIntensity: 0.3
                });
                const crystal = new THREE.Mesh(crystalGeo, crystalMat);
                crystal.position.set(
                    (Math.random() - 0.5) * 2,
                    0.5 + Math.random() * 0.5,
                    (Math.random() - 0.5) * 2
                );
                crystal.rotation.set(Math.random(), Math.random(), Math.random());
                crystal.castShadow = true;
                group.add(crystal);
            }
        } else if (type === 'food') {
            // Farm - wheat fields
            for (let i = 0; i < 20; i++) {
                const stalkGeo = createHighPolyCylinder(0.05, 0.08, 1.5, 8, 4);
                const stalkMat = createPBRMaterial({ color: 0xDAA520, roughness: 0.9 });
                const stalk = new THREE.Mesh(stalkGeo, stalkMat);
                stalk.position.set((Math.random() - 0.5) * 3, 0.75, (Math.random() - 0.5) * 3);
                group.add(stalk);

                // Wheat head
                const headGeo = createHighPolySphere(0.15, 16);
                const headMat = createPBRMaterial({ color: 0xFFD700, roughness: 0.8 });
                const head = new THREE.Mesh(headGeo, headMat);
                head.position.copy(stalk.position);
                head.position.y += 0.8;
                group.add(head);
            }
        } else if (type === 'wood') {
            // Trees
            for (let i = 0; i < 3; i++) {
                const trunkGeo = createHighPolyCylinder(0.4, 0.6, 3, 24, 8);
                const trunkMat = createPBRMaterial({ color: 0x5D4037, roughness: 0.9 });
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.set((Math.random() - 0.5) * 2, 1.5, (Math.random() - 0.5) * 2);
                trunk.castShadow = true;
                group.add(trunk);

                // Foliage
                const foliageGeo = createHighPolySphere(1.5, 32);
                const foliageMat = createPBRMaterial({ color: 0x2E7D32, roughness: 0.95 });
                const foliage = new THREE.Mesh(foliageGeo, foliageMat);
                foliage.position.copy(trunk.position);
                foliage.position.y += 2.5;
                foliage.castShadow = true;
                group.add(foliage);
            }
        } else {
            // Stone quarry
            for (let i = 0; i < 5; i++) {
                const rockGeo = createHighPolySphere(0.8 + Math.random() * 0.5, 24);
                const rockMat = createPBRMaterial({ color: 0x757575, roughness: 0.95 });
                const rock = new THREE.Mesh(rockGeo, rockMat);
                rock.position.set((Math.random() - 0.5) * 3, 0.5, (Math.random() - 0.5) * 3);
                rock.scale.set(1 + Math.random(), 0.5 + Math.random(), 1 + Math.random());
                rock.castShadow = true;
                group.add(rock);
            }
        }

        group.scale.setScalar(scale);
        return group;
    }

    static createHospitalBuilding() {
        const group = new THREE.Group();

        // Main building
        const mainGeo = createHighPolyCylinder(5, 6, 8, 64, 32);
        const mainMat = createPBRMaterial({ color: 0xf5f5f5, roughness: 0.7 });
        const main = new THREE.Mesh(mainGeo, mainMat);
        main.position.y = 4;
        main.castShadow = true;
        group.add(main);

        // Dome
        const domeGeo = createHighPolySphere(5.5, 64);
        const domeMat = createPBRMaterial({ color: 0x87CEEB, roughness: 0.2, metalness: 0.1 });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.y = 8;
        group.add(dome);

        // Cross symbol
        const crossV = createHighPolyCylinder(0.3, 0.3, 2, 16, 4);
        const crossMat = createPBRMaterial({ color: 0xdc143c, roughness: 0.4, metalness: 0.3 });
        const crossVert = new THREE.Mesh(crossV, crossMat);
        crossVert.position.set(0, 13, 6);
        group.add(crossVert);

        const crossH = createHighPolyCylinder(0.3, 0.3, 1.5, 16, 4);
        const crossHoriz = new THREE.Mesh(crossH, crossMat);
        crossHoriz.rotation.z = Math.PI / 2;
        crossHoriz.position.set(0, 13.3, 6);
        group.add(crossHoriz);

        // Windows with emissive for night
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const winGeo = new THREE.PlaneGeometry(0.8, 1.2);
            const winMat = new THREE.MeshStandardMaterial({
                color: 0x87CEEB,
                emissive: 0x224466,
                emissiveIntensity: 0.5
            });
            const win = new THREE.Mesh(winGeo, winMat);
            win.position.set(Math.cos(angle) * 5.1, 5, Math.sin(angle) * 5.1);
            win.rotation.y = -angle + Math.PI / 2;
            win.name = 'window';
            group.add(win);
        }

        return group;
    }

    static createTavernBuilding() {
        const group = new THREE.Group();

        // Main structure
        const mainGeo = new THREE.BoxGeometry(8, 6, 8);
        const mainMat = createPBRMaterial({ color: 0x8B4513, roughness: 0.8 });
        const main = new THREE.Mesh(mainGeo, mainMat);
        main.position.y = 3;
        main.castShadow = true;
        group.add(main);

        // Roof
        const roofGeo = new THREE.ConeGeometry(6, 4, 64);
        const roofMat = createPBRMaterial({ color: 0x8B0000, roughness: 0.7 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 8;
        roof.rotation.y = Math.PI / 4;
        group.add(roof);

        // Sign
        const signGeo = new THREE.BoxGeometry(3, 1, 0.2);
        const signMat = createPBRMaterial({ color: 0xFFD700, roughness: 0.4, metalness: 0.3 });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 4, 4.2);
        group.add(sign);

        // Lanterns
        for (let side of [-1, 1]) {
            const lanternGeo = createHighPolySphere(0.3, 16);
            const lanternMat = new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                emissive: 0xffaa00,
                emissiveIntensity: 2
            });
            const lantern = new THREE.Mesh(lanternGeo, lanternMat);
            lantern.position.set(side * 3, 5, 4.2);
            group.add(lantern);

            const light = new THREE.PointLight(0xffaa00, 1, 10);
            light.position.copy(lantern.position);
            group.add(light);
        }

        return group;
    }

    static createScoutUnit() {
        const group = new THREE.Group();

        // Horse
        const horseGeo = createHighPolyCylinder(0.3, 0.4, 1.2, 24, 12);
        const horseMat = createPBRMaterial({ color: 0x654321, roughness: 0.8 });
        const horse = new THREE.Mesh(horseGeo, horseMat);
        horse.rotation.z = Math.PI / 2;
        horse.position.y = 0.8;
        group.add(horse);

        // Rider
        const riderGeo = createHighPolyCylinder(0.2, 0.25, 0.8, 16, 8);
        const riderMat = createPBRMaterial({ color: 0x2F4F4F, roughness: 0.7 });
        const rider = new THREE.Mesh(riderGeo, riderMat);
        rider.position.set(-0.2, 1.5, 0);
        group.add(rider);

        // Cloak (billowing)
        const cloakGeo = new THREE.PlaneGeometry(0.8, 1.2, 16, 16);
        const cloakMat = createPBRMaterial({ color: 0x8B4513, roughness: 0.9, side: THREE.DoubleSide });
        const cloak = new THREE.Mesh(cloakGeo, cloakMat);
        cloak.position.set(-0.6, 1.4, 0);
        cloak.rotation.y = Math.PI / 2;
        cloak.name = 'cloak';
        group.add(cloak);

        group.userData = { type: 'scout', speed: 80 };
        return group;
    }
}

export default GameState;
