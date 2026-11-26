const blockedSites = document.getElementById("blockedSites");
const youtubeAdBlocking = document.getElementById("youtubeAdBlocking");
const blockSitesEnabled = document.getElementById("blockSitesEnabled");
const status = document.getElementById("status");

function getSiteCount() {
  return [...new Set(
    blockedSites.value
      .split(/\r?\n/)
      .map(value => value.trim())
      .filter(Boolean)
  )].length;
}

async function load() {
  const data = await chrome.runtime.sendMessage({type: "getSettings"});

  if (!data) return;

  blockedSites.value = data.blockedSites.join("\n");
  youtubeAdBlocking.checked = data.youtubeAdBlocking;
  blockSitesEnabled.checked = data.blockSitesEnabled;

  await loadStats();
}

async function save() {
  const list = [...new Set(
    blockedSites.value
      .split(/\r?\n/)
      .map(value => value.trim())
      .filter(Boolean)
  )];

  await chrome.storage.local.set({
    blockedSites: list,
    youtubeAdBlocking: youtubeAdBlocking.checked,
    blockSitesEnabled: blockSitesEnabled.checked
  });

  blockedSites.value = list.join("\n");

  status.textContent = "Settings saved.";
  setTimeout(() => {
    status.textContent = "";
  }, 1800);

  await loadStats();
}

async function restoreDefaults() {
  const data = await chrome.runtime.sendMessage({type: "getSettings"});
  const defaults = data?.defaults?.blockedSites || [];

  blockedSites.value = defaults.join("\n");
  youtubeAdBlocking.checked = true;
  blockSitesEnabled.checked = false;

  await chrome.storage.local.set({
    blockedSites: [...defaults],
    youtubeAdBlocking: true,
    blockSitesEnabled: false
  });

  status.textContent = "Default settings restored.";
  setTimeout(() => {
    status.textContent = "";
  }, 1800);

  await loadStats();
}

async function loadStats() {
  const data = await chrome.runtime.sendMessage({type: "getSettings"});

  const ads = Number(data?.stats?.adsBlocked || 0);
  const siteCount = getSiteCount();

  document.getElementById("ads").textContent =
    ads.toLocaleString();

  document.getElementById("sites").textContent =
    siteCount.toLocaleString();

  document.getElementById("total").textContent =
    ads.toLocaleString();
}

document.getElementById("save").addEventListener("click", save);
document.getElementById("restore").addEventListener("click", restoreDefaults);

document.getElementById("resetStats").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({
    type: "resetStats"
  });

  await loadStats();
});

blockedSites.addEventListener("input", loadStats);

load();
