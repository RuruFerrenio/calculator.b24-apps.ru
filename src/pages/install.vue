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

const autoFinishTimer = ref<any>(null)
const secondsLeft = ref(5)
const isTimerActive = ref(false)

// Статус установки
const isInstalling = ref(false)
const installationComplete = ref(false)
const installedCount = ref(0)
const placementStatus = ref({
  pageBackgroundWorker: null as string | null,
  restAppUri: null as string | null
})
const settingsStatus = ref(null as string | null)

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
    title: 'Фоновый счетчик',
    description: 'Подсчитывает время, проведенное пользователем на странице',
    options: {
      errorHandlerUrl: `${window.location.origin}/dist/widgets/background-error-handler`
    }
  },
  REST_APP_URI: {
    title: 'Форма для отчета',
    description: 'Позволяет сотруднику заполнять запрошенные отчеты',
    options: {}
  }
}

// Типы для Bitrix24 API (для TypeScript)
interface BX24CallMethod {
  (method: string, params: any, callback: (result: BX24Result) => void): void
}

interface BX24Result {
  error: () => { getError: () => string } | null
  data: () => any
}

interface BX24Init {
  (callback: () => void): void
}

interface BX24Global {
  callMethod?: BX24CallMethod
  init?: BX24Init
}

declare global {
  interface Window {
    BX24?: BX24Global
  }
}

// Функции для работы с Bitrix24 API
const bitrixAPI = {
  call: (method: string, params: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (typeof window.BX24 === 'undefined' || typeof window.BX24.callMethod === 'undefined') {
        reject(new Error('Библиотека Bitrix24 не доступна'))
        return
      }

      window.BX24.callMethod(method, params, (result: BX24Result) => {
        if (result.error()) {
          reject(new Error(result.error()?.getError() || 'Неизвестная ошибка'))
        } else {
          resolve(result.data())
        }
      })
    })
  },

  installFinish: () => {
    return new Promise((resolve, reject) => {
      if (typeof window.BX24 === 'undefined') {
        reject(new Error('Библиотека Bitrix24 не доступна'))
        return
      }
      window.BX24.installFinish()
      resolve(true)
    })
  },

  setAppOption: async (key: string, value: string): Promise<any> => {
    try {
      const result = await bitrixAPI.call('app.option.set', {
        options: { [key]: value }
      })
      return result
    } catch (error) {
      throw error
    }
  },

  getPlacements: async (): Promise<any[]> => {
    try {
      const result = await bitrixAPI.call('placement.get', {})
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Ошибка при получении списка встроек:', error)
      return []
    }
  }
}

// Менеджер встроек (исправленная версия, аналогичная первому компоненту)
const placementManager = {
  getConfig: (placementType: string): any => {
    const config = PLACEMENT_CONFIGS[placementType as keyof typeof PLACEMENT_CONFIGS]
    if (!config) {
      throw new Error(`Неизвестный тип встройки: ${placementType}`)
    }
    return config
  },

  checkStatus: async (placementType: string, handler: string): Promise<boolean> => {
    try {
      const placements = await bitrixAPI.getPlacements()

      if (!Array.isArray(placements)) {
        console.warn('Получен некорректный формат данных встроек:', placements)
        return false
      }

      // Обратите внимание: в placement.get поля приходят с маленькой буквы
      const placement = placements.find((p: any) =>
          p.placement === placementType &&
          p.handler === handler
      )

      return !!placement
    } catch (error) {
      console.error(`Ошибка при проверке статуса встройки ${placementType}:`, error)
      return false
    }
  },

  unbind: async (placementType: string, handler: string): Promise<any> => {
    try {
      const result = await bitrixAPI.call('placement.unbind', {
        PLACEMENT: placementType,
        HANDLER: handler
      })
      return result
    } catch (error) {
      console.error(`Ошибка удаления встройки ${placementType}:`, error)
      // Игнорируем ошибку, если встройка не существует
      return null
    }
  },

  bind: async (placementType: string, handler: string): Promise<boolean> => {
    try {
      const config = placementManager.getConfig(placementType)

      // Формируем конфигурацию для регистрации (аналогично первому компоненту)
      let placementConfig: any

      if (placementType === 'PAGE_BACKGROUND_WORKER') {
        // Для PAGE_BACKGROUND_WORKER используем минимальную конфигурацию
        placementConfig = {
          PLACEMENT: placementType,
          HANDLER: handler,
          OPTIONS: config.options
        }
      } else {
        // Для REST_APP_URI используем полную конфигурацию с LANG_ALL
        placementConfig = {
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
      }

      await bitrixAPI.call('placement.bind', placementConfig)
      return true
    } catch (error) {
      console.error(`Ошибка регистрации встройки ${placementType}:`, error)
      throw error
    }
  },

  // Функция переустановки встройки (аналогичная registerAllPlacements из первого компонента)
  reinstall: async (placementType: string, handler: string): Promise<boolean> => {
    try {
      // Проверяем существование встройки
      const exists = await placementManager.checkStatus(placementType, handler)

      // Если существует, удаляем
      if (exists) {
        await placementManager.unbind(placementType, handler)
      }

      // Регистрируем новую встройку
      await placementManager.bind(placementType, handler)

      return true
    } catch (error) {
      console.error(`Ошибка при переустановке встройки ${placementType}:`, error)
      throw error
    }
  }
}

// Сохранение настроек приложения (расширенная версия с новыми параметрами)
const saveSettings = async (): Promise<boolean> => {
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
    console.error('Ошибка при сохранении настроек:', error)
    settingsStatus.value = 'error'
    return false
  }
}

