export type ConnectionRouteMode =
  | 'PROBING'
  | 'LOCAL_ONLINE'
  | 'CLOUD_ONLINE'
  | 'AWAY_UNPAIRED'

export type SimulationScenario =
  | 'auto'
  | 'home_unpaired'
  | 'home_paired'
  | 'away_paired'
  | 'away_unpaired'

export interface LocalSystemInfo {
  hostname: string
  ip: string
  netmask: string
  gateway: string
  memory: string
  disk: string
  build: string
  asset_tag: string
}

export interface LocalCloudStatus {
  enabled: boolean
  status: 'disconnected' | 'pairing' | 'online' | 'error'
  server_url: string
  serial_number: string
  pairing_token: string
  device_id: number
  device_secret: string
  last_sync: string | null
  last_error: string
  latency_ms: number
}

export interface LiveTelemetrySummary {
  solarPowerW: number
  gridPowerW: number
  batteryPowerW: number
  batterySoc: number
  homeLoadW: number
  evPowerW: number
  evMode: 'ECO' | 'SOLAR' | 'FAST' | 'OFF'
  evChargerName: string
  batteryBrand: string
  batteryMode: 'auto' | 'self_consumption' | 'dynamic_arbitrage' | 'peak_shaving'
  strategyMode: string
  currentTariffEurKwh: number
  monthlyPeakKw: number
  capacityCeilingKw: number
  l1Amps: number
  l2Amps: number
  l3Amps: number
  voltageV: number
}

export interface PendingCloudPairingJob {
  serverUrl: string
  pairingToken: string
  serialNumber: string
  accountEmail?: string
  accountName?: string
  queuedAt: string
  preRegisteredOnCloud: boolean
}

export interface DiscoveredEmsEndpoint {
  host: string
  port: number
  url: string
  hostname: string
  serialNumber: string
  build: string
  cloudEnabled: boolean
  cloudStatus: string
  latencyMs: number
  source: 'saved' | 'mdns' | 'subnet' | 'manual' | 'demo'
}

export interface CloudRegistrationForm {
  name: string
  email: string
  phone: string
  password: string
  passwordConfirmation: string
  pairingToken: string
  serialNumber: string
  serverUrl: string
  tenantSlug: string
}
