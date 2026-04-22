<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Типы данных
interface WorkdaySettings {
  enabled: boolean
  method: 'auto' | 'modal'
}

// Состояние компонента
const isBitrixLoaded = ref(false)
const isProcessing = ref(false)
const currentUserId = ref<number | null>(null)

// Настройки рабочего дня
const workdayStart = ref<WorkdaySettings>({
  enabled: false,
  method: 'modal'
})

const workdayEnd = ref<WorkdaySettings>({
  enabled: false,
  method: 'modal'
})

// Состояние модальных окон
const showStartModal = ref(false)
const showEndModal = ref(false)

// Функция для нормализации значений
function normalizeBoolean(value: unknown): boolean {
  return value === 'Y' || value === true || value === 1
}

function normalizeMethod(value: unknown): 'auto' | 'modal' | null {
  if (value === 'auto' || value === 'modal') {
    return value
  }
  return null
}

// Загрузка настроек (оставляем как было с Promise)
async function loadSettings(): Promise<void> {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return

  try {
    const [
      workdayStartEnabled,
      workdayStartMethod,
      workdayEndEnabled,
      workdayEndMethod
    ] = await Promise.all([
      BX24.appOption.get('workday_start_enabled'),
      BX24.appOption.get('workday_start_method'),
      BX24.appOption.get('workday_end_enabled'),
      BX24.appOption.get('workday_end_method')
    ])

    workdayStart.value.enabled = normalizeBoolean(workdayStartEnabled)
    const startMethod = normalizeMethod(workdayStartMethod)
    if (startMethod) {
      workdayStart.value.method = startMethod
    }

    workdayEnd.value.enabled = normalizeBoolean(workdayEndEnabled)
    const endMethod = normalizeMethod(workdayEndMethod)
    if (endMethod) {
      workdayEnd.value.method = endMethod
    }

  } catch (error) {
    console.error('Ошибка загрузки настроек:', error)
  }
}

// Получение ID текущего пользователя
function getCurrentUserId(callback: (userId: number) => void): void {
  BX24.callMethod(
      'user.current',
      {},
      function(result: any) {
        if (result.error()) {
          console.error('Ошибка получения текущего пользователя:', result.error())
          return
        }

        const user = result.data()
        callback(user.ID)
      }
  )
}

// Проверка, является ли текущее время рабочим (переделываем на callback)
function checkIsWorkTime(callback: (isWorkTime: boolean) => void): void {
  BX24.callMethod(
      'timeman.settings.get',
      {},
      function(result: any) {
        if (result.error()) {
          console.error('Ошибка получения расписания:', result.error())
          callback(true)
          return
        }

        const schedule = result.data()
        if (schedule) {
          const now = new Date()
          const currentHour = now.getHours()
          const currentMinute = now.getMinutes()
          const currentTime = currentHour * 60 + currentMinute

          const dayOfWeek = now.getDay()
          const workTime = schedule[dayOfWeek]

          if (workTime && workTime.from && workTime.to) {
            const [startHours, startMinutes] = workTime.from.split(':').map(Number)
            const [endHours, endMinutes] = workTime.to.split(':').map(Number)
            const startTime = startHours * 60 + startMinutes
            const endTime = endHours * 60 + endMinutes

            callback(currentTime >= startTime && currentTime <= endTime)
          } else {
            callback(true)
          }
        } else {
          callback(true)
        }
      }
  )
}

// Начало рабочего дня (переделываем на callback)
function startWorkday(): void {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return

  isProcessing.value = true
  BX24.callMethod(
      'timeman.open',
      {},
      function(result: any) {
        isProcessing.value = false
        showStartModal.value = false

        if (result.error()) {
          console.error('Ошибка начала рабочего дня:', result.error())
        } else {
          console.log('Рабочий день успешно начат')
        }
      }
  )
}

// Завершение рабочего дня (переделываем на callback)
function endWorkday(): void {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return

  isProcessing.value = true
  BX24.callMethod(
      'timeman.close',
      {},
      function(result: any) {
        isProcessing.value = false
        showEndModal.value = false

        if (result.error()) {
          console.error('Ошибка завершения рабочего дня:', result.error())
        } else {
          console.log('Рабочий день успешно завершен')
        }
      }
  )
}

// Обработчики для модальных окон
function onConfirmStart(): void {
  startWorkday()
}

function onConfirmEnd(): void {
  endWorkday()
}

function onCancelStart(): void {
  showStartModal.value = false
}

function onCancelEnd(): void {
  showEndModal.value = false
}

// Проверка необходимости показа модальных окон (переделываем на callback)
function checkWorkdayStatus(): void {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return

  // Сначала получаем ID текущего пользователя
  getCurrentUserId(function(userId: number) {
    currentUserId.value = userId

    BX24.callMethod(
        'timeman.status',
        {
          'USER_ID': userId
        },
        function(result: any) {
          if (result.error()) {
            console.error('Ошибка проверки статуса рабочего дня:', result.error())
            return
          }

          const status = result.data()
          console.log('Информация о рабочем дне:', status)

          // Проверка для начала рабочего дня
          if (workdayStart.value.enabled && status === 'closed') {
            console.log('Открываем модалку начала рабочего дня')
            if (workdayStart.value.method === 'modal') {
              showStartModal.value = true
            } else if (workdayStart.value.method === 'auto') {
              startWorkday()
            }
          }

          // Проверка для завершения рабочего дня
          if (workdayEnd.value.enabled && status === 'opened') {
            console.log('Открываем модалку завершения рабочего дня')
            checkIsWorkTime(function(isWorkTime: boolean) {
              if (!isWorkTime) {
                if (workdayEnd.value.method === 'modal') {
                  showEndModal.value = true
                } else if (workdayEnd.value.method === 'auto') {
                  endWorkday()
                }
              }
            })
          }
        }
    )
  })
}

// Жизненный цикл
onMounted(async () => {
  console.log('Работает встройка!')
  if (typeof BX24 !== 'undefined' && BX24.init) {
    BX24.init(async () => {
      console.log('Рест доступен')
      isBitrixLoaded.value = true
      await loadSettings()
      checkWorkdayStatus()
    })
  }
})
</script>

<template>
  <!-- Пустой шаблон - модальные окна должны быть реализованы в родительском компоненте -->
  <!-- Доступные reactive переменные: showStartModal, showEndModal -->
  <!-- Доступные методы: onConfirmStart, onConfirmEnd, onCancelStart, onCancelEnd -->
</template>