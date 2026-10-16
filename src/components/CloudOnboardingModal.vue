<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  UserPlus,
  KeyRound,
  Cpu,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  X,
  Globe,
} from '@lucide/vue'
import {
  connectionState,
  pairOrQueueCloudAccount,
  openExternalOrNativePortal,
} from '../services/connectionManager'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const dialogRef = ref<HTMLDialogElement | null>(null)

const fullName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const pairingToken = ref(connectionState.pairingToken)
const serialNumber = ref(connectionState.serialNumber)
const serverUrl = ref(connectionState.cloudServerUrl)

const isSubmitting = ref(false)
const copied = ref(false)
const onboardingResult = ref<'paired_local_now' | 'queued_deferred_away' | null>(null)
const registerUrl = ref('')

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
      pairingToken.value = connectionState.pairingToken
      serialNumber.value = connectionState.serialNumber
      serverUrl.value = connectionState.cloudServerUrl
      onboardingResult.value = null
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }
)

const handleNativeClose = () => {
  emit('close')
}

const copyPairingToken = async () => {
  try {
    await navigator.clipboard.writeText(pairingToken.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // ignore clipboard errors
  }
}

const handleOnboardingSubmit = async () => {
  isSubmitting.value = true
  try {
    const res = await pairOrQueueCloudAccount({
      serverUrl: serverUrl.value,
      pairingToken: pairingToken.value,
      serialNumber: serialNumber.value,
      accountName: fullName.value,
      accountEmail: email.value,
    })
    onboardingResult.value = res.mode
    registerUrl.value = res.registerPortalUrl
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <dialog
    ref="dialogRef"
    closedby="any"
    aria-labelledby="cloudOnboardingDialogTitle"
    @close="handleNativeClose"
    class="w-full max-w-xl rounded-3xl bg-card text-foreground border border-border shadow-2xl p-0 m-auto overflow-hidden"
    data-testid="cloud-onboarding-dialog"
  >
    <div class="p-5 sm:p-6 border-b border-border flex items-start justify-between gap-4 bg-muted/40">
      <div class="flex items-start gap-3">
        <div
          class="h-10 w-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/20"
        >
          <UserPlus class="h-5 w-5" />
        </div>
        <div>
          <h2 id="cloudOnboardingDialogTitle" class="text-base sm:text-lg font-extrabold">
            {{ t('onboarding.modalTitle') }}
          </h2>
          <p class="text-xs text-muted-foreground mt-0.5">
            {{ t('onboarding.modalSubtitle') }}
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

    <div class="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
      <!-- Success Confirmation State -->
      <div
        v-if="onboardingResult"
        class="rounded-2xl bg-emerald-500/15 border border-emerald-500/35 p-4 space-y-3"
        data-testid="onboarding-result-box"
      >
        <div class="flex items-start gap-3">
          <CheckCircle2 class="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div class="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">
            {{
              onboardingResult === 'paired_local_now'
                ? t('onboarding.successPairedLocal')
                : t('onboarding.successQueuedAway')
            }}
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            @click="openExternalOrNativePortal(registerUrl)"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer"
            data-testid="open-cloud-register-portal-btn"
          >
            <ExternalLink class="h-4 w-4" />
            <span>{{ t('onboarding.openCloudRegisterPage') }}</span>
          </button>

          <button
            type="button"
            @click="copyPairingToken"
            class="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-card hover:bg-accent border border-border text-xs font-bold transition cursor-pointer"
          >
            <Check v-if="copied" class="h-3.5 w-3.5 text-emerald-500" />
            <Copy v-else class="h-3.5 w-3.5 text-primary" />
            <span>{{ copied ? t('onboarding.copied') : t('onboarding.copyToken') }} ({{ pairingToken }})</span>
          </button>
        </div>
      </div>

      <!-- Account & Hardware Pairing Form -->
      <form @submit.prevent="handleOnboardingSubmit" class="space-y-3.5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1">
              {{ t('onboarding.fullName') }}
            </label>
            <input
              v-model="fullName"
              type="text"
              required
              placeholder="Jan Janssens"
              class="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary"
              data-testid="onboarding-name-input"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1">
              {{ t('onboarding.email') }}
            </label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="name@example.com"
              class="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary"
              data-testid="onboarding-email-input"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1">
              {{ t('onboarding.password') }}
            </label>
            <input
              v-model="password"
              type="password"
              minlength="8"
              required
              placeholder="••••••••"
              class="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary"
              data-testid="onboarding-password-input"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-muted-foreground mb-1">
              {{ t('onboarding.passwordConfirm') }}
            </label>
            <input
              v-model="passwordConfirm"
              type="password"
              minlength="8"
              required
              placeholder="••••••••"
              class="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <!-- Hardware Pairing Token + Serial Number Box -->
        <div class="rounded-2xl bg-muted/60 border border-border p-3.5 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1">
                <KeyRound class="h-3.5 w-3.5 text-amber-500" />
                <span>{{ t('onboarding.pairingToken') }}</span>
              </label>
              <div class="flex items-center gap-1.5">
                <input
                  v-model="pairingToken"
                  type="text"
                  required
                  class="w-full px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-mono font-bold uppercase text-primary"
                  data-testid="onboarding-token-input"
                />
                <button
                  type="button"
                  @click="copyPairingToken"
                  class="px-2.5 py-1.5 rounded-xl bg-card hover:bg-accent border border-border text-xs font-bold shrink-0 cursor-pointer"
                  :title="t('onboarding.copyToken')"
                >
                  <Check v-if="copied" class="h-3.5 w-3.5 text-emerald-500" />
                  <Copy v-else class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label class="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1">
                <Cpu class="h-3.5 w-3.5 text-primary" />
                <span>{{ t('onboarding.serialNumber') }}</span>
              </label>
              <input
                v-model="serialNumber"
                type="text"
                required
                class="w-full px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-mono font-semibold"
              />
            </div>
          </div>

          <div>
            <label class="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1">
              <Globe class="h-3.5 w-3.5 text-sky-500" />
              <span>{{ t('onboarding.serverUrl') }}</span>
            </label>
            <input
              v-model="serverUrl"
              type="url"
              required
              class="w-full px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-mono"
            />
          </div>
        </div>

        <div class="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            type="button"
            @click="dialogRef?.close()"
            class="px-4 py-2.5 rounded-xl bg-muted hover:bg-accent text-xs font-bold transition cursor-pointer"
          >
            {{ t('onboarding.close') }}
          </button>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-primary/25 transition cursor-pointer disabled:opacity-50"
            data-testid="onboarding-submit-btn"
          >
            <UserPlus class="h-4 w-4" />
            <span>
              {{
                isSubmitting
                  ? t('onboarding.pairingInProgress')
                  : connectionState.isAtHome
                    ? t('onboarding.autoPairLocalNow')
                    : t('onboarding.queueDeferredPair')
              }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </dialog>
</template>
