<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useToast } from '@bitrix24/b24ui-nuxt/composables/useToast'
import PowerIcon from '@bitrix24/b24icons-vue/outline/PowerIcon'
import CalendarIcon from '@bitrix24/b24icons-vue/outline/CalendarIcon'
import ClockIcon from '@bitrix24/b24icons-vue/outline/ClockIcon'
import CircleCheckIcon from '@bitrix24/b24icons-vue/outline/CircleCheckIcon'
import InfoCircleIcon from '@bitrix24/b24icons-vue/main/InfoCircleIcon'
import NoteCircleIcon from '@bitrix24/b24icons-vue/main/NoteCircleIcon'
import RefreshIcon from '@bitrix24/b24icons-vue/outline/RefreshIcon'

type WorkdayStatus = 'OPENED' | 'CLOSED' | 'EXPIRED'

interface WorkdayInfo {
  STATUS: WorkdayStatus
  TIME_START?: string
  TIME_FINISH?: string
  DURATION?: string
  TIME_LEAKS?: string
  [key: string]: any
}

interface UserProfile {
  ID: number
  NAME: string
  LAST_NAME: string
  SECOND_NAME?: string
  FULL_NAME: string
  EMAIL: string
  WORK_POSITION: string
  PERSONAL_PHOTO?: string
  IS_ONLINE: 'Y' | 'N'
}

const toast = useToast()

const isBitrixLoaded = ref(false)
const isLoading = ref(true)
const isProcessing = ref(false)
const workdayInfo = ref<WorkdayInfo | null>(null)
const currentUser = ref<UserProfile | null>(null)
const error = ref<string | null>(null)
const isRefreshing = ref(false)

// Флаг доступности метода timeman.status
const isTimemanAvailable = ref<boolean | null>(null) // null - не проверено, false - недоступен, true - доступен

let refreshInterval: ReturnType<typeof setInterval> | null = null
let isPageVisible = true

// Кэш профилей пользователей
const userProfilesCache = ref<Record<number, UserProfile>>({})

// Вычисляемые свойства для статуса
const statusText = computed(() => {
  if (!workdayInfo.value) return 'Неизвестно'

  const statusMap: Record<WorkdayStatus, string> = {
    'OPENED': 'Рабочий день активен',
    'CLOSED': 'Рабочий день не начат',
    'EXPIRED': 'Рабочий день истек'
  }
  return statusMap[workdayInfo.value.STATUS] || workdayInfo.value.STATUS
})

const statusIcon = computed(() => {
  if (!workdayInfo.value) return InfoCircleIcon

  const iconMap: Record<WorkdayStatus, any> = {
    'OPENED': CircleCheckIcon,
    'CLOSED': InfoCircleIcon,
    'EXPIRED': NoteCircleIcon
  }
  return iconMap[workdayInfo.value.STATUS] || InfoCircleIcon
})

const statusColor = computed(() => {
  if (!workdayInfo.value) return 'text-gray-500'

  const colorMap: Record<WorkdayStatus, string> = {
    'OPENED': 'text-green-600',
    'CLOSED': 'text-gray-500',
    'EXPIRED': 'text-red-600'
  }
  return colorMap[workdayInfo.value.STATUS] || 'text-gray-500'
})

const statusBgColor = computed(() => {
  if (!workdayInfo.value) return 'bg-gray-100'

  const colorMap: Record<WorkdayStatus, string> = {
    'OPENED': 'bg-green-50 border-green-200',
    'CLOSED': 'bg-gray-50 border-gray-200',
    'EXPIRED': 'bg-red-50 border-red-200'
  }
  return colorMap[workdayInfo.value.STATUS] || 'bg-gray-100 border-gray-200'
})

const statusChipColor = computed(() => {
  if (!workdayInfo.value) return 'air-secondary-accent'

  const colorMap: Record<WorkdayStatus, string> = {
    'OPENED': 'air-primary-success',
    'CLOSED': 'air-secondary-accent',
    'EXPIRED': 'air-primary-alert'
  }
  return colorMap[workdayInfo.value.STATUS] || 'air-secondary-accent'
})

const canStartWorkday = computed(() => {
  return workdayInfo.value && workdayInfo.value.STATUS === 'CLOSED'
})

const canEndWorkday = computed(() => {
  return workdayInfo.value && workdayInfo.value.STATUS === 'OPENED'
})

const buttonText = computed(() => {
  if (canStartWorkday.value) return 'Начать рабочий день'
  if (canEndWorkday.value) return 'Завершить рабочий день'
  return 'Рабочий день'
})

