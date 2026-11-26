# Changelog

All notable changes to TubeShield are documented here.

## 1.0.1

- Removed the static declarativeNetRequest ruleset that blocked `doubleclick.net`, `static.doubleclick.net`, `googlesyndication.com` and `googleadservices.com` requests initiated by YouTube. Blocking those requests prevented ad breaks from completing, which is the inferred trigger for YouTube's "ad blocker detected" / Premium prompt. Ad requests and ad playback are now allowed to complete.
- YouTube ads are now handled entirely in the content script: ad containers are hidden, the player is hidden and muted while an ad is playing, and a visible skip button is clicked when available.
- Replaced `display: none` / `visibility: hidden` with `opacity: 0`, `clip-path: inset(100%)` and `pointer-events: none`, so hidden elements keep normal layout geometry and computed `display`/`visibility` values.
- Restored hidden elements and player audio when ad blocking is switched off or the ad ends.
- Reduced the install-time permission surface: removed unused host permissions for Vimeo, Dailymotion, Twitch, Google Video, DoubleClick, Google Syndication, Google Ad Services and youtu.be. Only `*://*.youtube.com/*` remains, for the content script. `declarativeNetRequest` is retained for the optional site-blocking list.
- Set `minimum_chrome_version` to 101.
- Fixed the popup showing zero configured sites on a fresh install. Settings and defaults now come from the background service worker through a single `getSettings` message, so the popup and Options page use the same defaults.
- The content script now observes `class` attribute changes in addition to DOM insertions, so ad state changes applied by YouTube without adding or removing nodes are detected.
- Removed the forced video seek to the end and the forced `16x` playback rate.
- An ad pod is treated as one episode: consecutive ads starting within 8 seconds of the previous ad ending are not counted again, and each skip button is clicked at most once.
- Ad detection runs on class/id mutations and a 250 ms poll, so the player is hidden and muted as soon as an ad starts rather than after the skip button appears.
- Muting is now reasserted on every detection pass and immediately on `volumechange`. If YouTube un-mutes the player during an ad, TubeShield re-mutes it instead of leaving ad audio playing; the original mute state is restored when the ad ends.
- Prevented inflated ad counters: each ad element is counted once, ad-episode transitions use edge detection, and all count reports share a 4-second cooldown so the same ad cannot be counted by both the visual and player paths.
- Capped dynamic site-blocking rules at 1000 and validated/normalised user-entered domains before they become `||domain/` filters.
- Hardened settings storage: malformed statistics and non-array site lists are normalised on load.
- Updated README permission notes and documentation version strings to 1.0.1.
- Replaced the placeholder Chrome Web Store and Microsoft Edge Add-ons badge assets with the official Chrome and Edge SVGs and linked the verified official listings: `https://chromewebstore.google.com/detail/tubeshield/mdalbhgcgmblklfgpjmpbchbgidfkclm` and `https://microsoftedge.microsoft.com/addons/detail/tubeshield/ioobkmbkklooimjmkanbeconldikdoeg`. The TubeShield shield SVG is used for the favicon, README header icon and extension mark. All README/store/project links are now clickable Markdown links. Both listings currently publish v1.0.0.

## 1.0.0

- Initial Manifest V3 release with ad blocking, configurable site blocking, local statistics, Options page and declarative network rules.
