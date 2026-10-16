<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Wifi,
  Cloud,
  CloudOff,
  ShieldAlert,
  Radar,
  Sun,
  Moon,
  ArrowLeftRight,
  Zap,
} from '@lucide/vue'
import { connectionState, evaluateSmartRouting } from '../services/connectionManager'

defineProps<{
  isDark: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleTheme'): void
  (e: 'openScanner'): void
  (e: 'openOnboarding'): void
}>()

const { locale, t } = useI18n()

const setLang = (lang: 'EN' | 'NL' | 'FR') => {
  locale.value = lang
  try {
    localStorage.setItem('gems_app_locale', lang)
  } catch {
    // ignore
  }
}

const toggleLocalCloudView = () => {
  if (connectionState.routeMode === 'LOCAL_ONLINE') {
    connectionState.manualViewOverride = 'cloud'
    connectionState.routeMode = 'CLOUD_ONLINE'
  } else if (connectionState.isAtHome) {
    connectionState.manualViewOverride = 'local'
    connectionState.routeMode = 'LOCAL_ONLINE'
  } else {
    evaluateSmartRouting()
  }
}

const modeBadge = computed(() => {
  if (connectionState.routeMode === 'LOCAL_ONLINE') {
    return {
      label: t('status.localHome'),
      detail: `${connectionState.localHost}:${connectionState.localPort} (${connectionState.localLatencyMs}ms)`,
      classes:
        'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      dotClass: 'bg-emerald-500',
      icon: Wifi,
    }
  }
  if (connectionState.routeMode === 'CLOUD_ONLINE') {
    return {
      label: t('status.cloudRemote'),
      detail: 'ems.newenergygrid.com',
      classes: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      dotClass: 'bg-blue-500',
      icon: Cloud,
    }
  }
  return {
    label: t('status.awayUnpaired'),
    detail: 'Cloud Account Needed',
    classes: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-500',
    icon: ShieldAlert,
  }
})
</script>

<template>
  <header
    class="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border px-3 sm:px-5 py-2.5 transition-colors"
  >
    <div class="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
      <!-- Brand Identity + Live Connection Pill -->
      <div class="flex items-center gap-2.5 min-w-0">
        <div
          class="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-sm shrink-0"
        >
          <Zap class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-extrabold tracking-tight text-sm sm:text-base">
              GRID<span class="text-primary">-EMS</span>
            </span>
            <span
              class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground hidden sm:inline-block"
            >
              iOS &amp; Android
            </span>
          </div>
          <!-- Smart Route Status Pill -->
          <div class="flex items-center gap-1.5 mt-0.5">
            <span
              :class="[
                'inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border',
                modeBadge.classes,
              ]"
              data-testid="connection-mode-pill"
            >
              <span :class="['h-1.5 w-1.5 rounded-full animate-pulse', modeBadge.dotClass]"></span>
              <component :is="modeBadge.icon" class="h-3 w-3 shrink-0" />
              <span>{{ modeBadge.label }}</span>
            </span>
            <span class="text-[11px] text-muted-foreground font-mono hidden md:inline truncate">
              {{ modeBadge.detail }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right Action Controls -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- Cloud Pairing Status / Action Pill when at home -->
        <button
          v-if="!connectionState.isCloudPaired"
          type="button"
          @click="emit('openOnboarding')"
          class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 transition cursor-pointer"
          data-testid="status-connect-cloud-btn"
        >
          <CloudOff class="h-3.5 w-3.5 shrink-0" />
          <span class="hidden sm:inline">{{ t('status.cloudUnpaired') }}</span>
        </button>

        <button
          v-else-if="connectionState.isAtHome"
          type="button"
          @click="toggleLocalCloudView"
          class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition cursor-pointer"
          data-testid="toggle-local-cloud-btn"
        >
          <ArrowLeftRight class="h-3.5 w-3.5 shrink-0" />
          <span>
            {{
              connectionState.routeMode === 'LOCAL_ONLINE'
                ? t('status.switchToCloud')
                : t('status.switchToLocal')
            }}
          </span>
        </button>

        <!-- Network Scanner & Scenario Switcher Button -->
        <button
          type="button"
          @click="emit('openScanner')"
          class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-muted hover:bg-accent text-foreground border border-border transition cursor-pointer"
          :title="t('status.scanNetwork')"
          data-testid="open-scanner-btn"
        >
          <Radar class="h-3.5 w-3.5 text-primary shrink-0" />
          <span class="hidden sm:inline">{{ t('status.scanNetwork') }}</span>
        </button>

        <!-- Language Selector (EN / NL / FR) -->
        <div
          class="inline-flex items-center rounded-xl bg-muted p-0.5 border border-border text-[11px] font-bold"
        >
          <button
            v-for="lang in (['EN', 'NL', 'FR'] as const)"
            :key="lang"
            type="button"
            @click="setLang(lang)"
            :class="[
              'px-1.5 py-1 rounded-lg transition cursor-pointer',
              locale === lang
                ? 'bg-card text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            ]"
          >
            {{ lang }}
          </button>
        </div>

        <!-- Theme Toggle -->
        <button
          type="button"
          @click="emit('toggleTheme')"
          class="p-2 rounded-xl bg-muted hover:bg-accent text-foreground border border-border transition cursor-pointer"
          aria-label="Toggle theme"
        >
          <Sun v-if="isDark" class="h-4 w-4 text-amber-400" />
          <Moon v-else class="h-4 w-4 text-slate-700" />
        </button>
      </div>
    </div>
  </header>
</template>
