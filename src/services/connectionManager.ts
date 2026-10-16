import { reactive } from 'vue'
import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { Network } from '@capacitor/network'
import { Browser } from '@capacitor/browser'
import type {
  ConnectionRouteMode,
  SimulationScenario,
  LocalSystemInfo,
  LocalCloudStatus,
  LiveTelemetrySummary,
  PendingCloudPairingJob,
  DiscoveredEmsEndpoint,
} from '../types'

const STORAGE_KEYS = {
  LOCAL_HOST: 'gems_app_local_host',
  LOCAL_PORT: 'gems_app_local_port',
  CLOUD_URL: 'gems_app_cloud_url',
  TENANT_SLUG: 'gems_app_tenant_slug',
  SERIAL_NUMBER: 'gems_app_serial_number',
  PAIRING_TOKEN: 'gems_app_pairing_token',
  CLOUD_PAIRED: 'gems_app_cloud_paired',
  PENDING_PAIRING: 'gems_app_pending_pairing',
  SIMULATION_MODE: 'gems_app_simulation_mode',
}

function getStored(key: string, fallback = ''): string {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function setStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore storage errors
  }
}

function generatePairingToken(): string {
  const hex = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 16).toString(16).toUpperCase()
  ).join('')
  return `PAIR-${hex}-TCG`
}

export const connectionState = reactive({
  routeMode: 'PROBING' as ConnectionRouteMode,
  simulationScenario: (getStored(STORAGE_KEYS.SIMULATION_MODE, 'auto') || 'auto') as SimulationScenario,
  manualViewOverride: null as 'local' | 'cloud' | null,

  isAtHome: false,
  isCloudPaired: getStored(STORAGE_KEYS.CLOUD_PAIRED, 'false') === 'true',
  isProbing: false,
  isScanningSubnet: false,
  scanProgressPct: 0,

  localHost: getStored(STORAGE_KEYS.LOCAL_HOST, 'gems.local'),
  localPort: Number(getStored(STORAGE_KEYS.LOCAL_PORT, '8080')) || 8080,
  localLatencyMs: 0,

  cloudServerUrl: getStored(STORAGE_KEYS.CLOUD_URL, 'https://ems.newenergygrid.com'),
  tenantSlug: getStored(STORAGE_KEYS.TENANT_SLUG, ''),

  serialNumber: getStored(STORAGE_KEYS.SERIAL_NUMBER, 'TCG-EMS-83daf13d05f1adad'),
  pairingToken: getStored(STORAGE_KEYS.PAIRING_TOKEN, '') || generatePairingToken(),

  systemInfo: null as LocalSystemInfo | null,
  cloudStatus: null as LocalCloudStatus | null,
  pendingPairingJob: (() => {
    try {
      const raw = getStored(STORAGE_KEYS.PENDING_PAIRING, '')
      return raw ? (JSON.parse(raw) as PendingCloudPairingJob) : null
    } catch {
      return null
    }
  })(),
  deferredPairingJustCompleted: false,

  discoveredEndpoints: [] as DiscoveredEmsEndpoint[],

  telemetry: {
    solarPowerW: 4280,
    gridPowerW: -1420,
    batteryPowerW: -1850,
    batterySoc: 78,
    homeLoadW: 1010,
    evPowerW: 0,
    evMode: 'ECO',
    evChargerName: 'Raedian Gemini 11kW',
    batteryBrand: 'Solis BESS 10kWh',
    batteryMode: 'auto',
    strategyMode: 'self_consumption',
    currentTariffEurKwh: 0.214,
    monthlyPeakKw: 3.18,
    capacityCeilingKw: 4.0,
    l1Amps: 2.1,
    l2Amps: 1.9,
    l3Amps: 2.2,
    voltageV: 232.4,
  } as LiveTelemetrySummary,
})

// Save initial generated pairing token if none was stored
if (!getStored(STORAGE_KEYS.PAIRING_TOKEN)) {
  setStored(STORAGE_KEYS.PAIRING_TOKEN, connectionState.pairingToken)
}

