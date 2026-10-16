# AGENTS.md - System Directives for GRID-EMS-APP

## Repository Identity & Purpose
You are engineering **GRID-EMS-APP**, the official iOS and Android mobile companion application for **GRID-EMS** (edge energy management controller) and **GRID-EMS-SERVER** (`https://ems.newenergygrid.com`), owned exclusively by **New Energy Grid** and **The Charge Grid**.

## Core Directives
1. **Strict Brand & IP Policy:** Only reference **"The Charge Grid"** and **"New Energy Grid"** (alongside `GRID-EMS` / `GEMS` / `GRID-EMS-SERVER`), and hardware reference templates **Raedian** (EV wallboxes) and **Solis** (inverters/BESS). Never hardcode secrets or mention third-party competitors.
2. **Ecosystem Lockstep:** Maintain full API compatibility with local `GRID-EMS` endpoints (`/api/system/info`, `/api/cloud/status`, `/api/cloud/pair`, `/api/settings`) and cloud `GRID-EMS-SERVER` endpoints (`/api/v1/device/register`, `/register`, `/login`, `/client/dashboard`).
3. **Browser & WebView Support Policy:** Assume a modern mobile WebView execution environment (iOS WKWebView / Android System WebView), using native `<dialog closedby="any">` modals with progressive enhancement and lightweight bounding-box click fallbacks for Safari/WKWebView.
