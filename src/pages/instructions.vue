<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Импорт иконок (остается без изменений)
import SettingsIcon from '@bitrix24/b24icons-vue/outline/SettingsIcon'
import AlertIcon from '@bitrix24/b24icons-vue/outline/AlertIcon'
import CircleCheckIcon from '@bitrix24/b24icons-vue/outline/CircleCheckIcon'
import TableEditorIcon from '@bitrix24/b24icons-vue/editor/TableEditorIcon'
import InfoCircleIcon from '@bitrix24/b24icons-vue/outline/InfoCircleIcon'
import CursorClickIcon from '@bitrix24/b24icons-vue/outline/CursorClickIcon'
import RocketIcon from '@bitrix24/b24icons-vue/outline/RocketIcon'
import ChatsWithCheckIcon from '@bitrix24/b24icons-vue/outline/ChatsWithCheckIcon'
import MobileSelectedIcon from '@bitrix24/b24icons-vue/outline/MobileSelectedIcon'

// Иконки для методов
import PlayLIcon from '@bitrix24/b24icons-vue/outline/PlayLIcon'
import WindowScreenIcon from '@bitrix24/b24icons-vue/social/WindowScreenIcon'
import NotificationIcon from '@bitrix24/b24icons-vue/outline/NotificationIcon'

// Реактивные переменные
const bitrixDomain = ref('') // Изменено с windowLocationOrigin на bitrixDomain
const selectedMethod = ref<string | null>(null)

// Данные о методах (без изменений)
const methods = [
  {
    name: 'Автоматический',
    icon: PlayLIcon,
    iconClass: 'text-green-500',
    shortDescription: 'Действие выполняется автоматически без участия сотрудника',
    pros: [
      'Не отвлекает сотрудников',
      'Полная автоматизация процесса',
      'Идеально для формального учёта времени'
    ],
    cons: [
      'Сотрудник не контролирует процесс',
      'Возможны ошибки при синхронизации'
    ]
  },
  {
    name: 'Модальное окно',
    icon: WindowScreenIcon,
    iconClass: 'text-blue-500',
    shortDescription: 'Всплывающее окно с кнопкой действия, пока не будет выполнено',
    pros: [
      'Действие нельзя пропустить',
      'Максимальная вовлечённость сотрудника',
      'Подходит для обязательного учёта времени'
    ],
    cons: [
      'Может раздражать сотрудников',
      'Требует ручного подтверждения'
    ]
  },
  {
    name: 'Сообщение в чате',
    icon: ChatsWithCheckIcon,
    iconClass: 'text-purple-500',
    shortDescription: 'Уведомление отправляется в чат Битрикс24',
    pros: [
      'Удобно для команд, работающих в чатах',
      'Действие можно выполнить прямо из чата',
      'Остаётся история уведомлений'
    ],
    cons: [
      'Может затеряться среди других сообщений',
      'Требует внимания сотрудника'
    ]
  },
  {
    name: 'Push-уведомление',
    icon: NotificationIcon,
    iconClass: 'text-orange-500',
    shortDescription: 'Мгновенное уведомление в мобильном приложении',
    pros: [
      'Мгновенное оповещение',
      'Подходит для мобильных сотрудников',
      'Высокий охват'
    ],
    cons: [
      'Требует установленного мобильного приложения',
      'Может быть заблокировано настройками телефона'
    ]
  }
]

