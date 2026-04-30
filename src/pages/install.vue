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
  restAppUri: null,
  chatTextarea: null,
  chatSidebar: null,
  taskSidebar: null,
  taskTab: null,
  callCard: null,
  userField: null
})
const settingsStatus = ref(null)

// Выбранные встройки
const selectedPlacements = ref({
  pageBackgroundWorker: true,
  restAppUri: true,
  chatTextarea: true,
  chatSidebar: true,
  taskSidebar: true,
  taskTab: true,
  callCard: true,
  userField: true
})

// URL обработчиков
const HANDLERS = {
  pageBackgroundWorker: `${window.location.origin}/dist/widgets/background-handler`,
  restAppUri: `${window.location.origin}/dist/`,
  chatTextarea: `${window.location.origin}/dist/widgets/chat-textarea`,
  chatSidebar: `${window.location.origin}/dist/widgets/chat-sidebar`,
  taskSidebar: `${window.location.origin}/dist/widgets/task-sidebar`,
  taskTab: `${window.location.origin}/dist/widgets/task-tab`,
  callCard: `${window.location.origin}/dist/widgets/call-card`,
  userField: `${window.location.origin}/dist/widgets/user-field`
}

// Изображения для слайдеров
const chatImages = ref([
  `${window.location.origin}/images/install/calc_in_chat_panel.png`,
  `${window.location.origin}/images/install/calc_in_chat_sidebar.png`
])

const taskImages = ref([
  `${window.location.origin}/images/install/calc_in_task.png`,
])

const callCardImages = ref([
  `${window.location.origin}/images/install/calc_in_call_card.png`,
])

const userFieldImages = ref([
  `${window.location.origin}/images/install/calc_in_crm.png`,
])

// Текущие слайды
const currentChatSlide = ref(0)
const currentTaskSlide = ref(0)
const currentCallCardSlide = ref(0)
const currentUserFieldSlide = ref(0)

// Автопрокрутка слайдеров
const autoplayIntervals = ref({
  chat: null,
  task: null,
  callCard: null,
  userField: null
})

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
  },
  IM_TEXTAREA: {
    title: 'Калькулятор в CRM',
    description: 'Расчеты прямо в панели ввода сообщения',
    options: {
      iconName: 'fa-calculator',
      context: 'ALL',
      role: 'USER',
      color: 'AQUA',
      extranet: 'N',
      width: 300,
      height: 675
    }
  },
  IM_SIDEBAR: {
    title: 'Калькулятор в CRM',
    description: 'Расчеты в боковой панели чата',
    options: {
      iconName: 'fa-calculator',
      context: 'ALL',
      color: 'AQUA',
      extranet: 'N',
      role: 'USER',
      width: 300,
      height: 500,
    }
  },
  TASK_VIEW_SIDEBAR: {
    title: 'Калькулятор в задачах',
    description: 'Расчеты в боковой панели задачи',
    options: {
      iconName: 'fa-calculator',
      color: 'AQUA',
      extranet: 'N',
      role: 'USER',
      width: 300,
      height: 500,
    }
  },
  TASK_VIEW_TAB: {
    title: 'Калькулятор',
    description: 'Расчеты во вкладке задачи',
    options: {
      iconName: 'fa-calculator',
      color: 'AQUA',
      extranet: 'N',
      role: 'USER',
      width: 300,
      height: 500,
    }
  },
  CALL_CARD: {
    title: 'Калькулятор',
    description: 'Расчеты в карточке звонка',
    options: {
      iconName: 'fa-calculator',
      color: 'AQUA',
      extranet: 'N',
      role: 'USER',
    }
  }
}