/**
 * Cross-platform HTTP JSON helper using CapacitorHttp on native iOS/Android
 * (bypasses mixed-content / CORS on local LAN) with standard fetch fallback.
 */
async function httpRequestJson<T = unknown>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT'
    body?: Record<string, unknown>
    timeoutMs?: number
  } = {}
): Promise<{ ok: boolean; status: number; data: T | null; latencyMs: number }> {
  const method = options.method ?? 'GET'
  const timeoutMs = options.timeoutMs ?? 1800
  const t0 = performance.now()

  if (Capacitor.isNativePlatform()) {
    try {
      const response = await CapacitorHttp.request({
        url,
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        data: options.body,
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
      })
      const latencyMs = Math.round(performance.now() - t0)
      const ok = response.status >= 200 && response.status < 300
      return {
        ok,
        status: response.status,
        data: (response.data as T) ?? null,
        latencyMs,
      }
    } catch {
      return {
        ok: false,
        status: 0,
        data: null,
        latencyMs: Math.round(performance.now() - t0),
      }
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method,
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })
    const latencyMs = Math.round(performance.now() - t0)
    let data: T | null = null
    try {
      data = (await res.json()) as T
    } catch {
      data = null
    }
    return {
      ok: res.ok,
      status: res.status,
      data,
      latencyMs,
    }
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      latencyMs: Math.round(performance.now() - t0),
    }
  } finally {
    clearTimeout(timer)
  }
}

export function getLocalBaseUrl(host = connectionState.localHost, port = connectionState.localPort): string {
  const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0]
  return `http://${cleanHost}:${port}`
}

export function getCloudPortalUrl(path = '/client/dashboard'): string {
  const base = connectionState.cloudServerUrl.replace(/\/$/, '')
  const slug = connectionState.tenantSlug.trim().replace(/^\/|\/$/g, '')
  if (slug && (path === '/login' || path === '/register' || path === '/dashboard' || path === '/client/dashboard')) {
    const normalizedPath = path === '/client/dashboard' ? '/dashboard' : path
    return `${base}/${slug}${normalizedPath}`
  }
  return `${base}${path}`
}

/**
 * Probes a single local candidate host:port for GRID-EMS `/api/system/info` and `/api/cloud/status`.
 */
export async function probeSingleLocalHost(
  host: string,
  port = 8080,
  source: DiscoveredEmsEndpoint['source'] = 'saved',
  timeoutMs = 1500
): Promise<DiscoveredEmsEndpoint | null> {
  const baseUrl = getLocalBaseUrl(host, port)
  const sysRes = await httpRequestJson<LocalSystemInfo>(`${baseUrl}/api/system/info`, { timeoutMs })
  if (!sysRes.ok || !sysRes.data || (!sysRes.data.hostname && !sysRes.data.asset_tag)) {
    return null
  }

  const cloudRes = await httpRequestJson<LocalCloudStatus>(`${baseUrl}/api/cloud/status`, { timeoutMs })
  const serial =
    cloudRes.data?.serial_number ||
    (sysRes.data.asset_tag ? `TCG-EMS-${sysRes.data.asset_tag}` : 'TCG-EMS-83daf13d05f1adad')

  return {
    host,
    port,
    url: baseUrl,
    hostname: sysRes.data.hostname || 'gems',
    serialNumber: serial,
    build: sysRes.data.build || 'v9.4.0',
    cloudEnabled: Boolean(cloudRes.data?.enabled),
    cloudStatus: cloudRes.data?.status || 'disconnected',
    latencyMs: sysRes.latencyMs,
    source,
  }
}

/**
 * Executes Deferred Auto-Pairing (`POST /api/cloud/pair`) if the user queued a cloud pairing job
 * while away from home and has now reconnected to their home Wi-Fi.
 */
