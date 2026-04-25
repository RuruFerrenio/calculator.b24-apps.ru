<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@bitrix24/b24ui-nuxt/composables/useToast'
import PowerIcon from '@bitrix24/b24icons-vue/outline/PowerIcon'

type WorkdayMode = 'start' | 'end'
type WorkdayStatus = 'OPENED' | 'CLOSED' | 'PAUSED' | 'EXPIRED'

interface WorkdayInfo {
  STATUS: WorkdayStatus
  TIME_START?: string
  TIME_FINISH?: string
  TIME_PAUSED?: string
  [key: string]: any
}

interface CurrentUser {
  id: number
  name: string
  lastName: string
  email: string
}

interface BX24Error {
  error?: string
  error_description?: string
  message?: string
}

const props = withDefaults(defineProps<{
  mode: WorkdayMode
  alertaParameters?: Record<string, any>
  autoCloseDelay?: number
}>(), {
  alertaParameters: () => ({}),
  autoCloseDelay: 2000
})

const toast = useToast()

const isProcessing = ref(false)
const isActionCompleted = ref(false)
const error = ref<string | null>(null)
const statusMessage = ref('')
const workdayInfo = ref<WorkdayInfo | null>(null)

const currentUser = ref<CurrentUser>({
  id: 0,
  name: 'Сотрудник',
  lastName: '',
  email: ''
})

const isStartMode = computed(() => props.mode === 'start')

const title = computed(() => {
  if (isActionCompleted.value) {
    return isStartMode.value ? 'Рабочий день начат' : 'Рабочий день завершен'
  }
  return isStartMode.value ? 'Рабочий день не начат' : 'Завершение рабочего дня'
})

const subtitle = computed(() => {
  if (isStartMode.value) {
    return 'Начните рабочий день, чтобы фиксировать рабочее время'
  }
  return 'Завершите рабочий день, чтобы зафиксировать отработанное время'
})

const completionMessage = computed(() => {
  return isStartMode.value
      ? 'Рабочий день успешно начат'
      : 'Рабочий день успешно завершен'
})

const buttonText = computed(() => {
  return isStartMode.value ? 'Начать рабочий день' : 'Завершить рабочий день'
})

const processingText = computed(() => {
  return isStartMode.value ? 'Начинаем...' : 'Завершаем...'
})

const completedText = computed(() => {
  return isStartMode.value ? 'Рабочий день начат' : 'Рабочий день завершен'
})

const buttonClass = computed(() => {
  const isDisabled = isProcessing.value || isActionCompleted.value
  const isEnabled = !isProcessing.value && !isActionCompleted.value

  const classes: Record<string, boolean> = {
    'bg-gray-300 text-gray-600 cursor-not-allowed hover:bg-gray-300': isDisabled,
    'shadow-md hover:shadow-lg': isEnabled
  }

  if (isStartMode.value) {
    classes['bg-green-600 hover:bg-green-700 text-white hover:text-white'] = isEnabled
  } else {
    classes['bg-orange-600 hover:bg-orange-700 text-white hover:text-white'] = isEnabled
  }

  return classes
})

const statusClass = computed(() => {
  if (error.value) return 'text-red-600 font-medium'
  if (isActionCompleted.value) return 'text-green-600 font-medium'
  return 'text-gray-500'
})

const getStatusText = (status: WorkdayStatus | string): string => {
  const statusMap: Record<string, string> = {
    'OPENED': 'Открыт',
    'CLOSED': 'Закрыт',
    'PAUSED': 'Приостановлен',
    'EXPIRED': 'Истек'
  }
  return statusMap[status] || status
}

const formatDateTime = (dateTimeStr?: string): string => {
  if (!dateTimeStr) return '—'
  try {
    const date = new Date(dateTimeStr)
    return date.toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateTimeStr
  }
}

const loadCurrentUser = async (): Promise<CurrentUser> => {
  if (!BX24) {
    console.warn('BX24 API недоступна для загрузки данных пользователя')
    return {
      id: 0,
      name: 'Тестовый пользователь',
      lastName: '',
      email: ''
    }
  }

  try {
    const userData = await new Promise<any>((resolve, reject) => {
      BX24.callMethod('user.current', {}, (result: any) => {
        if (result.error()) {
          reject(result.error())
        } else {
          resolve(result.data())
        }
      })
    })

    const fullName = userData.NAME || ''
    const lastName = userData.LAST_NAME || ''

    let displayName = ''
    if (fullName || lastName) {
      displayName = `${fullName} ${lastName}`.trim()
    } else if (userData.EMAIL) {
      displayName = userData.EMAIL.split('@')[0]
    } else {
      displayName = `Сотрудник ${userData.ID}`
    }

    return {
      id: parseInt(userData.ID) || 0,
      name: displayName,
      lastName: lastName,
      email: userData.EMAIL || ''
    }

  } catch (err) {
    console.warn('Ошибка при получении user.current:', err)

    try {
      const authData = BX24.getAuth()
      if (authData && authData.user_id) {
        return {
          id: parseInt(authData.user_id),
          name: authData.user_name || `Сотрудник ${authData.user_id}`,
          lastName: '',
          email: authData.user_email || ''
        }
      }
    } catch (authError) {
      console.warn('Ошибка при получении BX24.getAuth():', authError)
    }

    return {
      id: 0,
      name: 'Сотрудник',
      lastName: '',
      email: ''
    }
  }
}

