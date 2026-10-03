const CUSTOM_RULE_BASE = 100000;

const DEFAULTS = {
  blockedSites: [
    "youtube.com",
    "vimeo.com",
    "dailymotion.com",
    "twitch.tv"
  ],
  youtubeAdBlocking: true,
  blockSitesEnabled: false,
  stats: {
    adsBlocked: 0,
    lastBlockedAt: 0
  }
};

async function ensureDefaults() {
  const current = await chrome.storage.local.get(DEFAULTS);

  if (!Array.isArray(current.blockedSites)) {
    current.blockedSites = [...DEFAULTS.blockedSites];
  }

  if (typeof current.youtubeAdBlocking !== "boolean") {
    current.youtubeAdBlocking = true;
  }

  if (typeof current.blockSitesEnabled !== "boolean") {
    current.blockSitesEnabled = false;
  }

  if (!current.stats || typeof current.stats !== "object") {
    current.stats = {...DEFAULTS.stats};
  }

  current.stats.adsBlocked = Math.max(
    0,
    Number(current.stats.adsBlocked || 0)
  );

  current.stats.lastBlockedAt = Math.max(
    0,
    Number(current.stats.lastBlockedAt || 0)
  );

  await chrome.storage.local.set(current);
  return current;
}

function toUrlFilter(value) {
  let pattern = String(value || "").trim();

  if (!pattern) return "";

  pattern = pattern
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "");

  if (pattern.endsWith("/")) {
    pattern = pattern.slice(0, -1);
  }

  return pattern;
}

async function rebuildSiteRules() {
  const data = await ensureDefaults();
  const existing = await chrome.declarativeNetRequest.getDynamicRules();

  const removeRuleIds = existing
    .filter(rule => rule.id >= CUSTOM_RULE_BASE)
    .map(rule => rule.id);

  const addRules = [];

  if (!data.blockSitesEnabled) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules: []
    });
    return;
  }

  let id = CUSTOM_RULE_BASE;

  for (const raw of data.blockedSites) {
    const filter = toUrlFilter(raw);

    if (!filter) continue;

    addRules.push({
      id: id++,
      priority: 1,
      action: {
        type: "block"
      },
      condition: {
        urlFilter: `||${filter}`,
        resourceTypes: ["main_frame"]
      }
    });
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules
  });
}

async function addAdStats(delta = 0) {
  const data = await chrome.storage.local.get({
    stats: {...DEFAULTS.stats}
  });

  const stats = data.stats || {...DEFAULTS.stats};

  stats.adsBlocked = Math.max(
    0,
    Number(stats.adsBlocked || 0) + Number(delta || 0)
  );

  if (delta) {
    stats.lastBlockedAt = Date.now();
  }

  await chrome.storage.local.set({stats});
}

async function updateAdRuleset(enabled) {
  try {
    if (enabled) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: ["video_site_ads"],
        disableRulesetIds: []
      });
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: [],
        disableRulesetIds: ["video_site_ads"]
      });
    }
  } catch (_) {}
}

chrome.runtime.onInstalled.addListener(async () => {
  const data = await ensureDefaults();

  await rebuildSiteRules();
  await updateAdRuleset(data.youtubeAdBlocking !== false);

  await chrome.storage.local.set({
    stats: data.stats || {...DEFAULTS.stats}
  });
});

chrome.runtime.onStartup.addListener(async () => {
  const data = await ensureDefaults();

  await rebuildSiteRules();
  await updateAdRuleset(data.youtubeAdBlocking !== false);
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local") return;

  if (changes.blockedSites || changes.blockSitesEnabled) {
    await rebuildSiteRules();
  }

  if (changes.youtubeAdBlocking) {
    await updateAdRuleset(
      changes.youtubeAdBlocking.newValue !== false
    );
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "adBlocked") {
    addAdStats(Number(message.count || 1));
    return;
  }

  if (message?.type === "getStats") {
    chrome.storage.local
      .get({stats: {...DEFAULTS.stats}})
      .then(data => sendResponse(data.stats));

    return true;
  }

  if (message?.type === "resetStats") {
    chrome.storage.local
      .set({stats: {...DEFAULTS.stats}})
      .then(() => sendResponse({ok: true}));

    return true;
  }
});
