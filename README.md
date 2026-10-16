# GRID-EMS-APP (iOS & Android Mobile Companion)

Cross-platform mobile application (**Capacitor + Vue 3 + TypeScript + Tailwind CSS**) for **GRID-EMS** (Local Edge Controller) and **GRID-EMS-SERVER** (`https://ems.newenergygrid.com`), built for **New Energy Grid** and **The Charge Grid**.

---

## Core Smart Routing & Onboarding Capabilities

1. **At Home — Local LAN Zero-Latency Mode (`LOCAL_ONLINE`)**
   - Automatically probes the local network for `GRID-EMS` via saved LAN IP, mDNS (`gems.local` / `grid-ems.local`), or subnet scan on port `8080`.
   - Connects directly to the local `GRID-EMS` unit (`GET /api/system/info`, `GET /api/cloud/status`) for instant local telemetry and hardware control (**Raedian** EV wallbox modes & **Solis** battery storage optimization modes).
   - **Automatic Cloud Check:** If the local `GRID-EMS` is not connected to `GRID-EMS-SERVER` yet (`enabled: false`), displays a prominent onboarding banner proposing to **Create a Cloud Account & Pair in 1 Tap** (`POST /api/cloud/pair`).

2. **Away from Home — Automatic Cloud Failover (`CLOUD_ONLINE`)**
   - When the local `GRID-EMS` is unreachable (cellular / external Wi-Fi) and the unit is paired with the cloud, the app automatically switches to **GRID-EMS-SERVER** (`https://ems.newenergygrid.com/client/dashboard` or white-label tenant portal `https://ems.newenergygrid.com/<tenant>/dashboard`).

3. **Away from Home & EMS Not Connected to Cloud Yet (`AWAY_UNPAIRED`)**
   - Displays a dedicated **Cloud Account Proposal & Onboarding Wizard**:
     1. Pre-registers the hardware `pairing_token` and `serial_number` on `GRID-EMS-SERVER` (`POST /api/v1/device/register`) and opens `/register?pairing_token=...`.
     2. Queues **Deferred Auto-Pairing**: the moment the user's phone reconnects to their home Wi-Fi and detects the local `GRID-EMS`, the app automatically executes `POST /api/cloud/pair` to link the local unit to their new cloud account.

---

## Development & Native Build Commands

```bash
# Install dependencies
npm install

# Run automated tests
npm test

# Start development server
npm run dev

# Build production web bundle
npm run build

# Synchronize with iOS (Xcode) and Android (Android Studio)
npm run cap:sync
npm run cap:ios
npm run cap:android
```
