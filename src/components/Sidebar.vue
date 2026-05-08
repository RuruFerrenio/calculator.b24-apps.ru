<script setup lang="ts">
import MailOutIcon from '@bitrix24/b24icons-vue/main/MailOutIcon'
import StarIcon from '@bitrix24/b24icons-vue/outline/AiStarsQuestionIcon'
import CalculatorIcon from '@bitrix24/b24icons-vue/main/CalculatorIcon'
import SettingsIcon from '@bitrix24/b24icons-vue/outline/SettingsIcon'
import HomeIcon from '@bitrix24/b24icons-vue/outline/HomeIcon'
import DocumentUpdateIcon from '@bitrix24/b24icons-vue/outline/DocumentUpdateIcon'

import SolutionsSlider from './SolutionsSlider.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Состояние для проверки прав администратора
const isAdmin = ref(false)
let intervalId: number | null = null

// Состояние для SDK
const ysdk = ref<any>(null)
const isSDKReady = ref(false)
let messageHandlerCleanup: (() => void) | null = null
let hasShownInitialAd = ref(false) // Флаг, чтобы показать рекламу только один раз

// Данные из реального iframe игры с ID 494640
const IFRAME_DATA = {
  appId: '494640',
  originHash: '65nr7x2k6wfif3g7nn2j34pe5maxnluw',
  sdkPath: '/sdk/_/v2.ddbf1fbb7b41988ff84e.js',
  yclid: '792744691842940927',
  deviceType: 'desktop',
  originSrc: 'https://app-494640.games.s3.yandex.net/494640/65nr7x2k6wfif3g7nn2j34pe5maxnluw/index.html',

  // Полное окружение, которое ожидает SDK (структура из кода)
  environmentData: {
    sdkBackendURL: 'https://games-backend.yandex.ru',
    APP_VERSION: 'production',
    i18n: {
      lang: 'ru',
      langs: ['ru', 'en', 'tr', 'kk']
    },
    isTelegram: false,
    isVK: false,
    isYandexApp: false,
    serverTime: Date.now(),
    parentTimeOrigin: Date.now(),
    useLSWrapper: true,
    useLSWrapperWithLoad: false,
    // Структура app из кода SDK
    app: {
      id: '494640'
    },
    // Структура request с experiments (то, что вызывало ошибку)
    request: {
      experiments: {
        test1212Payments: false,
        signed: false,
        enableNewAds: true,
        enableRewardedVideo: true,
        enableFullscreenAdv: true,
        enableStickyBanner: true
      }
    },
    // Дополнительные поля, которые могут понадобиться
    features: {
      gamepads: false,
      vibration: false
    },
    deviceInfo: {
      type: 'desktop',
      isMobile: false,
      isTablet: false,
      isDesktop: true
    },
    isIframe: true,
    parentOrigin: 'https://yandex.ru'
  },

  // Опции для инициализации
  optionsData: {
    hasAuth: true,
    features: {
      gamepads: false,
      vibration: false,
      adv: true
    },
    deviceType: 'desktop',
    appId: '494640',
    signed: false
  }
}

// Функция проверки активного маршрута
const isRouteActive = (path: string): boolean => {
  return route.path === path
}

const handleReview = (): void => {
  if (typeof (window as any).BX24 !== 'undefined') {
    (window as any).BX24.init(() => {
      (window as any).BX24.openPath(
          '/marketplace/detail/tekhnogalera.avtomaticheskoe_nachalo_i_zavershenie_rabochego_dnya/',
          function(result: any) {
          }
      );
    });
  } else {
  }
};

// Функция перехода на страницу настроек
const goToSettings = (): void => {
  if (router && isAdmin.value) {
    router.push('/settings')
  }
};

// Функция перехода на главную
const goToMain = (): void => {
  if (router) {
    router.push('/')
  }
};

// Функция перехода на инструкции
const goToInstructions = (): void => {
  if (router) {
    router.push('/instructions')
  }
};