// Детальные описания методов (без изменений)
function getMethodDetails(methodName: string) {
  const details: Record<string, any> = {
    'Автоматический': {
      title: 'Автоматический метод',
      fullDescription: 'Система самостоятельно выполняет действие (начало или завершение рабочего дня) без какого-либо участия сотрудника. Не требует подтверждения или реакции от пользователя. Рабочий день начинается или завершается в заданное время автоматически.',
      pros: [
        'Не требует действий от сотрудника',
        'Идеально для дисциплинированных команд',
        'Нет риска забыть отметить начало/конец дня'
      ],
      cons: [
        'Сотрудник может не заметить, что день начался/закончился',
        'Не подходит для строгого контроля'
      ]
    },
    'Модальное окно': {
      title: 'Модальное окно с предупреждением',
      fullDescription: 'При каждом открытии страницы портала показывается всплывающее окно с предложением выполнить действие. Окно будет появляться снова и снова, пока сотрудник его не выполнит. Самый надёжный способ уведомления.',
      pros: [
        'Действие невозможно пропустить',
        'Высокая надёжность',
        'Сотрудник точно выполнит действие'
      ],
      cons: [
        'Может раздражать при частом появлении',
        'Требует ручного подтверждения'
      ]
    },
    'Сообщение в чате': {
      title: 'Сообщение в чате',
      fullDescription: 'В чат Битрикс24 (личный или общий) отправляется уведомление с предложением выполнить действие. Сотрудник может нажать на кнопку в сообщении, чтобы выполнить действие. Уведомление остается в истории чата.',
      pros: [
        'Удобно для команд, работающих в чатах',
        'Действие выполняется прямо из чата',
        'Остаётся история уведомлений'
      ],
      cons: [
        'Сообщение может затеряться',
        'Требует внимания сотрудника'
      ]
    },
    'Push-уведомление': {
      title: 'Push-уведомление',
      fullDescription: 'Сотруднику отправляется push-уведомление в мобильное приложение Битрикс24. Нажатие на уведомление открывает портал с предложением выполнить действие. Мгновенный способ доставки.',
      pros: [
        'Мгновенная доставка',
        'Подходит для мобильных сотрудников',
        'Не требует открытого браузера'
      ],
      cons: [
        'Требуется установленное мобильное приложение',
        'Может быть отключено в настройках телефона',
        'Ограничения на некоторых устройствах'
      ]
    }
  }
  return details[methodName] || details['Автоматический']
}

// Типы данных для второго компонента
interface WorkdaySettings {
  enabled: boolean
  method: 'auto' | 'modal' | 'chat' | 'push'
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

// Состояние модальных окон
const showStartModal = ref(false)
const showEndModal = ref(false)

// Таймер для периодической проверки
let periodicCheckInterval: ReturnType<typeof setInterval> | null = null
let isPageVisible = true

// Конфигурация модальных окон
const MODAL_CONFIG = {
  WIDTH: 500,
  DYNAMIC_PAGE_PATH: '/marketplace/view/app.69e7a5997e44b3.48094201/',
  CHECK_INTERVAL_SECONDS: 10
}

// Функции для работы с localStorage (без изменений)
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

// Функции для работы с кукой
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

// Очистка всех данных
function clearAppData(): void {
  deleteCookie('open_app_mode')
  deleteCookie('modal_type')
  deleteStoredFlag('start_notification_sent')
  deleteStoredFlag('end_notification_sent')
  console.log('Все данные приложения очищены')
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

// Загрузка настроек (без изменений)
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

// Отправка push-уведомления - ИСПРАВЛЕНО использование домена
function sendPushNotification(userId: number, mode: 'start' | 'end'): void {
  if (typeof BX24 === 'undefined') return

  const notificationKey = mode === 'start' ? 'start_notification_sent' : 'end_notification_sent'
  const notificationSent = getStoredFlag(notificationKey)

  if (notificationSent === 'true') {
    console.log(`Push-уведомление для ${mode === 'start' ? 'начала' : 'завершения'} рабочего дня уже было отправлено, пропускаем`)
    return
  }

  // Используем bitrixDomain вместо windowLocationOrigin
  const modalUrl = `https://${bitrixDomain.value}${MODAL_CONFIG.DYNAMIC_PAGE_PATH}`
  const title = mode === 'start' ? '[B]Начало рабочего дня[/B]' : '[B]Завершение рабочего дня[/B]'
  const message = mode === 'start'
      ? 'Время начать рабочий день!'
      : 'Время завершить рабочий день!'

  const buttonText = mode === 'start' ? 'Начать рабочий день' : 'Завершить рабочий день'
  const colorToken = mode === 'start' ? 'primary' : 'alert'

  setStoredFlag(notificationKey, 'true', 24)

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
          console.error(`Ошибка отправки push-уведомления:`, result.error())
          deleteStoredFlag(notificationKey)
        } else {
          console.log(`Push-уведомление отправлено успешно`)
        }
      }
  )
}

