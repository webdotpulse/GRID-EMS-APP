import { describe, it, expect, beforeEach } from 'vitest'
import {
  connectionState,
  setSimulationScenario,
  pairOrQueueCloudAccount,
  getLocalBaseUrl,
  getCloudPortalUrl,
} from '../src/services/connectionManager'

describe('GRID-EMS-APP Smart Local / Cloud Routing & Onboarding Engine', () => {
  beforeEach(() => {
    localStorage.clear()
    connectionState.pendingPairingJob = null
    connectionState.deferredPairingJustCompleted = false
    connectionState.tenantSlug = ''
  })

  it('routes to LOCAL_ONLINE when user is at home and flags unpaired cloud status', async () => {
    await setSimulationScenario('home_unpaired')
    expect(connectionState.isAtHome).toBe(true)
    expect(connectionState.isCloudPaired).toBe(false)
    expect(connectionState.routeMode).toBe('LOCAL_ONLINE')
    expect(getLocalBaseUrl()).toBe('http://192.168.1.48:8080')
  })

  it('routes to CLOUD_ONLINE (GRID-EMS-SERVER) automatically when user is away from home and EMS is cloud-paired', async () => {
    await setSimulationScenario('away_paired')
    expect(connectionState.isAtHome).toBe(false)
    expect(connectionState.isCloudPaired).toBe(true)
    expect(connectionState.routeMode).toBe('CLOUD_ONLINE')
    expect(getCloudPortalUrl('/client/dashboard')).toBe(
      'https://ems.newenergygrid.com/client/dashboard'
    )
  })

  it('routes to AWAY_UNPAIRED (proposes Cloud Account creation) when user is away and EMS is not connected to cloud yet', async () => {
    await setSimulationScenario('away_unpaired')
    expect(connectionState.isAtHome).toBe(false)
    expect(connectionState.isCloudPaired).toBe(false)
    expect(connectionState.routeMode).toBe('AWAY_UNPAIRED')
  })

  it('pairs local EMS immediately when user creates a cloud account while at home', async () => {
    await setSimulationScenario('home_unpaired')
    const res = await pairOrQueueCloudAccount({
      serverUrl: 'https://ems.newenergygrid.com',
      pairingToken: 'PAIR-77AA-TCG',
      serialNumber: 'TCG-EMS-83daf13d05f1adad',
      accountName: 'Jan Janssens',
      accountEmail: 'jan@example.com',
    })

    expect(res.mode).toBe('paired_local_now')
    expect(connectionState.isCloudPaired).toBe(true)
    expect(res.registerPortalUrl).toContain('pairing_token=PAIR-77AA-TCG')
  })

  it('queues Deferred Auto-Pairing when away from home and automatically pairs local EMS upon returning to home Wi-Fi', async () => {
    await setSimulationScenario('away_unpaired')

    const res = await pairOrQueueCloudAccount({
      serverUrl: 'https://ems.newenergygrid.com',
      pairingToken: 'PAIR-99BB-TCG',
      serialNumber: 'TCG-EMS-83daf13d05f1adad',
      accountName: 'Jan Janssens',
      accountEmail: 'jan@example.com',
    })

    expect(res.mode).toBe('queued_deferred_away')
    expect(connectionState.pendingPairingJob).not.toBeNull()
    expect(connectionState.pendingPairingJob?.pairingToken).toBe('PAIR-99BB-TCG')

    // Simulate user arriving back home on Wi-Fi where the previously unpaired local EMS is found
    await setSimulationScenario('home_unpaired')

    expect(connectionState.isAtHome).toBe(true)
    expect(connectionState.isCloudPaired).toBe(true)
    expect(connectionState.pendingPairingJob).toBeNull()
    expect(connectionState.deferredPairingJustCompleted).toBe(true)
  })
})
