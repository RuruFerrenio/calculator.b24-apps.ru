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

// Данные из реального iframe
const IFRAME_DATA = {
  appId: '494640',
  originHash: '65nr7x2k6wfif3g7nn2j34pe5maxnluw',
  sdkPath: '/sdk/_/v2.ddbf1fbb7b41988ff84e.js',
  yclid: '792744691842940927',
  deviceType: 'desktop',
  originSrc: 'https://app-494640.games.s3.yandex.net/494640/65nr7x2k6wfif3g7nn2j34pe5maxnluw/index.html',
  environmentData: {
    sdkBackendURL: 'https://games-backend.yandex.ru',
    APP_VERSION: 'production',
    i18n: { lang: 'ru', langs: ['ru', 'en', 'tr', 'kk'] },
    isTelegram: false,
    isVK: false,
    isYandexApp: false,
    serverTime: Date.now(),
    parentTimeOrigin: Date.now(),
    useLSWrapper: true
  },
  optionsData: {
    hasAuth: true,
    features: { gamepads: false, vibration: false },
    deviceType: 'desktop'
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

  // Добавляем yclid параметр
  if (!currentUrl.searchParams.has('yclid')) {
    currentUrl.searchParams.set('yclid', IFRAME_DATA.yclid)
  }

  // Добавляем sdk параметр
  if (!currentUrl.searchParams.has('sdk')) {
    currentUrl.searchParams.set('sdk', IFRAME_DATA.sdkPath)
  }

  // Обновляем hash с origin, app-id, device-type
  const newHash = `#origin=${encodeURIComponent('https://yandex.ru')}&app-id=${IFRAME_DATA.appId}&device-type=${IFRAME_DATA.deviceType}`
  if (window.location.hash !== newHash) {
    window.location.hash = newHash
  }

  // Обновляем URL без перезагрузки
  window.history.replaceState({}, '', currentUrl.toString())
}

// Эмуляция родительского окна для ответов на postMessage
const setupParentWindowEmulator = () => {
  console.log('🎮 Настройка эмулятора родительского окна для Яндекс SDK')

  // Сохраняем оригинальный postMessage
  const originalPostMessage = window.parent.postMessage

  // Создаем обработчик для подделки ответов
  const messageHandler = (event: MessageEvent) => {
    let data: any

    // Парсим сообщение
    try {
      data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
    } catch {
      return // Не JSON сообщение
    }

    // Проверяем, что это сообщение от SDK
    if (data && data.source === 'YandexGamesSDK') {
      console.log('🎮 Получено сообщение от SDK:', data.actionName, data)

      // Обработка GET_IFRAME_ORIGIN_SRC - самый важный запрос
      if (data.actionName === 'GET_IFRAME_ORIGIN_SRC') {
        const response = {
          source: 'YandexGamesSDK',
          messageId: data.messageId,
          payload: `${IFRAME_DATA.originSrc}?yclid=${IFRAME_DATA.yclid}&sdk=${IFRAME_DATA.sdkPath}#origin=${encodeURIComponent('https://yandex.ru')}&app-id=${IFRAME_DATA.appId}&device-type=${IFRAME_DATA.deviceType}`
        }

        setTimeout(() => {
          event.source?.postMessage(JSON.stringify(response), '*')
          console.log('✅ Отправлен ответ на GET_IFRAME_ORIGIN_SRC')
        }, 10)
        return
      }

      // Обработка запроса окружения (loadEnvironment)
      if (data.actionName === 'GET_ENVIRONMENT') {
        const response = {
          source: 'YandexGamesSDK',
          messageId: data.messageId,
          data: {
            enviroment: IFRAME_DATA.environmentData,
            options: IFRAME_DATA.optionsData
          }
        }

        setTimeout(() => {
          event.source?.postMessage(JSON.stringify(response), '*')
          console.log('✅ Отправлен ответ на GET_ENVIRONMENT')
        }, 10)
        return
      }

      // Получение опций
      if (data.actionName === 'GET_OPTIONS') {
        const response = {
          source: 'YandexGamesSDK',
          messageId: data.messageId,
          data: IFRAME_DATA.optionsData
        }

        setTimeout(() => {
          event.source?.postMessage(JSON.stringify(response), '*')
          console.log('✅ Отправлен ответ на GET_OPTIONS')
        }, 10)
        return
      }

      // Получение статуса стики-баннера
      if (data.actionName === 'GET_BANNER_ADV_STATUS') {
        const response = {
          source: 'YandexGamesSDK',
          messageId: data.messageId,
          data: {
            stickyAdvIsShowing: false
          }
        }

        setTimeout(() => {
          event.source?.postMessage(JSON.stringify(response), '*')
          console.log('✅ Отправлен ответ на GET_BANNER_ADV_STATUS')
        }, 10)
        return
      }

      // Показ стики-баннера
      if (data.actionName === 'SHOW_BANNER_ADV') {
        const response = {
          source: 'YandexGamesSDK',
          messageId: data.messageId,
          data: {
            stickyAdvIsShowing: true
          }
        }

        setTimeout(() => {
          event.source?.postMessage(JSON.stringify(response), '*')
          console.log('✅ Отправлен ответ на SHOW_BANNER_ADV')
        }, 10)
        return
      }

      // Скрытие стики-баннера
      if (data.actionName === 'HIDE_BANNER_ADV') {
        const response = {
          source: 'YandexGamesSDK',
          messageId: data.messageId,
          data: {
            stickyAdvIsShowing: false
          }
        }

        setTimeout(() => {
          event.source?.postMessage(JSON.stringify(response), '*')
          console.log('✅ Отправлен ответ на HIDE_BANNER_ADV')
        }, 10)
        return
      }

      // Проверка доступности методов
      if (data.actionName === 'CHECK_AVAILABILITY') {
        const response = {
          source: 'YandexGamesSDK',
          messageId: data.messageId,
          data: {
            isAvailable: true
          }
        }

        setTimeout(() => {
          event.source?.postMessage(JSON.stringify(response), '*')
          console.log('✅ Отправлен ответ на CHECK_AVAILABILITY')
        }, 10)
        return
      }
    }
  }

  window.addEventListener('message', messageHandler)

  // Эмулируем глобальную переменную loadEnvironmentPromise
  ;(window as any).loadEnvironmentPromise = Promise.resolve({
    enviroment: IFRAME_DATA.environmentData,
    options: IFRAME_DATA.optionsData
  })

  ;(window as any).YandexGamesSDKEnvironment = IFRAME_DATA.environmentData

  return () => window.removeEventListener('message', messageHandler)
}

// Загрузка SDK Яндекс Игр
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
  // Настраиваем URL параметры как в реальном iframe
  setupUrlParams()

  // Настраиваем эмулятор родительского окна
  const cleanupEmulator = setupParentWindowEmulator()

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
        console.log('✅ SDK готов к работе')
      }

      // Пытаемся показать стикер-баннер (если настроен)
      try {
        await showStickyBanner()
      } catch (e) {
        console.log('ℹ️ Стики-баннер не настроен')
      }
    }
  } catch (error: any) {
    console.error('❌ Ошибка инициализации Яндекс SDK:', error)
    isSDKReady.value = false

    // Даже при ошибке, эмулятор останется для последующих вызовов
  }

  return cleanupEmulator
}