// Функция проверки прав администратора
const checkAdminRights = () => {
  if (typeof (window as any).BX24 !== 'undefined') {
    (window as any).BX24.init(() => {
      const adminStatus = (window as any).BX24.isAdmin()

      if (isAdmin.value !== adminStatus) {
        isAdmin.value = adminStatus
      }
    })
  } else {
    if (isAdmin.value !== false) {
      isAdmin.value = false
    }
  }
}

// Настройка параметров URL как в реальном iframe
const setupUrlParams = () => {
  const currentUrl = new URL(window.location.href)

  if (!currentUrl.searchParams.has('yclid')) {
    currentUrl.searchParams.set('yclid', IFRAME_DATA.yclid)
  }

  if (!currentUrl.searchParams.has('sdk')) {
    currentUrl.searchParams.set('sdk', IFRAME_DATA.sdkPath)
  }

  if (!currentUrl.searchParams.has('app-id')) {
    currentUrl.searchParams.set('app-id', IFRAME_DATA.appId)
  }

  if (!currentUrl.searchParams.has('device-type')) {
    currentUrl.searchParams.set('device-type', IFRAME_DATA.deviceType)
  }

  const newHash = `#origin=${encodeURIComponent('https://yandex.ru')}&app-id=${IFRAME_DATA.appId}&device-type=${IFRAME_DATA.deviceType}`
  if (window.location.hash !== newHash) {
    window.location.hash = newHash
  }

  window.history.replaceState({}, '', currentUrl.toString())
  console.log('🎮 URL настроен:', window.location.href)
}

// Эмуляция родительского окна
const setupParentWindowEmulator = () => {
  console.log('🎮 Настройка эмулятора родительского окна')

  // Устанавливаем глобальные переменные, которые ожидает SDK
  ;(window as any).YandexGamesSDKEnvironment = IFRAME_DATA.environmentData
  ;(window as any).__YA_GAMES_APP_ID__ = IFRAME_DATA.appId

  // Эмулируем Promise для loadEnvironment
  ;(window as any).loadEnvironmentPromise = Promise.resolve({
    enviroment: IFRAME_DATA.environmentData,
    options: IFRAME_DATA.optionsData
  })

  // Карта ответов на запросы SDK
  const getResponseForAction = (actionName: string, messageId: string, data?: any) => {
    switch (actionName) {
      case 'GET_IFRAME_ORIGIN_SRC':
        return {
          source: 'YandexGamesSDK',
          messageId: messageId,
          payload: `${IFRAME_DATA.originSrc}?yclid=${IFRAME_DATA.yclid}&sdk=${IFRAME_DATA.sdkPath}&app-id=${IFRAME_DATA.appId}&device-type=${IFRAME_DATA.deviceType}#origin=${encodeURIComponent('https://yandex.ru')}&app-id=${IFRAME_DATA.appId}&device-type=${IFRAME_DATA.deviceType}`
        }

      case 'GET_ENVIRONMENT':
      case 'VT':
        return {
          source: 'YandexGamesSDK',
          messageId: messageId,
          data: {
            enviroment: IFRAME_DATA.environmentData,
            options: IFRAME_DATA.optionsData
          }
        }

      case 'GET_OPTIONS':
      case 'Gd':
        return {
          source: 'YandexGamesSDK',
          messageId: messageId,
          data: IFRAME_DATA.optionsData
        }

      case 'GET_BANNER_ADV_STATUS':
        return {
          source: 'YandexGamesSDK',
          messageId: messageId,
          data: { stickyAdvIsShowing: false }
        }

      case 'SHOW_BANNER_ADV':
        return {
          source: 'YandexGamesSDK',
          messageId: messageId,
          data: { stickyAdvIsShowing: true }
        }

      case 'HIDE_BANNER_ADV':
        return {
          source: 'YandexGamesSDK',
          messageId: messageId,
          data: { stickyAdvIsShowing: false }
        }

      case 'CHECK_AVAILABILITY':
      case 'sC':
        return {
          source: 'YandexGamesSDK',
          messageId: messageId,
          data: { isAvailable: true }
        }

      default:
        return null
    }
  }

  // Обработчик сообщений
  const messageHandler = (event: MessageEvent) => {
    let data: any

    try {
      data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
    } catch {
      return
    }

    if (data && data.source === 'YandexGamesSDK') {
      console.log('🎮 Получено сообщение:', data.actionName)

      const response = getResponseForAction(data.actionName, data.messageId, data)
      if (response) {
        setTimeout(() => {
          event.source?.postMessage(JSON.stringify(response), '*')
          console.log('✅ Ответ отправлен на:', data.actionName)
        }, 10)
      }
    }
  }

  window.addEventListener('message', messageHandler)
  return () => window.removeEventListener('message', messageHandler)
}