// Показывать ли основной контент (если метод доступен)
const showMainContent = computed(() => {
  return isTimemanAvailable.value === true && !error.value
})

// Показывать ли сообщение о недоступности (если метод не доступен)
const showUnavailableMessage = computed(() => {
  return isTimemanAvailable.value === false
})

// Вспомогательные функции
const formatTime = (dateTimeStr?: string): string => {
  if (!dateTimeStr) return '—'
  try {
    const date = new Date(dateTimeStr)
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateTimeStr
  }
}

const formatDate = (dateTimeStr?: string): string => {
  if (!dateTimeStr) return '—'
  try {
    const date = new Date(dateTimeStr)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateTimeStr
  }
}

const formatDuration = (durationStr?: string): string => {
  if (!durationStr) return '—'
  try {
    const seconds = parseInt(durationStr)
    if (!isNaN(seconds)) {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      if (hours > 0) {
        return `${hours} ч ${minutes} мин`
      }
      return `${minutes} мин`
    }
  } catch {
    return durationStr
  }
  return durationStr
}

const getUserInitials = (user: UserProfile | null): string => {
  if (!user) return '?'
  const firstName = user.NAME || ''
  const lastName = user.LAST_NAME || ''
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase()
  }
  if (firstName) return firstName.substring(0, 2).toUpperCase()
  if (user.EMAIL) return user.EMAIL.substring(0, 2).toUpperCase()
  return 'С'
}

const getUserPhoto = (user: UserProfile | null): string | null => {
  return user?.PERSONAL_PHOTO || null
}

const getFullName = (userData: any): string => {
  const parts = []
  if (userData.NAME) parts.push(userData.NAME)
  if (userData.LAST_NAME) parts.push(userData.LAST_NAME)
  if (userData.SECOND_NAME) parts.push(userData.SECOND_NAME)
  return parts.join(' ') || `Пользователь ${userData.ID}`
}

// ==========================================================================
// ПРОВЕРКА ДОСТУПНОСТИ МЕТОДА timeman.status
// ==========================================================================

/**
 * Проверяет доступность метода timeman.status через API Битрикс24
 * @returns Promise<boolean> - true если метод доступен, false если нет
 */
const checkTimemanAvailability = async (): Promise<boolean> => {
  if (typeof BX24 === 'undefined') {
    console.warn('⚠️ BX24 не загружен')
    return false
  }

  return new Promise((resolve) => {
    BX24.callMethod('method.get', {
      name: 'timeman.status'
    }, (result: any) => {
      if (result.error()) {
        console.warn('⚠️ Метод method.get вернул ошибку:', result.error())
        resolve(false)
        return
      }

      const methodData = result.data()
      // Метод доступен только если он существует И доступен для вызова
      const isAvailable = methodData.isExisting && methodData.isAvailable

      if (isAvailable) {
        console.log('✅ Метод timeman.status доступен')
      } else {
        console.warn('❌ Метод timeman.status НЕ доступен. Требуется тариф "Профессиональный"')
      }

      resolve(isAvailable)
    })
  })
}

// API вызовы
const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') {
    return null
  }

  try {
    const result = await new Promise<any>((resolve, reject) => {
      BX24.callMethod('user.current', {}, (result: any) => {
        if (result.error()) {
          reject(result.error())
        } else {
          resolve(result.data())
        }
      })
    })

    const userProfile: UserProfile = {
      ID: parseInt(result.ID),
      NAME: result.NAME || '',
      LAST_NAME: result.LAST_NAME || '',
      SECOND_NAME: result.SECOND_NAME || '',
      FULL_NAME: getFullName(result),
      EMAIL: result.EMAIL || '',
      WORK_POSITION: result.WORK_POSITION || '',
      PERSONAL_PHOTO: result.PERSONAL_PHOTO,
      IS_ONLINE: result.IS_ONLINE || 'N'
    }

    userProfilesCache.value[userProfile.ID] = userProfile
    return userProfile
  } catch (err) {
    console.error('Ошибка получения пользователя:', err)
    return null
  }
}

const getWorkdayStatus = async (): Promise<WorkdayInfo | null> => {
  // Если метод недоступен, сразу возвращаем null
  if (!isTimemanAvailable.value) {
    return null
  }

  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') {
    return null
  }

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
  } catch (err) {
    console.error('Ошибка получения статуса рабочего дня:', err)
    error.value = 'Не удалось получить статус рабочего дня'
    return null
  }
}

