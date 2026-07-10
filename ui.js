import { GameState } from './gameplay.js';

export class UIController {
    constructor(gameState, engine) {
        this.game = gameState;
        this.engine = engine;
        this.panels = {};
        this.activePanel = null;
        this.selectedCommander = null;
        this.touchStart = null;

        this.initElements();
        this.bindEvents();
        this.startUpdateLoop();
    }

    initElements() {
        this.panels = {
            city: document.getElementById('city-panel'),
            hospital: document.getElementById('hospital-panel'),
            tavern: document.getElementById('tavern-panel'),
            skilltree: document.getElementById('skilltree-panel'),
            alliance: document.getElementById('alliance-panel'),
            rewards: document.getElementById('rewards-panel'),
            scout: document.getElementById('scout-panel')
        };

        this.hud = {
            top: document.getElementById('top-hud'),
            troop: document.getElementById('troop-panel'),
            bottom: document.getElementById('bottom-bar'),
            combat: document.getElementById('combat-hud'),
            boss: document.getElementById('boss-hud'),
            buildQueue: document.getElementById('build-queue'),
            threat: document.getElementById('threat-alert'),
            context: document.getElementById('context-menu'),
            notifications: document.getElementById('notification-area')
        };
    }

    bindEvents() {
        // Bottom bar navigation
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = btn.dataset.panel;
                if (panel === 'map') {
                    this.closeAllPanels();
                    this.setActiveButton(btn);
                } else if (panel === 'city') {
                    this.openPanel('city');
                    this.setActiveButton(btn);
                } else if (panel === 'hospital') {
                    this.openPanel('hospital');
                    this.renderHospital();
                } else if (panel === 'tavern') {
                    this.openPanel('tavern');
                } else if (panel === 'alliance') {
                    this.openPanel('alliance');
                    this.renderAlliance();
                } else if (panel === 'rewards') {
                    this.openPanel('rewards');
                    this.renderRewards();
                } else if (panel === 'mail') {
                    this.showNotification('Mail system - 3 new messages', 'info');
                }
            });
        });

        // Close panel buttons
        document.querySelectorAll('.close-panel').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllPanels());
        });

        // City building clicks
        document.querySelectorAll('.city-building').forEach(building => {
            building.addEventListener('click', () => {
                const type = building.dataset.building;
                if (type === 'hospital') {
                    this.openPanel('hospital');
                    this.renderHospital();
                } else if (type === 'tavern') {
                    this.openPanel('tavern');
                } else if (type === 'scout') {
                    this.openPanel('scout');
                } else {
                    this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} - Level ${building.dataset.level}`, 'info');
                }
            });
        });

        // Gacha buttons
        document.getElementById('btn-draw-1').addEventListener('click', () => this.performGacha(1));
        document.getElementById('btn-draw-10').addEventListener('click', () => this.performGacha(10));

        // Hospital buttons
        document.getElementById('btn-heal-all').addEventListener('click', () => this.healAllInstant());
        document.getElementById('btn-heal-normal').addEventListener('click', () => this.healAllNormal());

        // Scout button
        document.getElementById('btn-dispatch-scout').addEventListener('click', () => this.dispatchScout());

        // Daily chest
        document.getElementById('daily-chest').addEventListener('click', () => this.claimDailyReward());

        // Settings
        document.getElementById('btn-settings').addEventListener('click', () => {
            this.showNotification('Settings panel - Audio/Graphics options', 'info');
        });

        // Touch events on canvas
        const canvas = this.engine.renderer.domElement;
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        canvas.addEventListener('click', (e) => this.onCanvasClick(e));

        // Context menu actions
        document.querySelectorAll('.ctx-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                this.handleContextAction(action);
                this.hideContextMenu();
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllPanels();
        });
    }

    setActiveButton(btn) {
        document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
    }

    openPanel(name) {
        this.closeAllPanels();
        if (this.panels[name]) {
            this.panels[name].classList.remove('hidden');
            this.activePanel = name;
        }
    }

    closeAllPanels() {
        Object.values(this.panels).forEach(p => p.classList.add('hidden'));
        this.activePanel = null;
        this.setActiveButton(null);
    }

    showNotification(text, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;
        toast.textContent = text;
        this.hud.notifications.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.4s ease forwards';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    // ============================================
    // HUD UPDATES
    // ============================================
    updateHUD() {
        // Resources
        document.getElementById('res-gold').textContent = Math.floor(this.game.resources.gold).toLocaleString();
        document.getElementById('res-food').textContent = Math.floor(this.game.resources.food).toLocaleString();
        document.getElementById('res-wood').textContent = Math.floor(this.game.resources.wood).toLocaleString();
        document.getElementById('res-stone').textContent = Math.floor(this.game.resources.stone).toLocaleString();
        document.getElementById('res-gems').textContent = this.game.resources.gems.toLocaleString();

        // Troops
        document.getElementById('troop-infantry').textContent = Math.floor(this.game.troops.infantry).toLocaleString();
        document.getElementById('troop-cavalry').textContent = Math.floor(this.game.troops.cavalry).toLocaleString();
        document.getElementById('troop-archer').textContent = Math.floor(this.game.troops.archer).toLocaleString();
        document.getElementById('troop-flying').textContent = Math.floor(this.game.troops.flying).toLocaleString();

        // Wounded
        const totalWounded = this.game.wounded.reduce((sum, w) => sum + w.count, 0);
        const woundedIndicator = document.getElementById('wounded-indicator');
        const woundedCount = document.getElementById('wounded-count');
        const hospitalBadge = document.getElementById('hospital-badge');

        if (totalWounded > 0) {
            woundedIndicator.classList.remove('hidden');
            woundedCount.textContent = totalWounded.toLocaleString();
            hospitalBadge.textContent = totalWounded > 99 ? '99+' : totalWounded;
            hospitalBadge.style.display = 'flex';
        } else {
            woundedIndicator.classList.add('hidden');
            hospitalBadge.style.display = 'none';
        }

        // Game time
        document.getElementById('game-time').textContent = this.game.getFormattedTime();

        // Weather icon
        const weather = this.game.getWeather();
        const weatherIcon = document.getElementById('weather-icon');
        weatherIcon.textContent = weather.type === 'rain' ? '🌧️' : weather.type === 'fog' ? '🌫️' : weather.type === 'storm' ? '⛈️' : '☀️';

        // Build queue
        this.renderBuildQueue();

        // Combat HUD
        this.updateCombatHUD();

        // Boss HUD
        this.updateBossHUD();

        // Token count
        document.getElementById('token-count').textContent = this.game.tokens;
    }

    renderBuildQueue() {
        const list = document.getElementById('queue-list');
        if (this.game.buildQueue.length === 0) {
            this.hud.buildQueue.classList.add('hidden');
            return;
        }

        this.hud.buildQueue.classList.remove('hidden');
        list.innerHTML = this.game.buildQueue.map(q => {
            const progress = 1 - (q.remaining / q.totalTime);
            return `
                <div class="queue-item">
                    <div class="queue-item-icon">🏗️</div>
                    <div class="queue-item-info">
                        <div class="queue-item-name">${q.building} Lv.${q.targetLevel}</div>
                        <div class="queue-item-timer">${this.formatTime(q.remaining)}</div>
                        <div class="queue-item-bar"><div class="queue-item-fill" style="width:${progress * 100}%"></div></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateCombatHUD() {
        if (this.game.activeCombats.length > 0) {
            this.hud.combat.classList.remove('hidden');
            const combat = this.game.activeCombats[0];
            document.getElementById('combat-timer').textContent = this.formatTime(combat.duration - combat.elapsed);
            document.getElementById('friendly-troops').textContent = Math.floor(combat.friendlyTroops).toLocaleString();
            document.getElementById('enemy-troops').textContent = Math.floor(combat.enemyTroops).toLocaleString();

            const friendlyBar = document.querySelector('.bar-fill:not(.enemy-fill)');
            const enemyBar = document.querySelector('.enemy-fill');
            if (friendlyBar) friendlyBar.style.width = `${(combat.friendlyTroops / combat.friendlyMax) * 100}%`;
            if (enemyBar) enemyBar.style.width = `${(combat.enemyTroops / combat.enemyMax) * 100}%`;
        } else {
            this.hud.combat.classList.add('hidden');
        }
    }

    updateBossHUD() {
        if (this.game.dragonBoss.active && this.game.dragonBoss.health < this.game.dragonBoss.maxHealth) {
            this.hud.boss.classList.remove('hidden');
            const pct = (this.game.dragonBoss.health / this.game.dragonBoss.maxHealth) * 100;
            document.getElementById('boss-health-fill').style.width = `${pct}%`;
            document.getElementById('boss-health-text').textContent = `${pct.toFixed(1)}%`;
            document.getElementById('boss-tier').textContent = `Tier ${this.game.dragonBoss.tier === 1 ? 'I' : 'II'}`;

            const abilities = document.getElementById('boss-abilities');
            abilities.innerHTML = this.game.dragonBoss.abilities.map(a => `<div class="boss-ability">${a}</div>`).join('');
        } else if (!this.game.dragonBoss.active) {
            this.hud.boss.classList.add('hidden');
        }
    }

    // ============================================
    // HOSPITAL
    // ============================================
    renderHospital() {
        const occupied = this.game.wounded.reduce((sum, w) => sum + w.count, 0);
        const healing = this.game.wounded.filter(w => w.healing).reduce((sum, w) => sum + w.count, 0);

        document.getElementById('hospital-capacity').textContent = this.game.hospitalCapacity.toLocaleString();
        document.getElementById('hospital-occupied').textContent = occupied.toLocaleString();
        document.getElementById('hospital-healing').textContent = healing.toLocaleString();

        const list = document.getElementById('wounded-list');
        if (this.game.wounded.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏥</div>
                    <p>No wounded troops currently.</p>
                    <p class="empty-sub">Victory favors the prepared!</p>
                </div>
            `;
            document.getElementById('btn-heal-all').disabled = true;
            document.getElementById('btn-heal-normal').disabled = true;
            return;
        }

        document.getElementById('btn-heal-all').disabled = false;
        document.getElementById('btn-heal-normal').disabled = false;

        const icons = { infantry: '🛡️', cavalry: '🐴', archer: '🏹', flying: '🐉' };
        list.innerHTML = this.game.wounded.map((w, i) => `
            <div class="wounded-item">
                <div class="wounded-troop-info">
                    <div class="wounded-troop-icon">${icons[w.type]}</div>
                    <div class="wounded-troop-details">
                        <div class="wounded-troop-name">${w.type.charAt(0).toUpperCase() + w.type.slice(1)}</div>
                        <div class="wounded-troop-count">${w.count.toLocaleString()} wounded</div>
                    </div>
                </div>
                <div class="wounded-actions">
                    ${w.healing 
                        ? `<div class="wounded-heal-timer">Healing...</div>`
                        : `<button class="wounded-heal-btn" onclick="window.ui.healWounded('${w.type}', false)">Heal</button>
                           <button class="wounded-heal-btn" onclick="window.ui.healWounded('${w.type}', true)" style="margin-left:8px;background:linear-gradient(135deg,#FFD700,#FFA500);color:#1a1a1a;">💎</button>`
                    }
                </div>
            </div>
        `).join('');
    }

    healWounded(type, instant) {
        const result = this.game.healWounded(type, instant);
        if (result) {
            this.showNotification(instant ? 'Troops healed instantly!' : 'Healing started!', 'success');
            this.renderHospital();
        } else {
            this.showNotification('Not enough resources!', 'warning');
        }
    }

    healAllInstant() {
        let totalCost = 0;
        this.game.wounded.forEach(w => totalCost += Math.ceil(w.count / 100));
        if (this.game.resources.gems < totalCost) {
            this.showNotification('Not enough gems!', 'warning');
            return;
        }

        const types = this.game.wounded.map(w => w.type);
        types.forEach(t => this.game.healWounded(t, true));
        this.showNotification('All troops healed instantly!', 'success');
        this.renderHospital();
    }

    healAllNormal() {
        let totalFood = 0;
        this.game.wounded.forEach(w => totalFood += w.count * 2);
        if (this.game.resources.food < totalFood) {
            this.showNotification('Not enough food!', 'warning');
            return;
        }

        this.game.wounded.forEach(w => { w.healing = true; });
        this.showNotification('Healing all wounded with resources!', 'success');
        this.renderHospital();
    }

    // ============================================
    // GACHA SYSTEM
    // ============================================
    performGacha(draws) {
        if (this.game.tokens < draws) {
            this.showNotification('Not enough recruit tokens!', 'warning');
            return;
        }

        const chest = document.getElementById('gacha-chest');
        const result = document.getElementById('gacha-result');

        // Animation
        chest.style.animation = 'none';
        chest.offsetHeight; // Trigger reflow
        chest.style.animation = 'chestShake 0.5s ease';

        setTimeout(() => {
            const results = this.game.performGacha(draws);
            if (!results) return;

            // Show result (first item for now)
            const first = results[0];
            if (first.type === 'commander') {
                const c = first.commander;
                document.getElementById('hero-rarity').textContent = c.rarity.toUpperCase();
                document.getElementById('hero-rarity').style.color = 
                    c.rarity === 'Legendary' ? '#FFD700' : c.rarity === 'Epic' ? '#9C27B0' : c.rarity === 'Rare' ? '#2196F3' : '#9E9E9E';
                document.getElementById('hero-name').textContent = c.name;
                document.getElementById('hero-class').textContent = c.class + ' Commander';
                document.getElementById('hero-skills').innerHTML = c.skills.slice(0, 3).map(s => 
                    `<div class="skill-tag">${s.icon} ${s.name}</div>`
                ).join('');
            } else {
                document.getElementById('hero-rarity').textContent = first.rarity.toUpperCase() + ' SHARDS';
                document.getElementById('hero-name').textContent = `${first.amount} Shards`;
                document.getElementById('hero-class').textContent = 'Used for commander upgrades';
                document.getElementById('hero-skills').innerHTML = '';
            }

            chest.classList.add('hidden');
            result.classList.remove('hidden');

            // Particle burst
            if (this.engine) {
                this.engine.spawnParticleBurst(new THREE.Vector3(0, 5, 0), 0xFFD700, 100, 'explosion');
            }

            this.showNotification(`Recruited ${draws} hero(es)!`, 'success');
            document.getElementById('token-count').textContent = this.game.tokens;
        }, 600);

        // Reset after viewing
        setTimeout(() => {
            result.classList.add('hidden');
            chest.classList.remove('hidden');
        }, 4000);
    }

    // ============================================
    // SKILL TREE
    // ============================================
    renderSkillTree() {
        const selector = document.getElementById('commander-selector');
        selector.innerHTML = this.game.ownedCommanders.map(c => `
            <div class="commander-thumb ${this.selectedCommander === c.id ? 'active' : ''}" onclick="window.ui.selectCommander(${c.id})">
                <div class="commander-thumb-avatar">${c.rarity === 'Legendary' ? '👑' : c.rarity === 'Epic' ? '⚔️' : '🛡️'}</div>
                <div class="commander-thumb-name">${c.name}</div>
            </div>
        `).join('');

        if (this.selectedCommander === null && this.game.ownedCommanders.length > 0) {
            this.selectedCommander = this.game.ownedCommanders[0].id;
        }

        const commander = this.game.commanders.find(c => c.id === this.selectedCommander);
        if (!commander) return;

        const svg = document.getElementById('skilltree-svg');
        svg.innerHTML = '';

        // Draw links
        commander.skills.forEach(skill => {
            skill.requires.forEach(reqId => {
                const req = commander.skills.find(s => s.id === reqId);
                if (req) {
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', 100 + req.col * 250);
                    line.setAttribute('y1', 80 + req.row * 130);
                    line.setAttribute('x2', 100 + skill.col * 250);
                    line.setAttribute('y2', 80 + skill.row * 130);
                    line.setAttribute('class', `skill-link ${skill.unlocked ? 'active' : ''}`);
                    svg.appendChild(line);
                }
            });
        });

        // Draw nodes
        commander.skills.forEach(skill => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', `skill-node ${skill.purchased ? 'active' : skill.unlocked ? 'unlocked' : 'locked'}`);
            g.setAttribute('transform', `translate(${100 + skill.col * 250}, ${80 + skill.row * 130})`);
            g.onclick = () => this.unlockSkill(skill.id);

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', '30');
            circle.setAttribute('cx', '0');
            circle.setAttribute('cy', '0');

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '0');
            text.setAttribute('y', '5');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'white');
            text.setAttribute('font-size', '20');
            text.textContent = skill.icon;

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', '0');
            label.setAttribute('y', '50');
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('fill', '#b0b8c8');
            label.setAttribute('font-size', '12');
            label.textContent = skill.name;

            const cost = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            cost.setAttribute('x', '0');
            cost.setAttribute('y', '65');
            cost.setAttribute('text-anchor', 'middle');
            cost.setAttribute('fill', '#FFD700');
            cost.setAttribute('font-size', '11');
            cost.textContent = `${skill.cost} pts`;

            g.appendChild(circle);
            g.appendChild(text);
            g.appendChild(label);
            g.appendChild(cost);
            svg.appendChild(g);
        });

        document.getElementById('skill-points').textContent = this.game.skillPoints;
    }

    selectCommander(id) {
        this.selectedCommander = id;
        this.renderSkillTree();
    }

    unlockSkill(skillId) {
        if (this.game.unlockSkill(this.selectedCommander, skillId)) {
            this.showNotification('Skill unlocked!', 'success');
            this.renderSkillTree();
            if (this.engine) {
                this.engine.spawnParticleBurst(new THREE.Vector3(0, 5, 0), 0x4CAF50, 50, 'explosion');
            }
        } else {
            this.showNotification('Cannot unlock skill!', 'warning');
        }
    }

    // ============================================
    // ALLIANCE
    // ============================================
    renderAlliance() {
        const list = document.getElementById('watchtower-list');
        list.innerHTML = this.game.watchtowers.map(t => `
            <div class="watchtower-item">
                <div class="watchtower-info">
                    <div class="watchtower-icon">🗼</div>
                    <div>
                        <div class="watchtower-name">Watchtower #${t.id}</div>
                        <div style="color:#b0b8c8;font-size:0.75rem">(${t.x}, ${t.z})</div>
                    </div>
                </div>
                <div class="watchtower-status active">Active</div>
            </div>
        `).join('');
    }

    // ============================================
    // REWARDS
    // ============================================
    renderRewards() {
        document.getElementById('streak-count').textContent = this.game.dailyRewards.streak;

        const calendar = document.getElementById('rewards-calendar');
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const rewards = ['🪙', '🌾', '💎', '🎫', '🪙', '💎', '🎁'];

        calendar.innerHTML = days.map((day, i) => `
            <div class="reward-day ${this.game.dailyRewards.claimed[i] ? 'claimed' : ''} ${i === this.game.dailyRewards.claimed.findIndex(c => !c) ? 'current' : ''}">
                <div class="day-num">${day}</div>
                <div class="day-reward">${rewards[i]}</div>
            </div>
        `).join('');

        const chest = document.getElementById('daily-chest');
        const status = document.getElementById('chest-status');
        const timer = document.getElementById('chest-timer');

        if (this.game.dailyRewards.canClaim) {
            status.textContent = 'Claim Now';
            chest.style.opacity = '1';
            timer.classList.add('hidden');
        } else {
            status.textContent = 'Claimed';
            chest.style.opacity = '0.5';
            timer.classList.remove('hidden');
            const remaining = 24 * 3600 - ((Date.now() / 1000) - this.game.dailyRewards.lastClaim);
            timer.textContent = this.formatTime(Math.max(0, remaining));
        }
    }

    claimDailyReward() {
        if (!this.game.dailyRewards.canClaim) {
            this.showNotification('Daily reward already claimed!', 'warning');
            return;
        }

        const reward = this.game.claimDailyReward();
        if (reward) {
            this.showNotification('Daily reward claimed!', 'success');
            this.renderRewards();
            if (this.engine) {
                this.engine.spawnParticleBurst(new THREE.Vector3(0, 5, 0), 0xFFD700, 80, 'explosion');
            }
        }
    }

    // ============================================
    // SCOUT
    // ============================================
    dispatchScout() {
        if (this.game.scout.state !== 'idle') {
            this.showNotification('Scout already dispatched!', 'warning');
            return;
        }

        // Pick random target
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 80;
        this.game.scout.targetX = Math.cos(angle) * dist;
        this.game.scout.targetZ = Math.sin(angle) * dist;
        this.game.scout.state = 'scouting';
        this.game.scout.progress = 0;
        this.game.scout.duration = 15; // 15 seconds for demo

        this.showNotification('Scout dispatched!', 'info');
        this.renderScout();
    }

    renderScout() {
        const state = document.getElementById('scout-state');
        const progress = document.getElementById('scout-progress');
        const fill = document.getElementById('scout-progress-fill');
        const text = document.getElementById('scout-progress-text');

        if (this.game.scout.state === 'scouting') {
            state.textContent = 'Scouting in progress...';
            progress.classList.remove('hidden');
            const pct = Math.min(100, this.game.scout.progress * 100);
            fill.style.width = `${pct}%`;
            text.textContent = `${pct.toFixed(0)}%`;
        } else {
            state.textContent = 'Ready to Dispatch';
            progress.classList.add('hidden');
        }
    }

    // ============================================
    // TOUCH & INPUT
    // ============================================
    onTouchStart(e) {
        if (e.touches.length === 1) {
            this.touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }

    onTouchMove(e) {
        e.preventDefault();
    }

    onTouchEnd(e) {
        if (!this.touchStart || e.changedTouches.length === 0) return;
        const end = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        const dx = end.x - this.touchStart.x;
        const dy = end.y - this.touchStart.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 10) {
            // Tap - show context menu or select
            this.onCanvasClick({ clientX: end.x, clientY: end.y });
        }
        this.touchStart = null;
    }

    onCanvasClick(e) {
        const intersects = this.engine.raycast(e.clientX, e.clientY);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.showContextMenu(e.clientX, e.clientY, point);
        }
    }

    showContextMenu(x, y, point) {
        this.hud.context.style.left = `${x}px`;
        this.hud.context.style.top = `${y}px`;
        this.hud.context.classList.remove('hidden');
        this.contextPoint = point;
    }

    hideContextMenu() {
        this.hud.context.classList.add('hidden');
    }

    handleContextAction(action) {
        if (!this.contextPoint) return;
        const { x, z } = this.contextPoint;

        switch(action) {
            case 'march':
                this.showNotification('Select troops to march...', 'info');
                break;
            case 'gather':
                this.game.dispatchArmy('infantry', 1000, x, z, 'gather');
                this.showNotification('Army dispatched to gather resources!', 'success');
                break;
            case 'scout':
                this.game.scout.targetX = x;
                this.game.scout.targetZ = z;
                this.dispatchScout();
                break;
            case 'attack':
                this.showNotification('Select target to attack...', 'info');
                break;
        }
    }

    // ============================================
    // UTILITIES
    // ============================================
    formatTime(seconds) {
        if (seconds <= 0) return '00:00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    startUpdateLoop() {
        setInterval(() => {
            this.updateHUD();
            if (this.activePanel === 'hospital') this.renderHospital();
            if (this.activePanel === 'scout') this.renderScout();
            if (this.activePanel === 'rewards') this.renderRewards();
        }, 1000);
    }

    showLoading(progress) {
        const bar = document.getElementById('loading-bar');
        const tip = document.getElementById('loading-tip');
        if (bar) bar.style.width = `${progress}%`;
        if (tip && progress < 30) tip.textContent = 'Initializing High-Poly Graphics Engine...';
        else if (tip && progress < 60) tip.textContent = 'Generating Fantasy Terrain...';
        else if (tip && progress < 90) tip.textContent = 'Spawning Legendary Behemoth...';
        else if (tip) tip.textContent = 'Entering the Realm...';
    }

    hideLoading() {
        document.getElementById('loading-screen').classList.add('hidden');
        this.hud.top.classList.remove('hidden');
        this.hud.troop.classList.remove('hidden');
        this.hud.bottom.classList.remove('hidden');
    }
}

export default UIController;
