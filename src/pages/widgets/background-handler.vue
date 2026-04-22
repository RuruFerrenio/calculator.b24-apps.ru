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
const applicationOpened = ref(false)

// Настройки рабочего дня
const workdayStart = ref<WorkdaySettings>({
  enabled: false,
  method: 'modal'
})

const workdayEnd = ref<WorkdaySettings>({
  enabled: false,
  method: 'modal'
})

// Состояние модальных окон (для внутреннего использования)
const showStartModal = ref(false)
const showEndModal = ref(false)

// Конфигурация модальных окон
const MODAL_CONFIG = {
  WIDTH: 500,
  DYNAMIC_PAGE_PATH: '/dist/widgets/dynamic-page'
}

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

// Получение ID текущего пользователя
function getCurrentUserId(callback: (userId: number) => void): void {
  if (typeof BX24 === 'undefined') return

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

// Получение полного имени пользователя
function getUserFullName(callback: (fullName: string) => void): void {
  if (typeof BX24 === 'undefined') return

  BX24.callMethod(
      'user.current',
      {},
      function(result: any) {
        if (result.error()) {
          console.error('Ошибка получения пользователя:', result.error())
          callback('Пользователь')
          return
        }

        const user = result.data()
        const firstName = user.NAME || ''
        const lastName = user.LAST_NAME || ''
        const fullName = `${firstName} ${lastName}`.trim()
        callback(fullName || user.EMAIL || 'Пользователь')
      }
  )
}

// Проверка, является ли текущее время рабочим
function checkIsWorkTime(callback: (isWorkTime: boolean) => void): void {
  if (typeof BX24 === 'undefined') {
    callback(true)
    return
  }

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

// Начало рабочего дня
function startWorkday(): void {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return

  isProcessing.value = true
  BX24.callMethod(
      'timeman.open',
      {},
      function(result: any) {
        isProcessing.value = false

        if (result.error()) {
          console.error('Ошибка начала рабочего дня:', result.error())
        } else {
          console.log('Рабочий день успешно начат')
        }
      }
  )
}

// Завершение рабочего дня
function endWorkday(): void {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return

  isProcessing.value = true
  BX24.callMethod(
      'timeman.close',
      {},
      function(result: any) {
        isProcessing.value = false

        if (result.error()) {
          console.error('Ошибка завершения рабочего дня:', result.error())
        } else {
          console.log('Рабочий день успешно завершен')
        }
      }
  )
}

// Открытие модального окна через BX24.openApplication
function openWorkdayModal(mode: 'start' | 'end'): void {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return
  if (applicationOpened.value) return

  applicationOpened.value = true

  // Записываем в userOption режим modal перед открытием
  BX24.userOption.set('open_app_mode', 'modal', function() {
    console.log('Режим modal сохранен в userOption')
  })

  const modalUrl = `${window.location.origin}${MODAL_CONFIG.DYNAMIC_PAGE_PATH}`
  const modalTitle = mode === 'start' ? 'Начало рабочего дня' : 'Завершение рабочего дня'
  const bgColor = mode === 'start' ? 'green' : 'red'
  const labelText = mode === 'start' ? 'Старт дня' : 'Завершение дня'

  const modalSettings = {
    opened: true,
    title: modalTitle,
    label: {
      bgColor: bgColor,
      text: labelText,
      color: '#ffffff',
    },
    width: MODAL_CONFIG.WIDTH,
  }

  BX24.openApplication({}, function() {
    onModalClosed(mode)
  }, modalSettings)
}

// Обработчик закрытия модального окна
function onModalClosed(mode: 'start' | 'end'): void {
  applicationOpened.value = false

  // Возвращаем режим default после закрытия
  BX24.userOption.set('open_app_mode', 'default', function() {
    console.log('Режим default сохранен в userOption')
  })

  if (mode === 'start') {
    showStartModal.value = false
  } else {
    showEndModal.value = false
  }

  // После закрытия модалки проверяем статус рабочего дня и выполняем действие если нужно
  if (mode === 'start') {
    startWorkday()
  } else {
    endWorkday()
  }
}

// Обработчики для модальных окон (для обратной совместимости с шаблоном)
function onConfirmStart(): void {
  startWorkday()
  showStartModal.value = false
}

function onConfirmEnd(): void {
  endWorkday()
  showEndModal.value = false
}

function onCancelStart(): void {
  showStartModal.value = false
}

function onCancelEnd(): void {
  showEndModal.value = false
}

// Проверка необходимости показа модальных окон
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

          const workDayParams = result.data()
          console.log('Информация о рабочем дне:', workDayParams)
          console.log('Статус:', workDayParams.STATUS)
          console.log('Настройки:')
          console.log('- Начало дня (включено):', workdayStart.value.enabled)
          console.log('- Начало дня (метод):', workdayStart.value.method)
          console.log('- Завершение дня (включено):', workdayEnd.value.enabled)
          console.log('- Завершение дня (метод):', workdayEnd.value.method)

          // Проверка для начала рабочего дня
          if (workdayStart.value.enabled && workDayParams.STATUS === 'CLOSED') {
            if (workdayStart.value.method === 'modal') {
              console.log('Открываем модальное окно начала рабочего дня через BX24.openApplication')
              openWorkdayModal('start')
            } else if (workdayStart.value.method === 'auto') {
              console.log('Автоматически запускаем рабочий день')
              startWorkday()
            }
          }

          // Проверка для завершения рабочего дня
          if (workdayEnd.value.enabled && workDayParams.STATUS === 'OPENED') {
            checkIsWorkTime(function(isWorkTime: boolean) {
              if (!isWorkTime) {
                if (workdayEnd.value.method === 'modal') {
                  console.log('Открываем модальное окно завершения рабочего дня через BX24.openApplication')
                  openWorkdayModal('end')
                } else if (workdayEnd.value.method === 'auto') {
                  console.log('Автоматически завершаем рабочий день')
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
      console.log('REST API доступен')
      isBitrixLoaded.value = true
      await loadSettings()
      checkWorkdayStatus()
    })
  }
})
</script>

<template>
  <!-- Пустой шаблон - модальные окна открываются через BX24.openApplication -->
  <!--
    Доступные reactive переменные (для обратной совместимости):
    - showStartModal
    - showEndModal

    Доступные методы:
    - onConfirmStart
    - onConfirmEnd
    - onCancelStart
    - onCancelEnd
  -->
</template>