const getCurrentWorkdayStatus = async (): Promise<WorkdayInfo | null> => {
  if (!BX24) return null

  try {
    const result = await new Promise<WorkdayInfo>((resolve, reject) => {
      BX24.callMethod('timeman.status', {}, (result: any) => {
        if (result.error()) {
          reject(result.error())
        } else {
          resolve(result.data())
        }
      })
    })
    return result
  } catch (error) {
    console.error('Ошибка получения статуса рабочего дня:', error)
    return null
  }
}

const startWorkday = async (): Promise<WorkdayInfo> => {
  const status = await getCurrentWorkdayStatus()

  if (!status || status.STATUS === 'CLOSED') {
    const params: Record<string, any> = {}
    if (currentUser.value.id && currentUser.value.id > 0) {
      params.USER_ID = currentUser.value.id
    }

    const result = await new Promise<WorkdayInfo>((resolve, reject) => {
      BX24.callMethod('timeman.open', params, (result: any) => {
        if (result.error()) {
          reject(result.error())
        } else {
          resolve(result.data())
        }
      })
    })
    return result
  } else if (status.STATUS === 'OPENED' || status.STATUS === 'PAUSED') {
    statusMessage.value = 'Рабочий день уже начат'
    return status
  } else {
    return status
  }
}

const endWorkday = async (): Promise<WorkdayInfo> => {
  const status = await getCurrentWorkdayStatus()

  if (!status || status.STATUS === 'CLOSED') {
    throw new Error('Рабочий день уже завершен')
  }

  const params: Record<string, any> = {}

  if (currentUser.value.id && currentUser.value.id > 0) {
    params.USER_ID = currentUser.value.id
  }

  if (status && status.STATUS === 'EXPIRED') {
    params.REPORT = 'Завершение истекшего рабочего дня'
  }

  const result = await new Promise<WorkdayInfo>((resolve, reject) => {
    BX24.callMethod('timeman.close', params, (result: any) => {
      if (result.error()) {
        reject(result.error())
      } else {
        resolve(result.data())
      }
    })
  })

  return result
}

const resumeWorkday = async (): Promise<boolean> => {
  try {
    const params: Record<string, any> = {}
    if (currentUser.value.id && currentUser.value.id > 0) {
      params.USER_ID = currentUser.value.id
    }

    const result = await new Promise<WorkdayInfo>((resolve, reject) => {
      BX24.callMethod('timeman.resume', params, (result: any) => {
        if (result.error()) {
          reject(result.error())
        } else {
          resolve(result.data())
        }
      })
    })

    workdayInfo.value = result
    isActionCompleted.value = true
    statusMessage.value = 'Рабочий день возобновлен'

    toast.add({
      description: 'Рабочий день успешно возобновлен',
      variant: 'success'
    })

    setTimeout(() => {
      closeApplication()
    }, props.autoCloseDelay)

    return true
  } catch (resumeError) {
    console.error('Ошибка при возобновлении:', resumeError)
    throw new Error('Не удалось возобновить рабочий день')
  }
}

const closeApplication = (): void => {
  // Очищаем localStorage перед закрытием
  localStorage.removeItem('open_app_mode')
  localStorage.removeItem('modal_type')

  if (typeof BX24 !== 'undefined' && typeof BX24.closeApplication === 'function') {
    BX24.closeApplication()
  } else {
    console.error('Функция BX24.closeApplication недоступна')
    window.close()
  }
}