// Отправка сообщения в чат - ИСПРАВЛЕНО использование домена
function sendChatNotification(userId: number, mode: 'start' | 'end'): void {
  if (typeof BX24 === 'undefined') return

  const notificationKey = mode === 'start' ? 'start_notification_sent' : 'end_notification_sent'
  const notificationSent = getStoredFlag(notificationKey)

  if (notificationSent === 'true') {
    console.log(`Уведомление уже было отправлено, пропускаем`)
    return
  }

  // Используем bitrixDomain вместо windowLocationOrigin
  const modalUrl = `https://${bitrixDomain.value}${MODAL_CONFIG.DYNAMIC_PAGE_PATH}`
  const messageText = mode === 'start'
      ? '🔔 Время начать рабочий день!\n'
      : '🔔 Время завершить рабочий день!\n'

  const buttonText = mode === 'start' ? 'Начать рабочий день' : 'Завершить рабочий день'

  setStoredFlag(notificationKey, 'true', 24)

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
          console.error(`Ошибка отправки сообщения в чат:`, result.error())
          deleteStoredFlag(notificationKey)
        } else {
          console.log(`Сообщение в чат отправлено успешно`)
        }
      }
  )
}

// Открытие модального окна - ИСПРАВЛЕНО использование домена
function openWorkdayModal(mode: 'start' | 'end'): void {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return
  if (applicationOpened.value) return

  applicationOpened.value = true

  // Используем bitrixDomain вместо windowLocationOrigin
  const modalUrl = `https://${bitrixDomain.value}${MODAL_CONFIG.DYNAMIC_PAGE_PATH}`
  const modalTitle = mode === 'start' ? 'Начало рабочего дня' : 'Завершение рабочего дня'
  const bgColor = mode === 'start' ? 'green' : 'red'
  const labelText = mode === 'start' ? 'Старт дня' : 'Завершение дня'

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

// Остальные функции без изменений...
function onModalClosed(mode: 'start' | 'end'): void {
  applicationOpened.value = false
  deleteCookie('open_app_mode')
  deleteCookie('modal_type')

  if (mode === 'start') {
    showStartModal.value = false
  } else {
    showEndModal.value = false
  }
}

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
          deleteStoredFlag('start_notification_sent')
        }
      }
  )
}

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
          deleteStoredFlag('end_notification_sent')
        }
      }
  )
}

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

          if (settings.UF_TM_FREE === true) {
            callback(true)
            return
          }

          if (settings.UF_TIMEMAN !== true) {
            callback(true)
            return
          }

          const now = new Date()
          const currentMinutes = now.getHours() * 60 + now.getMinutes()

          const maxStartMinutes = parseTimeToMinutes(settings.UF_TM_MAX_START)
          const minFinishMinutes = parseTimeToMinutes(settings.UF_TM_MIN_FINISH)

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

function checkWorkdayStatus(): void {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return

  if (!isPageVisible) {
    console.log('Страница скрыта, пропускаем проверку рабочего дня')
    return
  }

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

          if (workdayStart.value.enabled && workDayParams.STATUS === 'CLOSED') {
            checkIsWorkTime(function(isWorkTime: boolean) {
              if (!isWorkTime) {
                console.log('Сейчас не рабочее время, начало дня не требуется')
                return
              }

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
              } else if (workdayStart.value.method === 'push') {
                console.log('Отправляем push-уведомление для начала рабочего дня')
                sendPushNotification(userId, 'start')
              }
            })
          } else if (workdayStart.value.enabled && workDayParams.STATUS !== 'CLOSED') {
            deleteStoredFlag('start_notification_sent')
          }

          if (workdayEnd.value.enabled && workDayParams.STATUS === 'OPENED') {
            checkIsWorkTime(function(isWorkTime: boolean) {
              if (isWorkTime) {
                console.log('Сейчас рабочее время, завершение дня не требуется')
                return
              }

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
              } else if (workdayEnd.value.method === 'push') {
                console.log('Отправляем push-уведомление для завершения рабочего дня')
                sendPushNotification(userId, 'end')
              }
            })
          } else if (workdayEnd.value.enabled && workDayParams.STATUS !== 'OPENED') {
            deleteStoredFlag('end_notification_sent')
          }
        }
    )
  })
}

function startPeriodicCheck(): void {
  if (periodicCheckInterval) {
    clearInterval(periodicCheckInterval)
  }

  periodicCheckInterval = setInterval(() => {
    console.log(`Периодическая проверка статуса рабочего дня (каждые ${MODAL_CONFIG.CHECK_INTERVAL_SECONDS} сек)`)
    checkWorkdayStatus()
  }, MODAL_CONFIG.CHECK_INTERVAL_SECONDS * 1000)

  console.log(`Запущен периодический таймер проверки (${MODAL_CONFIG.CHECK_INTERVAL_SECONDS} сек)`)
}

