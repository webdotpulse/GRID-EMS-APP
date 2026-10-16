# Changelog

All notable changes to **GRID-EMS-APP** are documented in this file.

## [Unreleased]

### Added
- Initial release of the **GRID-EMS** iOS and Android mobile companion application powered by Capacitor, Vue 3, TypeScript, and Tailwind CSS.
- **Smart Local & Cloud Connection Router**: Automatically connects to the local **GRID-EMS** unit (`gems.local` / LAN IP) when at home on Wi-Fi, and seamlessly switches to **GRID-EMS-SERVER** (`https://ems.newenergygrid.com`) when away from home.
- **Cloud Account Proposal & One-Tap Onboarding Wizard**: Detects when a local or remote **GRID-EMS** is not yet paired with the cloud, proposes creating a **GRID-EMS-SERVER** account with pre-filled hardware pairing tokens, and supports **Deferred Auto-Pairing** upon returning to home Wi-Fi.
- **Native iOS & Android Network Configuration**: Configured iOS `Info.plist` (`NSLocalNetworkUsageDescription`, `NSBonjourServices`, `NSAllowsLocalNetworking`) and Android `AndroidManifest.xml` / `network_security_config.xml` for local LAN discovery and secure cloud communication.
- **Multi-Language Support (i18n)**: Full user interface localization in English (`EN`), Dutch (`NL`), and French (`FR`).
