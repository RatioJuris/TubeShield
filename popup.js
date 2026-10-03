async function loadStats() {
  const stats = await chrome.runtime.sendMessage({
    type: "getStats"
  });

  const ads = Number(stats?.adsBlocked || 0);

  const settings = await chrome.storage.local.get({
    blockedSites: []
  });

  const siteCount = Array.isArray(settings.blockedSites)
    ? settings.blockedSites.filter(v => String(v).trim()).length
    : 0;

  const adsElement = document.getElementById("adsBlocked");
  const siteElement = document.getElementById("siteBlocked");
  const totalElement = document.getElementById("totalBlocked");
  const lastElement = document.getElementById("lastBlocked");

  if (adsElement) {
    adsElement.textContent = ads.toLocaleString();
  }

  if (siteElement) {
    siteElement.textContent = siteCount.toLocaleString();
  }

  if (totalElement) {
    totalElement.textContent = ads.toLocaleString();
  }

  const last = Number(stats?.lastBlockedAt || 0);

  if (lastElement) {
    lastElement.textContent = last
      ? `Last blocked: ${new Date(last).toLocaleString()}`
      : "No blocks recorded yet.";
  }
}

document.getElementById("options")?.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("reset")?.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({
    type: "resetStats"
  });

  await loadStats();
});

loadStats();