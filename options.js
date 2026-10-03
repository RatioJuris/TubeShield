const DEFAULTS = [
  "youtube.com",
  "vimeo.com",
  "dailymotion.com",
  "twitch.tv"
];

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
  const data = await chrome.storage.local.get({
    blockedSites: DEFAULTS,
    youtubeAdBlocking: true,
    blockSitesEnabled: false
  });

  blockedSites.value = (data.blockedSites || DEFAULTS).join("\n");
  youtubeAdBlocking.checked = data.youtubeAdBlocking !== false;
  blockSitesEnabled.checked = data.blockSitesEnabled === true;

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
  blockedSites.value = DEFAULTS.join("\n");
  youtubeAdBlocking.checked = true;
  blockSitesEnabled.checked = false;

  await chrome.storage.local.set({
    blockedSites: [...DEFAULTS],
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
  const stats = await chrome.runtime.sendMessage({
    type: "getStats"
  });

  const ads = Number(stats?.adsBlocked || 0);
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
