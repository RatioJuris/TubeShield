"use strict";

const CUSTOM_RULE_BASE = 100000;
const MAX_SITE_RULES = 1000;

const DEFAULT_BLOCKED_SITES = [
  "youtube.com",
  "vimeo.com",
  "dailymotion.com",
  "twitch.tv"
];

const DEFAULTS = {
  blockedSites: [...DEFAULT_BLOCKED_SITES],
  youtubeAdBlocking: true,
  blockSitesEnabled: false,
  stats: {
    adsBlocked: 0,
    lastBlockedAt: 0
  }
};

function normalizeStats(raw) {
  const ads = Number(raw && raw.adsBlocked);
  const last = Number(raw && raw.lastBlockedAt);

  return {
    adsBlocked: Number.isFinite(ads) && ads > 0 ? Math.floor(ads) : 0,
    lastBlockedAt: Number.isFinite(last) && last > 0 ? Math.floor(last) : 0
  };
}

function snapshot(data) {
  return {
    blockedSites: Array.isArray(data.blockedSites) ? [...data.blockedSites] : [],
    youtubeAdBlocking: data.youtubeAdBlocking !== false,
    blockSitesEnabled: data.blockSitesEnabled === true,
    stats: normalizeStats(data.stats),
    defaults: {
      blockedSites: [...DEFAULT_BLOCKED_SITES],
      youtubeAdBlocking: true,
      blockSitesEnabled: false
    }
  };
}

async function ensureDefaults() {
  const stored = await chrome.storage.local.get(null);

  const data = {
    blockedSites: Array.isArray(stored.blockedSites)
      ? stored.blockedSites
      : [...DEFAULT_BLOCKED_SITES],
    youtubeAdBlocking: typeof stored.youtubeAdBlocking === "boolean"
      ? stored.youtubeAdBlocking
      : true,
    blockSitesEnabled: typeof stored.blockSitesEnabled === "boolean"
      ? stored.blockSitesEnabled
      : false,
    stats: normalizeStats(stored.stats)
  };

  const previous = {
    blockedSites: stored.blockedSites,
    youtubeAdBlocking: stored.youtubeAdBlocking,
    blockSitesEnabled: stored.blockSitesEnabled,
    stats: stored.stats
  };

  if (JSON.stringify(previous) !== JSON.stringify(data)) {
    await chrome.storage.local.set(data);
  }

  return data;
}

function toUrlFilter(value) {
  let pattern = String(value || "").trim();

  if (!pattern) return "";

  pattern = pattern
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^\|\|/, "")
    .replace(/\/\*$/, "")
    .replace(/\/+$/, "");

  if (!pattern || /[\s\\]/.test(pattern)) return "";
  if (!/^[a-z0-9.-]+(?:\/[a-z0-9._~%/:-]*)?$/i.test(pattern)) return "";

  if (!pattern.includes("/")) pattern += "/";

  return pattern;
}

function normalizeSiteList(list) {
  const seen = new Set();
  const filters = [];

  for (const raw of Array.isArray(list) ? list : []) {
    const filter = toUrlFilter(raw);

    if (!filter || seen.has(filter)) continue;

    seen.add(filter);
    filters.push(filter);

    if (filters.length >= MAX_SITE_RULES) break;
  }

  return filters;
}

async function rebuildSiteRules(data) {
  const settings = data || (await ensureDefaults());
  const existing = await chrome.declarativeNetRequest.getDynamicRules();

  const removeRuleIds = existing
    .filter(rule => rule.id >= CUSTOM_RULE_BASE)
    .map(rule => rule.id);

  const addRules = [];

  if (settings.blockSitesEnabled) {
    let id = CUSTOM_RULE_BASE;

    for (const filter of normalizeSiteList(settings.blockedSites)) {
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
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules
  });
}

async function addAdStats(delta) {
  const data = await chrome.storage.local.get({
    stats: {...DEFAULTS.stats}
  });

  const stats = normalizeStats(data.stats);
  const change = Number(delta);
  const step = Number.isFinite(change) ? Math.max(0, Math.floor(change)) : 0;

  stats.adsBlocked = Math.max(0, stats.adsBlocked + step);

  if (step > 0) {
    stats.lastBlockedAt = Date.now();
  }

  await chrome.storage.local.set({stats});
}

chrome.runtime.onInstalled.addListener(async () => {
  const data = await ensureDefaults();

  await rebuildSiteRules(data);
});

chrome.runtime.onStartup.addListener(async () => {
  const data = await ensureDefaults();

  await rebuildSiteRules(data);
});

chrome.storage.onChanged.addListener(changes => {
  if (changes.blockedSites || changes.blockSitesEnabled) {
    rebuildSiteRules().catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "adBlocked") {
    addAdStats(message.count)
      .then(() => sendResponse({ok: true}))
      .catch(() => sendResponse({ok: false}));
    return true;
  }

  if (message?.type === "getSettings") {
    ensureDefaults()
      .then(data => sendResponse(snapshot(data)))
      .catch(() => sendResponse(null));

    return true;
  }

  if (message?.type === "getStats") {
    chrome.storage.local
      .get({stats: {...DEFAULTS.stats}})
      .then(data => sendResponse(normalizeStats(data.stats)));

    return true;
  }

  if (message?.type === "resetStats") {
    chrome.storage.local
      .set({stats: {...DEFAULTS.stats}})
      .then(() => sendResponse({ok: true}));

    return true;
  }
});
