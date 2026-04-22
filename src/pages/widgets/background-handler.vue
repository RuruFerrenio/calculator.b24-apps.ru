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

// Загрузка настроек
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

// Проверка, является ли текущее время рабочим
async function checkIsWorkTime(): Promise<boolean> {
  try {
    const schedule = await BX24.callMethod('timeman.settings.get')
    if (schedule && schedule.data) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTime = currentHour * 60 + currentMinute

      const dayOfWeek = now.getDay()
      const workTime = schedule.data[dayOfWeek]

      if (workTime && workTime.from && workTime.to) {
        const [startHours, startMinutes] = workTime.from.split(':').map(Number)
        const [endHours, endMinutes] = workTime.to.split(':').map(Number)
        const startTime = startHours * 60 + startMinutes
        const endTime = endHours * 60 + endMinutes

        return currentTime >= startTime && currentTime <= endTime
      }
    }
  } catch (error) {
    console.error('Ошибка получения расписания:', error)
  }

  return true
}

// Начало рабочего дня
async function startWorkday(): Promise<void> {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return

  try {
    isProcessing.value = true
    await BX24.callMethod('timeman.open')
    console.log('Рабочий день успешно начат')
  } catch (error) {
    console.error('Ошибка начала рабочего дня:', error)
  } finally {
    isProcessing.value = false
    showStartModal.value = false
  }
}

// Завершение рабочего дня
async function endWorkday(): Promise<void> {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return

  try {
    isProcessing.value = true
    await BX24.callMethod('timeman.close')
    console.log('Рабочий день успешно завершен')
  } catch (error) {
    console.error('Ошибка завершения рабочего дня:', error)
  } finally {
    isProcessing.value = false
    showEndModal.value = false
  }
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

// Проверка необходимости показа модальных окон
async function checkWorkdayStatus(): Promise<void> {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return

  try {
    const currentDayStatus = await BX24.callMethod('timeman.status')

    if (currentDayStatus && currentDayStatus.data) {
      const status = currentDayStatus.data

      // Проверка для начала рабочего дня
      if (workdayStart.value.enabled && status === 'closed') {
        if (workdayStart.value.method === 'modal') {
          showStartModal.value = true
        } else if (workdayStart.value.method === 'auto') {
          await startWorkday()
        }
      }

      // Проверка для завершения рабочего дня
      if (workdayEnd.value.enabled && status === 'opened') {
        const isWorkTime = await checkIsWorkTime()

        if (!isWorkTime) {
          if (workdayEnd.value.method === 'modal') {
            showEndModal.value = true
          } else if (workdayEnd.value.method === 'auto') {
            await endWorkday()
          }
        }
      }
    }
  } catch (error) {
    console.error('Ошибка проверки статуса рабочего дня:', error)
  }
}

// Жизненный цикл
onMounted(async () => {
  if (typeof BX24 !== 'undefined' && BX24.init) {
    BX24.init(async () => {
      isBitrixLoaded.value = true
      await loadSettings()
      await checkWorkdayStatus()
    })
  }
})
</script>

<template>
  <!-- Пустой шаблон - модальные окна должны быть реализованы в родительском компоненте -->
  <!-- Доступные reactive переменные: showStartModal, showEndModal -->
  <!-- Доступные методы: onConfirmStart, onConfirmEnd, onCancelStart, onCancelEnd -->
</template>