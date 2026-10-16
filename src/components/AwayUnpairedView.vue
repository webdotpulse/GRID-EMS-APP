<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  CloudOff,
  UserPlus,
  Wifi,
  CheckCircle2,
  LogIn,
  Radar,
  Cpu,
  KeyRound,
  ArrowRight,
  Clock,
} from '@lucide/vue'
import {
  connectionState,
  getCloudPortalUrl,
  openExternalOrNativePortal,
} from '../services/connectionManager'

const emit = defineEmits<{
  (e: 'openOnboarding'): void
  (e: 'openScanner'): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="max-w-4xl mx-auto px-3 sm:px-5 py-6 sm:py-10 space-y-6" data-testid="away-unpaired-view">
    <!-- Deferred Auto-Pairing Queued Alert (if user already created account while away) -->
    <div
      v-if="connectionState.pendingPairingJob"
      class="rounded-2xl bg-emerald-500/15 border border-emerald-500/35 p-4 sm:p-5 flex items-start gap-3.5"
      data-testid="deferred-job-active-card"
    >
      <Clock class="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span
            class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
          >
            Ready for Home Wi-Fi Handshake
          </span>
        </div>
        <h2 class="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-300">
          {{ t('banner.deferredQueuedTitle') }}
        </h2>
        <p class="text-xs sm:text-sm text-muted-foreground">
          {{ t('banner.deferredQueuedDesc') }}:
          <span class="font-mono font-bold text-foreground">{{
            connectionState.pendingPairingJob.pairingToken
          }}</span>
          ({{ connectionState.pendingPairingJob.serialNumber }}).
        </p>
      </div>
    </div>

    <!-- Main Hero Card: User is Not Home & EMS is Not Connected to Cloud Yet -->
    <div
      class="rounded-3xl bg-card border border-border shadow-xl overflow-hidden"
    >
      <div
        class="bg-gradient-to-br from-blue-600/15 via-sky-500/10 to-amber-500/10 p-6 sm:p-8 border-b border-border"
      >
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-extrabold mb-4">
          <CloudOff class="h-3.5 w-3.5" />
          <span>{{ t('away.badge') }}</span>
        </div>

        <h1 class="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
          {{ t('away.title') }}
        </h1>
        <p class="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          {{ t('away.subtitle') }}
        </p>

        <!-- Cached Hardware Identity Box -->
        <div
          class="mt-5 rounded-2xl bg-background/80 backdrop-blur-xs border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Cpu class="h-5 w-5" />
            </div>
            <div>
              <div class="text-xs text-muted-foreground font-semibold">
                EMS Hardware Serial Number
              </div>
              <div class="text-sm font-mono font-extrabold">
                {{ connectionState.serialNumber }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-amber-500/15 text-amber-500">
              <KeyRound class="h-5 w-5" />
            </div>
            <div>
              <div class="text-xs text-muted-foreground font-semibold">
                Ready Pairing Token
              </div>
              <div class="text-sm font-mono font-extrabold text-primary" data-testid="away-pairing-token">
                {{ connectionState.pairingToken }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Creation Proposal & 3-Step Workflow -->
      <div class="p-6 sm:p-8 space-y-6">
        <div>
          <h2 class="text-base sm:text-lg font-extrabold">
            {{ t('away.proposeTitle') }}
          </h2>
          <p class="text-xs sm:text-sm text-muted-foreground mt-1">
            {{ t('away.proposeDesc') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div class="rounded-2xl bg-muted/50 border border-border p-4">
            <div class="h-8 w-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-extrabold text-sm mb-2.5">
              <UserPlus class="h-4 w-4" />
            </div>
            <h3 class="text-xs sm:text-sm font-extrabold">{{ t('away.step1Title') }}</h3>
            <p class="text-xs text-muted-foreground mt-1">{{ t('away.step1Desc') }}</p>
          </div>

          <div class="rounded-2xl bg-muted/50 border border-border p-4">
            <div class="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-extrabold text-sm mb-2.5">
              <Wifi class="h-4 w-4" />
            </div>
            <h3 class="text-xs sm:text-sm font-extrabold">{{ t('away.step2Title') }}</h3>
            <p class="text-xs text-muted-foreground mt-1">{{ t('away.step2Desc') }}</p>
          </div>

          <div class="rounded-2xl bg-muted/50 border border-border p-4">
            <div class="h-8 w-8 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center font-extrabold text-sm mb-2.5">
              <CheckCircle2 class="h-4 w-4" />
            </div>
            <h3 class="text-xs sm:text-sm font-extrabold">{{ t('away.step3Title') }}</h3>
            <p class="text-xs text-muted-foreground mt-1">{{ t('away.step3Desc') }}</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button
            type="button"
            @click="emit('openOnboarding')"
            class="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-extrabold text-sm shadow-lg shadow-primary/25 transition cursor-pointer"
            data-testid="away-propose-create-account-btn"
          >
            <UserPlus class="h-4 w-4" />
            <span>{{ t('away.createAccountBtn') }}</span>
            <ArrowRight class="h-4 w-4" />
          </button>

          <button
            type="button"
            @click="openExternalOrNativePortal(getCloudPortalUrl('/login'))"
            class="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-muted hover:bg-accent text-foreground font-bold text-xs sm:text-sm border border-border transition cursor-pointer"
          >
            <LogIn class="h-4 w-4 text-primary" />
            <span>{{ t('away.alreadyHaveAccountBtn') }}</span>
          </button>
        </div>

        <div class="pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
          <span class="text-xs text-muted-foreground">
            Connected to home Wi-Fi right now? Check your local IP or mDNS:
          </span>
          <button
            type="button"
            @click="emit('openScanner')"
            class="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline cursor-pointer"
          >
            <Radar class="h-3.5 w-3.5" />
            <span>{{ t('away.atHomeRetryBtn') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