// Загрузка SDK
const loadYandexSDK = () => {
  return new Promise((resolve, reject) => {
    if (typeof (window as any).YaGames !== 'undefined') {
      console.log('✅ Yandex SDK уже загружен')
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://yandex.ru/games/sdk/v2'
    script.async = true
    script.onload = () => {
      console.log('✅ Yandex Games SDK загружен')
      resolve(true)
    }
    script.onerror = () => {
      console.error('❌ Ошибка загрузки Yandex SDK')
      reject(false)
    }
    document.head.appendChild(script)
  })
}

// Инициализация SDK
const initYandexSDK = async () => {
  setupUrlParams()
  messageHandlerCleanup = setupParentWindowEmulator()

  // Устанавливаем глобальное окружение ДО загрузки SDK
  ;(window as any).YandexGamesSDKEnvironment = IFRAME_DATA.environmentData

  try {
    await loadYandexSDK()

    if (typeof (window as any).YaGames !== 'undefined') {
      console.log('🎮 Инициализация Яндекс SDK...')

      const sdk = await (window as any).YaGames.init()
      ysdk.value = sdk
      isSDKReady.value = true
      console.log('✅ Яндекс SDK инициализирован успешно')

      if (sdk && sdk.ready) {
        await sdk.ready()
        console.log('✅ SDK готов')
      }
    }
  } catch (error: any) {
    console.error('❌ Ошибка инициализации:', error)
    isSDKReady.value = false
  }
}

// Показать полноэкранную рекламу
const showFullscreenAd = () => {
  if (!ysdk.value?.adv) {
    console.warn('⚠️ SDK не инициализирован для показа рекламы')
    return
  }

  console.log('📺 Вызов полноэкранной рекламы...')

  ysdk.value.adv.showFullscreenAdv({
    callbacks: {
      onOpen: () => {
        console.log('📺 Полноэкранная реклама открыта')
      },
      onClose: (wasShown: boolean) => {
        if (wasShown) {
          console.log('✅ Полноэкранная реклама показана и закрыта')
        } else {
          console.log('ℹ️ Полноэкранная реклама не показана (возможно, слишком частый вызов или реклама не загрузилась)')
        }
      },
      onError: (error: any) => {
        console.error('❌ Ошибка при показе полноэкранной рекламы:', error)
      }
    }
  })
}

// Показать rewarded рекламу
const showRewardedAd = () => {
  if (!ysdk.value?.adv) {
    console.warn('⚠️ SDK не инициализирован для показа rewarded рекламы')
    return
  }

  console.log('🎁 Вызов rewarded рекламы...')

  ysdk.value.adv.showRewardedVideo({
    callbacks: {
      onOpen: () => {
        console.log('🎁 Rewarded реклама открыта')
      },
      onRewarded: () => {
        console.log('🎉 Пользователь получил награду за просмотр рекламы!')
      },
      onClose: (wasShown: boolean) => {
        if (wasShown) {
          console.log('✅ Rewarded реклама показана и закрыта')
        } else {
          console.log('ℹ️ Rewarded реклама не показана')
        }
      },
      onError: (error: any) => {
        console.error('❌ Ошибка при показе rewarded рекламы:', error)
      }
    }
  })
}

// Показать рекламу при загрузке страницы
const showAdOnLoad = async () => {
  // Ждем, пока SDK будет готов
  let attempts = 0
  const maxAttempts = 30 // Максимум 3 секунды (30 * 100ms)

  const waitForSDK = setInterval(() => {
    attempts++

    if (isSDKReady.value && ysdk.value?.adv) {
      clearInterval(waitForSDK)
      console.log('🎮 SDK готов, показываем рекламу при загрузке...')

      // Небольшая задержка перед показом рекламы
      setTimeout(() => {
        showFullscreenAd()
      }, 500)
    } else if (attempts >= maxAttempts) {
      clearInterval(waitForSDK)
      console.warn('⚠️ SDK не готов для показа рекламы при загрузке')
    }
  }, 100)
}

// Инициализация
const initialize = async () => {
  checkAdminRights()
  await initYandexSDK()

  // Показываем рекламу при загрузке (если SDK готов)
  await showAdOnLoad()

  if (intervalId === null) {
    intervalId = window.setInterval(() => {
      checkAdminRights()
    }, 5000)
  }
}

// Очистка
const cleanup = () => {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
  if (messageHandlerCleanup) {
    messageHandlerCleanup()
  }
}

onMounted(() => {
  initialize()
})

onUnmounted(() => {
  cleanup()
})

defineExpose({
  showFullscreenAd,
  showRewardedAd,
  isSDKReady
})
</script>

<template>
  <div class="lg:sticky lg:top-6 space-y-6">
    <B24Card>
      <div class="p-0 md:p-6">
        <div class="space-y-6">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalculatorIcon class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Калькулятор под рукой</h3>
              <p class="text-sm text-gray-500">Версия 1.0.0</p>
            </div>
          </div>

          <div class="space-y-3">
            <h4 class="text-sm font-medium text-gray-900">Меню</h4>
            <nav class="space-y-2">
              <div
                  @click="goToMain"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer"
                  :class="isRouteActive('/') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'"
              >
                <HomeIcon :class="isRouteActive('/') ? 'w-5 h-5 mr-3 text-blue-600' : 'w-5 h-5 mr-3 text-gray-500'" />
                Главная
              </div>

              <div
                  v-if="isAdmin"
                  @click="goToSettings"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer"
                  :class="isRouteActive('/settings') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'"
              >
                <SettingsIcon :class="isRouteActive('/settings') ? 'w-5 h-5 mr-3 text-blue-600' : 'w-5 h-5 mr-3 text-gray-500'" />
                Настройки
              </div>

              <div
                  v-else
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-400 cursor-not-allowed"
                  title="Доступно только администраторам"
              >
                <SettingsIcon class="w-5 h-5 mr-3 text-gray-400" />
                Настройки
              </div>

              <div
                  @click="goToInstructions"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer"
                  :class="isRouteActive('/instructions') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'"
              >
                <DocumentUpdateIcon :class="isRouteActive('/instructions') ? 'w-5 h-5 mr-3 text-blue-600' : 'w-5 h-5 mr-3 text-gray-500'" />
                Инструкция
              </div>

              <a
                  href="mailto:technogalera@yandex.ru?subject=Поддержка приложения"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <MailOutIcon class="w-5 h-5 mr-3 text-gray-500" />
                Техническая поддержка
              </a>

              <div
                  @click="handleReview"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <StarIcon class="w-5 h-5 mr-3 text-gray-500" />
                Оставить отзыв
              </div>
            </nav>
          </div>
        </div>
      </div>
    </B24Card>

    <SolutionsSlider />
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.cursor-not-allowed {
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .text-3xl {
    font-size: 1.875rem;
  }

  .text-xl {
    font-size: 1.25rem;
  }
}
</style>