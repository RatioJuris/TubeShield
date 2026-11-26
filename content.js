(() => {
  "use strict";

  const selectors = [
    ".ytd-companion-slot-renderer",
    "#player-ads",
    "ytd-ad-slot-renderer",
    ".ytp-ad-progress-list",
    ".video-ads",
    ".ytp-ad-overlay-container",
    ".ytp-ad-overlay-slot",
    "ytd-in-feed-ad-layout-renderer",
    "ytd-advertisement-renderer",
    "ytd-banner-promo-renderer"
  ];

  const skipSelectors = [
    ".ytp-skip-ad-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-ad-skip-button"
  ];

  const HIDE_PROPERTIES = ["opacity", "clip-path", "pointer-events"];
  const COUNT_COOLDOWN_MS = 4000;
  const POD_GAP_MS = 8000;

  let enabled = true;
  let adShowing = false;
  let lastCountAt = 0;
  let lastAdEndAt = 0;
  let scheduled = false;
  let adVideo = null;
  let adVideoWasMuted = false;

  const handledElements = new Set();
  const handledSkipButtons = new Set();

  chrome.storage.local.get({youtubeAdBlocking: true}).then(data => {
    enabled = data.youtubeAdBlocking !== false;
  }).catch(() => {});

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.youtubeAdBlocking) {
      enabled = changes.youtubeAdBlocking.newValue !== false;

      if (!enabled) {
        restoreAdVideo();

        for (const element of handledElements) {
          if (element.isConnected) undoSoftHide(element);
        }

        handledElements.clear();
        handledSkipButtons.clear();
        adShowing = false;
      }
    }
  });

  document.addEventListener("volumechange", (event) => {
    if (!enabled || !adShowing || event.target !== adVideo) return;

    if (event.target.muted) return;

    event.target.muted = true;
  }, true);

  function softHide(element) {
    element.style.setProperty("opacity", "0", "important");
    element.style.setProperty("clip-path", "inset(100%)", "important");
    element.style.setProperty("pointer-events", "none", "important");
  }

  function undoSoftHide(element) {
    for (const property of HIDE_PROPERTIES) {
      element.style.removeProperty(property);
    }
  }

  function restoreAdVideo() {
    if (!adVideo) return;

    undoSoftHide(adVideo);
    adVideo.muted = adVideoWasMuted;
    adVideo = null;
  }

  function reportAd(count) {
    const now = Date.now();

    if (now - lastCountAt < COUNT_COOLDOWN_MS) return;

    lastCountAt = now;

    chrome.runtime.sendMessage({
      type: "adBlocked",
      count: Math.max(1, Number(count) || 1)
    }).catch(() => {});
  }

  function isVisible(element) {
    const style = getComputedStyle(element);

    return element.getClientRects().length > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden";
  }

  function hideVisualAds() {
    let newlyHidden = 0;

    for (const element of handledElements) {
      if (!element.isConnected) handledElements.delete(element);
    }

    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach(element => {
        if (!handledElements.has(element) && isVisible(element)) {
          handledElements.add(element);
          newlyHidden++;
        } else {
          handledElements.add(element);
        }

        softHide(element);
      });
    }

    if (newlyHidden) reportAd(newlyHidden);
  }

  function handlePlayerAd() {
    const video = document.querySelector("video");
    const showing = !!document.querySelector(".ad-showing, .ad-interrupting");
    const now = Date.now();

    if (showing) {
      if (video) {
        if (adVideo !== video) {
          restoreAdVideo();
          adVideo = video;
          adVideoWasMuted = video.muted;
        }

        if (!video.muted) video.muted = true;
        softHide(video);
      } else {
        restoreAdVideo();
      }

      for (const selector of skipSelectors) {
        document.querySelectorAll(selector).forEach(button => {
          if (handledSkipButtons.has(button) || !isVisible(button)) return;

          handledSkipButtons.add(button);
          button.click();
        });
      }

      if (!adShowing && now - lastAdEndAt >= POD_GAP_MS) {
        reportAd(1);
      }
    } else if (adShowing) {
      lastAdEndAt = now;
      handledSkipButtons.clear();
      restoreAdVideo();
    }

    adShowing = showing;
  }

  function run() {
    if (!enabled) return;

    hideVisualAds();
    handlePlayerAd();
  }

  function scheduleRun() {
    if (scheduled) return;

    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      run();
    });
  }

  function init() {
    run();

    const observer = new MutationObserver(scheduleRun);

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "id"]
    });

    setInterval(run, 250);
  }

  if (document.documentElement) {
    init();
  } else {
    const wait = new MutationObserver((_, observer) => {
      if (document.documentElement) {
        observer.disconnect();
        init();
      }
    });

    wait.observe(document, {childList: true, subtree: true});
  }
})();
