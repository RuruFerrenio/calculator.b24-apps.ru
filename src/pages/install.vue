<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import ArrowRightLIcon from '@bitrix24/b24icons-vue/outline/ArrowRightLIcon'
import ArrowLeftLIcon from '@bitrix24/b24icons-vue/outline/ArrowLeftLIcon'
import CheckIcon from '@bitrix24/b24icons-vue/main/CheckIcon'
import LoaderClockIcon from '@bitrix24/b24icons-vue/animated/LoaderClockIcon'
import SettingsIcon from '@bitrix24/b24icons-vue/main/SettingsIcon'
import ShieldIcon from '@bitrix24/b24icons-vue/main/ShieldIcon'
import RefreshIcon from '@bitrix24/b24icons-vue/main/RefreshIcon'
import SuccessIcon from '@bitrix24/b24icons-vue/button/SuccessIcon'
import ErrorIcon from '@bitrix24/b24icons-vue/main/UnavailableIcon'
import LoadingIcon from '@bitrix24/b24icons-vue/animated/LoaderWaitIcon'

// Состояние
const currentStep = ref(1)
const totalSteps = 4
const progress = computed(() => Math.round((currentStep.value / totalSteps) * 100))

const autoFinishTimer = ref(null)
const secondsLeft = ref(5)
const isTimerActive = ref(false)

// Статус установки
const isInstalling = ref(false)
const installationComplete = ref(false)
const installedCount = ref(0)
const placementStatus = ref({
  pageBackgroundWorker: null
})
const settingsStatus = ref(null)

// Выбранные функции
const selectedFeatures = ref({
  workdayStart: true,
  workdayEnd: true
})

// Настройки по умолчанию
const configSettings = ref({
  workdayStart: {
    enabled: true,
    method: 'modal'
  },
  workdayEnd: {
    enabled: true,
    method: 'modal'
  }
})

// URL обработчиков
const HANDLERS = {
  pageBackgroundWorker: `${window.location.origin}/placements/page-background-worker`
}

// Конфигурации встроек
const PLACEMENT_CONFIGS = {
  PAGE_BACKGROUND_WORKER: {
    title: 'Фоновый счетчик',
    description: 'Подсчитывает время, проведенное пользователем на странице',
    options: {
      errorHandlerUrl: `${window.location.origin}/placements/error-handler`
    }
  }
}

// Функции для работы с Bitrix24 API
const bitrixAPI = {
  call: (method, params) => {
    return new Promise((resolve, reject) => {
      if (typeof BX24 === 'undefined' || typeof BX24.callMethod === 'undefined') {
        reject(new Error('Библиотека Bitrix24 не доступна'))
        return
      }

      BX24.callMethod(method, params, (result) => {
        if (result.error()) {
          reject(new Error(result.error().getError()))
        } else {
          resolve(result.data())
        }
      })
    })
  },

  installFinish: () => {
    return new Promise((resolve, reject) => {
      if (typeof BX24 === 'undefined') {
        reject(new Error('Библиотека Bitrix24 не доступна'))
        return
      }

      BX24.installFinish()
      resolve()
    })
  },

  setAppOption: async (key, value) => {
    try {
      const result = await bitrixAPI.call('app.option.set', {
        options: { [key]: value }
      })
      return result
    } catch (error) {
      throw error
    }
  }
}

// Менеджер встроек
const placementManager = {
  getConfig: (placementType) => {
    const config = PLACEMENT_CONFIGS[placementType]
    if (!config) {
      throw new Error(`Неизвестный тип встройки: ${placementType}`)
    }
    return config
  },

  getPlacements: () => {
    return new Promise((resolve, reject) => {
      BX24.callMethod('placement.list', {}, (result) => {
        if (result.error()) {
          reject(new Error(result.error().getError()))
        } else {
          resolve(result.data())
        }
      })
    })
  },

  unbind: async (placementType, handler) => {
    try {
      await bitrixAPI.call('placement.unbind', {
        PLACEMENT: placementType,
        HANDLER: handler
      })
      return true
    } catch (error) {
      return null
    }
  },

  bind: async (placementType, handler) => {
    try {
      const config = placementManager.getConfig(placementType)

      const placementConfig = {
        PLACEMENT: placementType,
        HANDLER: handler,
        OPTIONS: config.options
      }

      await bitrixAPI.call('placement.bind', placementConfig)
      return true
    } catch (error) {
      throw error
    }
  },

  reinstall: async (placementType, handler) => {
    try {
      const placements = await placementManager.getPlacements()

      const existingPlacement = placements.find(p =>
          p.PLACEMENT === placementType && p.HANDLER === handler
      )

      if (existingPlacement) {
        await placementManager.unbind(placementType, handler)
      }

      await placementManager.bind(placementType, handler)

      return true
    } catch (error) {
      throw error
    }
  }
}

