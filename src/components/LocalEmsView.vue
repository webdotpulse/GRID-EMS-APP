<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Sun,
  BatteryCharging,
  Zap,
  Car,
  Home,
  CloudUpload,
  CheckCircle2,
  ExternalLink,
  LayoutDashboard,
  Monitor,
  ShieldCheck,
  Sparkles,
} from '@lucide/vue'
import {
  connectionState,
  getLocalBaseUrl,
  openExternalOrNativePortal,
} from '../services/connectionManager'

const emit = defineEmits<{
  (e: 'openOnboarding'): void
}>()

const { t } = useI18n()
const activeSubTab = ref<'companion' | 'embedded'>('companion')

const localPortalUrl = computed(() => getLocalBaseUrl())

const setEvMode = (mode: 'ECO' | 'SOLAR' | 'FAST' | 'OFF') => {
  connectionState.telemetry.evMode = mode
  if (mode === 'FAST') {
    connectionState.telemetry.evPowerW = 7360
  } else if (mode === 'SOLAR') {
    connectionState.telemetry.evPowerW = 2800
  } else if (mode === 'ECO') {
    connectionState.telemetry.evPowerW = 1420
  } else {
    connectionState.telemetry.evPowerW = 0
  }
}

const setBatteryMode = (
  mode: 'auto' | 'self_consumption' | 'dynamic_arbitrage' | 'peak_shaving'
) => {
  connectionState.telemetry.batteryMode = mode
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-3 sm:px-5 py-4 space-y-4">
    <!-- Deferred Auto-Pairing Completed Celebration Banner -->
    <div
      v-if="connectionState.deferredPairingJustCompleted"
      class="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-4 flex items-start justify-between gap-3"
      data-testid="deferred-pairing-success-banner"
    >
      <div class="flex items-start gap-3">
        <CheckCircle2 class="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <h3 class="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
            {{ t('banner.deferredSuccessTitle') }}
          </h3>
          <p class="text-xs text-muted-foreground mt-0.5">
            Your local <span class="font-mono font-semibold">{{ connectionState.serialNumber }}</span> unit was automatically paired with
            <span class="font-mono font-semibold">ems.newenergygrid.com</span> upon connecting to your home Wi-Fi.
          </p>
        </div>
      </div>
      <button
        type="button"
        @click="connectionState.deferredPairingJustCompleted = false"
        class="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
      >
        ✕
      </button>
    </div>

    <!-- Cloud Onboarding Proposal Banner (When Local EMS is NOT connected to Cloud yet) -->
    <div
      v-if="!connectionState.isCloudPaired"
      class="rounded-2xl bg-gradient-to-r from-amber-500/15 via-blue-600/10 to-sky-500/15 border border-amber-500/35 p-4 sm:p-5 shadow-sm"
      data-testid="local-unpaired-cloud-banner"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-start gap-3.5">
          <div
            class="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5"
          >
            <CloudUpload class="h-5 w-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span
                class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300"
              >
                Cloud Backup &amp; Remote Control
              </span>
            </div>
            <h2 class="text-sm sm:text-base font-extrabold mt-1">
              {{ t('banner.unpairedTitle') }}
            </h2>
            <p class="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
              {{ t('banner.unpairedDesc') }}
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('openOnboarding')"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition shrink-0 cursor-pointer"
          data-testid="banner-create-cloud-account-btn"
        >
          <Sparkles class="h-4 w-4" />
          <span>{{ t('banner.createAccountCta') }}</span>
        </button>
      </div>
    </div>

    <!-- Sub-view Switcher: Mobile Quick Dashboard vs Embedded Local Web UI -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="inline-flex rounded-xl bg-card border border-border p-1">
        <button
          type="button"
          @click="activeSubTab = 'companion'"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
            activeSubTab === 'companion'
              ? 'bg-primary text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          ]"
        >
          <LayoutDashboard class="h-3.5 w-3.5" />
          <span>{{ t('local.companionView') }}</span>
        </button>
        <button
          type="button"
          @click="activeSubTab = 'embedded'"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
            activeSubTab === 'embedded'
              ? 'bg-primary text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          data-testid="switch-embedded-local-tab"
        >
          <Monitor class="h-3.5 w-3.5" />
          <span>{{ t('local.embeddedView') }}</span>
        </button>
      </div>

      <div class="flex items-center gap-2">
        <span
          v-if="connectionState.isCloudPaired"
          class="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
        >
          <ShieldCheck class="h-3.5 w-3.5" />
          <span>{{ t('status.cloudSynced') }} ({{ connectionState.serialNumber }})</span>
        </span>

        <button
          type="button"
          @click="openExternalOrNativePortal(localPortalUrl)"
          class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-card hover:bg-accent border border-border transition cursor-pointer"
        >
          <ExternalLink class="h-3.5 w-3.5 text-primary" />
          <span>{{ t('local.openFullBrowser') }}</span>
        </button>
      </div>
    </div>

    <!-- TAB 1: Native Mobile Quick Dashboard -->
    <div v-if="activeSubTab === 'companion'" class="space-y-4">
      <!-- Real-Time Energy Flow Metric Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Solar PV -->
        <div class="rounded-2xl bg-card border border-border p-4 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-muted-foreground">{{ t('local.solarPv') }}</span>
            <div class="p-2 rounded-xl bg-amber-500/15 text-amber-500">
              <Sun class="h-4 w-4" />
            </div>
          </div>
          <div class="text-2xl font-extrabold mt-2">
            {{ (connectionState.telemetry.solarPowerW / 1000).toFixed(2) }}
            <span class="text-xs font-bold text-muted-foreground">kW</span>
          </div>
          <div class="text-[11px] text-emerald-500 font-semibold mt-1">
            Solis Hybrid PV Active
          </div>
        </div>

        <!-- Solis Battery Storage -->
        <div class="rounded-2xl bg-card border border-border p-4 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-muted-foreground">{{ t('local.battery') }}</span>
            <div class="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
              <BatteryCharging class="h-4 w-4" />
            </div>
          </div>
          <div class="flex items-baseline gap-2 mt-2">
            <span class="text-2xl font-extrabold">{{ connectionState.telemetry.batterySoc }}%</span>
            <span class="text-xs font-semibold text-emerald-500">
              {{ (Math.abs(connectionState.telemetry.batteryPowerW) / 1000).toFixed(2) }} kW
            </span>
          </div>
          <div class="text-[11px] text-muted-foreground font-semibold mt-1">
            {{
              connectionState.telemetry.batteryPowerW < 0
                ? t('local.charging')
                : t('local.discharging')
            }}
            • {{ connectionState.telemetry.batteryBrand }}
          </div>
        </div>

        <!-- Digital Grid Meter -->
        <div class="rounded-2xl bg-card border border-border p-4 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-muted-foreground">{{ t('local.grid') }}</span>
            <div class="p-2 rounded-xl bg-blue-500/15 text-blue-500">
              <Zap class="h-4 w-4" />
            </div>
          </div>
          <div class="text-2xl font-extrabold mt-2">
            {{ (Math.abs(connectionState.telemetry.gridPowerW) / 1000).toFixed(2) }}
            <span class="text-xs font-bold text-muted-foreground">kW</span>
          </div>
          <div
            :class="[
              'text-[11px] font-semibold mt-1',
              connectionState.telemetry.gridPowerW < 0 ? 'text-emerald-500' : 'text-amber-500',
            ]"
          >
            {{
              connectionState.telemetry.gridPowerW < 0
                ? t('local.exporting')
                : t('local.importing')
            }}
            ({{ connectionState.telemetry.voltageV }}V)
          </div>
        </div>

        <!-- Raedian EV Wallbox -->
        <div class="rounded-2xl bg-card border border-border p-4 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-muted-foreground">{{ t('local.evCharger') }}</span>
            <div class="p-2 rounded-xl bg-sky-500/15 text-sky-500">
              <Car class="h-4 w-4" />
            </div>
          </div>
          <div class="text-2xl font-extrabold mt-2">
            {{ (connectionState.telemetry.evPowerW / 1000).toFixed(2) }}
            <span class="text-xs font-bold text-muted-foreground">kW</span>
          </div>
          <div class="text-[11px] text-muted-foreground font-semibold mt-1">
            {{ connectionState.telemetry.evChargerName }} • {{ connectionState.telemetry.evMode }}
          </div>
        </div>
      </div>

      <!-- Interactive Local Hardware Controls (Raedian EV Mode + Solis Battery Strategy) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Raedian EV Charging Mode Control -->
        <div class="rounded-2xl bg-card border border-border p-4 sm:p-5">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-sm font-extrabold">{{ t('local.chargingMode') }}</h3>
              <p class="text-xs text-muted-foreground">
                {{ connectionState.telemetry.evChargerName }} (Local LAN Direct Control)
              </p>
            </div>
            <span
              class="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary"
            >
              {{ connectionState.telemetry.evMode }}
            </span>
          </div>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="mode in (['ECO', 'SOLAR', 'FAST', 'OFF'] as const)"
              :key="mode"
              type="button"
              @click="setEvMode(mode)"
              :class="[
                'py-2 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer',
                connectionState.telemetry.evMode === mode
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-muted/60 hover:bg-accent text-foreground border-border',
              ]"
            >
              {{ mode }}
            </button>
          </div>
        </div>

        <!-- Solis Battery Optimization Mode Control -->
        <div class="rounded-2xl bg-card border border-border p-4 sm:p-5">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-sm font-extrabold">{{ t('local.batteryStrategy') }}</h3>
              <p class="text-xs text-muted-foreground">
                {{ connectionState.telemetry.batteryBrand }} • {{ t('local.peakMonitor') }}:
                {{ connectionState.telemetry.monthlyPeakKw }} /
                {{ connectionState.telemetry.capacityCeilingKw }} kW
              </p>
            </div>
            <Home class="h-4 w-4 text-muted-foreground" />
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="item in ([
                { id: 'auto', label: 'Auto AI' },
                { id: 'self_consumption', label: 'Self-Use' },
                { id: 'dynamic_arbitrage', label: 'EPEX Spot' },
                { id: 'peak_shaving', label: 'Peak Shave' },
              ] as const)"
              :key="item.id"
              type="button"
              @click="setBatteryMode(item.id)"
              :class="[
                'py-2 px-2.5 rounded-xl text-xs font-extrabold border transition cursor-pointer truncate',
                connectionState.telemetry.batteryMode === item.id
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-muted/60 hover:bg-accent text-foreground border-border',
              ]"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: Embedded Local GRID-EMS WebView -->
    <div
      v-else
      class="rounded-2xl bg-card border border-border overflow-hidden shadow-sm flex flex-col"
      style="height: calc(100vh - 210px); min-height: 480px"
    >
      <div
        class="bg-muted/60 px-4 py-2 border-b border-border flex items-center justify-between text-xs"
      >
        <div class="flex items-center gap-2 font-mono">
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>{{ localPortalUrl }}</span>
        </div>
        <button
          type="button"
          @click="openExternalOrNativePortal(localPortalUrl)"
          class="text-primary font-bold hover:underline cursor-pointer"
        >
          {{ t('local.openFullBrowser') }} ↗
        </button>
      </div>
      <iframe
        :src="localPortalUrl"
        title="Local GRID-EMS Portal"
        class="w-full flex-1 border-0 bg-background"
      ></iframe>
    </div>
  </div>
</template>