async function maybeRunDeferredAutoPairing(baseUrl: string): Promise<void> {
  const job = connectionState.pendingPairingJob
  if (!job) return

  const pairRes = await httpRequestJson<{ status: string; cloud?: LocalCloudStatus }>(
    `${baseUrl}/api/cloud/pair`,
    {
      method: 'POST',
      body: {
        server_url: job.serverUrl || connectionState.cloudServerUrl,
        pairing_token: job.pairingToken,
        serial_number: job.serialNumber || connectionState.serialNumber,
      },
      timeoutMs: 5000,
    }
  )

  if (pairRes.ok || connectionState.simulationScenario !== 'auto') {
    connectionState.isCloudPaired = true
    setStored(STORAGE_KEYS.CLOUD_PAIRED, 'true')
    connectionState.pendingPairingJob = null
    setStored(STORAGE_KEYS.PENDING_PAIRING, '')
    connectionState.deferredPairingJustCompleted = true
    if (pairRes.data?.cloud) {
      connectionState.cloudStatus = pairRes.data.cloud
    } else if (connectionState.cloudStatus) {
      connectionState.cloudStatus.enabled = true
      connectionState.cloudStatus.status = 'online'
      connectionState.cloudStatus.pairing_token = job.pairingToken
    }
  }
}

/**
 * Fetches live telemetry from local GRID-EMS (`/api/status`, `/api/settings`, `/api/devices`)
 */
export async function refreshLocalTelemetry(): Promise<void> {
  if (!connectionState.isAtHome) return
  if (connectionState.simulationScenario !== 'auto') return

  const baseUrl = getLocalBaseUrl()
  const [cloudRes, settingsRes] = await Promise.all([
    httpRequestJson<LocalCloudStatus>(`${baseUrl}/api/cloud/status`, { timeoutMs: 1800 }),
    httpRequestJson<Record<string, unknown>>(`${baseUrl}/api/settings`, { timeoutMs: 1800 }),
  ])

  if (cloudRes.ok && cloudRes.data) {
    connectionState.cloudStatus = cloudRes.data
    if (cloudRes.data.serial_number) {
      connectionState.serialNumber = cloudRes.data.serial_number
      setStored(STORAGE_KEYS.SERIAL_NUMBER, cloudRes.data.serial_number)
    }
    if (cloudRes.data.pairing_token) {
      connectionState.pairingToken = cloudRes.data.pairing_token
      setStored(STORAGE_KEYS.PAIRING_TOKEN, cloudRes.data.pairing_token)
    }
    const paired = Boolean(
      cloudRes.data.enabled &&
        (cloudRes.data.status === 'online' || Boolean(cloudRes.data.device_secret))
    )
    connectionState.isCloudPaired = paired
    setStored(STORAGE_KEYS.CLOUD_PAIRED, paired ? 'true' : 'false')
  }

  if (settingsRes.ok && settingsRes.data) {
    if (typeof settingsRes.data.strategy_mode === 'string') {
      connectionState.telemetry.strategyMode = settingsRes.data.strategy_mode
    }
  }
}

/**
 * Core Smart Routing Engine:
 * 1. Probes local GRID-EMS on the home network (saved IP, gems.local mDNS, localhost).
 * 2. If found -> Opens Local GRID-EMS (and checks if Cloud is connected; if not, proposes Cloud Account).
 * 3. If not found (user is away from home):
 *    - If EMS is paired with Cloud -> Automatically opens GRID-EMS-SERVER.
 *    - If EMS is NOT paired with Cloud yet -> Proposes creating an account & queues Deferred Auto-Pairing.
 */
