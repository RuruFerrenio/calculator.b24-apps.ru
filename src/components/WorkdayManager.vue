<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

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

// Функции для работы с кукой
function getCookie(name: string): string | null {
  const nameEQ = `${name}=`
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

function clearAppCookies(): void {
  deleteCookie('open_app_mode')
  deleteCookie('modal_type')
}

// Определяем режим из куки
function getModeFromCookie(): WorkdayMode {
  const mode = getCookie('modal_type')
  if (mode === 'start' || mode === 'end') {
    return mode
  }
  // Если куки нет, пробуем получить из URL параметров
  const urlParams = new URLSearchParams(window.location.search)
  const urlMode = urlParams.get('mode')
  if (urlMode === 'start' || urlMode === 'end') {
    return urlMode
  }
  return 'start'
}

const props = withDefaults(defineProps<{
  autoCloseDelay?: number
}>(), {
  autoCloseDelay: 2000
})

const mode = ref<WorkdayMode>(getModeFromCookie())
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

const isStartMode = computed(() => mode.value === 'start')

const title = computed(() => {
  if (isActionCompleted.value) {
    return isStartMode.value ? 'Рабочий день начат' : 'Рабочий день завершен'
  }
  return isStartMode.value ? 'Начало рабочего дня' : 'Завершение рабочего дня'
})

const subtitle = computed(() => {
  if (isStartMode.value) {
    return 'Нажмите кнопку ниже, чтобы начать рабочий день'
  }
  return 'Нажмите кнопку ниже, чтобы завершить рабочий день'
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

  if (isStartMode.value) {
    return {
      'bg-green-600 hover:bg-green-700 text-white': isEnabled,
      'bg-gray-300 text-gray-600 cursor-not-allowed': isDisabled
    }
  } else {
    return {
      'bg-orange-600 hover:bg-orange-700 text-white': isEnabled,
      'bg-gray-300 text-gray-600 cursor-not-allowed': isDisabled
    }
  }
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

const loadCurrentUser = async (): Promise<CurrentUser> => {
  if (!window.BX24) {
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
      window.BX24.callMethod('user.current', {}, (result: any) => {
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
      const authData = window.BX24.getAuth()
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
  if (!window.BX24) return null

  try {
    const result = await new Promise<WorkdayInfo>((resolve, reject) => {
      window.BX24.callMethod('timeman.status', {}, (result: any) => {
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
      window.BX24.callMethod('timeman.open', params, (result: any) => {
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
    window.BX24.callMethod('timeman.close', params, (result: any) => {
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
      window.BX24.callMethod('timeman.resume', params, (result: any) => {
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
  // Очищаем куки перед закрытием
  clearAppCookies()

  if (typeof window.BX24 !== 'undefined' && typeof window.BX24.closeApplication === 'function') {
    window.BX24.closeApplication()
  } else {
    console.error('Функция BX24.closeApplication недоступна')
    window.close()
  }
}

const executeAction = async (): Promise<void> => {
  if (isProcessing.value || isActionCompleted.value) return

  error.value = null
  statusMessage.value = ''

  if (!window.BX24) {
    error.value = 'API Битрикс24 недоступно'
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
        setTimeout(() => {
          closeApplication()
        }, props.autoCloseDelay)
      }

      if (!isStartMode.value && status.STATUS === 'CLOSED') {
        isActionCompleted.value = true
        statusMessage.value = 'Рабочий день уже завершен'
        setTimeout(() => {
          closeApplication()
        }, props.autoCloseDelay)
      }
    }
  } catch (error) {
    console.error('Ошибка инициализации компонента:', error)
  }
}

onMounted(() => {
  if (typeof window.BX24 !== 'undefined') {
    if (window.BX24.init) {
      window.BX24.init(async () => {
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
    <div class="text-center w-full max-w-md">
      <!-- Заголовок -->
      <h1 class="text-2xl font-bold text-gray-900 mb-3">
        {{ title }}
      </h1>

      <!-- Подзаголовок -->
      <p class="text-gray-600 mb-8" v-if="!isActionCompleted">
        {{ subtitle }}
      </p>
      <p class="text-gray-600 mb-8" v-else>
        {{ completionMessage }}
      </p>

      <!-- Информация о пользователе -->
      <div v-if="currentUser.id" class="mb-6 text-sm text-gray-500">
        {{ currentUser.name }}
      </div>

      <!-- Кнопка действия -->
      <div class="mb-4" v-if="!isActionCompleted">
        <button
            @click="executeAction"
            :disabled="isProcessing || isActionCompleted"
            class="w-full py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
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
        </button>
      </div>

      <!-- Статус -->
      <div v-if="statusMessage && !isActionCompleted" class="text-sm mb-4" :class="statusClass">
        {{ statusMessage }}
      </div>

      <!-- Информация о рабочем дне -->
      <div v-if="workdayInfo && !isActionCompleted && workdayInfo.STATUS !== 'CLOSED'" class="mt-6 p-4 bg-gray-50 rounded-lg">
        <div class="text-sm text-gray-600">
          <div class="flex justify-between mb-2">
            <span>Статус:</span>
            <span class="font-medium">{{ getStatusText(workdayInfo.STATUS) }}</span>
          </div>
          <div v-if="workdayInfo.TIME_START" class="flex justify-between mb-2">
            <span>Начало:</span>
            <span class="font-medium">{{ new Date(workdayInfo.TIME_START).toLocaleTimeString('ru-RU') }}</span>
          </div>
          <div v-if="workdayInfo.TIME_PAUSED" class="flex justify-between">
            <span>Пауза:</span>
            <span class="font-medium">{{ new Date(workdayInfo.TIME_PAUSED).toLocaleTimeString('ru-RU') }}</span>
          </div>
        </div>
      </div>

      <!-- Сообщение об ошибке -->
      <div v-if="error" class="mt-6 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
        <div class="flex items-center justify-center">
          <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span class="text-sm font-medium">{{ error }}</span>
        </div>
      </div>
    </div>
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

.hover\:scale-105:hover {
  transform: scale(1.05);
}

.active\:scale-95:active {
  transform: scale(0.95);
}
</style>