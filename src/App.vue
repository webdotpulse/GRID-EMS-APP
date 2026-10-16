<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Radar, Wifi, Cloud, UserPlus } from '@lucide/vue'
import MobileStatusBar from './components/MobileStatusBar.vue'
import LocalEmsView from './components/LocalEmsView.vue'
import CloudServerView from './components/CloudServerView.vue'
import AwayUnpairedView from './components/AwayUnpairedView.vue'
import CloudOnboardingModal from './components/CloudOnboardingModal.vue'
import NetworkScannerModal from './components/NetworkScannerModal.vue'
import {
  connectionState,
  evaluateSmartRouting,
  initNetworkLifecycleListeners,
  setSimulationScenario,
} from './services/connectionManager'

const { t } = useI18n()
const isDark = ref(true)
const isScannerOpen = ref(false)
const isOnboardingOpen = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

onMounted(async () => {
  document.documentElement.classList.toggle('dark', isDark.value)
  initNetworkLifecycleListeners()

  // Allow URL query override for testing: ?scenario=home_unpaired | home_paired | away_paired | away_unpaired
  const params = new URLSearchParams(window.location.search)
  const scenarioParam = params.get('scenario')
  if (
    scenarioParam === 'home_unpaired' ||
    scenarioParam === 'home_paired' ||
    scenarioParam === 'away_paired' ||
    scenarioParam === 'away_unpaired' ||
    scenarioParam === 'auto'
  ) {
    await setSimulationScenario(scenarioParam)
  } else {
    await evaluateSmartRouting()
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground pb-16">
    <!-- Native-Style Smart Top Status Bar -->
    <MobileStatusBar
      :is-dark="isDark"
      @toggle-theme="toggleTheme"
      @open-scanner="isScannerOpen = true"
      @open-onboarding="isOnboardingOpen = true"
    />

    <!-- Main Smart Router Viewport -->
    <main class="flex-1">
      <!-- State 0: Probing Local Network -->
      <div
        v-if="connectionState.routeMode === 'PROBING'"
        class="max-w-lg mx-auto px-4 py-20 text-center space-y-4"
        data-testid="probing-view"
      >
        <div
          class="h-14 w-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto animate-pulse"
        >
          <Radar class="h-7 w-7 animate-spin" />
        </div>
        <h1 class="text-lg font-extrabold">{{ t('app.probing') }}</h1>
        <p class="text-xs sm:text-sm text-muted-foreground">
          {{ t('app.probingSub') }}
        </p>
      </div>

      <!-- State 1: User is AT HOME (Local GRID-EMS Connected) -->
      <LocalEmsView
        v-else-if="connectionState.routeMode === 'LOCAL_ONLINE'"
        @open-onboarding="isOnboardingOpen = true"
      />

      <!-- State 2: User is AWAY FROM HOME & EMS is Cloud-Paired (Open GRID-EMS-SERVER) -->
      <CloudServerView v-else-if="connectionState.routeMode === 'CLOUD_ONLINE'" />

      <!-- State 3: User is AWAY FROM HOME & EMS is NOT Cloud-Paired (Propose Account + Deferred Auto-Pair) -->
      <AwayUnpairedView
        v-else
        @open-onboarding="isOnboardingOpen = true"
        @open-scanner="isScannerOpen = true"
      />
    </main>

    <!-- Bottom Mobile Quick-State Bar (Simulates Home Wi-Fi vs Away Cellular transitions) -->
    <nav
      class="fixed bottom-0 left-0 right-0 z-20 bg-card/95 backdrop-blur-md border-t border-border px-2 py-1.5"
      aria-label="Connection State Switcher"
    >
      <div class="max-w-4xl mx-auto grid grid-cols-4 gap-1.5">
        <button
          type="button"
          @click="setSimulationScenario('home_unpaired')"
          :class="[
            'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer truncate',
            connectionState.isAtHome && !connectionState.isCloudPaired
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          ]"
          data-testid="nav-sim-home-unpaired"
        >
          <Wifi class="h-3.5 w-3.5 shrink-0" />
          <span class="truncate">Home (Unpaired)</span>
        </button>

        <button
          type="button"
          @click="setSimulationScenario('home_paired')"
          :class="[
            'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer truncate',
            connectionState.isAtHome && connectionState.isCloudPaired
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          ]"
          data-testid="nav-sim-home-paired"
        >
          <Wifi class="h-3.5 w-3.5 shrink-0" />
          <span class="truncate">Home (Paired)</span>
        </button>

        <button
          type="button"
          @click="setSimulationScenario('away_paired')"
          :class="[
            'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer truncate',
            !connectionState.isAtHome && connectionState.isCloudPaired
              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          ]"
          data-testid="nav-sim-away-paired"
        >
          <Cloud class="h-3.5 w-3.5 shrink-0" />
          <span class="truncate">Away (Cloud)</span>
        </button>

        <button
          type="button"
          @click="setSimulationScenario('away_unpaired')"
          :class="[
            'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer truncate',
            !connectionState.isAtHome && !connectionState.isCloudPaired
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          ]"
          data-testid="nav-sim-away-unpaired"
        >
          <UserPlus class="h-3.5 w-3.5 shrink-0" />
          <span class="truncate">Away (No Account)</span>
        </button>
      </div>
    </nav>

    <!-- Native Modal Dialogs (with closedby="any" light-dismiss and platform controls) -->
    <CloudOnboardingModal :open="isOnboardingOpen" @close="isOnboardingOpen = false" />
    <NetworkScannerModal :open="isScannerOpen" @close="isScannerOpen = false" />
  </div>
</template>
