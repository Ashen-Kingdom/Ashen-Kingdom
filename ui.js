export function initUI() {
  document.getElementById("status-bars").innerHTML = "HP: 100 | Mana: 50";
  document.getElementById("troop-counters").innerHTML = "Cavalry: 20 | Infantry: 40";
  document.getElementById("upgrade-queue").innerHTML = "Castle Upgrade: 2h remaining";
  document.getElementById("daily-reward").innerHTML = "<button>Claim Daily Chest</button>";
}
