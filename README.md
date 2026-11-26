# TubeShield

**TubeShield by RatioJuris**

Version 1.0.1 — Manifest V3 browser extension.

## Features

- Client-side YouTube ad hiding and skip-button activation without blocking ad requests.
- Editable blocked-sites list.
- Programmed video-site defaults.
- Whole-site blocking can be enabled or disabled separately.
- Popup statistics for locally detected advertising blocks and configured site rules.
- Dedicated Options page.
- Restore Default Settings.
- Reset Statistics.
- Local-only settings and statistics using `chrome.storage`.
- Dynamic site-blocking rules using `declarativeNetRequest`.

## How YouTube ad handling works

TubeShield does not block ad network requests on YouTube. The ad request and ad playback are allowed to complete, so YouTube sees normal ad delivery and its "ad blocker detected" / Premium prompt is not triggered by a failed ad request. The content script hides ad containers and the player while an ad is playing, keeps the player muted for that interval (re-applying mute if the player changes it), and clicks the skip button when one is visible. Ads are therefore hidden from view but are still delivered and counted as played by YouTube.

This means the **Ads blocked** counter records ads that were hidden or skipped locally, not requests that were prevented from reaching the network. Unskippable ads still occupy their normal playback duration, during which the player is hidden and muted.

## Default blocked sites

The Options page starts with:

    youtube.com
    vimeo.com
    dailymotion.com
    twitch.tv

These entries are whole-site blocking entries, but the blocked-sites feature is disabled by default. If enabled, entries in the list are blocked as top-level navigation requests.

## Permissions

TubeShield uses only the permissions required by its implementation:

- `storage` — stores user preferences and local statistics.
- `declarativeNetRequest` — applies dynamic rules for the optional user-configured blocked-sites list.
- Host permission for `*://*.youtube.com/*` — required only for the YouTube content script.

TubeShield does not use `declarativeNetRequestFeedback` in the production build.

## Install for development

1. Extract the ZIP.
2. Open `edge://extensions/` or `chrome://extensions/`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Select the extracted extension directory containing `manifest.json`.

## Store listings

- Chrome Web Store: https://chromewebstore.google.com/detail/tubeshield/mdalbhgcgmblklfgpjmpbchbgidfkclm
- Microsoft Edge Add-ons: https://microsoftedge.microsoft.com/addons/detail/tubeshield/ioobkmbkklooimjmkanbeconldikdoeg

Both official listings currently publish v1.0.0. The v1.0.1 source and release ZIP are in this repository.

## Project

- Repository: https://github.com/RatioJuris/TubeShield
- Homepage: https://ratiojuris.github.io/TubeShield/

## Legal

- Privacy Policy: https://ratiojuris.github.io/TubeShield/privacy.html
- Terms of Service: https://ratiojuris.github.io/TubeShield/terms.html
- Contact: https://ratiojuris.github.io/TubeShield/contact.html

## Branding

TubeShield by RatioJuris.
