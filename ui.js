export function initUI() {
  // Status Bars
  const statusBars = document.getElementById("status-bars");
  statusBars.innerHTML = `
    <div>❤️ HP: 100</div>
    <div>🔮 Mana: 50</div>
    <div>💰 Gold: 200</div>
    <div>🍖 Food: 150</div>
  `;

  // Troop Counters
  const troopCounters = document.getElementById("troop-counters");
  troopCounters.innerHTML = `
    🐎 Cavalry: 20 | ⚔️ Infantry: 40 | 🕊️ Flying: 10 | 🔥 Mage: 5
  `;

  // Upgrade Queue
  const upgradeQueue = document.getElementById("upgrade-queue");
  upgradeQueue.innerHTML = `
    <div>🏰 Castle Upgrade: 2h remaining</div>
    <div>⚒️ Forge Upgrade: 1h remaining</div>
  `;

  // Daily Reward
  const dailyReward = document.getElementById("daily-reward");
  dailyReward.innerHTML = `
    <button id="claim-reward">🎁 Claim Daily Chest</button>
  `;

  // Reward Logic
  document.getElementById("claim-reward").onclick = () => {
    alert("🎉 You claimed 50 Gold and 20 Food!");
  };
}
