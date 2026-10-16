<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Cloud,
  ExternalLink,
  ShieldCheck,
  Sun,
  BatteryCharging,
  Zap,
  Car,
  LogIn,
  LayoutDashboard,
  Cpu,
  Radio,
} from '@lucide/vue'
import {
  connectionState,
  getCloudPortalUrl,
  openExternalOrNativePortal,
} from '../services/connectionManager'

const { t } = useI18n()
const tenantInput = ref(connectionState.tenantSlug)
const activeCloudPath = ref<'/client/dashboard' | '/login'>('/client/dashboard')

const cloudTargetUrl = computed(() => getCloudPortalUrl(activeCloudPath.value))

const saveTenantSlug = () => {
  connectionState.tenantSlug = tenantInput.value.trim().replace(/^\/|\/$/g, '')
  try {
    localStorage.setItem('gems_app_tenant_slug', connectionState.tenantSlug)
  } catch {
    // ignore
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-3 sm:px-5 py-4 space-y-4" data-testid="cloud-server-view">
    <!-- Cloud Failover Status Hero Banner -->
    <div
      class="rounded-2xl bg-gradient-to-r from-blue-600/15 via-sky-500/10 to-indigo-500/15 border border-blue-500/30 p-4 sm:p-5"
    >
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-start gap-3.5">
          <div
            class="h-11 w-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0"
          >
            <Cloud class="h-6 w-6" />
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300"
              >
                GRID-EMS-SERVER • Cloud Mode
              </span>
              <span
                class="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400"
              >
                <Radio class="h-3 w-3 animate-pulse" />
                {{ t('cloud.remoteControlReady') }}
              </span>
            </div>
            <h1 class="text-base sm:text-lg font-extrabold mt-1">
              {{ t('cloud.title') }}
            </h1>
            <p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {{
                connectionState.isAtHome ? t('cloud.manualReason') : t('cloud.remoteReason')
              }}
            </p>
          </div>
        </div>

        <!-- Primary Native Cloud Portal Launchers -->
        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            @click="openExternalOrNativePortal(getCloudPortalUrl('/client/dashboard'))"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition cursor-pointer"
            data-testid="launch-cloud-dashboard-btn"
          >
            <LayoutDashboard class="h-4 w-4" />
            <span>{{ t('cloud.openNativePortal') }}</span>
            <ExternalLink class="h-3.5 w-3.5 opacity-80" />
          </button>

          <button
            type="button"
            @click="openExternalOrNativePortal(getCloudPortalUrl('/login'))"
            class="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-card hover:bg-accent border border-border text-xs sm:text-sm font-bold transition cursor-pointer"
          >
            <LogIn class="h-4 w-4 text-primary" />
            <span>{{ t('cloud.openLogin') }}</span>
          </button>
        </div>
      </div>

      <!-- Paired Hardware Summary Strip + Optional White-Label Tenant Selector -->
      <div
        class="mt-4 pt-3.5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
      >
        <div class="flex flex-wrap items-center gap-3">
          <span class="inline-flex items-center gap-1.5 font-bold text-foreground">
            <Cpu class="h-3.5 w-3.5 text-primary" />
            {{ t('cloud.pairedHardware') }}:
            <span class="font-mono text-primary">{{ connectionState.serialNumber }}</span>
          </span>
          <span
            class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"
          >
            <ShieldCheck class="h-3.5 w-3.5" />
            Token: <span class="font-mono">{{ connectionState.pairingToken }}</span>
          </span>
        </div>

        <div class="flex items-center gap-2">
          <label for="tenantSlugInput" class="text-muted-foreground font-semibold shrink-0">
            {{ t('cloud.tenantLabel') }}:
          </label>
          <input
            id="tenantSlugInput"
            v-model="tenantInput"
            @change="saveTenantSlug"
            type="text"
            :placeholder="t('cloud.tenantPlaceholder')"
            class="px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-mono w-40 focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </div>

    <!-- Cloud Telemetry Mirror Cards (1:1 Parity with Local GRID-EMS via SSE) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="rounded-2xl bg-card border border-border p-4 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-muted-foreground">{{ t('local.solarPv') }}</span>
          <Sun class="h-4 w-4 text-amber-500" />
        </div>
        <div class="text-xl font-extrabold mt-1.5">
          {{ (connectionState.telemetry.solarPowerW / 1000).toFixed(2) }} kW
        </div>
        <div class="text-[11px] text-muted-foreground mt-0.5">Cloud SSE Stream</div>
      </div>

      <div class="rounded-2xl bg-card border border-border p-4 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-muted-foreground">{{ t('local.battery') }}</span>
          <BatteryCharging class="h-4 w-4 text-emerald-500" />
        </div>
        <div class="text-xl font-extrabold mt-1.5">
          {{ connectionState.telemetry.batterySoc }}% ({{
            (Math.abs(connectionState.telemetry.batteryPowerW) / 1000).toFixed(2)
          }}
          kW)
        </div>
        <div class="text-[11px] text-muted-foreground mt-0.5">
          {{ connectionState.telemetry.batteryBrand }}
        </div>
      </div>

      <div class="rounded-2xl bg-card border border-border p-4 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-muted-foreground">{{ t('local.grid') }}</span>
          <Zap class="h-4 w-4 text-blue-500" />
        </div>
        <div class="text-xl font-extrabold mt-1.5">
          {{ (Math.abs(connectionState.telemetry.gridPowerW) / 1000).toFixed(2) }} kW
        </div>
        <div class="text-[11px] text-emerald-500 font-semibold mt-0.5">
          {{
            connectionState.telemetry.gridPowerW < 0
              ? t('local.exporting')
              : t('local.importing')
          }}
        </div>
      </div>

      <div class="rounded-2xl bg-card border border-border p-4 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-muted-foreground">{{ t('local.evCharger') }}</span>
          <Car class="h-4 w-4 text-sky-500" />
        </div>
        <div class="text-xl font-extrabold mt-1.5">
          {{ (connectionState.telemetry.evPowerW / 1000).toFixed(2) }} kW ({{
            connectionState.telemetry.evMode
          }})
        </div>
        <div class="text-[11px] text-muted-foreground mt-0.5">
          {{ connectionState.telemetry.evChargerName }}
        </div>
      </div>
    </div>

    <!-- Embedded Cloud Portal Container -->
    <div
      class="rounded-2xl bg-card border border-border overflow-hidden shadow-sm flex flex-col"
      style="height: calc(100vh - 340px); min-height: 440px"
    >
      <div
        class="bg-muted/60 px-4 py-2.5 border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs"
      >
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="activeCloudPath = '/client/dashboard'"
            :class="[
              'px-2.5 py-1 rounded-lg font-bold transition cursor-pointer',
              activeCloudPath === '/client/dashboard'
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground',
            ]"
          >
            {{ t('cloud.openDashboard') }}
          </button>
          <button
            type="button"
            @click="activeCloudPath = '/login'"
            :class="[
              'px-2.5 py-1 rounded-lg font-bold transition cursor-pointer',
              activeCloudPath === '/login'
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground',
            ]"
          >
            {{ t('cloud.openLogin') }}
          </button>
          <span class="font-mono text-muted-foreground hidden sm:inline ml-2">
            {{ cloudTargetUrl }}
          </span>
        </div>

        <button
          type="button"
          @click="openExternalOrNativePortal(cloudTargetUrl)"
          class="text-primary font-bold hover:underline cursor-pointer"
        >
          {{ t('cloud.openNativePortal') }} ↗
        </button>
      </div>

      <iframe
        :src="cloudTargetUrl"
        title="GRID-EMS-SERVER Cloud Portal"
        class="w-full flex-1 border-0 bg-background"
      ></iframe>
    </div>
  </div>
</template>
