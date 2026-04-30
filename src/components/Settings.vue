<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@bitrix24/b24ui-nuxt/composables/useToast'
import PlacementsManager from './PlacementsManager.vue'

const toast = useToast()

// URL обработчиков (должны совпадать с инсталлером)
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

// Конфигурации встроек
const PLACEMENT_CONFIGS = {
  PAGE_BACKGROUND_WORKER: {
    title: 'Фоновая встройка',
    description: 'Автоматически определяет время старта и завершения рабочего дня',
    options: {
      errorHandlerUrl: `${window.location.origin}/dist/widgets/background-error-handler`
    }
  },
  REST_APP_URI: {
    title: 'Встройка для управления рабочим днем из уведомлений',
    description: 'Управление статусом рабочего дня через уведомления',
    options: {}
  },
  IM_TEXTAREA: {
    title: 'Калькулятор в панели ввода сообщения',
    description: 'Расчеты прямо в панели ввода сообщения чата',
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
    title: 'Калькулятор в боковой панели чата',
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
    title: 'Калькулятор в боковой панели задачи',
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
    title: 'Калькулятор во вкладке задачи',
    description: 'Расчеты в отдельной вкладке задачи',
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
    title: 'Калькулятор в карточке звонка',
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

// Типы данных
interface PlacementStatus {
  pageBackgroundWorker: boolean
  restAppUri: boolean
  chatTextarea: boolean
  chatSidebar: boolean
  taskSidebar: boolean
  taskTab: boolean
  callCard: boolean
  userField: boolean
}

// Состояние настроек
const settings = ref<PlacementStatus>({
  pageBackgroundWorker: false,
  restAppUri: false,
  chatTextarea: false,
  chatSidebar: false,
  taskSidebar: false,
  taskTab: false,
  callCard: false,
  userField: false
})

// Состояния загрузки для каждого свитчера
const processingStates = ref({
  pageBackgroundWorker: false,
  restAppUri: false,
  chatTextarea: false,
  chatSidebar: false,
  taskSidebar: false,
  taskTab: false,
  callCard: false,
  userField: false
})

const isBitrixLoaded = ref(false)

// Функция для уведомлений
function showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
  if (typeof toast !== 'undefined') {
    toast.add({
      description: message,
      variant: type
    })
  }
}

// Функции для работы с Bitrix24 API
const bitrixAPI = {
  call: (method: string, params: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (typeof BX24 === 'undefined' || typeof BX24.callMethod === 'undefined') {
        reject(new Error('Библиотека Bitrix24 не доступна'))
        return
      }

      BX24.callMethod(method, params, (result: any) => {
        if (result.error()) {
          reject(new Error(result.error().getError()))
        } else {
          resolve(result.data())
        }
      })
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

  getAppOption: async (key: string): Promise<string | null> => {
    try {
      const result = await bitrixAPI.call('app.option.get', { name: key })
      return result || null
    } catch (error) {
      return null
    }
  },

  getPlacements: async (): Promise<any[]> => {
    try {
      const result = await bitrixAPI.call('placement.list', {})
      return Array.isArray(result) ? result : []
    } catch (error) {
      return []
    }
  },

  getUserFieldTypes: async (): Promise<any[]> => {
    try {
      const result = await bitrixAPI.call('userfieldtype.list', {})
      return Array.isArray(result) ? result : []
    } catch (error) {
      return []
    }
  }
}

// Менеджер встроек
const placementManager = {
  getConfig: (placementType: string) => {
    const config = PLACEMENT_CONFIGS[placementType as keyof typeof PLACEMENT_CONFIGS]
    if (!config) {
      throw new Error(`Неизвестный тип встройки: ${placementType}`)
    }
    return config
  },

  bind: async (placementType: string, handler: string): Promise<boolean> => {
    try {
      const config = placementManager.getConfig(placementType)

      let placementConfig: any

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

  unbind: async (placementType: string, handler: string): Promise<boolean> => {
    try {
      await bitrixAPI.call('placement.unbind', {
        PLACEMENT: placementType,
        HANDLER: handler
      })
      return true
    } catch (error) {
      return false
    }
  },

  checkStatus: async (placementType: string, handler: string): Promise<boolean> => {
    try {
      const placements = await bitrixAPI.getPlacements()
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
  checkStatus: async (): Promise<boolean> => {
    try {
      const userFieldTypes = await bitrixAPI.getUserFieldTypes()
      const existingType = userFieldTypes.find(type =>
          type.USER_TYPE_ID === USER_FIELD_CONFIG.TYPE_ID &&
          type.HANDLER === HANDLERS.userField
      )
      return !!existingType
    } catch (error) {
      return false
    }
  },

  add: async (): Promise<boolean> => {
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

  delete: async (): Promise<boolean> => {
    try {
      await bitrixAPI.call('userfieldtype.delete', {
        USER_TYPE_ID: USER_FIELD_CONFIG.TYPE_ID
      })
      return true
    } catch (error) {
      return false
    }
  }
}

// Универсальная функция переключения встройки
async function togglePlacement(
    key: keyof PlacementStatus,
    placementType: string,
    handler: string,
    isUserField: boolean = false
): Promise<void> {
  if (processingStates.value[key]) return

  processingStates.value[key] = true
  const newValue = !settings.value[key]

  try {
    if (!isBitrixLoaded.value || typeof BX24 === 'undefined') {
      throw new Error('Библиотека Bitrix24 не доступна')
    }

    if (newValue) {
      // Включение
      if (isUserField) {
        await userFieldManager.add()
      } else {
        await placementManager.bind(placementType, handler)
      }
      showNotification('success', getSuccessMessage(key, true))
    } else {
      // Выключение
      if (isUserField) {
        await userFieldManager.delete()
      } else {
        await placementManager.unbind(placementType, handler)
      }
      showNotification('success', getSuccessMessage(key, false))
    }

    settings.value[key] = newValue

    // Сохраняем настройку в app.options
    const optionKey = `${key}_enabled`
    await bitrixAPI.setAppOption(optionKey, newValue ? 'Y' : 'N')

  } catch (error) {
    console.error(`Ошибка при переключении ${key}:`, error)
    showNotification('error', getErrorMessage(key, newValue))
    // Обновляем статус из системы
    await loadPlacementStatus(key, placementType, handler, isUserField)
  } finally {
    processingStates.value[key] = false
  }
}

// Получение сообщений об успехе
function getSuccessMessage(key: keyof PlacementStatus, enabled: boolean): string {
  const messages: Record<keyof PlacementStatus, { on: string; off: string }> = {
    pageBackgroundWorker: {
      on: 'Фоновая встройка включена',
      off: 'Фоновая встройка выключена'
    },
    restAppUri: {
      on: 'Управление из уведомлений включено',
      off: 'Управление из уведомлений выключено'
    },
    chatTextarea: {
      on: 'Калькулятор в панели ввода сообщения включен',
      off: 'Калькулятор в панели ввода сообщения выключен'
    },
    chatSidebar: {
      on: 'Калькулятор в боковой панели чата включен',
      off: 'Калькулятор в боковой панели чата выключен'
    },
    taskSidebar: {
      on: 'Калькулятор в боковой панели задачи включен',
      off: 'Калькулятор в боковой панели задачи выключен'
    },
    taskTab: {
      on: 'Калькулятор во вкладке задачи включен',
      off: 'Калькулятор во вкладке задачи выключен'
    },
    callCard: {
      on: 'Калькулятор в карточке звонка включен',
      off: 'Калькулятор в карточке звонка выключен'
    },
    userField: {
      on: 'Пользовательское поле с калькулятором включено',
      off: 'Пользовательское поле с калькулятором выключено'
    }
  }
  return enabled ? messages[key].on : messages[key].off
}

// Получение сообщений об ошибке
function getErrorMessage(key: keyof PlacementStatus, enabled: boolean): string {
  const messages: Record<keyof PlacementStatus, { on: string; off: string }> = {
    pageBackgroundWorker: {
      on: 'Ошибка при включении фоновой встройки',
      off: 'Ошибка при выключении фоновой встройки'
    },
    restAppUri: {
      on: 'Ошибка при включении управления из уведомлений',
      off: 'Ошибка при выключении управления из уведомлений'
    },
    chatTextarea: {
      on: 'Ошибка при включении калькулятора в панели ввода сообщения',
      off: 'Ошибка при выключении калькулятора в панели ввода сообщения'
    },
    chatSidebar: {
      on: 'Ошибка при включении калькулятора в боковой панели чата',
      off: 'Ошибка при выключении калькулятора в боковой панели чата'
    },
    taskSidebar: {
      on: 'Ошибка при включении калькулятора в боковой панели задачи',
      off: 'Ошибка при выключении калькулятора в боковой панели задачи'
    },
    taskTab: {
      on: 'Ошибка при включении калькулятора во вкладке задачи',
      off: 'Ошибка при выключении калькулятора во вкладке задачи'
    },
    callCard: {
      on: 'Ошибка при включении калькулятора в карточке звонка',
      off: 'Ошибка при выключении калькулятора в карточке звонка'
    },
    userField: {
      on: 'Ошибка при включении пользовательского поля',
      off: 'Ошибка при выключении пользовательского поля'
    }
  }
  return enabled ? messages[key].on : messages[key].off
}

// Загрузка статуса конкретной встройки
async function loadPlacementStatus(
    key: keyof PlacementStatus,
    placementType: string,
    handler: string,
    isUserField: boolean = false
): Promise<void> {
  try {
    let isEnabled: boolean
    if (isUserField) {
      isEnabled = await userFieldManager.checkStatus()
    } else {
      isEnabled = await placementManager.checkStatus(placementType, handler)
    }
    settings.value[key] = isEnabled
  } catch (error) {
    console.error(`Ошибка загрузки статуса ${key}:`, error)
  }
}

// Загрузка всех настроек
async function loadAllSettings(): Promise<void> {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return

  // Загружаем статусы для placement'ов
  await Promise.all([
    loadPlacementStatus('pageBackgroundWorker', 'PAGE_BACKGROUND_WORKER', HANDLERS.pageBackgroundWorker),
    loadPlacementStatus('restAppUri', 'REST_APP_URI', HANDLERS.restAppUri),
    loadPlacementStatus('chatTextarea', 'IM_TEXTAREA', HANDLERS.chatTextarea),
    loadPlacementStatus('chatSidebar', 'IM_SIDEBAR', HANDLERS.chatSidebar),
    loadPlacementStatus('taskSidebar', 'TASK_VIEW_SIDEBAR', HANDLERS.taskSidebar),
    loadPlacementStatus('taskTab', 'TASK_VIEW_TAB', HANDLERS.taskTab),
    loadPlacementStatus('callCard', 'CALL_CARD', HANDLERS.callCard)
  ])

  // Загружаем статус пользовательского поля отдельно
  try {
    settings.value.userField = await userFieldManager.checkStatus()
  } catch (error) {
    console.error('Ошибка загрузки статуса userField:', error)
    settings.value.userField = false
  }
}

// Функции-обертки для каждого свитчера
const togglePageBackgroundWorker = () => togglePlacement('pageBackgroundWorker', 'PAGE_BACKGROUND_WORKER', HANDLERS.pageBackgroundWorker)
const toggleRestAppUri = () => togglePlacement('restAppUri', 'REST_APP_URI', HANDLERS.restAppUri)
const toggleChatTextarea = () => togglePlacement('chatTextarea', 'IM_TEXTAREA', HANDLERS.chatTextarea)
const toggleChatSidebar = () => togglePlacement('chatSidebar', 'IM_SIDEBAR', HANDLERS.chatSidebar)
const toggleTaskSidebar = () => togglePlacement('taskSidebar', 'TASK_VIEW_SIDEBAR', HANDLERS.taskSidebar)
const toggleTaskTab = () => togglePlacement('taskTab', 'TASK_VIEW_TAB', HANDLERS.taskTab)
const toggleCallCard = () => togglePlacement('callCard', 'CALL_CARD', HANDLERS.callCard)
const toggleUserField = () => togglePlacement('userField', '', '', true)

// Инициализация
onMounted(async () => {
  if (typeof BX24 !== 'undefined' && BX24.init) {
    BX24.init(async () => {
      isBitrixLoaded.value = true
      await loadAllSettings()
    })
  }
})
</script>

<template>
  <div>
    <!-- Блок 1: Фоновая встройка -->
    <B24Card class="mb-6">
      <div class="p-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-base font-medium text-gray-900">
                Фоновая встройка
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Автоматически определяет время старта и завершения рабочего дня
              </p>
            </div>
            <div class="ml-4 flex items-center space-x-3">
              <div class="w-2 h-2 rounded-full"
                   :class="settings.pageBackgroundWorker ? 'bg-green-500' : 'bg-red-500'"></div>
              <B24Switch
                  :model-value="settings.pageBackgroundWorker"
                  @update:model-value="togglePageBackgroundWorker"
                  :disabled="processingStates.pageBackgroundWorker"
              />
            </div>
          </div>
        </div>
      </div>
    </B24Card>

    <!-- Блок 2: Управление из уведомлений -->
    <B24Card class="mb-6">
      <div class="p-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-base font-medium text-gray-900">
                Управление рабочим днем из уведомлений
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Управление статусом рабочего дня через уведомления
              </p>
            </div>
            <div class="ml-4 flex items-center space-x-3">
              <div class="w-2 h-2 rounded-full"
                   :class="settings.restAppUri ? 'bg-green-500' : 'bg-red-500'"></div>
              <B24Switch
                  :model-value="settings.restAppUri"
                  @update:model-value="toggleRestAppUri"
                  :disabled="processingStates.restAppUri"
              />
            </div>
          </div>
        </div>
      </div>
    </B24Card>

    <!-- Блок 3: Калькулятор в панели ввода сообщения -->
    <B24Card class="mb-6">
      <div class="p-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-base font-medium text-gray-900">
                Калькулятор в панели ввода сообщения
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Расчеты прямо в панели ввода сообщения чата
              </p>
            </div>
            <div class="ml-4 flex items-center space-x-3">
              <div class="w-2 h-2 rounded-full"
                   :class="settings.chatTextarea ? 'bg-green-500' : 'bg-red-500'"></div>
              <B24Switch
                  :model-value="settings.chatTextarea"
                  @update:model-value="toggleChatTextarea"
                  :disabled="processingStates.chatTextarea"
              />
            </div>
          </div>
        </div>
      </div>
    </B24Card>

    <!-- Блок 4: Калькулятор в боковой панели чата -->
    <B24Card class="mb-6">
      <div class="p-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-base font-medium text-gray-900">
                Калькулятор в боковой панели чата
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Расчеты в боковой панели чата
              </p>
            </div>
            <div class="ml-4 flex items-center space-x-3">
              <div class="w-2 h-2 rounded-full"
                   :class="settings.chatSidebar ? 'bg-green-500' : 'bg-red-500'"></div>
              <B24Switch
                  :model-value="settings.chatSidebar"
                  @update:model-value="toggleChatSidebar"
                  :disabled="processingStates.chatSidebar"
              />
            </div>
          </div>
        </div>
      </div>
    </B24Card>

    <!-- Блок 5: Калькулятор в боковой панели задачи -->
    <B24Card class="mb-6">
      <div class="p-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-base font-medium text-gray-900">
                Калькулятор в боковой панели задачи
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Расчеты в боковой панели задачи
              </p>
            </div>
            <div class="ml-4 flex items-center space-x-3">
              <div class="w-2 h-2 rounded-full"
                   :class="settings.taskSidebar ? 'bg-green-500' : 'bg-red-500'"></div>
              <B24Switch
                  :model-value="settings.taskSidebar"
                  @update:model-value="toggleTaskSidebar"
                  :disabled="processingStates.taskSidebar"
              />
            </div>
          </div>
        </div>
      </div>
    </B24Card>

    <!-- Блок 6: Калькулятор во вкладке задачи -->
    <B24Card class="mb-6">
      <div class="p-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-base font-medium text-gray-900">
                Калькулятор во вкладке задачи
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Расчеты в отдельной вкладке задачи
              </p>
            </div>
            <div class="ml-4 flex items-center space-x-3">
              <div class="w-2 h-2 rounded-full"
                   :class="settings.taskTab ? 'bg-green-500' : 'bg-red-500'"></div>
              <B24Switch
                  :model-value="settings.taskTab"
                  @update:model-value="toggleTaskTab"
                  :disabled="processingStates.taskTab"
              />
            </div>
          </div>
        </div>
      </div>
    </B24Card>

    <!-- Блок 7: Калькулятор в карточке звонка -->
    <B24Card class="mb-6">
      <div class="p-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-base font-medium text-gray-900">
                Калькулятор в карточке звонка
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Расчеты в карточке звонка
              </p>
            </div>
            <div class="ml-4 flex items-center space-x-3">
              <div class="w-2 h-2 rounded-full"
                   :class="settings.callCard ? 'bg-green-500' : 'bg-red-500'"></div>
              <B24Switch
                  :model-value="settings.callCard"
                  @update:model-value="toggleCallCard"
                  :disabled="processingStates.callCard"
              />
            </div>
          </div>
        </div>
      </div>
    </B24Card>

    <!-- Блок 8: Пользовательское поле -->
    <B24Card class="mb-6">
      <div class="p-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-base font-medium text-gray-900">
                Пользовательское поле с калькулятором
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Поле с калькулятором в карточках CRM
              </p>
            </div>
            <div class="ml-4 flex items-center space-x-3">
              <div class="w-2 h-2 rounded-full"
                   :class="settings.userField ? 'bg-green-500' : 'bg-red-500'"></div>
              <B24Switch
                  :model-value="settings.userField"
                  @update:model-value="toggleUserField"
                  :disabled="processingStates.userField"
              />
            </div>
          </div>

          <!-- Информация о типе поля -->
          <div v-if="settings.userField" class="mt-4 pt-4 border-t">
            <div class="bg-blue-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-blue-800 mb-2">
                Информация о пользовательском поле
              </h4>
              <div class="space-y-2 text-sm text-blue-700">
                <div class="flex">
                  <span class="font-medium w-32 flex-shrink-0">Код типа:</span>
                  <span class="font-mono bg-white px-2 py-0.5 rounded">calculator_crm</span>
                </div>
                <div class="flex">
                  <span class="font-medium w-32 flex-shrink-0">Название:</span>
                  <span>Калькулятор в CRM</span>
                </div>
                <div class="flex">
                  <span class="font-medium w-32 flex-shrink-0">Описание:</span>
                  <span>Поле с калькулятором для проведения расчетов</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </B24Card>

    <!-- Управление встройками (PAGE_BACKGROUND_WORKER и REST_APP_URI) -->
    <PlacementsManager class="mt-8" />
  </div>
</template>