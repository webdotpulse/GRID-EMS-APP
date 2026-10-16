## GRID-EMS-APP v1.0.0 — iOS & Android Mobile Companion

First official release of **GRID-EMS-APP** for **Android** and **iOS**, providing seamless automatic switching between your local **GRID-EMS** edge controller at home and **GRID-EMS-SERVER** (`https://ems.newenergygrid.com`) when away from home.

### 📦 Release Downloads
- **Android APK (`GRID-EMS-v1.0.0-android.apk`)**: Direct installation package for Android 8.0+ smartphones and tablets.
- **iOS Application Bundle (`GRID-EMS-v1.0.0-ios.ipa`)**: Unsigned ARM64 iOS application bundle for sideloading (AltStore / Sideloadly / Apple Configurator 2) or enterprise/developer code signing.
- **iOS Xcode Project (`GRID-EMS-v1.0.0-ios-xcode.zip`)**: Complete pre-synced Capacitor iOS Xcode workspace ready to build and deploy via Xcode.

### ✨ Highlights
- **At Home (Local LAN Zero-Latency Mode)**: Automatically discovers local `GRID-EMS` controllers via mDNS (`gems.local`), saved LAN IP, or subnet scan.
- **Away from Home (Automatic Cloud Failover)**: Automatically opens `GRID-EMS-SERVER` (`https://ems.newenergygrid.com/client/dashboard`) when away from your home Wi-Fi.
- **Cloud Account Proposal & Deferred Auto-Pairing**: If your `GRID-EMS` is not yet connected to the cloud, proposes creating a `GRID-EMS-SERVER` account with your hardware `pairing_token` pre-registered, and automatically pairs your local `GRID-EMS` (`POST /api/cloud/pair`) the next time your phone connects to your home Wi-Fi.
- **Multi-Language UI**: Available in English (`EN`), Nederlands (`NL`), and Français (`FR`).
