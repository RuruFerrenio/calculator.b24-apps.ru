<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Типы данных
interface WorkdaySettings {
  enabled: boolean
  method: 'auto' | 'modal' | 'chat'
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

// Таймер для периодической проверки
let periodicCheckInterval: ReturnType<typeof setInterval> | null = null
let isPageVisible = true

// Конфигурация модальных окон
const MODAL_CONFIG = {
  WIDTH: 500,
  DYNAMIC_PAGE_PATH: '/marketplace/view/app.69e7a5997e44b3.48094201/',
  CHECK_INTERVAL_SECONDS: 10 // Интервал проверки в секундах
}

// Функции для работы с localStorage
function setStoredFlag(key: string, value: string, hours: number): void {
  const data = {
    value: value,
    expires: Date.now() + (hours * 60 * 60 * 1000)
  }
  localStorage.setItem(key, JSON.stringify(data))
}

function getStoredFlag(key: string): string | null {
  const item = localStorage.getItem(key)
  if (!item) return null

  try {
    const data = JSON.parse(item)
    if (Date.now() > data.expires) {
      localStorage.removeItem(key)
      return null
    }
    return data.value
  } catch (e) {
    localStorage.removeItem(key)
    return null
  }
}

function deleteStoredFlag(key: string): void {
  localStorage.removeItem(key)
}

// Функции для работы с кукой (оставляем для других нужд)
function setCookie(name: string, value: string, minutes: number): void {
  const date = new Date()
  date.setTime(date.getTime() + minutes * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  document.cookie = `${name}=${value};${expires};path=/`
}

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
  console.log(`Кука ${name} удалена`)
}

// Очистка всех данных, используемых приложением
function clearAppData(): void {
  deleteCookie('open_app_mode')
  deleteCookie('modal_type')
  // Очищаем флаги из localStorage
  deleteStoredFlag('start_notification_sent')
  deleteStoredFlag('end_notification_sent')
  console.log('Все данные приложения очищены')
}

// Функция для нормализации значений
function normalizeBoolean(value: unknown): boolean {
  return value === 'Y' || value === true || value === 1
}

function normalizeMethod(value: unknown): 'auto' | 'modal' | 'chat' | null {
  if (value === 'auto' || value === 'modal' || value === 'chat') {
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

// Отправка сообщения в чат (с проверкой флага)
function sendChatNotification(userId: number, mode: 'start' | 'end'): void {
  if (typeof BX24 === 'undefined') return

  // Проверяем, было ли уже отправлено уведомление
  const notificationKey = mode === 'start' ? 'start_notification_sent' : 'end_notification_sent'
  const notificationSent = getStoredFlag(notificationKey)

  if (notificationSent === 'true') {
    console.log(`Уведомление для ${mode === 'start' ? 'начала' : 'завершения'} рабочего дня уже было отправлено, пропускаем`)
    return
  }

  const modalUrl = `${MODAL_CONFIG.DYNAMIC_PAGE_PATH}`
  const messageText = mode === 'start'
      ? '🔔 Время начать рабочий день!\n'
      : '🔔 Время завершить рабочий день!\n'

  const buttonText = mode === 'start' ? 'Начать рабочий день' : 'Завершить рабочий день'

  // Устанавливаем флаг перед отправкой (на 24 часа)
  setStoredFlag(notificationKey, 'true', 24)

  // Определяем стили кнопки в зависимости от режима
  const buttonStyles = mode === 'start'
      ? {
        BG_COLOR_TOKEN: 'primary',
        TEXT_COLOR: '#FFFFFF'
      }
      : {
        BG_COLOR_TOKEN: 'alert',
        TEXT_COLOR: '#FFFFFF'
      }

  BX24.callMethod(
      'im.message.add',
      {
        DIALOG_ID: userId.toString(),
        MESSAGE: messageText,
        SYSTEM: 'Y',
        KEYBOARD: {
          BUTTONS: [
            {
              TEXT: buttonText,
              LINK: modalUrl,
              BG_COLOR_TOKEN: buttonStyles.BG_COLOR_TOKEN,
              TEXT_COLOR: buttonStyles.TEXT_COLOR,
            }
          ]
        }
      },
      function(result: any) {
        if (result.error()) {
          console.error(`Ошибка отправки сообщения в чат для ${mode === 'start' ? 'начала' : 'завершения'} рабочего дня:`, result.error())
          // При ошибке удаляем флаг, чтобы можно было повторить позже
          deleteStoredFlag(notificationKey)
        } else {
          console.log(`Сообщение в чат для ${mode === 'start' ? 'начала' : 'завершения'} рабочего дня отправлено успешно`)
        }
      }
  )
}

// Проверка, является ли текущее время рабочим
function checkIsWorkTime(callback: (isWorkTime: boolean) => void): void {
  if (typeof BX24 === 'undefined') {
    callback(true)
    return
  }

  getCurrentUserId(function(userId: number) {
    if (!userId) {
      console.error('Не удалось получить ID пользователя')
      callback(true)
      return
    }

    BX24.callMethod(
        'timeman.settings',
        { USER_ID: userId },
        function(result: any) {
          if (result.error()) {
            console.error('Ошибка получения настроек:', result.error())
            callback(true)
            return
          }

          const settings = result.data()
          console.log('Настройки:', settings)

          // Если свободный график - всегда рабочее время
          if (settings.UF_TM_FREE === true) {
            callback(true)
            return
          }

          // Если учет времени отключен - всегда рабочее время
          if (settings.UF_TIMEMAN !== true) {
            callback(true)
            return
          }

          const now = new Date()
          const currentMinutes = now.getHours() * 60 + now.getMinutes()

          // Парсим время
          const maxStartMinutes = parseTimeToMinutes(settings.UF_TM_MAX_START)
          const minFinishMinutes = parseTimeToMinutes(settings.UF_TM_MIN_FINISH)

          // Рабочее время - между MAX_START и MIN_FINISH
          const isWorkTime = currentMinutes >= maxStartMinutes &&
              currentMinutes <= minFinishMinutes

          console.log(`Текущее время: ${currentMinutes} мин, Рабочее: ${maxStartMinutes}-${minFinishMinutes}, Результат: ${isWorkTime}`)

          callback(isWorkTime)
        }
    )
  })
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
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
          // После успешного начала очищаем флаги уведомлений
          deleteStoredFlag('start_notification_sent')
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
          // После успешного завершения очищаем флаги уведомлений
          deleteStoredFlag('end_notification_sent')
        }
      }
  )
}