function stopPeriodicCheck(): void {
  if (periodicCheckInterval) {
    clearInterval(periodicCheckInterval)
    periodicCheckInterval = null
    console.log('Периодический таймер проверки остановлен')
  }
}

function handleVisibilityChange(): void {
  const wasVisible = isPageVisible
  isPageVisible = !document.hidden

  if (isPageVisible && !wasVisible) {
    console.log('Страница стала видимой, возобновляем проверки')
    startPeriodicCheck()
    checkWorkdayStatus()
  } else if (!isPageVisible && wasVisible) {
    console.log('Страница скрыта, останавливаем проверки')
    stopPeriodicCheck()
  }
}

// Функция для получения домена через BX24.getDomain()
function getBitrixDomain(): string | null {
  if (typeof BX24 !== 'undefined' && BX24.getDomain) {
    try {
      const domain = BX24.getDomain()
      if (domain && typeof domain === 'string') {
        console.log('Домен получен через BX24.getDomain():', domain)
        return domain
      }
    } catch (error) {
      console.error('Ошибка при вызове BX24.getDomain():', error)
    }
  }
  return null
}

// Жизненный цикл - ОСНОВНЫЕ ИЗМЕНЕНИЯ ЗДЕСЬ
onMounted(async () => {
  console.log('Компонент смонтирован, инициализация...')

  // Удаляем временные куки
  deleteCookie('open_app_mode')
  deleteCookie('modal_type')

  // Устанавливаем обработчик видимости страницы
  document.addEventListener('visibilitychange', handleVisibilityChange)
  isPageVisible = !document.hidden

  if (typeof BX24 !== 'undefined' && BX24.init) {
    BX24.init(async () => {
      console.log('BX24 инициализирован, REST API доступен')
      isBitrixLoaded.value = true

      // Получаем домен через BX24.getDomain()
      const domain = getBitrixDomain()
      if (domain) {
        bitrixDomain.value = domain
        console.log('Домен успешно установлен:', bitrixDomain.value)
      } else {
        console.error('Не удалось получить домен через BX24.getDomain()')
        // Fallback - пробуем получить из window.location, если не сработало
        if (typeof window !== 'undefined' && window.location) {
          const fallbackDomain = window.location.hostname
          bitrixDomain.value = fallbackDomain
          console.warn('Используем fallback домен:', fallbackDomain)
        }
      }

      // Загружаем настройки
      await loadSettings()

      // Выполняем первую проверку
      checkWorkdayStatus()

      // Запускаем периодическую проверку
      if (isPageVisible) {
        startPeriodicCheck()
      }
    })
  } else {
    console.error('BX24 не доступен')
  }
})

// Очистка при размонтировании
onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopPeriodicCheck()
  deleteCookie('open_app_mode')
  deleteCookie('modal_type')
})
</script>

