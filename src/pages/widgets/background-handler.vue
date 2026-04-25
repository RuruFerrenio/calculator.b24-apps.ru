<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Типы данных
interface WorkdaySettings {
  enabled: boolean
  method: 'auto' | 'modal' | 'chat' | 'push'
}

interface WeekendActivitySettings {
  enabled: boolean
}

// Состояние компонента
const isBitrixLoaded = ref(false)
const isProcessing = ref(false)
const currentUserId = ref<number | null>(null)
const applicationOpened = ref(false)
const isTimemanAvailable = ref<boolean | null>(null) // null - не проверено, false - недоступен, true - доступен

// Настройки рабочего дня
const workdayStart = ref<WorkdaySettings>({
  enabled: false,
  method: 'modal'
})

const workdayEnd = ref<WorkdaySettings>({
  enabled: false,
  method: 'modal'
})

// Настройка активности в выходные
const weekendActivity = ref<WeekendActivitySettings>({
  enabled: false
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

// ==========================================================================
// ФУНКЦИЯ ПРОВЕРКИ ДОСТУПНОСТИ МЕТОДА timeman.status
// ==========================================================================

/**
 * Проверяет доступность метода timeman.status через API Битрикс24
 * @returns Promise<boolean> - true если метод доступен, false если нет
 */
async function checkTimemanAvailability(): Promise<boolean> {
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
        console.log('Методы timeman доступны')
      } else {
        console.warn('Методы timeman не доступны')
      }

      resolve(isAvailable)
    })
  })
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
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`
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
}

// Очистка всех данных, используемых приложением
function clearAppData(): void {
  deleteCookie('open_app_mode')
  deleteCookie('modal_type')
  // Очищаем флаги из localStorage
  deleteStoredFlag('start_notification_sent')
  deleteStoredFlag('end_notification_sent')
}

// Функция для нормализации значений
function normalizeBoolean(value: unknown): boolean {
  return value === 'Y' || value === true || value === 1
}

function normalizeMethod(value: unknown): 'auto' | 'modal' | 'chat' | 'push' | null {
  if (value === 'auto' || value === 'modal' || value === 'chat' || value === 'push') {
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
      workdayEndMethod,
      weekendActivityEnabled
    ] = await Promise.all([
      BX24.appOption.get('workday_start_enabled'),
      BX24.appOption.get('workday_start_method'),
      BX24.appOption.get('workday_end_enabled'),
      BX24.appOption.get('workday_end_method'),
      BX24.appOption.get('weekend_activity_enabled')
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

    weekendActivity.value.enabled = normalizeBoolean(weekendActivityEnabled)

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

// Проверка, является ли текущий день выходным
function checkIsWeekend(callback: (isWeekend: boolean) => void): void {
  if (typeof BX24 === 'undefined') {
    callback(false)
    return
  }

  getCurrentUserId(function(userId: number) {
    if (!userId) {
      console.error('Не удалось получить ID пользователя')
      callback(false)
      return
    }

    BX24.callMethod(
        'timeman.settings',
        { USER_ID: userId },
        function(result: any) {
          if (result.error()) {
            console.error('Ошибка получения настроек для проверки выходных:', result.error())
            callback(false)
            return
          }

          const settings = result.data()
          const now = new Date()
          const currentDayOfWeek = now.getDay() // 0 - воскресенье, 6 - суббота

          // Определяем, является ли сегодня выходным
          let isWeekend = false

          // Если установлен свободный график - выходных нет
          if (settings.UF_TM_FREE === true) {
            callback(false)
            return
          }

          // Проверяем по дням недели из настроек рабочего графика
          // Обычно рабочие дни с понедельника по пятницу
          if (currentDayOfWeek === 0 || currentDayOfWeek === 6) {
            isWeekend = true
          }

          // Дополнительная проверка: если установлен сменный график
          if (settings.SCHEDULE_ID) {
            // Здесь можно добавить логику для сменного графика, если необходимо
            // По умолчанию считаем субботу и воскресенье выходными
            isWeekend = (currentDayOfWeek === 0 || currentDayOfWeek === 6)
          }

          callback(isWeekend)
        }
    )
  })
}

// Проверка, можно ли выполнять действия сегодня (учитывая настройку выходных)
function shouldAllowActivity(callback: (allow: boolean) => void): void {
  checkIsWeekend(function(isWeekend: boolean) {
    if (isWeekend && !weekendActivity.value.enabled) {
      callback(false)
    } else {
      callback(true)
    }
  })
}

// Отправка push-уведомления
function sendPushNotification(userId: number, mode: 'start' | 'end'): void {
  if (typeof BX24 === 'undefined') return

  // Проверяем, можно ли выполнять действия сегодня
  shouldAllowActivity(function(allow: boolean) {
    if (!allow) return

    // Проверяем, было ли уже отправлено уведомление
    const notificationKey = mode === 'start' ? 'start_notification_sent' : 'end_notification_sent'
    const notificationSent = getStoredFlag(notificationKey)

    if (notificationSent === 'true') {
      return
    }

    const modalUrl = `${MODAL_CONFIG.DYNAMIC_PAGE_PATH}`
    const title = mode === 'start' ? '[B]Начало рабочего дня[/B]' : '[B]Завершение рабочего дня[/B]'
    const message = mode === 'start'
        ? 'Время начать рабочий день!'
        : 'Время завершить рабочий день!'

    const buttonText = mode === 'start' ? 'Начать рабочий день' : 'Завершить рабочий день'
    const colorToken = mode === 'start' ? 'primary' : 'alert'

    // Устанавливаем флаг перед отправкой (на 24 часа)
    setStoredFlag(notificationKey, 'true', 24)

    // Используем im.notify для отправки push-уведомления с правильной структурой ATTACH
    BX24.callMethod(
        'im.notify.system.add',
        {
          USER_ID: userId,
          MESSAGE: title,
          MESSAGE_OUT: message,
          TAG: `workday_${mode}_${Date.now()}`,
          SUB_TAG: `workday_${mode}`,
          ATTACH: {
            ID: 1,
            COLOR_TOKEN: colorToken,
            BLOCKS: [
              {
                MESSAGE: ``
              },
              {
                LINK: {
                  NAME: buttonText,
                  LINK: modalUrl
                }
              }
            ]
          }
        },
        function(result: any) {
          if (result.error()) {
            console.error(`Ошибка отправки push-уведомления для ${mode === 'start' ? 'начала' : 'завершения'} рабочего дня:`, result.error())
            // При ошибке удаляем флаг, чтобы можно было повторить позже
            deleteStoredFlag(notificationKey)
          } else {
          }
        }
    )
  })
}

// Отправка сообщения в чат (с проверкой флага)
function sendChatNotification(userId: number, mode: 'start' | 'end'): void {
  if (typeof BX24 === 'undefined') return

  // Проверяем, можно ли выполнять действия сегодня
  shouldAllowActivity(function(allow: boolean) {
    if (!allow) return

    // Проверяем, было ли уже отправлено уведомление
    const notificationKey = mode === 'start' ? 'start_notification_sent' : 'end_notification_sent'
    const notificationSent = getStoredFlag(notificationKey)

    if (notificationSent === 'true') {
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
          }
        }
    )
  })
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
  if (!isTimemanAvailable.value) {
    console.warn('Метод timeman.status недоступен, пропускаем')
    return
  }

  // Проверяем, можно ли выполнять действия сегодня
  shouldAllowActivity(function(allow: boolean) {
    if (!allow) return

    isProcessing.value = true
    BX24.callMethod(
        'timeman.open',
        {},
        function(result: any) {
          isProcessing.value = false

          if (result.error()) {
          } else {
            // После успешного начала очищаем флаги уведомлений
            deleteStoredFlag('start_notification_sent')
          }
        }
    )
  })
}

// Завершение рабочего дня
function endWorkday(): void {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return
  if (!isTimemanAvailable.value) {
    console.warn('Метод timeman.status недоступен, пропускаем')
    return
  }

  // Проверяем, можно ли выполнять действия сегодня
  shouldAllowActivity(function(allow: boolean) {
    if (!allow) return

    isProcessing.value = true
    BX24.callMethod(
        'timeman.close',
        {},
        function(result: any) {
          isProcessing.value = false

          if (result.error()) {
          } else {
            // После успешного завершения очищаем флаги уведомлений
            deleteStoredFlag('end_notification_sent')
          }
        }
    )
  })
}

// Открытие модального окна через BX24.openApplication
function openWorkdayModal(mode: 'start' | 'end'): void {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return
  if (applicationOpened.value) return
  if (!isTimemanAvailable.value) {
    console.warn('Метод timeman.status недоступен, пропускаем')
    return
  }

  // Проверяем, можно ли выполнять действия сегодня
  shouldAllowActivity(function(allow: boolean) {
    if (!allow) return

    applicationOpened.value = true

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
  })
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
  // ГЛАВНАЯ ПРОВЕРКА: если метод timeman.status НЕ доступен, ничего не делаем
  if (isTimemanAvailable.value === false) {
    return
  }

  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return

  // Проверяем видимость страницы - если страница скрыта, не выполняем проверку
  if (!isPageVisible) {
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

          // Проверка для начала рабочего дня
          if (workdayStart.value.enabled && workDayParams.STATUS === 'CLOSED') {
            // Проверяем, рабочее ли сейчас время для начала дня
            checkIsWorkTime(function(isWorkTime: boolean) {
              if (!isWorkTime) {
                return
              }

              // Дополнительная проверка: если модальное окно уже открыто, не открываем повторно
              if (applicationOpened.value) {
                return
              }

              if (workdayStart.value.method === 'modal') {
                openWorkdayModal('start')
              } else if (workdayStart.value.method === 'auto') {
                startWorkday()
              } else if (workdayStart.value.method === 'chat') {
                sendChatNotification(userId, 'start')
              } else if (workdayStart.value.method === 'push') {
                sendPushNotification(userId, 'start')
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
                return
              }

              // Дополнительная проверка: если модальное окно уже открыто, не открываем повторно
              if (applicationOpened.value) {
                return
              }

              if (workdayEnd.value.method === 'modal') {
                openWorkdayModal('end')
              } else if (workdayEnd.value.method === 'auto') {
                endWorkday()
              } else if (workdayEnd.value.method === 'chat') {
                sendChatNotification(userId, 'end')
              } else if (workdayEnd.value.method === 'push') {
                sendPushNotification(userId, 'end')
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
    checkWorkdayStatus()
  }, MODAL_CONFIG.CHECK_INTERVAL_SECONDS * 1000)

}

// Остановка периодической проверки
function stopPeriodicCheck(): void {
  if (periodicCheckInterval) {
    clearInterval(periodicCheckInterval)
    periodicCheckInterval = null
  }
}

// Обработчик видимости страницы
function handleVisibilityChange(): void {
  const wasVisible = isPageVisible
  isPageVisible = !document.hidden

  if (isPageVisible && !wasVisible) {
    // Страница стала видимой - возобновляем проверки
    if (isTimemanAvailable.value === true) {
      startPeriodicCheck()
      // Выполняем немедленную проверку при возвращении
      checkWorkdayStatus()
    }
  } else if (!isPageVisible && wasVisible) {
    // Страница скрыта - останавливаем проверки
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

  if (typeof BX24 !== 'undefined' && BX24.init) {
    BX24.init(async () => {
      isBitrixLoaded.value = true

      // ======================================================================
      // ГЛАВНАЯ ПРОВЕРКА ДОСТУПНОСТИ МЕТОДА timeman.status
      // Если метод недоступен - приложение не выполняет никакой логики
      // ======================================================================
      isTimemanAvailable.value = await checkTimemanAvailability()

      if (!isTimemanAvailable.value) {
        console.warn('Методы timeman не доступны. Приложение будет работать в режиме ожидания без выполнения активной логики.')
        // Метод недоступен - загружаем настройки, НО не запускаем проверки
        await loadSettings()
        return
      }

      // ======================================================================
      // ТОЛЬКО ЕСЛИ МЕТОД ДОСТУПЕН - выполняем всю остальную логику
      // ======================================================================

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