// Показать стикер-баннер (используя правильные методы)
const showStickyBanner = async () => {
  if (!ysdk.value || !ysdk.value.adv) {
    console.warn('⚠️ SDK не инициализирован для показа баннера')
    return
  }

  try {
    // Используем правильный метод showBannerAdv (не showStickyBanner)
    if (ysdk.value.adv.showBannerAdv) {
      const result = await ysdk.value.adv.showBannerAdv()
      console.log('📺 Стики-баннер показан:', result)
    } else if (ysdk.value.adv.showStickyBanner) {
      // Fallback для старых версий
      ysdk.value.adv.showStickyBanner()
      console.log('📺 Стики-баннер показан (старый метод)')
    }
  } catch (error) {
    console.error('❌ Ошибка показа стики-баннера:', error)
  }
}

// Скрыть стикер-баннер
const hideStickyBanner = async () => {
  if (!ysdk.value || !ysdk.value.adv) return

  try {
    if (ysdk.value.adv.hideBannerAdv) {
      const result = await ysdk.value.adv.hideBannerAdv()
      console.log('🔽 Стики-баннер скрыт:', result)
    } else if (ysdk.value.adv.hideStickyBanner) {
      ysdk.value.adv.hideStickyBanner()
      console.log('🔽 Стики-баннер скрыт (старый метод)')
    }
  } catch (error) {
    console.error('❌ Ошибка скрытия стики-баннера:', error)
  }
}