// Регистрация фоновой встройки
const registerPageBackgroundWorker = async (): Promise<void> => {
  placementStatus.value.pageBackgroundWorker = 'loading'
  try {
    await placementManager.reinstall('PAGE_BACKGROUND_WORKER', HANDLERS.pageBackgroundWorker)
    placementStatus.value.pageBackgroundWorker = 'success'
    installedCount.value++
  } catch (error) {
    console.error('Ошибка при регистрации фонового счетчика:', error)
    placementStatus.value.pageBackgroundWorker = 'error'
  }
}

// Регистрация встройки REST_APP_URI (Форма для отчета)
const registerRestAppUri = async (): Promise<void> => {
  placementStatus.value.restAppUri = 'loading'
  try {
    await placementManager.reinstall('REST_APP_URI', HANDLERS.restAppUri)
    placementStatus.value.restAppUri = 'success'
    installedCount.value++
  } catch (error) {
    console.error('Ошибка при регистрации формы для отчета:', error)
    placementStatus.value.restAppUri = 'error'
  }
}

// Основная функция установки
const startInstallation = async (): Promise<void> => {
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
    console.error('Ошибка при установке:', error)
  } finally {
    isInstalling.value = false
  }
}

const startAutoFinishTimer = (): void => {
  if (currentStep.value === 4) {
    isTimerActive.value = true
    secondsLeft.value = 5

    autoFinishTimer.value = setInterval(() => {
      secondsLeft.value -= 1

      if (secondsLeft.value <= 0) {
        clearInterval(autoFinishTimer.value)
        autoFinishTimer.value = null
        isTimerActive.value = false
        finishInstallation()
      }
    }, 1000)
  }
}

const cancelAutoFinish = (): void => {
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

const nextStep = (): void => {
  if (currentStep.value === 2) {
    startInstallation()
  } else if (currentStep.value < totalSteps) {
    currentStep.value++
    if (currentStep.value === 4) {
      startAutoFinishTimer()
    }
  }
}

const prevStep = (): void => {
  if (currentStep.value > 1) {
    cancelAutoFinish()
    currentStep.value--
  }
}

const finishInstallation = async (): Promise<void> => {
  cancelAutoFinish()
  try {
    await bitrixAPI.installFinish()
  } catch (error) {
    console.error('Ошибка при завершении установки:', error)
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
                  <span class="text-sm md:text-base text-gray-700">Гибкая настройка способов уведомлений (модальное окно, автоматический, push, чат)</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                  <span class="text-sm md:text-base text-gray-700">Контроль активности в выходные дни</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                  <span class="text-sm md:text-base text-gray-700">Форма для заполнения отчетов</span>
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
              Выберите, какие функции системы контроля времени вы хотите активировать и настроить.
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
                <div v-if="selectedFeatures.weekendActivity" class="mt-4 pt-4 border-t">
                  <div class="bg-yellow-50 rounded-lg p-4">
                    <div class="flex items-start">
                      <svg class="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                      </svg>
                      <div class="text-sm text-yellow-700">
                        <span class="font-medium">Примечание:</span> Используйте эту функцию осторожно, так как уведомления в выходные могут отвлекать сотрудников от отдыха.
                      </div>
                    </div>
                  </div>
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
              <!-- Фоновый счетчик -->
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

              <!-- Форма для отчета -->
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
                  <p class="text-xs md:text-sm font-medium text-gray-900">Форма для отчета</p>
                  <p class="text-xs text-gray-500">Позволяет сотруднику заполнять запрошенные отчеты</p>
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
                  <p class="text-xs text-gray-500">Сохранение настроек: старт/завершение рабочего дня, активность в выходные</p>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-6 border-t">
              <B24Button v-if="!installationComplete" @click="prevStep" label="Назад" size="lg" variant="outline" :disabled="isInstalling" :icon="ArrowLeftLIcon" />
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
              <p class="text-base md:text-lg text-gray-700">Система контроля времени сотрудников успешно установлена и настроена.</p>

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
                  <div class="flex items-start">
                    <CheckIcon class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm text-gray-700">Форма для заполнения отчетов</span>
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