const startWorkdayAPI = async (): Promise<void> => {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return
  if (!isTimemanAvailable.value) {
    throw new Error('Метод timeman.status недоступен')
  }

  return new Promise((resolve, reject) => {
    BX24.callMethod('timeman.open', {}, (result: any) => {
      if (result.error()) {
        reject(result.error())
      } else {
        resolve(result.data())
      }
    })
  })
}

const endWorkdayAPI = async (): Promise<void> => {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return
  if (!isTimemanAvailable.value) {
    throw new Error('Метод timeman.status недоступен')
  }

  return new Promise((resolve, reject) => {
    BX24.callMethod('timeman.close', {}, (result: any) => {
      if (result.error()) {
        reject(result.error())
      } else {
        resolve(result.data())
      }
    })
  })
}

// Основные действия
const refreshData = async () => {
  if (isRefreshing.value) return
  // Если метод недоступен, не пытаемся обновлять данные
  if (isTimemanAvailable.value === false) return

  isRefreshing.value = true

  try {
    const [user, status] = await Promise.all([
      getCurrentUserProfile(),
      getWorkdayStatus()
    ])

    if (user) currentUser.value = user
    if (status) workdayInfo.value = status

    error.value = null
  } catch (err) {
    console.error('Ошибка обновления данных:', err)
    error.value = 'Ошибка при обновлении данных'
  } finally {
    isRefreshing.value = false
    isLoading.value = false
  }
}

const handleStartWorkday = async () => {
  if (isProcessing.value) return
  if (isTimemanAvailable.value === false) {
    toast.add({
      description: 'Функция недоступна на вашем тарифе. Требуется тариф "Профессиональный"',
      variant: 'error'
    })
    return
  }

  isProcessing.value = true
  error.value = null

  try {
    await startWorkdayAPI()
    toast.add({
      description: 'Рабочий день успешно начат',
      variant: 'success'
    })
    await refreshData()
  } catch (err: any) {
    console.error('Ошибка начала рабочего дня:', err)
    const errorMessage = err.error_description || err.message || 'Ошибка при начале рабочего дня'
    error.value = errorMessage
    toast.add({
      description: errorMessage,
      variant: 'error'
    })
  } finally {
    isProcessing.value = false
  }
}

const handleEndWorkday = async () => {
  if (isProcessing.value) return
  if (isTimemanAvailable.value === false) {
    toast.add({
      description: 'Функция недоступна на вашем тарифе. Требуется тариф "Профессиональный"',
      variant: 'error'
    })
    return
  }

  isProcessing.value = true
  error.value = null

  try {
    await endWorkdayAPI()
    toast.add({
      description: 'Рабочий день успешно завершен',
      variant: 'success'
    })
    await refreshData()
  } catch (err: any) {
    console.error('Ошибка завершения рабочего дня:', err)
    const errorMessage = err.error_description || err.message || 'Ошибка при завершении рабочего дня'
    error.value = errorMessage
    toast.add({
      description: errorMessage,
      variant: 'error'
    })
  } finally {
    isProcessing.value = false
  }
}

const handleMainAction = () => {
  if (canStartWorkday.value) {
    handleStartWorkday()
  } else if (canEndWorkday.value) {
    handleEndWorkday()
  }
}

// Обработчики видимости страницы
const handleVisibilityChange = () => {
  const wasVisible = isPageVisible
  isPageVisible = !document.hidden

  if (isPageVisible && !wasVisible && isTimemanAvailable.value === true) {
    refreshData()
  }
}

const startAutoRefresh = () => {
  if (refreshInterval) clearInterval(refreshInterval)
  refreshInterval = setInterval(() => {
    if (isPageVisible && isTimemanAvailable.value === true) {
      refreshData()
    }
  }, 30000) // Обновляем каждые 30 секунд
}