// Показать полноэкранную рекламу
const showFullscreenAd = () => {
  if (!ysdk.value || !ysdk.value.adv) {
    console.warn('⚠️ SDK не инициализирован для показа полноэкранной рекламы')
    return
  }

  console.log('📺 Запрос на показ полноэкранной рекламы')

  ysdk.value.adv.showFullscreenAdv({
    callbacks: {
      onOpen: () => {
        console.log('📺 Полноэкранная реклама открыта')
      },
      onClose: (wasShown: boolean) => {
        if (wasShown) {
          console.log('✅ Полноэкранная реклама показана и закрыта')
        } else {
          console.log('ℹ️ Полноэкранная реклама не показана (возможно, слишком частый вызов)')
        }
      },
      onError: (error: any) => {
        console.error('❌ Ошибка при показе полноэкранной рекламы:', error)
      }
    }
  })
}

// Показать рекламу с вознаграждением
const showRewardedAd = () => {
  if (!ysdk.value || !ysdk.value.adv) {
    console.warn('⚠️ SDK не инициализирован для показа rewarded видео')
    return
  }

  console.log('🎁 Запрос на показ рекламы с вознаграждением')

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

// Инициализация
const initialize = async () => {
  checkAdminRights()

  // Загружаем и инициализируем SDK Яндекс Игр
  const cleanupEmulator = await initYandexSDK()

      // Сохраняем cleanup для использования при размонтировании
  ;(window as any).__yandexCleanup = cleanupEmulator

  if (intervalId === null) {
    intervalId = window.setInterval(() => {
      checkAdminRights()
    }, 5000)
  }
}

// Очистка при размонтировании
const cleanup = () => {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }

  hideStickyBanner()

  // Очищаем эмулятор
  if ((window as any).__yandexCleanup) {
    (window as any).__yandexCleanup()
  }
}

onMounted(() => {
  initialize()
})

onUnmounted(() => {
  cleanup()
})

// Экспортируем методы для использования в других компонентах
defineExpose({
  showFullscreenAd,
  showRewardedAd,
  showStickyBanner,
  hideStickyBanner,
  isSDKReady
})
</script>

<template>
  <div class="lg:sticky lg:top-6 space-y-6">
    <!-- Карточка информации о приложении -->
    <B24Card>
      <div class="p-0 md:p-6">
        <div class="space-y-6">
          <!-- Логотип и название -->
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
            <!-- Панель навигации -->
            <nav class="space-y-2">
              <!-- Главная -->
              <div
                  @click="goToMain"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer"
                  :class="isRouteActive('/') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'"
              >
                <HomeIcon :class="isRouteActive('/') ? 'w-5 h-5 mr-3 text-blue-600' : 'w-5 h-5 mr-3 text-gray-500'" />
                Главная
              </div>

              <!-- Настройки - видно только администраторам -->
              <div
                  v-if="isAdmin"
                  @click="goToSettings"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer"
                  :class="isRouteActive('/settings') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'"
              >
                <SettingsIcon :class="isRouteActive('/settings') ? 'w-5 h-5 mr-3 text-blue-600' : 'w-5 h-5 mr-3 text-gray-500'" />
                Настройки
              </div>

              <!-- Заглушка для обычных пользователей -->
              <div
                  v-else
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-400 cursor-not-allowed"
                  title="Доступно только администраторам"
              >
                <SettingsIcon class="w-5 h-5 mr-3 text-gray-400" />
                Настройки
              </div>

              <!-- Инструкция -->
              <div
                  @click="goToInstructions"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer"
                  :class="isRouteActive('/instructions') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'"
              >
                <DocumentUpdateIcon :class="isRouteActive('/instructions') ? 'w-5 h-5 mr-3 text-blue-600' : 'w-5 h-5 mr-3 text-gray-500'" />
                Инструкция
              </div>

              <!-- Техническая поддержка -->
              <a
                  href="mailto:technogalera@yandex.ru?subject=Поддержка приложения"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <MailOutIcon class="w-5 h-5 mr-3 text-gray-500" />
                Техническая поддержка
              </a>

              <!-- Оставить отзыв -->
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

    <!-- Слайдер с другими решениями -->
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