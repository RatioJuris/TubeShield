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

  let previousAdState = false;
  let enabled = true;
  const countedElements = new WeakSet();

  chrome.storage.local.get({youtubeAdBlocking: true}).then(data => {
    enabled = data.youtubeAdBlocking !== false;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.youtubeAdBlocking) {
      enabled = changes.youtubeAdBlocking.newValue !== false;
    }
  });

  function reportAd(count = 1) {
    chrome.runtime.sendMessage({type: "adBlocked", count}).catch(() => {});
  }

  function hideVisualAds() {
    let newlyHidden = 0;

    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach(element => {
        const visible =
          element.offsetWidth > 0 ||
          element.offsetHeight > 0 ||
          getComputedStyle(element).display !== "none";

        if (visible && !countedElements.has(element)) {
          countedElements.add(element);
          newlyHidden++;
        }

        element.style.setProperty("display", "none", "important");
        element.style.setProperty("visibility", "hidden", "important");
      });
    }

    if (newlyHidden) reportAd(newlyHidden);
  }

  function skipVideoAd() {
    const video = document.querySelector("video");
    const skipButton = document.querySelector(
      ".ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button"
    );
    const adShowing = !!document.querySelector(".ad-showing, .ad-interrupting");

    if (skipButton) {
      skipButton.click();
    }

    if (adShowing && !previousAdState) {
      reportAd(1);
    }

    previousAdState = adShowing;

    if (adShowing && video && Number.isFinite(video.duration) && video.duration > 0) {
      try {
        video.currentTime = Math.max(0, video.duration - 0.05);
        video.playbackRate = 16;
      } catch (_) {}
    }
  }

  function run() {
    if (!enabled) return;
    hideVisualAds();
    skipVideoAd();
  }

  function init() {
    run();

    const observer = new MutationObserver(run);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    setInterval(run, 1000);
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
