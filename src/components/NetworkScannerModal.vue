<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Radar,
  Wifi,
  CheckCircle2,
  X,
  Sliders,
  RefreshCw,
  Server,
} from '@lucide/vue'
import {
  connectionState,
  scanLocalSubnet,
  probeSingleLocalHost,
  evaluateSmartRouting,
  setSimulationScenario,
} from '../services/connectionManager'
import type { SimulationScenario } from '../types'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const dialogRef = ref<HTMLDialogElement | null>(null)

const manualHost = ref(connectionState.localHost)
const manualPort = ref(connectionState.localPort)
const manualTestFeedback = ref('')

// Apply modern-web-guidance light-dismiss-a-dialog fallback for browsers without closedBy support (e.g. Safari/iOS WebView)
onMounted(() => {
  const dialog = dialogRef.value
  if (!dialog) return

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (event: MouseEvent) => {
      if (event.target !== dialog) return
      const rect = dialog.getBoundingClientRect()
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      if (isDialogContent) return
      dialog.close()
    })
  }
})

watch(
  () => props.open,
  (isOpen) => {
    const dialog = dialogRef.value
    if (!dialog) return
    if (isOpen && !dialog.open) {
      manualHost.value = connectionState.localHost
      manualPort.value = connectionState.localPort
      manualTestFeedback.value = ''
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }
)

const handleSaveManualEndpoint = async () => {
  connectionState.localHost = manualHost.value.trim() || 'gems.local'
  connectionState.localPort = Number(manualPort.value) || 8080
  try {
    localStorage.setItem('gems_app_local_host', connectionState.localHost)
    localStorage.setItem('gems_app_local_port', String(connectionState.localPort))
  } catch {
    // ignore
  }

  const found = await probeSingleLocalHost(
    connectionState.localHost,
    connectionState.localPort,
    'manual',
    1800
  )
  if (found) {
    manualTestFeedback.value = `Connected to ${found.hostname} (${found.latencyMs}ms)`
    await evaluateSmartRouting()
  } else {
    manualTestFeedback.value = `Saved ${connectionState.localHost}:${connectionState.localPort} (currently unreachable on LAN; using fallback rules)`
    await evaluateSmartRouting()
  }
}

const selectScenario = async (scenario: SimulationScenario) => {
  await setSimulationScenario(scenario)
}
</script>

<template>
  <dialog
    ref="dialogRef"
    closedby="any"
    aria-labelledby="networkScannerDialogTitle"
    @close="emit('close')"
    class="w-full max-w-xl rounded-3xl bg-card text-foreground border border-border shadow-2xl p-0 m-auto overflow-hidden"
    data-testid="network-scanner-dialog"
  >
    <div class="p-5 sm:p-6 border-b border-border flex items-start justify-between gap-4 bg-muted/40">
      <div class="flex items-start gap-3">
        <div
          class="h-10 w-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/20"
        >
          <Radar class="h-5 w-5" />
        </div>
        <div>
          <h2 id="networkScannerDialogTitle" class="text-base sm:text-lg font-extrabold">
            {{ t('scanner.title') }}
          </h2>
          <p class="text-xs text-muted-foreground mt-0.5">
            {{ t('scanner.subtitle') }}
          </p>
        </div>
      </div>

      <button
        type="button"
        @click="dialogRef?.close()"
        class="p-2 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
        :aria-label="t('onboarding.close')"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <div class="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
      <!-- Connection Scenario Simulator (For instant verification of all 4 Home/Away & Paired/Unpaired states) -->
      <div class="rounded-2xl bg-muted/50 border border-border p-4 space-y-2.5">
        <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-primary">
          <Sliders class="h-3.5 w-3.5" />
          <span>{{ t('scanner.simulationTitle') }}</span>
        </div>

        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="item in ([
              { id: 'auto', label: t('scanner.simAuto') },
              { id: 'home_unpaired', label: t('scanner.simHomeUnpaired') },
              { id: 'home_paired', label: t('scanner.simHomePaired') },
              { id: 'away_paired', label: t('scanner.simAwayPaired') },
              { id: 'away_unpaired', label: t('scanner.simAwayUnpaired') },
            ] as const)"
            :key="item.id"
            type="button"
            @click="selectScenario(item.id)"
            :class="[
              'w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-between transition cursor-pointer',
              connectionState.simulationScenario === item.id
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-card hover:bg-accent text-foreground border-border',
            ]"
            :data-testid="`sim-mode-${item.id}`"
          >
            <span>{{ item.label }}</span>
            <CheckCircle2 v-if="connectionState.simulationScenario === item.id" class="h-4 w-4 shrink-0" />
          </button>
        </div>
      </div>

      <!-- Manual Local IP / Hostname Configuration -->
      <form @submit.prevent="handleSaveManualEndpoint" class="space-y-3">
        <h3 class="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          {{ t('scanner.manualTitle') }}
        </h3>
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            v-model="manualHost"
            type="text"
            :placeholder="t('scanner.hostPlaceholder')"
            class="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm font-mono"
          />
          <input
            v-model="manualPort"
            type="number"
            :placeholder="t('scanner.portPlaceholder')"
            class="w-24 px-3 py-2 rounded-xl bg-background border border-border text-sm font-mono"
          />
          <button
            type="submit"
            class="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-extrabold transition cursor-pointer shrink-0"
          >
            {{ t('scanner.saveAndConnect') }}
          </button>
        </div>
        <p v-if="manualTestFeedback" class="text-xs text-primary font-semibold">
          {{ manualTestFeedback }}
        </p>
      </form>

      <!-- Active mDNS + LAN Subnet Discovery -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            {{ t('scanner.discoveredTitle') }}
          </h3>
          <button
            type="button"
            :disabled="connectionState.isScanningSubnet"
            @click="scanLocalSubnet()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw :class="['h-3.5 w-3.5', connectionState.isScanningSubnet ? 'animate-spin' : '']" />
            <span>
              {{ connectionState.isScanningSubnet ? t('scanner.scanning') : t('scanner.scanNow') }}
            </span>
          </button>
        </div>

        <div v-if="connectionState.discoveredEndpoints.length === 0" class="rounded-2xl bg-muted/40 border border-border p-4 text-xs text-muted-foreground text-center">
          No local GRID-EMS endpoints cached yet. Tap "{{ t('scanner.scanNow') }}" when connected to your home Wi-Fi.
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="ep in connectionState.discoveredEndpoints"
            :key="ep.url"
            class="rounded-2xl bg-background border border-border p-3.5 flex items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                <Server class="h-4 w-4" />
              </div>
              <div class="min-w-0">
                <div class="text-xs font-extrabold flex items-center gap-2">
                  <span>{{ ep.hostname }}</span>
                  <span class="font-mono text-[11px] text-primary">{{ ep.host }}:{{ ep.port }}</span>
                </div>
                <div class="text-[11px] text-muted-foreground font-mono truncate">
                  SN: {{ ep.serialNumber }} • {{ ep.build }} • {{ ep.latencyMs }}ms
                </div>
              </div>
            </div>

            <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 shrink-0">
              <Wifi class="h-3 w-3" />
              LAN
            </span>
          </div>
        </div>
      </div>
    </div>
  </dialog>
</template>
