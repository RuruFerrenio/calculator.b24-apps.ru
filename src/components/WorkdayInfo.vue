<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useToast } from '@bitrix24/b24ui-nuxt/composables/useToast'
import PowerIcon from '@bitrix24/b24icons-vue/outline/PowerIcon'
import CalendarIcon from '@bitrix24/b24icons-vue/outline/CalendarIcon'
import ClockIcon from '@bitrix24/b24icons-vue/outline/ClockIcon'
import CircleCheckIcon from '@bitrix24/b24icons-vue/outline/CircleCheckIcon'
import InfoCircleIcon from '@bitrix24/b24icons-vue/main/InfoCircleIcon'
import NoteCircleIcon from '@bitrix24/b24icons-vue/main/NoteCircleIcon'

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

  if (isPageVisible && !wasVisible) {
    refreshData()
  }
}

const startAutoRefresh = () => {
  if (refreshInterval) clearInterval(refreshInterval)
  refreshInterval = setInterval(() => {
    if (isPageVisible) {
      refreshData()
    }
  }, 30000) // Обновляем каждые 30 секунд
}

// Жизненный цикл
onMounted(() => {
  if (typeof BX24 !== 'undefined' && BX24.init) {
    BX24.init(async () => {
      isBitrixLoaded.value = true
      await refreshData()
      startAutoRefresh()
    })
  } else if (typeof BX24 !== 'undefined') {
    isBitrixLoaded.value = true
    refreshData()
    startAutoRefresh()
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
    <!-- Заголовок -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-100 rounded-lg">
            <PowerIcon class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Рабочий день</h2>
            <p class="text-sm text-gray-500">Информация о текущем рабочем дне</p>
          </div>
        </div>

        <B24Button
            @click="refreshData"
            :disabled="isRefreshing"
            variant="ghost"
            size="sm"
            class="p-2"
            :class="{ 'animate-spin': isRefreshing }"
            title="Обновить данные"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </B24Button>
      </div>
    </div>

    <!-- Контент -->
    <div class="p-6">
      <!-- Состояние загрузки -->
      <div v-if="isLoading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="text-center py-6">
        <div class="text-red-600 mb-3 text-sm">{{ error }}</div>
        <B24Button size="sm" @click="refreshData">Попробовать снова</B24Button>
      </div>

      <!-- Данные -->
      <div v-else>
        <!-- Информация о пользователе с использованием B24User -->
        <div v-if="currentUser" class="mb-6 pb-4 border-b border-gray-100">
          <B24User
              :name="currentUser.FULL_NAME"
              :description="currentUser.WORK_POSITION || 'Должность не указана'"
              size="md"
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
          <div class="mt-2 text-xs text-gray-500 pl-12">
            {{ currentUser.EMAIL }}
          </div>
        </div>

        <!-- Статус -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Статус на сегодня</span>
          </div>
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

        <!-- Детали рабочего дня -->
        <div class="space-y-3 mb-6">
          <!-- Время начала -->
          <div v-if="workdayInfo?.TIME_START" class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 text-gray-500">
              <CalendarIcon class="w-4 h-4" />
              <span>Начало дня:</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">{{ formatDate(workdayInfo.TIME_START) }}</span>
              <ClockIcon class="w-4 h-4 text-gray-400" />
              <span class="text-gray-700">{{ formatTime(workdayInfo.TIME_START) }}</span>
            </div>
          </div>

          <!-- Время завершения -->
          <div v-if="workdayInfo?.TIME_FINISH && workdayInfo.STATUS === 'CLOSED'" class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 text-gray-500">
              <CalendarIcon class="w-4 h-4" />
              <span>Завершение дня:</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">{{ formatDate(workdayInfo.TIME_FINISH) }}</span>
              <ClockIcon class="w-4 h-4 text-gray-400" />
              <span class="text-gray-700">{{ formatTime(workdayInfo.TIME_FINISH) }}</span>
            </div>
          </div>

          <!-- Отработанное время -->
          <div v-if="workdayInfo?.DURATION" class="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
            <div class="flex items-center gap-2 text-gray-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Отработано:</span>
            </div>
            <span class="font-semibold text-gray-900">{{ formatDuration(workdayInfo.DURATION) }}</span>
          </div>
        </div>

        <!-- Кнопки действий -->
        <div class="flex flex-col gap-2">
          <B24Button
              v-if="canStartWorkday || canEndWorkday"
              @click="handleMainAction"
              :disabled="isProcessing"
              :color="canStartWorkday ? 'air-primary' : 'air-primary-warning'"
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