// Сохранение настроек приложения
const saveSettings = async () => {
  settingsStatus.value = 'loading'
  try {
    const settingsToSave = {
      workday_start_enabled: selectedFeatures.value.workdayStart ? 'Y' : 'N',
      workday_start_method: configSettings.value.workdayStart.method,
      workday_end_enabled: selectedFeatures.value.workdayEnd ? 'Y' : 'N',
      workday_end_method: configSettings.value.workdayEnd.method,
      installation_completed: 'Y'
    }

    for (const [key, value] of Object.entries(settingsToSave)) {
      await bitrixAPI.setAppOption(key, value)
    }

    settingsStatus.value = 'success'
    installedCount.value++
    return true
  } catch (error) {
    settingsStatus.value = 'error'
    return false
  }
}

// Регистрация фоновой встройки
const registerPageBackgroundWorker = async () => {
  placementStatus.value.pageBackgroundWorker = 'loading'
  try {
    await placementManager.reinstall('PAGE_BACKGROUND_WORKER', HANDLERS.pageBackgroundWorker)
    placementStatus.value.pageBackgroundWorker = 'success'
    installedCount.value++
  } catch (error) {
    placementStatus.value.pageBackgroundWorker = 'error'
  }
}

// Основная функция установки
const startInstallation = async () => {
  if (currentStep.value === 2) {
    currentStep.value = 3
  }

  isInstalling.value = true
  installedCount.value = 0

  placementStatus.value = {
    pageBackgroundWorker: null
  }
  settingsStatus.value = null

  try {
    await registerPageBackgroundWorker()
    await saveSettings()
    installationComplete.value = true
  } catch (error) {
    // Ошибка при установке
  } finally {
    isInstalling.value = false
  }
}

const startAutoFinishTimer = () => {
  if (currentStep.value === 4) {
    isTimerActive.value = true
    secondsLeft.value = 5

    autoFinishTimer.value = setInterval(() => {
      secondsLeft.value -= 1

      if (secondsLeft.value <= 0) {
        clearInterval(autoFinishTimer.value)
        isTimerActive.value = false
        finishInstallation()
      }
    }, 1000)
  }
}

const cancelAutoFinish = () => {
  if (autoFinishTimer.value) {
    clearInterval(autoFinishTimer.value)
    autoFinishTimer.value = null
    isTimerActive.value = false
  }
}

const hasSelectedFeatures = computed(() => {
  return Object.values(selectedFeatures.value).some(value => value === true)
})

const installationsToProcess = computed(() => {
  return 2
})

const installationProgress = computed(() => {
  if (installationsToProcess.value === 0) return 0
  return Math.round((installedCount.value / installationsToProcess.value) * 100)
})