// Открытие модального окна через BX24.openApplication
function openWorkdayModal(mode: 'start' | 'end'): void {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return
  if (applicationOpened.value) return

  applicationOpened.value = true

  const modalUrl = `${window.location.origin}${MODAL_CONFIG.DYNAMIC_PAGE_PATH}`
  const modalTitle = mode === 'start' ? 'Начало рабочего дня' : 'Завершение рабочего дня'
  const bgColor = mode === 'start' ? 'green' : 'red'
  const labelText = mode === 'start' ? 'Старт дня' : 'Завершение дня'

  // Устанавливаем куки перед открытием приложения
  setCookie('open_app_mode', 'modal', 1)
  setCookie('modal_type', mode, 1)

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

  // Очищаем куки после закрытия
  deleteCookie('open_app_mode')
  deleteCookie('modal_type')

  if (mode === 'start') {
    showStartModal.value = false
  } else {
    showEndModal.value = false
  }
}

// Проверка необходимости показа модальных окон (основная логика)
function checkWorkdayStatus(): void {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return

  // Проверяем видимость страницы - если страница скрыта, не выполняем проверку
  if (!isPageVisible) {
    console.log('Страница скрыта, пропускаем проверку рабочего дня')
    return
  }

  // Получаем ID текущего пользователя
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

          // Проверка для начала рабочего дня
          if (workdayStart.value.enabled && workDayParams.STATUS === 'CLOSED') {
            // Проверяем, рабочее ли сейчас время для начала дня
            checkIsWorkTime(function(isWorkTime: boolean) {
              if (!isWorkTime) {
                console.log('Сейчас не рабочее время, начало дня не требуется')
                return
              }

              // Дополнительная проверка: если модальное окно уже открыто, не открываем повторно
              if (applicationOpened.value) {
                console.log('Модальное окно уже открыто, пропускаем')
                return
              }

              if (workdayStart.value.method === 'modal') {
                console.log('Открываем модальное окно начала рабочего дня')
                openWorkdayModal('start')
              } else if (workdayStart.value.method === 'auto') {
                console.log('Автоматически запускаем рабочий день')
                startWorkday()
              } else if (workdayStart.value.method === 'chat') {
                console.log('Отправляем сообщение в чат для начала рабочего дня')
                sendChatNotification(userId, 'start')
              }
            })
          } else if (workdayStart.value.enabled && workDayParams.STATUS !== 'CLOSED') {
            // Если статус изменился и не CLOSED, очищаем флаг уведомления
            deleteStoredFlag('start_notification_sent')
          }

          // Проверка для завершения рабочего дня
          if (workdayEnd.value.enabled && workDayParams.STATUS === 'OPENED') {
            checkIsWorkTime(function(isWorkTime: boolean) {
              if (isWorkTime) {
                console.log('Сейчас рабочее время, завершение дня не требуется')
                return
              }

              // Дополнительная проверка: если модальное окно уже открыто, не открываем повторно
              if (applicationOpened.value) {
                console.log('Модальное окно уже открыто, пропускаем')
                return
              }

              if (workdayEnd.value.method === 'modal') {
                console.log('Открываем модальное окно завершения рабочего дня')
                openWorkdayModal('end')
              } else if (workdayEnd.value.method === 'auto') {
                console.log('Автоматически завершаем рабочий день')
                endWorkday()
              } else if (workdayEnd.value.method === 'chat') {
                console.log('Отправляем сообщение в чат для завершения рабочего дня')
                sendChatNotification(userId, 'end')
              }
            })
          } else if (workdayEnd.value.enabled && workDayParams.STATUS !== 'OPENED') {
            // Если статус изменился и не OPENED, очищаем флаг уведомления
            deleteStoredFlag('end_notification_sent')
          }
        }
    )
  })
}