const executeAction = async (): Promise<void> => {
  if (isProcessing.value || isActionCompleted.value) return

  error.value = null
  statusMessage.value = ''

  if (!BX24) {
    error.value = 'API Битрикс24 недоступно'
    toast.add({
      description: error.value,
      variant: 'error'
    })
    return
  }

  try {
    isProcessing.value = true
    statusMessage.value = isStartMode.value ? 'Начинаем рабочий день...' : 'Завершаем рабочий день...'

    let result: WorkdayInfo
    if (isStartMode.value) {
      result = await startWorkday()
    } else {
      result = await endWorkday()
    }

    workdayInfo.value = result
    isActionCompleted.value = true
    statusMessage.value = isStartMode.value
        ? 'Рабочий день успешно начат'
        : 'Рабочий день успешно завершен'

    toast.add({
      description: statusMessage.value,
      variant: 'success'
    })

    setTimeout(() => {
      closeApplication()
    }, props.autoCloseDelay)

  } catch (err) {
    console.error(`Ошибка при ${isStartMode.value ? 'начале' : 'завершении'} рабочего дня:`, err)

    const bxError = err as BX24Error
    let errorMessage = bxError.error_description || bxError.message || 'Неизвестная ошибка'

    if (bxError.error === 'WRONG_DATETIME') {
      errorMessage = isStartMode.value
          ? 'Дата открытия рабочего дня должна совпадать с текущей календарной датой'
          : 'Дата завершения рабочего дня должна совпадать с датой начала'
    } else if (bxError.error === 'WRONG_DATETIME_FORMAT') {
      errorMessage = 'Неверный формат даты. Используйте формат ATOM (ISO-8601)'
    } else if (bxError.error === 'TIME' && isStartMode.value) {
      errorMessage = 'Нельзя установить время для приостановленного рабочего дня. Рабочий день возобновлен автоматически.'
      await resumeWorkday()
      return
    } else if (bxError.error === 'ACCESS_DENIED' || bxError.error === 'insufficient_scope') {
      errorMessage = 'Недостаточно прав для выполнения операции'
    } else if (bxError.error === 'USER_NOT_FOUND' || bxError.message?.includes('User not found')) {
      errorMessage = 'Пользователь не найден'
    } else if (bxError.error === 'REPORT_REQUIRED') {
      errorMessage = 'Необходимо указать причину завершения рабочего дня'
    }

    error.value = errorMessage
    statusMessage.value = errorMessage

    toast.add({
      description: errorMessage,
      variant: 'error'
    })
  } finally {
    isProcessing.value = false
  }
}

const initializeComponent = async (): Promise<void> => {
  try {
    const user = await loadCurrentUser()
    currentUser.value = user

    const status = await getCurrentWorkdayStatus()
    if (status) {
      workdayInfo.value = status

      if (isStartMode.value && status.STATUS === 'OPENED') {
        isActionCompleted.value = true
        statusMessage.value = 'Рабочий день уже начат'
      }

      if (!isStartMode.value && status.STATUS === 'CLOSED') {
        isActionCompleted.value = true
        statusMessage.value = 'Рабочий день уже завершен'
      }
    }
  } catch (error) {
    console.error('Ошибка инициализации компонента:', error)
  }
}

// Очистка localStorage
const clearModalStorage = () => {
  localStorage.removeItem('open_app_mode')
  localStorage.removeItem('modal_type')
}

onMounted(() => {
  clearModalStorage()

  if (typeof BX24 !== 'undefined') {
    if (BX24.init) {
      BX24.init(async () => {
        await initializeComponent()
      })
    } else {
      initializeComponent()
    }
  } else {
    initializeComponent()
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-white p-4">
    <!-- Основной контент -->
    <div class="text-center w-full">
      <!-- Иконка -->
      <div class="mb-8 flex justify-center">
        <div class="w-24 h-24 rounded-full flex items-center justify-center"
             :class="mode === 'start' ? 'bg-blue-50' : 'bg-orange-50'">
          <PowerIcon class="w-12 h-12" :class="mode === 'start' ? 'text-blue-600' : 'text-orange-600'" />
        </div>
      </div>

      <!-- Заголовок -->
      <h1 class="text-2xl font-bold text-gray-900 mb-4">
        {{ title }}
      </h1>

      <!-- Подзаголовок -->
      <p class="text-gray-600 mb-8" v-if="!isActionCompleted">
        {{ subtitle }}
      </p>
      <p class="text-gray-600 mb-8" v-else>
        {{ completionMessage }}
      </p>

      <!-- Кнопка действия -->
      <div class="mb-4" v-if="!isActionCompleted">
        <B24Button
            @click="executeAction"
            :disabled="isProcessing || isActionCompleted"
            variant="primary"
            size="lg"
            class="w-full h-15 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95"
            :class="buttonClass"
        >
          <div class="flex items-center justify-center">
            <span v-if="!isProcessing && !isActionCompleted">
              {{ buttonText }}
            </span>
            <span v-else-if="isProcessing" class="flex items-center">
              <svg class="w-6 h-6 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ processingText }}
            </span>
            <span v-else-if="isActionCompleted" class="flex items-center">
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M5 13l4 4L19 7" />
              </svg>
              {{ completedText }}
            </span>
          </div>
        </B24Button>
      </div>

      <!-- Статус -->
      <div v-if="statusMessage" class="text-sm mb-6" :class="statusClass">
        {{ statusMessage }}
      </div>

      <!-- Сообщение об ошибке -->
      <div v-if="error" class="mt-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
        <div class="flex items-center justify-center">
          <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span class="text-sm font-medium">{{ error }}</span>
        </div>
      </div>
    </div>

    <!-- Уведомления -->
    <B24NotificationContainer position="top-right" />
  </div>
</template>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.hover\:scale-105:hover {
  transform: scale(1.05);
}

.active\:scale-95:active {
  transform: scale(0.95);
}
</style>