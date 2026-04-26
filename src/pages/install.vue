<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import ArrowRightLIcon from '@bitrix24/b24icons-vue/outline/ArrowRightLIcon'
import ArrowLeftLIcon from '@bitrix24/b24icons-vue/outline/ArrowLeftLIcon'
import CheckIcon from '@bitrix24/b24icons-vue/main/CheckIcon'
import SettingsIcon from '@bitrix24/b24icons-vue/main/SettingsIcon'
import ShieldIcon from '@bitrix24/b24icons-vue/main/ShieldIcon'
import RefreshIcon from '@bitrix24/b24icons-vue/main/RefreshIcon'
import SuccessIcon from '@bitrix24/b24icons-vue/button/SuccessIcon'
import ErrorIcon from '@bitrix24/b24icons-vue/main/UnavailableIcon'
import LoadingIcon from '@bitrix24/b24icons-vue/animated/LoaderWaitIcon'
import PowerIcon from '@bitrix24/b24icons-vue/outline/PowerIcon'

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
  pageBackgroundWorker: null,
  restAppUri: null
})
const settingsStatus = ref(null)

// Выбранные функции
const selectedFeatures = ref({
  workdayStart: true,    // Помощь в старте - по умолчанию включена
  workdayEnd: true,      // Помощь в завершении - по умолчанию включена
  weekendActivity: false // Активность в выходные - по умолчанию выключена
})

// Расширенные настройки (методы)
const configSettings = ref({
  workdayStart: {
    enabled: true,
    method: 'modal'  // По умолчанию модальное окно
  },
  workdayEnd: {
    enabled: true,
    method: 'modal'  // По умолчанию модальное окно
  },
  weekendActivity: {
    enabled: false    // По умолчанию активность в выходные выключена
  }
})

// URL обработчиков
const HANDLERS = {
  pageBackgroundWorker: `${window.location.origin}/dist/widgets/background-handler`,
  restAppUri: `${window.location.origin}/dist/`
}