// Конфигурация пользовательского поля
const USER_FIELD_CONFIG = {
  TYPE_ID: 'calculator_crm',
  TITLE: 'Калькулятор в CRM',
  DESCRIPTION: 'Поле с калькулятором для проведения расчетов',
  OPTIONS: {
    height: 500
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
  },

  getUserFieldTypes: async () => {
    try {
      const result = await bitrixAPI.call('userfieldtype.list', {})
      return result || []
    } catch (error) {
      return []
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

      let placementConfig

      if (placementType === 'PAGE_BACKGROUND_WORKER') {
        placementConfig = {
          PLACEMENT: placementType,
          HANDLER: handler,
          OPTIONS: config.options
        }
      } else if (placementType === 'REST_APP_URI') {
        placementConfig = {
          PLACEMENT: placementType,
          HANDLER: handler,
          LANG_ALL: {
            ru: {
              TITLE: config.title,
              DESCRIPTION: config.description,
              GROUP_NAME: 'Калькулятор под рукой'
            },
            en: {
              TITLE: config.title,
              DESCRIPTION: config.description,
              GROUP_NAME: 'Calculator at hand'
            },
            be: {
              TITLE: config.title,
              DESCRIPTION: config.description,
              GROUP_NAME: 'Калькулятар пад рукой'
            },
            kk: {
              TITLE: config.title,
              DESCRIPTION: config.description,
              GROUP_NAME: 'Қол астындағы калькулятор'
            }
          },
          OPTIONS: config.options
        }
      } else {
        placementConfig = {
          PLACEMENT: placementType,
          HANDLER: handler,
          LANG_ALL: {
            ru: {
              TITLE: config.title,
              DESCRIPTION: config.description,
              GROUP_NAME: 'Калькулятор под рукой'
            },
            en: {
              TITLE: config.title,
              DESCRIPTION: config.description,
              GROUP_NAME: 'Calculator at hand'
            },
            be: {
              TITLE: config.title,
              DESCRIPTION: config.description,
              GROUP_NAME: 'Калькулятар пад рукой'
            },
            kk: {
              TITLE: config.title,
              DESCRIPTION: config.description,
              GROUP_NAME: 'Қол астындағы калькулятор'
            }
          },
          OPTIONS: config.options
        }
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
  },

  checkStatus: async (placementType, handler) => {
    try {
      const placements = await bitrixAPI.getPlacements()
      if (!Array.isArray(placements)) return false
      const placement = placements.find(p =>
          p.PLACEMENT === placementType && p.HANDLER === handler
      )
      return !!placement
    } catch (error) {
      return false
    }
  }
}

// Менеджер пользовательских полей
const userFieldManager = {
  checkStatus: async () => {
    try {
      const userFieldTypes = await bitrixAPI.getUserFieldTypes()
      if (!Array.isArray(userFieldTypes)) return false
      const existingType = userFieldTypes.find(type =>
          type.USER_TYPE_ID === USER_FIELD_CONFIG.TYPE_ID &&
          type.HANDLER === HANDLERS.userField
      )
      return !!existingType
    } catch (error) {
      return false
    }
  },

  add: async () => {
    try {
      await bitrixAPI.call('userfieldtype.add', {
        USER_TYPE_ID: USER_FIELD_CONFIG.TYPE_ID,
        HANDLER: HANDLERS.userField,
        TITLE: USER_FIELD_CONFIG.TITLE,
        DESCRIPTION: USER_FIELD_CONFIG.DESCRIPTION,
        OPTIONS: USER_FIELD_CONFIG.OPTIONS
      })
      return true
    } catch (error) {
      throw error
    }
  },

  delete: async () => {
    try {
      await bitrixAPI.call('userfieldtype.delete', {
        USER_TYPE_ID: USER_FIELD_CONFIG.TYPE_ID
      })
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
      page_background_worker_enabled: selectedPlacements.value.pageBackgroundWorker ? 'Y' : 'N',
      rest_app_uri_enabled: selectedPlacements.value.restAppUri ? 'Y' : 'N',
      chat_textarea_enabled: selectedPlacements.value.chatTextarea ? 'Y' : 'N',
      chat_sidebar_enabled: selectedPlacements.value.chatSidebar ? 'Y' : 'N',
      task_sidebar_enabled: selectedPlacements.value.taskSidebar ? 'Y' : 'N',
      task_tab_enabled: selectedPlacements.value.taskTab ? 'Y' : 'N',
      call_card_enabled: selectedPlacements.value.callCard ? 'Y' : 'N',
      user_field_enabled: selectedPlacements.value.userField ? 'Y' : 'N',
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

// Регистрация встройки REST_APP_URI
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

// Регистрация встроек калькулятора
const registerChatTextarea = async () => {
  placementStatus.value.chatTextarea = 'loading'
  try {
    await placementManager.reinstall('IM_TEXTAREA', HANDLERS.chatTextarea)
    placementStatus.value.chatTextarea = 'success'
    installedCount.value++
  } catch (error) {
    placementStatus.value.chatTextarea = 'error'
  }
}

const registerChatSidebar = async () => {
  placementStatus.value.chatSidebar = 'loading'
  try {
    await placementManager.reinstall('IM_SIDEBAR', HANDLERS.chatSidebar)
    placementStatus.value.chatSidebar = 'success'
    installedCount.value++
  } catch (error) {
    placementStatus.value.chatSidebar = 'error'
  }
}

const registerTaskSidebar = async () => {
  placementStatus.value.taskSidebar = 'loading'
  try {
    await placementManager.reinstall('TASK_VIEW_SIDEBAR', HANDLERS.taskSidebar)
    placementStatus.value.taskSidebar = 'success'
    installedCount.value++
  } catch (error) {
    placementStatus.value.taskSidebar = 'error'
  }
}

const registerTaskTab = async () => {
  placementStatus.value.taskTab = 'loading'
  try {
    await placementManager.reinstall('TASK_VIEW_TAB', HANDLERS.taskTab)
    placementStatus.value.taskTab = 'success'
    installedCount.value++
  } catch (error) {
    placementStatus.value.taskTab = 'error'
  }
}

const registerCallCard = async () => {
  placementStatus.value.callCard = 'loading'
  try {
    await placementManager.reinstall('CALL_CARD', HANDLERS.callCard)
    placementStatus.value.callCard = 'success'
    installedCount.value++
  } catch (error) {
    placementStatus.value.callCard = 'error'
  }
}

const registerUserField = async () => {
  placementStatus.value.userField = 'loading'
  try {
    await userFieldManager.delete()
    await userFieldManager.add()
    placementStatus.value.userField = 'success'
    installedCount.value++
  } catch (error) {
    placementStatus.value.userField = 'error'
  }
}

// Функции для слайдеров
const startAutoplay = () => {
  if (currentStep.value === 2) {
    if (chatImages.value.length > 1) startChatAutoplay()
    if (taskImages.value.length > 1) startTaskAutoplay()
    if (callCardImages.value.length > 1) startCallCardAutoplay()
    if (userFieldImages.value.length > 1) startUserFieldAutoplay()
  }
}

const stopAutoplay = () => {
  stopChatAutoplay()
  stopTaskAutoplay()
  stopCallCardAutoplay()
  stopUserFieldAutoplay()
}

const startChatAutoplay = () => {
  stopChatAutoplay()
  autoplayIntervals.value.chat = setInterval(() => nextChatSlide(), 4000)
}

const stopChatAutoplay = () => {
  if (autoplayIntervals.value.chat) {
    clearInterval(autoplayIntervals.value.chat)
    autoplayIntervals.value.chat = null
  }
}

const nextChatSlide = () => {
  currentChatSlide.value = currentChatSlide.value < chatImages.value.length - 1
      ? currentChatSlide.value + 1
      : 0
}

const prevChatSlide = () => {
  currentChatSlide.value = currentChatSlide.value > 0
      ? currentChatSlide.value - 1
      : chatImages.value.length - 1
}

const goToChatSlide = (index) => {
  if (index >= 0 && index < chatImages.value.length) {
    currentChatSlide.value = index
  }
}

const startTaskAutoplay = () => {
  stopTaskAutoplay()
  autoplayIntervals.value.task = setInterval(() => nextTaskSlide(), 4200)
}

const stopTaskAutoplay = () => {
  if (autoplayIntervals.value.task) {
    clearInterval(autoplayIntervals.value.task)
    autoplayIntervals.value.task = null
  }
}

const nextTaskSlide = () => {
  currentTaskSlide.value = currentTaskSlide.value < taskImages.value.length - 1
      ? currentTaskSlide.value + 1
      : 0
}

const prevTaskSlide = () => {
  currentTaskSlide.value = currentTaskSlide.value > 0
      ? currentTaskSlide.value - 1
      : taskImages.value.length - 1
}

const goToTaskSlide = (index) => {
  if (index >= 0 && index < taskImages.value.length) {
    currentTaskSlide.value = index
  }
}

const startCallCardAutoplay = () => {
  stopCallCardAutoplay()
  autoplayIntervals.value.callCard = setInterval(() => nextCallCardSlide(), 4400)
}

const stopCallCardAutoplay = () => {
  if (autoplayIntervals.value.callCard) {
    clearInterval(autoplayIntervals.value.callCard)
    autoplayIntervals.value.callCard = null
  }
}

const nextCallCardSlide = () => {
  currentCallCardSlide.value = currentCallCardSlide.value < callCardImages.value.length - 1
      ? currentCallCardSlide.value + 1
      : 0
}

const prevCallCardSlide = () => {
  currentCallCardSlide.value = currentCallCardSlide.value > 0
      ? currentCallCardSlide.value - 1
      : callCardImages.value.length - 1
}

const goToCallCardSlide = (index) => {
  if (index >= 0 && index < callCardImages.value.length) {
    currentCallCardSlide.value = index
  }
}

const startUserFieldAutoplay = () => {
  stopUserFieldAutoplay()
  autoplayIntervals.value.userField = setInterval(() => nextUserFieldSlide(), 4600)
}

const stopUserFieldAutoplay = () => {
  if (autoplayIntervals.value.userField) {
    clearInterval(autoplayIntervals.value.userField)
    autoplayIntervals.value.userField = null
  }
}

const nextUserFieldSlide = () => {
  currentUserFieldSlide.value = currentUserFieldSlide.value < userFieldImages.value.length - 1
      ? currentUserFieldSlide.value + 1
      : 0
}

const prevUserFieldSlide = () => {
  currentUserFieldSlide.value = currentUserFieldSlide.value > 0
      ? currentUserFieldSlide.value - 1
      : userFieldImages.value.length - 1
}

const goToUserFieldSlide = (index) => {
  if (index >= 0 && index < userFieldImages.value.length) {
    currentUserFieldSlide.value = index
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
    restAppUri: null,
    chatTextarea: null,
    chatSidebar: null,
    taskSidebar: null,
    taskTab: null,
    callCard: null,
    userField: null
  }
  settingsStatus.value = null

  try {
    if (selectedPlacements.value.pageBackgroundWorker) await registerPageBackgroundWorker()
    if (selectedPlacements.value.restAppUri) await registerRestAppUri()
    if (selectedPlacements.value.chatTextarea) await registerChatTextarea()
    if (selectedPlacements.value.chatSidebar) await registerChatSidebar()
    if (selectedPlacements.value.taskSidebar) await registerTaskSidebar()
    if (selectedPlacements.value.taskTab) await registerTaskTab()
    if (selectedPlacements.value.callCard) await registerCallCard()
    if (selectedPlacements.value.userField) await registerUserField()
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

const hasSelectedPlacements = computed(() => {
  return Object.values(selectedPlacements.value).some(value => value === true)
})

const installationsToProcess = computed(() => {
  let count = 0
  if (selectedPlacements.value.pageBackgroundWorker) count++
  if (selectedPlacements.value.restAppUri) count++
  if (selectedPlacements.value.chatTextarea) count++
  if (selectedPlacements.value.chatSidebar) count++
  if (selectedPlacements.value.taskSidebar) count++
  if (selectedPlacements.value.taskTab) count++
  if (selectedPlacements.value.callCard) count++
  if (selectedPlacements.value.userField) count++
  return count
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
  stopAutoplay()
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
        Установка приложения "Калькулятор под рукой"
      </h1>
      <p class="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
        Калькулятор всегда под рукой: в чатах, задачах, звонках и карточках CRM
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
              Добро пожаловать в приложение "Калькулятор под рукой"
            </h2>
            <p class="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              Установите калькулятор в различные места вашего Битрикс24 для быстрого доступа к вычислениям
            </p>

            <div class="bg-blue-50 rounded-xl p-4 md:p-6 mb-4 md:mb-6">
              <h3 class="text-base md:text-lg font-semibold text-blue-800 mb-3">
                Ключевые возможности приложения
              </h3>
              <ul class="space-y-2 md:space-y-3">
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                  <span class="text-sm md:text-base text-gray-700">Фоновая встройка для автоматического определения времени</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                  <span class="text-sm md:text-base text-gray-700">Управление рабочим днем через уведомления</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                  <span class="text-sm md:text-base text-gray-700">Калькулятор в панели ввода сообщений чата</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                  <span class="text-sm md:text-base text-gray-700">Калькулятор в боковой панели чата</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                  <span class="text-sm md:text-base text-gray-700">Калькулятор в задачах (боковая панель и вкладка)</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                  <span class="text-sm md:text-base text-gray-700">Калькулятор в карточке звонка</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                  <span class="text-sm md:text-base text-gray-700">Пользовательское поле с калькулятором в карточках CRM</span>
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

    <!-- Шаг 2: Выбор встроек -->
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
              Выберите компоненты для установки
            </h2>
            <p class="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              Отметьте, какие компоненты приложения вы хотите активировать
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Фоновая встройка -->
              <B24PageCard>
                <div class="p-6">
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900">Фоновая встройка</h3>
                      <p class="text-sm text-gray-500">Автоматически определяет время старта и завершения рабочего дня</p>
                    </div>
                    <B24Switch v-model="selectedPlacements.pageBackgroundWorker" />
                  </div>
                </div>
              </B24PageCard>

              <!-- Встройка для управления из уведомлений -->
              <B24PageCard>
                <div class="p-6">
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900">Управление из уведомлений</h3>
                      <p class="text-sm text-gray-500">Управление статусом рабочего дня через уведомления</p>
                    </div>
                    <B24Switch v-model="selectedPlacements.restAppUri" />
                  </div>
                </div>
              </B24PageCard>

              <!-- Калькулятор в чате (панель ввода) -->
              <B24PageCard class="hover:shadow-lg transition-shadow duration-300">
                <div class="p-6">
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-3">
                      <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-lg font-semibold text-gray-900">Калькулятор в панели ввода сообщения</h3>
                        <p class="text-sm text-gray-500">Расчеты прямо в панели ввода сообщения</p>
                      </div>
                    </div>
                    <B24Switch v-model="selectedPlacements.chatTextarea" />
                  </div>

                  <div class="bg-gray-100 rounded-lg overflow-hidden relative" @mouseenter="stopAutoplay" @mouseleave="startAutoplay">
                    <div class="relative h-48 overflow-hidden">
                      <transition name="fade" mode="out-in">
                        <div :key="chatImages[currentChatSlide]" class="absolute inset-0 flex items-center justify-center p-4">
                          <div class="text-center">
                            <img :src="chatImages[currentChatSlide]" alt="Калькулятор в панели ввода сообщения" class="max-w-full max-h-full object-contain mx-auto" />
                            <p class="text-xs text-gray-500 mt-2">
                              {{ currentChatSlide === 0 ? 'Калькулятор в панели ввода сообщения' : 'Калькулятор в боковой панели чата' }}
                            </p>
                          </div>
                        </div>
                      </transition>
                    </div>

                    <div v-if="chatImages.length > 1" class="absolute top-1/2 left-0 right-0 flex justify-between px-2 transform -translate-y-1/2">
                      <button @click="prevChatSlide" class="p-1 rounded-full bg-white/80 hover:bg-white shadow-sm" :disabled="currentChatSlide === 0" :class="{ 'opacity-50 cursor-not-allowed': currentChatSlide === 0 }">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                      </button>
                      <button @click="nextChatSlide" class="p-1 rounded-full bg-white/80 hover:bg-white shadow-sm" :disabled="currentChatSlide >= chatImages.length - 1" :class="{ 'opacity-50 cursor-not-allowed': currentChatSlide >= chatImages.length - 1 }">
                        <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>

                    <div v-if="chatImages.length > 1" class="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
                      <button v-for="index in chatImages.length" :key="index" @click="goToChatSlide(index - 1)" class="w-1.5 h-1.5 rounded-full transition-all duration-300" :class="currentChatSlide === index - 1 ? 'bg-blue-600 w-4' : 'bg-gray-300 hover:bg-gray-400'" />
                    </div>
                  </div>
                </div>
              </B24PageCard>

              <!-- Калькулятор в задачах -->
              <B24PageCard class="hover:shadow-lg transition-shadow duration-300">
                <div class="p-6">
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-3">
                      <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-lg font-semibold text-gray-900">Калькулятор в задачах</h3>
                        <p class="text-sm text-gray-500">Расчеты в боковой панели и вкладке задачи</p>
                      </div>
                    </div>
                    <div class="flex flex-col gap-2">
                      <B24Switch v-model="selectedPlacements.taskSidebar" />
                      <B24Switch v-model="selectedPlacements.taskTab" />
                    </div>
                  </div>

                  <div class="bg-gray-100 rounded-lg overflow-hidden relative" @mouseenter="stopAutoplay" @mouseleave="startAutoplay">
                    <div class="relative h-48 overflow-hidden">
                      <transition name="fade" mode="out-in">
                        <div :key="taskImages[currentTaskSlide]" class="absolute inset-0 flex items-center justify-center p-4">
                          <div class="text-center">
                            <img :src="taskImages[currentTaskSlide]" alt="Калькулятор в задачах" class="max-w-full max-h-full object-contain mx-auto" />
                            <p class="text-xs text-gray-500 mt-2">Калькулятор в боковой панели задачи</p>
                          </div>
                        </div>
                      </transition>
                    </div>
                  </div>
                </div>
              </B24PageCard>

              <!-- Калькулятор в карточке звонка -->
              <B24PageCard class="hover:shadow-lg transition-shadow duration-300">
                <div class="p-6">
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-3">
                      <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-lg font-semibold text-gray-900">Калькулятор в карточке звонка</h3>
                        <p class="text-sm text-gray-500">Расчеты в карточке звонка</p>
                      </div>
                    </div>
                    <B24Switch v-model="selectedPlacements.callCard" />
                  </div>

                  <div class="bg-gray-100 rounded-lg overflow-hidden relative" @mouseenter="stopAutoplay" @mouseleave="startAutoplay">
                    <div class="relative h-48 overflow-hidden">
                      <transition name="fade" mode="out-in">
                        <div :key="callCardImages[currentCallCardSlide]" class="absolute inset-0 flex items-center justify-center p-4">
                          <div class="text-center">
                            <img :src="callCardImages[currentCallCardSlide]" alt="Калькулятор в карточке звонка" class="max-w-full max-h-full object-contain mx-auto" />
                            <p class="text-xs text-gray-500 mt-2">Калькулятор в карточке звонка</p>
                          </div>
                        </div>
                      </transition>
                    </div>
                  </div>
                </div>
              </B24PageCard>

              <!-- Пользовательское поле -->
              <B24PageCard class="hover:shadow-lg transition-shadow duration-300">
                <div class="p-6">
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-3">
                      <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-lg font-semibold text-gray-900">Пользовательское поле с калькулятором</h3>
                        <p class="text-sm text-gray-500">Поле с калькулятором в карточках CRM</p>
                      </div>
                    </div>
                    <B24Switch v-model="selectedPlacements.userField" />
                  </div>

                  <div class="bg-gray-100 rounded-lg overflow-hidden relative" @mouseenter="stopAutoplay" @mouseleave="startAutoplay">
                    <div class="relative h-48 overflow-hidden">
                      <transition name="fade" mode="out-in">
                        <div :key="userFieldImages[currentUserFieldSlide]" class="absolute inset-0 flex items-center justify-center p-4">
                          <div class="text-center">
                            <img :src="userFieldImages[currentUserFieldSlide]" alt="Пользовательское поле с калькулятором" class="max-w-full max-h-full object-contain mx-auto" />
                            <p class="text-xs text-gray-500 mt-2">Пользовательское поле с калькулятором</p>
                          </div>
                        </div>
                      </transition>
                    </div>
                  </div>
                </div>
              </B24PageCard>
            </div>

            <div class="flex justify-between gap-3 pt-6 mt-6 border-t">
              <B24Button @click="prevStep" label="Назад" variant="outline" size="lg" :icon="ArrowLeftLIcon" />
              <B24Button @click="nextStep" label="Продолжить" color="primary" size="lg" :disabled="!hasSelectedPlacements" :icon="ArrowRightLIcon" icon-position="right" />
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
            <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Установка приложения</h2>
            <p class="text-sm md:text-base text-gray-600 mb-4 md:mb-6">Выполняется установка и настройка выбранных компонентов.</p>

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
              <div v-if="selectedPlacements.pageBackgroundWorker" class="flex items-center">
                <div class="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                  <div v-if="placementStatus.pageBackgroundWorker === 'loading'"><LoadingIcon class="animate-spin h-4 w-4 md:h-5 md:w-5 text-blue-600" /></div>
                  <div v-else-if="placementStatus.pageBackgroundWorker === 'success'"><SuccessIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
                  <div v-else-if="placementStatus.pageBackgroundWorker === 'error'"><ErrorIcon class="w-4 h-4 md:w-5 md:h-5 text-red-500" /></div>
                  <div v-else><div class="w-4 h-4 md:w-5 md:h-5 bg-gray-300 rounded-full"></div></div>
                </div>
                <div class="ml-2 md:ml-3">
                  <p class="text-xs md:text-sm font-medium text-gray-900">Фоновая встройка</p>
                  <p class="text-xs text-gray-500">Автоматически определяет время старта и завершения рабочего дня</p>
                </div>
              </div>

              <!-- Встройка для управления из уведомлений -->
              <div v-if="selectedPlacements.restAppUri" class="flex items-center">
                <div class="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                  <div v-if="placementStatus.restAppUri === 'loading'"><LoadingIcon class="animate-spin h-4 w-4 md:h-5 md:w-5 text-blue-600" /></div>
                  <div v-else-if="placementStatus.restAppUri === 'success'"><SuccessIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
                  <div v-else-if="placementStatus.restAppUri === 'error'"><ErrorIcon class="w-4 h-4 md:w-5 md:h-5 text-red-500" /></div>
                  <div v-else><div class="w-4 h-4 md:w-5 md:h-5 bg-gray-300 rounded-full"></div></div>
                </div>
                <div class="ml-2 md:ml-3">
                  <p class="text-xs md:text-sm font-medium text-gray-900">Управление рабочим днем из уведомлений</p>
                  <p class="text-xs text-gray-500">Управление статусом рабочего дня через уведомления</p>
                </div>
              </div>

              <!-- Калькулятор в панели ввода сообщения -->
              <div v-if="selectedPlacements.chatTextarea" class="flex items-center">
                <div class="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                  <div v-if="placementStatus.chatTextarea === 'loading'"><LoadingIcon class="animate-spin h-4 w-4 md:h-5 md:w-5 text-blue-600" /></div>
                  <div v-else-if="placementStatus.chatTextarea === 'success'"><SuccessIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
                  <div v-else-if="placementStatus.chatTextarea === 'error'"><ErrorIcon class="w-4 h-4 md:w-5 md:h-5 text-red-500" /></div>
                  <div v-else><div class="w-4 h-4 md:w-5 md:h-5 bg-gray-300 rounded-full"></div></div>
                </div>
                <div class="ml-2 md:ml-3">
                  <p class="text-xs md:text-sm font-medium text-gray-900">Калькулятор в панели ввода сообщения</p>
                  <p class="text-xs text-gray-500">Расчеты прямо в панели ввода сообщения чата</p>
                </div>
              </div>

              <!-- Калькулятор в боковой панели чата -->
              <div v-if="selectedPlacements.chatSidebar" class="flex items-center">
                <div class="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                  <div v-if="placementStatus.chatSidebar === 'loading'"><LoadingIcon class="animate-spin h-4 w-4 md:h-5 md:w-5 text-blue-600" /></div>
                  <div v-else-if="placementStatus.chatSidebar === 'success'"><SuccessIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
                  <div v-else-if="placementStatus.chatSidebar === 'error'"><ErrorIcon class="w-4 h-4 md:w-5 md:h-5 text-red-500" /></div>
                  <div v-else><div class="w-4 h-4 md:w-5 md:h-5 bg-gray-300 rounded-full"></div></div>
                </div>
                <div class="ml-2 md:ml-3">
                  <p class="text-xs md:text-sm font-medium text-gray-900">Калькулятор в боковой панели чата</p>
                  <p class="text-xs text-gray-500">Расчеты в боковой панели чата</p>
                </div>
              </div>

              <!-- Калькулятор в боковой панели задачи -->
              <div v-if="selectedPlacements.taskSidebar" class="flex items-center">
                <div class="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                  <div v-if="placementStatus.taskSidebar === 'loading'"><LoadingIcon class="animate-spin h-4 w-4 md:h-5 md:w-5 text-blue-600" /></div>
                  <div v-else-if="placementStatus.taskSidebar === 'success'"><SuccessIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
                  <div v-else-if="placementStatus.taskSidebar === 'error'"><ErrorIcon class="w-4 h-4 md:w-5 md:h-5 text-red-500" /></div>
                  <div v-else><div class="w-4 h-4 md:w-5 md:h-5 bg-gray-300 rounded-full"></div></div>
                </div>
                <div class="ml-2 md:ml-3">
                  <p class="text-xs md:text-sm font-medium text-gray-900">Калькулятор в боковой панели задачи</p>
                  <p class="text-xs text-gray-500">Расчеты в боковой панели задачи</p>
                </div>
              </div>

              <!-- Калькулятор во вкладке задачи -->
              <div v-if="selectedPlacements.taskTab" class="flex items-center">
                <div class="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                  <div v-if="placementStatus.taskTab === 'loading'"><LoadingIcon class="animate-spin h-4 w-4 md:h-5 md:w-5 text-blue-600" /></div>
                  <div v-else-if="placementStatus.taskTab === 'success'"><SuccessIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
                  <div v-else-if="placementStatus.taskTab === 'error'"><ErrorIcon class="w-4 h-4 md:w-5 md:h-5 text-red-500" /></div>
                  <div v-else><div class="w-4 h-4 md:w-5 md:h-5 bg-gray-300 rounded-full"></div></div>
                </div>
                <div class="ml-2 md:ml-3">
                  <p class="text-xs md:text-sm font-medium text-gray-900">Калькулятор во вкладке задачи</p>
                  <p class="text-xs text-gray-500">Расчеты в отдельной вкладке задачи</p>
                </div>
              </div>

              <!-- Калькулятор в карточке звонка -->
              <div v-if="selectedPlacements.callCard" class="flex items-center">
                <div class="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                  <div v-if="placementStatus.callCard === 'loading'"><LoadingIcon class="animate-spin h-4 w-4 md:h-5 md:w-5 text-blue-600" /></div>
                  <div v-else-if="placementStatus.callCard === 'success'"><SuccessIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
                  <div v-else-if="placementStatus.callCard === 'error'"><ErrorIcon class="w-4 h-4 md:w-5 md:h-5 text-red-500" /></div>
                  <div v-else><div class="w-4 h-4 md:w-5 md:h-5 bg-gray-300 rounded-full"></div></div>
                </div>
                <div class="ml-2 md:ml-3">
                  <p class="text-xs md:text-sm font-medium text-gray-900">Калькулятор в карточке звонка</p>
                  <p class="text-xs text-gray-500">Расчеты в карточке звонка</p>
                </div>
              </div>

              <!-- Пользовательское поле -->
              <div v-if="selectedPlacements.userField" class="flex items-center">
                <div class="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                  <div v-if="placementStatus.userField === 'loading'"><LoadingIcon class="animate-spin h-4 w-4 md:h-5 md:w-5 text-blue-600" /></div>
                  <div v-else-if="placementStatus.userField === 'success'"><SuccessIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
                  <div v-else-if="placementStatus.userField === 'error'"><ErrorIcon class="w-4 h-4 md:w-5 md:h-5 text-red-500" /></div>
                  <div v-else><div class="w-4 h-4 md:w-5 md:h-5 bg-gray-300 rounded-full"></div></div>
                </div>
                <div class="ml-2 md:ml-3">
                  <p class="text-xs md:text-sm font-medium text-gray-900">Пользовательское поле с калькулятором</p>
                  <p class="text-xs text-gray-500">Поле с калькулятором в карточках CRM</p>
                </div>
              </div>

              <!-- Настройка параметров системы -->
              <div class="flex items-center">
                <div class="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                  <div v-if="settingsStatus === 'loading'"><LoadingIcon class="animate-spin h-4 w-4 md:h-5 md:w-5 text-blue-600" /></div>
                  <div v-else-if="settingsStatus === 'success'"><SuccessIcon class="w-4 h-4 md:w-5 md:h-5 text-green-500" /></div>
                  <div v-else-if="settingsStatus === 'error'"><ErrorIcon class="w-4 h-4 md:w-5 md:h-5 text-red-500" /></div>
                  <div v-else><div class="w-4 h-4 md:w-5 md:h-5 bg-gray-300 rounded-full"></div></div>
                </div>
                <div class="ml-2 md:ml-3">
                  <p class="text-xs md:text-sm font-medium text-gray-900">Сохранение настроек</p>
                  <p class="text-xs text-gray-500">Сохранение выбранных параметров приложения</p>
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
              <p class="text-base md:text-lg text-gray-700">Приложение "Калькулятор под рукой" успешно установлено и настроено.</p>

              <B24PageCard variant="tinted">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Что установлено?</h3>

                <div class="space-y-2">
                  <div v-if="selectedPlacements.pageBackgroundWorker" class="flex items-start">
                    <CheckIcon class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm text-gray-700">Фоновая встройка для автоматического определения времени</span>
                  </div>
                  <div v-if="selectedPlacements.restAppUri" class="flex items-start">
                    <CheckIcon class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm text-gray-700">Управление рабочим днем из уведомлений</span>
                  </div>
                  <div v-if="selectedPlacements.chatTextarea || selectedPlacements.chatSidebar" class="flex items-start">
                    <CheckIcon class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm text-gray-700">Калькулятор в чатах</span>
                  </div>
                  <div v-if="selectedPlacements.taskSidebar || selectedPlacements.taskTab" class="flex items-start">
                    <CheckIcon class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm text-gray-700">Калькулятор в задачах</span>
                  </div>
                  <div v-if="selectedPlacements.callCard" class="flex items-start">
                    <CheckIcon class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm text-gray-700">Калькулятор в карточке звонка</span>
                  </div>
                  <div v-if="selectedPlacements.userField" class="flex items-start">
                    <CheckIcon class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm text-gray-700">Пользовательское поле с калькулятором в карточках CRM</span>
                  </div>
                </div>

                <div class="mt-4">
                  <B24Link href="mailto:technogalera@yandex.ru?subject=Поддержка приложения Калькулятор под рукой" target="_blank" is-action>
                    Техническая поддержка
                  </B24Link>
                </div>
              </B24PageCard>

              <B24PageCard variant="tinted-alt">
                <h3 class="text-base font-semibold text-gray-900 mb-2">Следующие шаги</h3>
                <ul class="space-y-2">
                  <li class="flex items-start text-gray-700">
                    <ArrowRightLIcon class="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm">Откройте чат, задачу или карточку CRM, чтобы использовать калькулятор</span>
                  </li>
                  <li class="flex items-start text-gray-700">
                    <ArrowRightLIcon class="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm">Калькулятор появится в выбранных вами местах</span>
                  </li>
                  <li class="flex items-start text-gray-700">
                    <ArrowRightLIcon class="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm">Вы всегда можете изменить настройки в разделе "Настройки приложения"</span>
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.hover\:shadow-lg:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>