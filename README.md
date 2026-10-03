# TubeShield

**TubeShield by RatioJuris**

Version 1.0.0 — Manifest V3 browser extension.

## Features

- Browser-side ad blocking on supported video services.
- Editable blocked-sites list.
- Programmed video-site defaults.
- Whole-site blocking can be enabled or disabled separately.
- Popup statistics for locally detected advertising blocks and configured site rules.
- Dedicated Options page.
- Restore Default Settings.
- Reset Statistics.
- Local-only settings and statistics using `chrome.storage`.
- Dynamic site-blocking rules using `declarativeNetRequest`.

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
- `declarativeNetRequest` — applies declarative blocking rules.
- Host permissions — required for the supported video-service content script and network-blocking rules.

TubeShield does not use `declarativeNetRequestFeedback` in the production build.

## Install for development

1. Extract the ZIP.
2. Open `edge://extensions/` or `chrome://extensions/`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Select the extracted extension directory containing `manifest.json`.

## Project

- Repository: https://github.com/RatioJuris/TubeShield
- Homepage: https://ratiojuris.github.io/TubeShield/

## Legal

- Privacy Policy: https://ratiojuris.github.io/TubeShield/privacy.html
- Terms of Service: https://ratiojuris.github.io/TubeShield/terms.html
- Contact: https://ratiojuris.github.io/TubeShield/contact.html

## Branding

TubeShield by RatioJuris.