// Запуск периодической проверки
function startPeriodicCheck(): void {
  if (periodicCheckInterval) {
    clearInterval(periodicCheckInterval)
  }

  // Запускаем интервал проверки
  periodicCheckInterval = setInterval(() => {
    console.log(`Периодическая проверка статуса рабочего дня (каждые ${MODAL_CONFIG.CHECK_INTERVAL_SECONDS} сек)`)
    checkWorkdayStatus()
  }, MODAL_CONFIG.CHECK_INTERVAL_SECONDS * 1000)

  console.log(`Запущен периодический таймер проверки (${MODAL_CONFIG.CHECK_INTERVAL_SECONDS} сек)`)
}

// Остановка периодической проверки
function stopPeriodicCheck(): void {
  if (periodicCheckInterval) {
    clearInterval(periodicCheckInterval)
    periodicCheckInterval = null
    console.log('Периодический таймер проверки остановлен')
  }
}

// Обработчик видимости страницы
function handleVisibilityChange(): void {
  const wasVisible = isPageVisible
  isPageVisible = !document.hidden

  if (isPageVisible && !wasVisible) {
    // Страница стала видимой - возобновляем проверки
    console.log('Страница стала видимой, возобновляем проверки')
    startPeriodicCheck()
    // Выполняем немедленную проверку при возвращении
    checkWorkdayStatus()
  } else if (!isPageVisible && wasVisible) {
    // Страница скрыта - останавливаем проверки
    console.log('Страница скрыта, останавливаем проверки')
    stopPeriodicCheck()
  }
}

// Жизненный цикл
onMounted(async () => {
  // НЕ очищаем данные полностью при загрузке!
  // Очищаем только временные куки для модальных окон
  deleteCookie('open_app_mode')
  deleteCookie('modal_type')

  // Флаги уведомлений НЕ очищаем, чтобы предотвратить повторную отправку

  // Устанавливаем обработчик видимости страницы
  document.addEventListener('visibilitychange', handleVisibilityChange)
  // Инициализируем состояние видимости
  isPageVisible = !document.hidden

  console.log('Работает встройка!')
  if (typeof BX24 !== 'undefined' && BX24.init) {
    BX24.init(async () => {
      console.log('REST API доступен')
      isBitrixLoaded.value = true
      await loadSettings()

      // Выполняем первую проверку
      checkWorkdayStatus()

      // Запускаем периодическую проверку (только если страница видима)
      if (isPageVisible) {
        startPeriodicCheck()
      }
    })
  }
})

// Очистка при размонтировании компонента
onUnmounted(() => {
  // Удаляем обработчик видимости
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  // Останавливаем периодический таймер
  stopPeriodicCheck()
  // Очищаем только временные куки
  deleteCookie('open_app_mode')
  deleteCookie('modal_type')
})
</script>

<template>
  <!-- Пустой шаблон - модальные окна открываются через BX24.openApplication -->
</template>