// Жизненный цикл
onMounted(() => {
  if (typeof BX24 !== 'undefined' && BX24.init) {
    BX24.init(async () => {
      isBitrixLoaded.value = true

      // ======================================================================
      // ГЛАВНАЯ ПРОВЕРКА ДОСТУПНОСТИ МЕТОДА timeman.status
      // ======================================================================
      isTimemanAvailable.value = await checkTimemanAvailability()

      if (!isTimemanAvailable.value) {
        console.warn('❌ Метод timeman.status НЕ ДОСТУПЕН. Требуется тариф "Профессиональный"')
        isLoading.value = false
        return
      }

      // ======================================================================
      // ТОЛЬКО ЕСЛИ МЕТОД ДОСТУПЕН - выполняем всю остальную логику
      // ======================================================================
      console.log('✅ Метод timeman.status ДОСТУПЕН. Приложение работает в полном режиме.')

      await refreshData()
      startAutoRefresh()
    })
  } else if (typeof BX24 !== 'undefined') {
    isBitrixLoaded.value = true

    // Асинхронная проверка доступности
    checkTimemanAvailability().then((isAvailable) => {
      isTimemanAvailable.value = isAvailable

      if (!isAvailable) {
        isLoading.value = false
        return
      }

      refreshData()
      startAutoRefresh()
    })
  } else {
    isLoading.value = false
    error.value = 'API Битрикс24 не обнаружен. Убедитесь, что приложение запущено в среде Битрикс24.'
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  isPageVisible = !document.hidden
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <!-- B24User вместо иконки приложения -->
    <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
      <div class="flex items-center justify-between">
        <B24User
            v-if="currentUser && showMainContent"
            :name="currentUser.FULL_NAME"
            :description="currentUser.WORK_POSITION || 'Должность не указана'"
            size="lg"
            :avatar="{
              src: getUserPhoto(currentUser),
              initials: getUserInitials(currentUser)
            }"
            :chip="{
              color: currentUser.IS_ONLINE === 'Y' ? 'air-primary-success' : 'air-secondary-accent',
              position: 'top-right'
            }"
            class="truncate overflow-visible"
        />
        <div v-else-if="!showUnavailableMessage" class="flex items-center gap-3">
          <div class="p-2 bg-blue-100 rounded-full">
            <PowerIcon class="w-5 h-5 text-blue-600" />
          </div>
          <span class="font-medium text-gray-700">Загрузка...</span>
        </div>

        <!-- Кнопка обновления (только если метод доступен) -->
        <B24Button
            v-if="showMainContent"
            @click="refreshData"
            :disabled="isRefreshing"
            variant="ghost"
            size="sm"
            class="p-2 w-9 h-9"
            :class="{ 'animate-spin': isRefreshing }"
            title="Обновить данные"
            :icon="RefreshIcon"
        >
        </B24Button>
      </div>
      <div v-if="currentUser && showMainContent" class="mt-2 text-xs text-gray-500 pl-12">
        {{ currentUser.EMAIL }}
      </div>
    </div>

    <!-- Содержимое -->
    <div class="p-6">
      <!-- Сообщение о недоступности метода (требуется Профессиональный тариф) -->
      <div v-if="showUnavailableMessage" class="text-center py-8">
        <div class="mb-4">
          <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Функция недоступна
        </h3>
        <p class="text-gray-600 mb-2">
          Для работы с учетом рабочего времени требуется тариф
        </p>
        <p class="text-lg font-bold text-blue-600 mb-4">
          «Профессиональный»
        </p>
        <p class="text-sm text-gray-500">
          Пожалуйста, обратитесь к администратору вашего Битрикс24<br>
          для перехода на соответствующий тарифный план.
        </p>
      </div>

      <!-- Состояние загрузки (только если метод доступен) -->
      <div v-else-if="isLoading && showMainContent" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Ошибка (только если метод доступен) -->
      <div v-else-if="error && showMainContent" class="text-center py-6">
        <div class="text-red-600 mb-3 text-sm">{{ error }}</div>
        <B24Button size="sm" @click="refreshData">Попробовать снова</B24Button>
      </div>

      <!-- Данные о рабочем дне (только если метод доступен) -->
      <div v-else-if="showMainContent">
        <!-- Статус -->
        <div class="mb-6">
          <div
              class="flex items-center gap-3 p-3 rounded-lg border"
              :class="statusBgColor"
          >
            <div class="p-1 rounded-full bg-white/50">
              <component :is="statusIcon" class="w-5 h-5" :class="statusColor" />
            </div>
            <div class="flex-1">
              <span class="font-medium" :class="statusColor">{{ statusText }}</span>
            </div>
            <B24Badge
                :color="statusChipColor"
                size="sm"
                variant="soft"
            >
              {{ workdayInfo?.STATUS === 'OPENED' ? 'В работе' :
                workdayInfo?.STATUS === 'EXPIRED' ? 'Просрочен' : 'Ожидание' }}
            </B24Badge>
          </div>
        </div>

        <!-- Кнопки действий -->
        <div class="flex flex-col gap-2">
          <B24Button
              v-if="canStartWorkday || canEndWorkday"
              @click="handleMainAction"
              :disabled="isProcessing"
              :color="canStartWorkday ? 'air-primary-success' : 'air-primary-alert'"
              size="lg"
              class="w-full"
          >
            <template #leading>
              <svg v-if="isProcessing" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <PowerIcon v-else class="w-4 h-4" />
            </template>
            {{ isProcessing ? 'Обработка...' : buttonText }}
          </B24Button>
        </div>
      </div>
    </div>
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