export async function evaluateSmartRouting(): Promise<void> {
  connectionState.isProbing = true

  // Handle explicit simulation scenarios for deterministic testing & demo verification
  if (connectionState.simulationScenario !== 'auto') {
    await new Promise((r) => setTimeout(r, 250))
    applySimulatedScenario(connectionState.simulationScenario)
    connectionState.isProbing = false
    return
  }

  const candidates: Array<{ host: string; port: number; source: DiscoveredEmsEndpoint['source'] }> = [
    { host: connectionState.localHost, port: connectionState.localPort, source: 'saved' },
    { host: 'gems.local', port: 8080, source: 'mdns' },
    { host: 'grid-ems.local', port: 8080, source: 'mdns' },
    { host: 'localhost', port: 8080, source: 'mdns' },
  ]

  // Deduplicate candidates
  const seen = new Set<string>()
  const uniqueCandidates = candidates.filter((c) => {
    const key = `${c.host}:${c.port}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  let matchedEndpoint: DiscoveredEmsEndpoint | null = null
  for (const candidate of uniqueCandidates) {
    const found = await probeSingleLocalHost(candidate.host, candidate.port, candidate.source, 1400)
    if (found) {
      matchedEndpoint = found
      break
    }
  }

  if (matchedEndpoint) {
    // User is AT HOME on the local network!
    connectionState.isAtHome = true
    connectionState.localHost = matchedEndpoint.host
    connectionState.localPort = matchedEndpoint.port
    connectionState.localLatencyMs = matchedEndpoint.latencyMs
    setStored(STORAGE_KEYS.LOCAL_HOST, matchedEndpoint.host)
    setStored(STORAGE_KEYS.LOCAL_PORT, String(matchedEndpoint.port))

    // Upsert into discovered endpoints
    const idx = connectionState.discoveredEndpoints.findIndex((e) => e.url === matchedEndpoint!.url)
    if (idx >= 0) {
      connectionState.discoveredEndpoints[idx] = matchedEndpoint
    } else {
      connectionState.discoveredEndpoints.unshift(matchedEndpoint)
    }

    await refreshLocalTelemetry()
    await maybeRunDeferredAutoPairing(matchedEndpoint.url)

    connectionState.routeMode =
      connectionState.manualViewOverride === 'cloud' ? 'CLOUD_ONLINE' : 'LOCAL_ONLINE'
  } else {
    // User is AWAY FROM HOME (Local GRID-EMS is unreachable)
    connectionState.isAtHome = false
    if (connectionState.isCloudPaired) {
      connectionState.routeMode = 'CLOUD_ONLINE'
    } else {
      connectionState.routeMode = 'AWAY_UNPAIRED'
    }
  }

  connectionState.isProbing = false
}

function applySimulatedScenario(scenario: SimulationScenario): void {
  const demoEndpoint: DiscoveredEmsEndpoint = {
    host: '192.168.1.48',
    port: 8080,
    url: 'http://192.168.1.48:8080',
    hostname: 'gems-home-rpi5',
    serialNumber: connectionState.serialNumber || 'TCG-EMS-83daf13d05f1adad',
    build: 'v9.4.2',
    cloudEnabled: scenario === 'home_paired' || scenario === 'away_paired',
    cloudStatus: scenario === 'home_paired' || scenario === 'away_paired' ? 'online' : 'disconnected',
    latencyMs: 6,
    source: 'demo',
  }

  connectionState.systemInfo = {
    hostname: 'gems-home-rpi5',
    ip: '192.168.1.48',
    netmask: '255.255.255.0',
    gateway: '192.168.1.1',
    memory: '0.6 GB / 4.0 GB',
    disk: '4.2G / 29G (15% used)',
    build: 'v9.4.2',
    asset_tag: '83daf13d05f1adad',
  }

  if (scenario === 'home_unpaired') {
    connectionState.isAtHome = true
    connectionState.localHost = '192.168.1.48'
    connectionState.localPort = 8080
    connectionState.localLatencyMs = 6
    connectionState.isCloudPaired = false
    connectionState.cloudStatus = {
      enabled: false,
      status: 'disconnected',
      server_url: connectionState.cloudServerUrl,
      serial_number: connectionState.serialNumber,
      pairing_token: connectionState.pairingToken,
      device_id: 0,
      device_secret: '',
      last_sync: null,
      last_error: '',
      latency_ms: 0,
    }
    connectionState.discoveredEndpoints = [demoEndpoint]
    // If there is a deferred job waiting and user just switched to home_unpaired, auto-complete it!
    if (connectionState.pendingPairingJob) {
      connectionState.isCloudPaired = true
      connectionState.cloudStatus.enabled = true
      connectionState.cloudStatus.status = 'online'
      connectionState.pendingPairingJob = null
      setStored(STORAGE_KEYS.PENDING_PAIRING, '')
      connectionState.deferredPairingJustCompleted = true
    }
    connectionState.routeMode =
      connectionState.manualViewOverride === 'cloud' ? 'CLOUD_ONLINE' : 'LOCAL_ONLINE'
  } else if (scenario === 'home_paired') {
    connectionState.isAtHome = true
    connectionState.localHost = '192.168.1.48'
    connectionState.localPort = 8080
    connectionState.localLatencyMs = 5
    connectionState.isCloudPaired = true
    connectionState.cloudStatus = {
      enabled: true,
      status: 'online',
      server_url: connectionState.cloudServerUrl,
      serial_number: connectionState.serialNumber,
      pairing_token: connectionState.pairingToken,
      device_id: 104,
      device_secret: 'sec_paired_live',
      last_sync: new Date().toISOString(),
      last_error: '',
      latency_ms: 19,
    }
    connectionState.discoveredEndpoints = [demoEndpoint]
    connectionState.routeMode =
      connectionState.manualViewOverride === 'cloud' ? 'CLOUD_ONLINE' : 'LOCAL_ONLINE'
  } else if (scenario === 'away_paired') {
    connectionState.isAtHome = false
    connectionState.isCloudPaired = true
    connectionState.routeMode = 'CLOUD_ONLINE'
  } else if (scenario === 'away_unpaired') {
    connectionState.isAtHome = false
    connectionState.isCloudPaired = false
    connectionState.routeMode = 'AWAY_UNPAIRED'
  }
}

export async function setSimulationScenario(scenario: SimulationScenario): Promise<void> {
  connectionState.simulationScenario = scenario
  connectionState.manualViewOverride = null
  setStored(STORAGE_KEYS.SIMULATION_MODE, scenario)
  await evaluateSmartRouting()
}

/**
 * Scans mDNS (`gems.local`, `grid-ems.local`) and common home LAN subnets for GRID-EMS units.
 */
export async function scanLocalSubnet(customSubnetPrefix?: string): Promise<DiscoveredEmsEndpoint[]> {
  connectionState.isScanningSubnet = true
  connectionState.scanProgressPct = 10

  const found: DiscoveredEmsEndpoint[] = []
  const mdnsHosts = ['gems.local', 'grid-ems.local', 'localhost']
  for (const host of mdnsHosts) {
    const res = await probeSingleLocalHost(host, 8080, 'mdns', 900)
    if (res) found.push(res)
  }

  connectionState.scanProgressPct = 40

  const prefix =
    customSubnetPrefix ||
    (connectionState.localHost.split('.').length === 4
      ? connectionState.localHost.split('.').slice(0, 3).join('.')
      : '192.168.1')

  // Probe common static / DHCP octets in parallel batches
  const commonOctets = [2, 10, 20, 30, 40, 48, 50, 60, 100, 101, 110, 120, 150, 200]
  const batchPromises = commonOctets.map((octet) =>
    probeSingleLocalHost(`${prefix}.${octet}`, 8080, 'subnet', 750)
  )
  const batchResults = await Promise.all(batchPromises)
  for (const item of batchResults) {
    if (item && !found.some((f) => f.url === item.url)) {
      found.push(item)
    }
  }

  connectionState.scanProgressPct = 100
  if (found.length > 0) {
    connectionState.discoveredEndpoints = found
  }
  connectionState.isScanningSubnet = false
  return connectionState.discoveredEndpoints
}

/**
 * Pairs the local GRID-EMS unit (if at home) OR pre-registers the pairing token on GRID-EMS-SERVER
 * and queues a Deferred Auto-Pairing job (if away from home).
 */
export async function pairOrQueueCloudAccount(params: {
  serverUrl: string
  pairingToken: string
  serialNumber: string
  accountName?: string
  accountEmail?: string
}): Promise<{
  mode: 'paired_local_now' | 'queued_deferred_away'
  registerPortalUrl: string
}> {
  const serverUrl = (params.serverUrl || 'https://ems.newenergygrid.com').replace(/\/$/, '')
  const pairingToken = (params.pairingToken || connectionState.pairingToken).trim().toUpperCase()
  const serialNumber = (params.serialNumber || connectionState.serialNumber).trim()

  connectionState.cloudServerUrl = serverUrl
  connectionState.pairingToken = pairingToken
  connectionState.serialNumber = serialNumber

  setStored(STORAGE_KEYS.CLOUD_URL, serverUrl)
  setStored(STORAGE_KEYS.PAIRING_TOKEN, pairingToken)
  setStored(STORAGE_KEYS.SERIAL_NUMBER, serialNumber)

  // 1. Pre-register the hardware unit & pairing token on GRID-EMS-SERVER (`POST /api/v1/device/register`)
  // so that `AuthController@register` immediately recognizes `pairing_token` when the user creates their account.
  const cloudRegRes = await httpRequestJson(`${serverUrl}/api/v1/device/register`, {
    method: 'POST',
    body: {
      serial_number: serialNumber,
      pairing_token: pairingToken,
      model: 'GEMS v9.4 Pro',
      firmware_version: 'v9.4.2',
      ip_local: connectionState.systemInfo?.ip || connectionState.localHost,
    },
    timeoutMs: 4000,
  })

  // 2. If the user is currently AT HOME, also call `POST /api/cloud/pair` on the local GRID-EMS immediately!
  if (connectionState.isAtHome) {
    const baseUrl = getLocalBaseUrl()
    await httpRequestJson(`${baseUrl}/api/cloud/pair`, {
      method: 'POST',
      body: {
        server_url: serverUrl,
        pairing_token: pairingToken,
        serial_number: serialNumber,
      },
      timeoutMs: 4500,
    })

    connectionState.isCloudPaired = true
    setStored(STORAGE_KEYS.CLOUD_PAIRED, 'true')
    if (connectionState.cloudStatus) {
      connectionState.cloudStatus.enabled = true
      connectionState.cloudStatus.status = 'online'
      connectionState.cloudStatus.pairing_token = pairingToken
      connectionState.cloudStatus.server_url = serverUrl
    }
    if (connectionState.simulationScenario === 'home_unpaired') {
      connectionState.simulationScenario = 'home_paired'
      setStored(STORAGE_KEYS.SIMULATION_MODE, 'home_paired')
    }

    const registerPortalUrl = `${getCloudPortalUrl('/register')}?pairing_token=${encodeURIComponent(pairingToken)}`
    return {
      mode: 'paired_local_now',
      registerPortalUrl,
    }
  }

  // 3. User is AWAY FROM HOME: Queue Deferred Auto-Pairing for when the phone reconnects to Home Wi-Fi!
  const job: PendingCloudPairingJob = {
    serverUrl,
    pairingToken,
    serialNumber,
    accountName: params.accountName,
    accountEmail: params.accountEmail,
    queuedAt: new Date().toISOString(),
    preRegisteredOnCloud: cloudRegRes.ok,
  }
  connectionState.pendingPairingJob = job
  setStored(STORAGE_KEYS.PENDING_PAIRING, JSON.stringify(job))

  const registerPortalUrl = `${getCloudPortalUrl('/register')}?pairing_token=${encodeURIComponent(pairingToken)}`
  return {
    mode: 'queued_deferred_away',
    registerPortalUrl,
  }
}

/**
 * Opens a URL using Capacitor's native SFSafariViewController / Chrome Custom Tabs on iOS/Android,
 * or a new tab on desktop web.
 */
export async function openExternalOrNativePortal(url: string): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url, presentationStyle: 'popover' })
      return
    }
  } catch {
    // Fallback to window.open
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

let networkListenerInitialized = false

export function initNetworkLifecycleListeners(): void {
  if (networkListenerInitialized) return
  networkListenerInitialized = true

  try {
    Network.addListener('networkStatusChange', (status) => {
      if (status.connected) {
        evaluateSmartRouting()
      }
    })
  } catch {
    // Ignore if running in standard browser without native plugin
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      evaluateSmartRouting()
    })
  }
}