<template>
  <div class="mx-auto mb-8">
    <!-- Часть 1: Настройка на стороне Битрикс24 -->
    <B24Card class="mb-8">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <SettingsIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Настройка на стороне Битрикс24
          </h2>
        </div>

        <div class="space-y-4 text-gray-700 dark:text-gray-300">
          <div class="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4">
            <div class="flex items-start gap-2">
              <AlertIcon class="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div class="text-sm">
                <p class="font-medium text-yellow-800 dark:text-yellow-400 mb-2">
                  Важное предварительное условие
                </p>
                <p>
                  В разделе
                  <span class="font-semibold bg-yellow-100 dark:bg-yellow-900/50 px-1.5 py-0.5 rounded">Рабочие графики</span>
                  должен быть обязательно заведён <span class="font-semibold">хотя бы один график работы</span>.
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <CircleCheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p>Настройки для приложения берутся для конкретного сотрудника из графика, за которым он закреплён.</p>
          </div>

          <div class="flex items-start gap-3">
            <CircleCheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p>Настройки находятся в подразделе <span class="font-semibold">«Начало и завершение дня»</span> внутри графика работы.</p>
          </div>
        </div>

        <!-- Кнопка перехода к рабочим графикам - ИСПРАВЛЕНО использование bitrixDomain -->
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <B24Button
              :href="`https://${bitrixDomain}/timeman/schedules/`"
              target="_blank"
              color="air-primary"
          >
            <template #left-icon>
              <SettingsIcon class="w-4 h-4" />
            </template>
            Перейти к рабочим графикам
          </B24Button>
        </div>
      </div>
    </B24Card>

    <!-- Остальной шаблон без изменений -->
    <!-- Часть 2: Сравнительная таблица методов -->
    <div class="mb-8">
      <B24Card>
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <TableEditorIcon class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Сравнение методов начала и завершения рабочего дня
          </h2>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Доступно 4 способа уведомления сотрудников. Нажмите на строку с методом для просмотра детального описания.
        </p>

        <B24TableWrapper
            class="overflow-x-auto w-full"
            size="md"
            row-hover
            rounded
            :b24ui="{
            base: '[&>table>thead>tr]:border-gray-200 dark:[&>table>thead>tr]:border-gray-700 [&>table>tbody>tr]:border-gray-100 dark:[&>table>tbody>tr]:border-gray-800'
          }"
        >
          <table class="min-w-full">
            <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="text-left font-medium text-gray-900 dark:text-gray-100 w-1/4">Метод</th>
              <th class="text-left font-medium text-gray-900 dark:text-gray-100 w-1/3">Описание</th>
              <th class="text-left font-medium text-gray-900 dark:text-gray-100 w-1/4">Плюсы</th>
              <th class="text-left font-medium text-gray-900 dark:text-gray-100 w-1/4">Минусы</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="method in methods"
                :key="method.name"
                @click="selectedMethod = selectedMethod === method.name ? null : method.name"
                class="cursor-pointer transition-all duration-200"
                :class="{ 'bg-blue-50 dark:bg-blue-950/30': selectedMethod === method.name }"
            >
              <td class="font-medium text-gray-900 dark:text-gray-100">
                <div class="flex items-center gap-2">
                  <component :is="method.icon" class="w-4 h-4" :class="method.iconClass" />
                  {{ method.name }}
                </div>
              </td>
              <td class="text-gray-600 dark:text-gray-400">{{ method.shortDescription }}</td>
              <td class="text-gray-600 dark:text-gray-400">
                <ul class="list-disc list-inside space-y-0 text-sm">
                  <li v-for="pro in method.pros.slice(0, 2)" :key="pro">{{ pro }}</li>
                </ul>
              </td>
              <td class="text-gray-600 dark:text-gray-400">
                <ul class="list-disc list-inside space-y-0 text-sm">
                  <li v-for="con in method.cons.slice(0, 2)" :key="con">{{ con }}</li>
                </ul>
              </td>
            </tr>
            </tbody>
          </table>
        </B24TableWrapper>

        <!-- Детальное описание выбранного метода -->
        <div v-if="selectedMethod" class="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div class="flex items-start gap-3">
            <InfoCircleIcon class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 class="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                {{ getMethodDetails(selectedMethod).title }}
              </h4>
              <p class="text-sm text-blue-700 dark:text-blue-300 mb-3">
                {{ getMethodDetails(selectedMethod).fullDescription }}
              </p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <CircleCheckIcon class="w-4 h-4 text-green-500" />
                    <p class="text-sm font-medium text-blue-800 dark:text-blue-300">Плюсы:</p>
                  </div>
                  <ul class="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li v-for="pro in getMethodDetails(selectedMethod).pros" :key="pro">{{ pro }}</li>
                  </ul>
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <AlertIcon class="w-4 h-4 text-yellow-500" />
                    <p class="text-sm font-medium text-blue-800 dark:text-blue-300">Минусы:</p>
                  </div>
                  <ul class="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li v-for="con in getMethodDetails(selectedMethod).cons" :key="con">{{ con }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          <CursorClickIcon class="inline-block w-4 h-4 mr-1" />
          Нажмите на строку с методом, чтобы увидеть подробное описание
        </div>
      </B24Card>
    </div>

    <!-- Дополнительная информация о типах методов -->
    <B24Card>
      <div class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <RocketIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Как выбрать подходящий метод?
          </h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <CircleCheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Для дисциплинированных сотрудников</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Подойдёт автоматический метод — сотрудники не будут отвлекаться на уведомления.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <AlertIcon class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Для команд, нуждающихся в контроле</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Модальное окно — самый надёжный способ, так как его нельзя проигнорировать.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <ChatsWithCheckIcon class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Для удалённых команд</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Уведомление в чате — сотрудники активны в чатах и увидят уведомление.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <MobileSelectedIcon class="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Для мобильных сотрудников</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Push-уведомление — сотрудники получат оповещение даже в мобильном приложении.</p>
            </div>
          </div>
        </div>
      </div>
    </B24Card>
  </div>
</template>