const nextStep = () => {
  if (currentStep.value === 2) {
    startInstallation()
  } else if (currentStep.value < totalSteps) {
    currentStep.value++
    if (currentStep.value === 4) {
      startAutoFinishTimer()
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    cancelAutoFinish()
    currentStep.value--
  }
}

const finishInstallation = async () => {
  cancelAutoFinish()
  try {
    await bitrixAPI.installFinish()
  } catch (error) {
    // Ошибка завершения установки
  }
}

onUnmounted(() => {
  if (autoFinishTimer.value) {
    clearInterval(autoFinishTimer.value)
  }
})
</script>

<template>
  <div>
    <!-- Шапка с логотипом и заголовком -->
    <div class="text-center py-8 md:py-12">
      <div class="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-2xl mb-4 md:mb-6">
        <LoaderClockIcon class="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
      </div>
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3 px-2">
        Установка системы контроля времени сотрудников
      </h1>
      <p class="text-base md:text-lg text-gray-600 mx-auto px-4">
        Настройка и активация системы мониторинга активности и рабочего времени
      </p>
    </div>

    <!-- Прогресс-бар -->
    <div class="container mx-auto px-4 py-4">
      <div class="mx-auto mb-6 md:mb-8">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs md:text-sm font-medium text-blue-600">Прогресс: {{ progress }}%</span>
          <span class="text-xs md:text-sm text-gray-500">{{ currentStep }}/{{ totalSteps }}</span>
        </div>
        <div class="h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-blue-600 transition-all duration-500 ease-out" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Шаг 1: Приветствие -->
    <B24PageSection v-if="currentStep === 1">
      <B24PageCard>
        <div class="flex flex-col md:flex-row md:items-start md:space-x-6">
          <div class="hidden md:flex md:flex-shrink-0 mb-4 md:mb-0">
            <div class="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShieldIcon class="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div class="flex-1">
            <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
              Добро пожаловать в систему контроля времени
            </h2>
            <p class="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              Настройте систему мониторинга активности сотрудников, которая поможет оптимизировать рабочее время и повысить продуктивность.
            </p>

            <div class="bg-blue-50 rounded-xl p-4 md:p-6 mb-4 md:mb-6">
              <h3 class="text-base md:text-lg font-semibold text-blue-800 mb-3">
                Ключевые возможности системы
              </h3>
              <ul class="space-y-2 md:space-y-3">
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                  <span class="text-sm md:text-base text-gray-700">Помощь в старте и завершении рабочего дня</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                  <span class="text-sm md:text-base text-gray-700">Гибкая настройка параметров системы</span>
                </li>
              </ul>
            </div>

            <div class="flex justify-end">
              <B24Button @click="nextStep" label="Начать настройку" color="primary" :icon="ArrowRightLIcon" icon-position="right" />
            </div>
          </div>
        </div>
      </B24PageCard>
    </B24PageSection>

    <!-- Шаг 2: Настройка функций -->
    <B24PageSection v-else-if="currentStep === 2">
      <B24PageCard>
        <div class="flex flex-col md:flex-row md:items-start md:space-x-6">
          <div class="hidden md:flex md:flex-shrink-0 mb-4 md:mb-0">
            <div class="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
              <SettingsIcon class="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div class="flex-1">
            <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
              Настройка основных функций системы
            </h2>
            <p class="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              Выберите, какие функции системы контроля времени вы хотите активировать и настроить.
            </p>

            <div class="space-y-4">
              <!-- Помощь в старте рабочего дня -->
              <B24PageCard>
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Помощь в старте рабочего дня</h3>
                    <p class="text-sm text-gray-500">Автоматическая помощь сотрудникам в своевременном начале рабочего дня</p>
                  </div>
                  <B24Switch v-model="selectedFeatures.workdayStart" />
                </div>
                <div v-if="selectedFeatures.workdayStart" class="mt-4 pt-4 border-t">
                  <B24RadioGroup
                      v-model="configSettings.workdayStart.method"
                      :items="[
                      { label: 'Автоматический старт', value: 'auto' },
                      { label: 'Модальное окно с предупреждением', value: 'modal' }
                    ]"
                  />
                </div>
              </B24PageCard>

              <!-- Помощь в завершении рабочего дня -->
              <B24PageCard>
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Помощь в завершении рабочего дня</h3>
                    <p class="text-sm text-gray-500">Автоматическая помощь сотрудникам в своевременном завершении рабочего дня</p>
                  </div>
                  <B24Switch v-model="selectedFeatures.workdayEnd" />
                </div>
                <div v-if="selectedFeatures.workdayEnd" class="mt-4 pt-4 border-t">
                  <B24RadioGroup
                      v-model="configSettings.workdayEnd.method"
                      :items="[
                      { label: 'Автоматическое завершение', value: 'auto' },
                      { label: 'Модальное окно с предупреждением', value: 'modal' }
                    ]"
                  />
                </div>
              </B24PageCard>
            </div>

            <div class="flex justify-between gap-3 pt-6 mt-6 border-t">
              <B24Button @click="prevStep" label="Назад" variant="outline" :icon="ArrowLeftLIcon" />
              <B24Button @click="nextStep" label="Продолжить" color="primary" :disabled="!hasSelectedFeatures" :icon="ArrowRightLIcon" icon-position="right" />
            </div>
          </div>
        </div>
      </B24PageCard>
    </B24PageSection>

    <!-- Шаг 3: Установка -->
    <B24PageSection v-else-if="currentStep === 3">
      <B24PageCard>
        <div class="flex flex-col md:flex-row md:items-start md:space-x-6">
          <div class="hidden md:flex md:flex-shrink-0 mb-4 md:mb-0">
            <div class="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
              <RefreshIcon class="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div class="flex-1">
            <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Установка системы</h2>
            <p class="text-sm md:text-base text-gray-600 mb-4 md:mb-6">Выполняется установка и настройка выбранных компонентов системы.</p>

            <div class="mb-6 md:mb-8">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs md:text-sm font-medium text-blue-600">Прогресс: {{ installationProgress }}%</span>
                <span class="text-xs md:text-sm text-gray-500">{{ installedCount }}/{{ installationsToProcess }}</span>
              </div>
              <div class="h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
                <div class="h-full bg-blue-600 transition-all duration-300 ease-out" :style="{ width: installationProgress + '%' }"></div>
              </div>
            </div>

            <div class="space-y-3 md:space-y-4 mb-6 md:mb-8">
              <div class="flex items-center">
                <div class="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                  <div v-if="placementStatus.pageBackgroundWorker === 'loading'">
                    <LoadingIcon class="animate-spin h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  </div>
                  <div v-else-if="placementStatus.pageBackgroundWorker === 'success'">
                    <SuccessIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                  </div>
                  <div v-else-if="placementStatus.pageBackgroundWorker === 'error'">
                    <ErrorIcon class="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                  </div>
                  <div v-else>
                    <div class="w-4 h-4 md:w-5 md:h-5 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
                <div class="ml-2 md:ml-3">
                  <p class="text-xs md:text-sm font-medium text-gray-900">Фоновый счетчик</p>
                  <p class="text-xs text-gray-500">Подсчитывает время, проведенное пользователем на странице</p>
                </div>
              </div>

              <div class="flex items-center">
                <div class="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                  <div v-if="settingsStatus === 'loading'">
                    <LoadingIcon class="animate-spin h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  </div>
                  <div v-else-if="settingsStatus === 'success'">
                    <SuccessIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                  </div>
                  <div v-else-if="settingsStatus === 'error'">
                    <ErrorIcon class="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                  </div>
                  <div v-else>
                    <div class="w-4 h-4 md:w-5 md:h-5 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
                <div class="ml-2 md:ml-3">
                  <p class="text-xs md:text-sm font-medium text-gray-900">Настройка параметров системы</p>
                  <p class="text-xs text-gray-500">Сохранение настроек функций</p>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-6 border-t">
              <B24Button v-if="!installationComplete" @click="prevStep" label="Назад" variant="outline" :disabled="isInstalling" :icon="ArrowLeftLIcon" />
              <B24Button v-if="installationComplete" @click="nextStep" label="Продолжить" color="primary" :icon="ArrowRightLIcon" icon-position="right" />
            </div>
          </div>
        </div>
      </B24PageCard>
    </B24PageSection>

    <!-- Шаг 4: Завершение -->
    <B24PageSection v-else-if="currentStep === 4">
      <B24PageCard>
        <div class="flex flex-col md:flex-row md:items-start md:space-x-6">
          <div class="hidden md:flex md:flex-shrink-0 mb-4 md:mb-0">
            <div class="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
              <SuccessIcon class="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div class="flex-1">
            <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Установка завершена!</h2>

            <div class="space-y-4 md:space-y-6">
              <p class="text-base md:text-lg text-gray-700">Система контроля времени сотрудников успешно установлена и настроена.</p>

              <B24PageCard variant="tinted">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Что дальше?</h3>
                <p class="text-sm text-gray-600 mb-4">Система готова к использованию. Вы можете начать мониторинг активности сотрудников прямо сейчас.</p>

                <div class="space-y-2">
                  <div v-if="selectedFeatures.workdayStart" class="flex items-start">
                    <CheckIcon class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm text-gray-700">Помощь в старте рабочего дня</span>
                  </div>
                  <div v-if="selectedFeatures.workdayEnd" class="flex items-start">
                    <CheckIcon class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm text-gray-700">Помощь в завершении рабочего дня</span>
                  </div>
                </div>

                <div class="mt-4">
                  <B24Link href="mailto:technogalera@yandex.ru?subject=Поддержка приложения Чистое время" target="_blank" is-action>
                    Техническая поддержка
                  </B24Link>
                </div>
              </B24PageCard>

              <B24PageCard variant="tinted-alt">
                <h3 class="text-base font-semibold text-gray-900 mb-2">Следующие шаги</h3>
                <ul class="space-y-2">
                  <li class="flex items-start text-gray-700">
                    <ArrowRightLIcon class="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm">Перейдите в приложение для просмотра данных мониторинга</span>
                  </li>
                  <li class="flex items-start text-gray-700">
                    <ArrowRightLIcon class="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm">Настройте дополнительные параметры в разделе "Настройки"</span>
                  </li>
                  <li class="flex items-start text-gray-700">
                    <ArrowRightLIcon class="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm">Ознакомьте сотрудников с новыми возможностями системы</span>
                  </li>
                </ul>
              </B24PageCard>

              <div class="flex justify-end gap-3 pt-6 border-t">
                <B24Button @click="finishInstallation" :label="`Завершить установку${isTimerActive ? ` (${secondsLeft}с)` : ''}`" color="primary" />
              </div>
            </div>
          </div>
        </div>
      </B24PageCard>
    </B24PageSection>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>