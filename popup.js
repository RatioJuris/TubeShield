async function loadStats() {
  const data = await chrome.runtime.sendMessage({type: "getSettings"});

  const stats = data?.stats || {};
  const ads = Number(stats.adsBlocked || 0);

  const sites = Array.isArray(data?.blockedSites) ? data.blockedSites : [];
  const siteCount = sites.filter(value => String(value).trim()).length;

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

  const last = Number(stats.lastBlockedAt || 0);

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
