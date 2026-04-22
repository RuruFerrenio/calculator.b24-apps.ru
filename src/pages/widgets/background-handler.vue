<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Типы данных
interface WorkdaySettings {
  enabled: boolean
  method: 'auto' | 'modal'
}

interface WorkdayStatus {
  STATUS: 'OPENED' | 'CLOSED' | 'PAUSED' | 'EXPIRED'
  [key: string]: any
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

// Promise-обертка для BX24.callMethod
function callBX24Method<T = any>(method: string, params: any = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof BX24 === 'undefined' || !BX24.callMethod) {
      reject(new Error('BX24 не инициализирован'))
      return
    }

    BX24.callMethod(method, params, (result: any) => {
      if (result.error()) {
        reject(result.error())
      } else {
        resolve(result.data())
      }
    })
  })
}

// Promise-обертка для BX24.appOption.get
function getAppOption<T = any>(key: string): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof BX24 === 'undefined' || !BX24.appOption) {
      reject(new Error('BX24 не инициализирован'))
      return
    }

    BX24.appOption.get(key, (value: T) => {
      resolve(value)
    })
  })
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
      getAppOption('workday_start_enabled'),
      getAppOption('workday_start_method'),
      getAppOption('workday_end_enabled'),
      getAppOption('workday_end_method')
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

    console.log('Настройки загружены:', {
      workdayStart: workdayStart.value,
      workdayEnd: workdayEnd.value
    })
  } catch (error) {
    console.error('Ошибка загрузки настроек:', error)
  }
}

// Получение расписания работы
async function getWorkSchedule(): Promise<any> {
  try {
    const schedule = await callBX24Method('timeman.settings.get')
    console.log('Расписание получено:', schedule)
    return schedule
  } catch (error) {
    console.error('Ошибка получения расписания:', error)
    return null
  }
}

// Проверка, является ли текущее время рабочим
async function checkIsWorkTime(): Promise<boolean> {
  try {
    const schedule = await getWorkSchedule()

    if (schedule && schedule.data) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTime = currentHour * 60 + currentMinute

      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1 // Конвертация для Битрикс (пн=0, вс=6)
      const workTime = schedule.data[dayOfWeek]

      if (workTime && workTime.from && workTime.to) {
        const [startHours, startMinutes] = workTime.from.split(':').map(Number)
        const [endHours, endMinutes] = workTime.to.split(':').map(Number)
        const startTime = startHours * 60 + startMinutes
        const endTime = endHours * 60 + endMinutes

        const isWorkTime = currentTime >= startTime && currentTime <= endTime
        console.log(`Проверка рабочего времени: ${isWorkTime}, текущее: ${currentTime}, рабочее: ${startTime}-${endTime}`)
        return isWorkTime
      }
    }
  } catch (error) {
    console.error('Ошибка получения расписания:', error)
  }

  return true
}

// Получение статуса рабочего дня (исправлено - использует колбек)
async function getWorkdayStatus(): Promise<WorkdayStatus | null> {
  try {
    const status = await callBX24Method<WorkdayStatus>('timeman.status')
    console.log('Статус рабочего дня получен:', status)
    return status
  } catch (error) {
    console.error('Ошибка получения статуса рабочего дня:', error)
    return null
  }
}

// Начало рабочего дня
async function startWorkday(): Promise<boolean> {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return false

  try {
    isProcessing.value = true
    const result = await callBX24Method('timeman.open')
    console.log('Рабочий день успешно начат:', result)
    return true
  } catch (error) {
    console.error('Ошибка начала рабочего дня:', error)
    return false
  } finally {
    isProcessing.value = false
    showStartModal.value = false
  }
}

// Завершение рабочего дня
async function endWorkday(): Promise<boolean> {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return false

  try {
    isProcessing.value = true
    const result = await callBX24Method('timeman.close')
    console.log('Рабочий день успешно завершен:', result)
    return true
  } catch (error) {
    console.error('Ошибка завершения рабочего дня:', error)
    return false
  } finally {
    isProcessing.value = false
    showEndModal.value = false
  }
}

// Обработчики для модальных окон
async function onConfirmStart(): Promise<void> {
  await startWorkday()
}

async function onConfirmEnd(): Promise<void> {
  await endWorkday()
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
    // Получаем статус рабочего дня через Promise-обертку
    const statusData = await getWorkdayStatus()

    if (!statusData) {
      console.warn('Не удалось получить статус рабочего дня')
      return
    }

    const currentStatus = statusData.STATUS
    console.log('Текущий статус рабочего дня:', currentStatus)
    console.log('Настройки начала дня:', workdayStart.value)
    console.log('Настройки завершения дня:', workdayEnd.value)

    // Проверка для начала рабочего дня (статус CLOSED - день не начат)
    if (workdayStart.value.enabled && currentStatus === 'CLOSED') {
      console.log('Условие для начала дня выполнено')

      if (workdayStart.value.method === 'modal') {
        console.log('Показываем модальное окно начала дня')
        showStartModal.value = true
      } else if (workdayStart.value.method === 'auto') {
        console.log('Автоматически начинаем день')
        await startWorkday()
      }
    }

    // Проверка для завершения рабочего дня (статус OPENED - день активен)
    if (workdayEnd.value.enabled && currentStatus === 'OPENED') {
      console.log('Условие для завершения дня выполнено')
      const isWorkTime = await checkIsWorkTime()
      console.log('Рабочее время:', isWorkTime)

      if (!isWorkTime) {
        if (workdayEnd.value.method === 'modal') {
          console.log('Показываем модальное окно завершения дня')
          showEndModal.value = true
        } else if (workdayEnd.value.method === 'auto') {
          console.log('Автоматически завершаем день')
          await endWorkday()
        }
      }
    }
  } catch (error) {
    console.error('Ошибка проверки статуса рабочего дня:', error)
  }
}

// Жизненный цикл
onMounted(async () => {
  console.log('Компонент смонтирован, инициализация...')

  if (typeof BX24 !== 'undefined' && BX24.init) {
    BX24.init(async () => {
      console.log('BX24 инициализирован, REST API доступен')
      isBitrixLoaded.value = true

      // Небольшая задержка для гарантии инициализации
      await new Promise(resolve => setTimeout(resolve, 100))

      await loadSettings()
      await checkWorkdayStatus()

      // Для отладки - выводим доступные методы
      if (typeof BX24.callMethod === 'function') {
        console.log('BX24.callMethod доступен')
      }
    })
  } else {
    console.error('BX24 не найден! Убедитесь, что подключен скрипт https://api.bitrix24.com/api/v1/')
  }
})
</script>

<template>
  <!-- Пустой шаблон - модальные окна должны быть реализованы в родительском компоненте -->
  <!-- Доступные reactive переменные: showStartModal, showEndModal -->
  <!-- Доступные методы: onConfirmStart, onConfirmEnd, onCancelStart, onCancelEnd -->
</template>