// Конфигурации встроек
const PLACEMENT_CONFIGS = {
  PAGE_BACKGROUND_WORKER: {
    title: 'Фоновая встройка',
    description: 'Автоматически определяет время старта и завершения рабочего дня и оповещает об этом сотрудника',
    options: {
      errorHandlerUrl: `${window.location.origin}/dist/widgets/background-error-handler`
    }
  },
  REST_APP_URI: {
    title: 'Встройка для управления рабочим днем из уведомлений',
    description: 'Позволяет сотруднику управлять статусом рабочего дня через сообщения в чатах или push-уведомлениях',
    options: {}
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

      const placementConfig = placementType === 'PAGE_BACKGROUND_WORKER'
          ? {
            PLACEMENT: placementType,
            HANDLER: handler,
            OPTIONS: config.options
          }
          : {
            PLACEMENT: placementType,
            HANDLER: handler,
            LANG_ALL: {
              ru: {
                TITLE: config.title,
                DESCRIPTION: config.description,
                GROUP_NAME: 'Инструменты контроля времени'
              },
              en: {
                TITLE: config.title,
                DESCRIPTION: config.description,
                GROUP_NAME: 'Time control tools'
              },
              be: {
                TITLE: config.title,
                DESCRIPTION: config.description,
                GROUP_NAME: 'Інструменты кантролю часу'
              },
              kk: {
                TITLE: config.title,
                DESCRIPTION: config.description,
                GROUP_NAME: 'Уақытты бақылау құралдары'
              }
            },
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
      const placements = await bitrixAPI.getPlacements()

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

// Сохранение настроек приложения (расширенная версия с новыми параметрами)
const saveSettings = async () => {
  settingsStatus.value = 'loading'
  try {
    const settingsToSave = {
      // Настройки старта рабочего дня
      workday_start_enabled: selectedFeatures.value.workdayStart ? 'Y' : 'N',
      workday_start_method: configSettings.value.workdayStart.method,
      // Настройки завершения рабочего дня
      workday_end_enabled: selectedFeatures.value.workdayEnd ? 'Y' : 'N',
      workday_end_method: configSettings.value.workdayEnd.method,
      // Настройки активности в выходные
      weekend_activity_enabled: selectedFeatures.value.weekendActivity ? 'Y' : 'N',
      // Флаг завершения установки
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

// Регистрация встройки REST_APP_URI (Встройка для управления рабочим днем из уведомлений)
const registerRestAppUri = async () => {
  placementStatus.value.restAppUri = 'loading'
  try {
    await placementManager.reinstall('REST_APP_URI', HANDLERS.restAppUri)
    placementStatus.value.restAppUri = 'success'
    installedCount.value++
  } catch (error) {
    placementStatus.value.restAppUri = 'error'
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
    pageBackgroundWorker: null,
    restAppUri: null
  }
  settingsStatus.value = null

  try {
    await registerPageBackgroundWorker()
    await registerRestAppUri()
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
  return 3 // Две встройки + настройки
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
        <PowerIcon class="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
      </div>
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3 px-2">
        Установка приложения "Удобное начало и завершение рабочего дня"
      </h1>
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
              Добро пожаловать в систему контроля начала и завершения рабочего дня
            </h2>
            <p class="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              Настройте систему, которая поможет сотрудникам запускать и завершать рабочий день своевременно.
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
                  <span class="text-sm md:text-base text-gray-700">Гибкая настройка способов уведомлений (модальное окно, автоматический, push, чат)</span>
                </li>
              </ul>
            </div>

            <div class="flex justify-end">
              <B24Button @click="nextStep" label="Начать настройку" color="primary" :icon="ArrowRightLIcon" size="lg" icon-position="right" />
            </div>
          </div>
        </div>
      </B24PageCard>
    </B24PageSection>

    <!-- Шаг 2: Настройка функций (расширенный) -->
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
              Выберите, какие функции системы контроля начала и завершения рабочего дня вы хотите активировать и настроить.
            </p>

            <div class="space-y-6">
              <!-- Помощь в старте рабочего дня (расширенная) -->
              <B24PageCard>
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Помощь в старте рабочего дня</h3>
                    <p class="text-sm text-gray-500">Автоматическая помощь сотрудникам в своевременном начале рабочего дня</p>
                  </div>
                  <B24Switch v-model="selectedFeatures.workdayStart" />
                </div>
                <div v-if="selectedFeatures.workdayStart" class="mt-4 pt-4 border-t">
                  <p class="text-sm font-medium text-gray-700 mb-3">Способ старта рабочего дня:</p>
                  <B24RadioGroup
                      v-model="configSettings.workdayStart.method"
                      :items="[
                        { label: 'Автоматический старт', value: 'auto', description: 'Рабочий день начинается автоматически' },
                        { label: 'Модальное окно с предупреждением', value: 'modal', description: 'Показывать окно с предложением начать рабочий день' },
                        { label: 'Сообщение в чате', value: 'chat', description: 'Отправлять уведомление в чат Б24' },
                        { label: 'Push-уведомление', value: 'push', description: 'Отправлять push-уведомление' }
                      ]"
                      orientation="horizontal"
                      variant="card"
                      size="sm"
                      default-value="modal"
                      indicator="end"
                      class="overflow-scroll md:overflow-auto"
                  />
                </div>
              </B24PageCard>

              <!-- Помощь в завершении рабочего дня (расширенная) -->
              <B24PageCard>
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Помощь в завершении рабочего дня</h3>
                    <p class="text-sm text-gray-500">Автоматическая помощь сотрудникам в своевременном завершении рабочего дня</p>
                  </div>
                  <B24Switch v-model="selectedFeatures.workdayEnd" />
                </div>
                <div v-if="selectedFeatures.workdayEnd" class="mt-4 pt-4 border-t">
                  <p class="text-sm font-medium text-gray-700 mb-3">Способ завершения рабочего дня:</p>
                  <B24RadioGroup
                      v-model="configSettings.workdayEnd.method"
                      :items="[
                        { label: 'Автоматическое завершение', value: 'auto', description: 'Рабочий день завершается автоматически' },
                        { label: 'Модальное окно с предупреждением', value: 'modal', description: 'Показывать окно с предложением завершить рабочий день' },
                        { label: 'Сообщение в чате', value: 'chat', description: 'Отправлять уведомление в чат Б24' },
                        { label: 'Push-уведомление', value: 'push', description: 'Отправлять push-уведомление' }
                      ]"
                      orientation="horizontal"
                      variant="card"
                      size="sm"
                      default-value="modal"
                      indicator="end"
                      class="overflow-scroll md:overflow-auto"
                  />
                </div>
              </B24PageCard>

              <!-- Активность в выходные (новая опция) -->
              <B24PageCard>
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Активность в выходные</h3>
                    <p class="text-sm text-gray-500">Разрешить уведомления и активность в выходные дни</p>
                  </div>
                  <B24Switch v-model="selectedFeatures.weekendActivity" />
                </div>
              </B24PageCard>
            </div>

            <div class="flex justify-between gap-3 pt-6 mt-6 border-t">
              <B24Button @click="prevStep" label="Назад" variant="outline" size="lg" :icon="ArrowLeftLIcon" />
              <B24Button @click="nextStep" label="Продолжить" color="primary" size="lg" :disabled="!hasSelectedFeatures" :icon="ArrowRightLIcon" icon-position="right" />
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
              <!-- Фоновая встройка -->
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
                  <p class="text-xs md:text-sm font-medium text-gray-900">Фоновая встройка</p>
                  <p class="text-xs text-gray-500">Автоматически определяет время старта и завершения рабочего дня и оповещает об этом сотрудника</p>
                </div>
              </div>

              <!-- Встройка для управления рабочим днем из уведомлений -->
              <div class="flex items-center">
                <div class="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                  <div v-if="placementStatus.restAppUri === 'loading'">
                    <LoadingIcon class="animate-spin h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  </div>
                  <div v-else-if="placementStatus.restAppUri === 'success'">
                    <SuccessIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                  </div>
                  <div v-else-if="placementStatus.restAppUri === 'error'">
                    <ErrorIcon class="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                  </div>
                  <div v-else>
                    <div class="w-4 h-4 md:w-5 md:h-5 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
                <div class="ml-2 md:ml-3">
                  <p class="text-xs md:text-sm font-medium text-gray-900">Встройка для управления рабочим днем из уведомлений</p>
                  <p class="text-xs text-gray-500">Позволяет сотруднику управлять статусом рабочего дня через сообщения в чатах или push-уведомлениях</p>
                </div>
              </div>

              <!-- Настройка параметров системы (расширенная) -->
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
                  <p class="text-xs text-gray-500">Сохранение настроек</p>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-6 border-t">
              <B24Button v-if="!installationComplete" @click="prevStep" label="Назад"  size="lg" variant="outline" :disabled="isInstalling" :icon="ArrowLeftLIcon" />
              <B24Button v-if="installationComplete" @click="nextStep" label="Продолжить" size="lg" color="primary" :icon="ArrowRightLIcon" icon-position="right" />
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
              <p class="text-base md:text-lg text-gray-700">Система начала и завершения рабочего дня сотрудников успешно установлена и настроена.</p>

              <B24PageCard variant="tinted">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Что дальше?</h3>
                <p class="text-sm text-gray-600 mb-4">Система готова к использованию. Вы можете начать мониторинг активности сотрудников прямо сейчас.</p>

                <div class="space-y-2">
                  <div v-if="selectedFeatures.workdayStart" class="flex items-start">
                    <CheckIcon class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm text-gray-700">Помощь в старте рабочего дня (способ: {{ configSettings.workdayStart.method }})</span>
                  </div>
                  <div v-if="selectedFeatures.workdayEnd" class="flex items-start">
                    <CheckIcon class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm text-gray-700">Помощь в завершении рабочего дня (способ: {{ configSettings.workdayEnd.method }})</span>
                  </div>
                  <div v-if="selectedFeatures.weekendActivity" class="flex items-start">
                    <CheckIcon class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm text-gray-700">Активность в выходные дни (включена)</span>
                  </div>
                  <div v-else class="flex items-start">
                    <CheckIcon class="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm text-gray-500">Активность в выходные дни (выключена)</span>
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
                <B24Button @click="finishInstallation" size="lg" :label="`Завершить установку${isTimerActive ? ` (${secondsLeft}с)` : ''}`" color="primary" />
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