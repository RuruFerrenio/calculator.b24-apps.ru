<script setup lang="ts">
import MailOutIcon from '@bitrix24/b24icons-vue/main/MailOutIcon'
import StarIcon from '@bitrix24/b24icons-vue/outline/AiStarsQuestionIcon'
import CalculatorIcon from '@bitrix24/b24icons-vue/main/CalculatorIcon'
import SettingsIcon from '@bitrix24/b24icons-vue/outline/SettingsIcon'
import HomeIcon from '@bitrix24/b24icons-vue/outline/HomeIcon'
import DocumentUpdateIcon from '@bitrix24/b24icons-vue/outline/DocumentUpdateIcon'

import SolutionsSlider from './SolutionsSlider.vue'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Состояние для проверки прав администратора
const isAdmin = ref(false)
let intervalId: number | null = null

// Состояние для SDK Яндекс Игр
const ysdk = ref<any>(null)
const isSDKReady = ref(false)
const isBannerShowing = ref(false)

// Флаг разработки - используем константу, а не import.meta в шаблоне
const isDevMode = import.meta.env.DEV

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

// Настройка мок-окружения Яндекс Игр для локальной разработки
const setupYandexGamesMockEnvironment = () => {
  console.log('🎮 [Mock] Настройка мок-окружения Яндекс Игр')

  // Данные из реального iframe игры с ID 494640
  const mockGameData = {
    appId: '494640',
    origin: 'https://app-494640.games.s3.yandex.net',
    sdkUrl: '/sdk/_/v2.ddbf1fbb7b41988ff84e.js',
    deviceType: 'desktop',
    yclid: '792744691842940927'
  }

  // Создаем фейковое окружение, как если бы мы были в iframe Яндекса
  const mockEnvironment = {
        enviroment: {
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
          gameUrl: `https://yandex.ru/games/app/${mockGameData.appId}`,
          originSrc: `https://app-${mockGameData.appId}.games.s3.yandex.net/${mockGameData.appId}/index.html`
        },
        options: {
          hasAuth: true,
          features: {
            gamepads: false,
            vibration: false
          },
          deviceType: mockGameData.deviceType,
          appId: mockGameData.appId
        }
      }

      // Подставляем мок-окружение глобально
  ;(window as any).loadEnvironmentPromise = Promise.resolve(mockEnvironment)
  ;(window as any).YandexGamesSDKEnvironment = mockEnvironment.enviroment
  ;(window as any).__YA_GAMES_APP_ID__ = mockGameData.appId

  // Меняем URL, чтобы он выглядел как игра на Яндекс Играх
  const currentUrl = new URL(window.location.href)
  if (!currentUrl.searchParams.has('app-id')) {
    currentUrl.searchParams.set('app-id', mockGameData.appId)
    currentUrl.searchParams.set('device-type', mockGameData.deviceType)
    if (mockGameData.yclid) {
      currentUrl.searchParams.set('yclid', mockGameData.yclid)
    }
    // Обновляем URL без перезагрузки страницы
    window.history.replaceState({}, '', currentUrl.toString())
  }

  // Добавляем #origin параметр в hash, если его нет
  if (!window.location.hash.includes('origin=')) {
    const newHash = `#origin=https%3A%2F%2Fyandex.ru&app-id=${mockGameData.appId}&device-type=${mockGameData.deviceType}`
    window.location.hash = newHash
  }

  console.log('🎮 [Mock] URL обновлен:', window.location.href)
  console.log('🎮 [Mock] Мок-окружение настроено для игры ID:', mockGameData.appId)
}

// Перехват и обработка postMessage запросов от SDK
const setupPostMessageInterceptor = () => {
  const messageHandler = (event: MessageEvent) => {
    try {
      // Пытаемся распарсить сообщение
      let data: any
      if (typeof event.data === 'string') {
        try {
          data = JSON.parse(event.data)
        } catch {
          return // Не JSON сообщение
        }
      } else {
        data = event.data
      }

      // Проверяем, что это сообщение от SDK Яндекс Игр
      if (data && data.source === 'YandexGamesSDK') {
        console.log('🎮 [Mock] Перехвачено сообщение:', data.actionName, data)

        // Ответы на различные запросы SDK
        const responses: Record<string, any> = {
          // Запрос на получение URL iframe
          'GET_IFRAME_ORIGIN_SRC': {
            source: 'YandexGamesSDK',
            messageId: data.messageId,
            payload: `https://app-494640.games.s3.yandex.net/494640/index.html#origin=https%3A%2F%2Fyandex.ru&app-id=494640&device-type=desktop`
          },

          // Запрос на получение информации об устройстве
          'GET_DEVICE_INFO': {
            source: 'YandexGamesSDK',
            messageId: data.messageId,
            data: {
              deviceType: 'desktop',
              isMobile: false,
              isTablet: false,
              isDesktop: true
            }
          },

          // Запрос на получение доступных функций
          'GET_FEATURES': {
            source: 'YandexGamesSDK',
            messageId: data.messageId,
            data: {
              features: ['adv', 'storage', 'player', 'leaderboards']
            }
          },

          // Запрос на получение i18n
          'GET_I18N': {
            source: 'YandexGamesSDK',
            messageId: data.messageId,
            data: {
              lang: 'ru',
              langs: ['ru', 'en']
            }
          },

          // Проверка доступности метода
          'CHECK_AVAILABILITY': {
            source: 'YandexGamesSDK',
            messageId: data.messageId,
            data: {
              isAvailable: true
            }
          },

          // Запрос опций
          'GET_OPTIONS': {
            source: 'YandexGamesSDK',
            messageId: data.messageId,
            data: {
              hasAuth: true,
              features: {},
              deviceType: 'desktop'
            }
          },

          // Запрос на получение статуса баннера
          'GET_BANNER_ADV_STATUS': {
            source: 'YandexGamesSDK',
            messageId: data.messageId,
            data: {
              stickyAdvIsShowing: false
            }
          },

          // Показать баннер
          'SHOW_BANNER_ADV': {
            source: 'YandexGamesSDK',
            messageId: data.messageId,
            data: {
              stickyAdvIsShowing: true
            }
          },

          // Скрыть баннер
          'HIDE_BANNER_ADV': {
            source: 'YandexGamesSDK',
            messageId: data.messageId,
            data: {
              stickyAdvIsShowing: false
            }
          }
        }

        // Отправляем ответ, если есть соответствующий обработчик
        if (responses[data.actionName]) {
          setTimeout(() => {
            event.source?.postMessage(JSON.stringify(responses[data.actionName]), '*')
            console.log('🎮 [Mock] Отправлен ответ на:', data.actionName)
          }, 10)
        }

        // Для полноэкранной рекламы эмулируем успешный показ
        if (data.actionName === 'SHOW_FULLSCREEN_ADV') {
          console.log('🎮 [Mock] Эмулируем показ полноэкранной рекламы')
          setTimeout(() => {
            // Эмулируем колбэк onOpen
            if (data.callbacks?.onOpen) {
              data.callbacks.onOpen()
            }
            // Эмулируем колбэк onClose через 2 секунды
            setTimeout(() => {
              if (data.callbacks?.onClose) {
                data.callbacks.onClose(true)
              }
            }, 2000)
          }, 100)
        }

        // Для rewarded видео эмулируем успешный показ с наградой
        if (data.actionName === 'SHOW_REWARDED_VIDEO') {
          console.log('🎮 [Mock] Эмулируем показ rewarded видео')
          setTimeout(() => {
            // Эмулируем колбэк onOpen
            if (data.callbacks?.onOpen) {
              data.callbacks.onOpen()
            }
            // Эмулируем колбэк onRewarded через 1 секунду
            setTimeout(() => {
              if (data.callbacks?.onRewarded) {
                data.callbacks.onRewarded()
              }
              // Эмулируем колбэк onClose
              if (data.callbacks?.onClose) {
                data.callbacks.onClose(true)
              }
            }, 1500)
          }, 100)
        }
      }
    } catch (e) {
      // Игнорируем ошибки парсинга
    }
  }

  window.addEventListener('message', messageHandler)
  return () => window.removeEventListener('message', messageHandler)
}

// Проверка окружения
const checkYandexGamesEnvironment = (): boolean => {
  // Всегда возвращаем true для разработки
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost'

  if (isDev) {
    console.log('🎮 [Mock] Режим разработки, используем мок-окружение')
    return true
  }

  // Реальная проверка для продакшена на Яндекс Играх
  const isYandexGamesDomain =
      window.location.hostname.includes('yandex') &&
      (window.location.pathname.includes('/games/') ||
          window.location.pathname.includes('/play/'))

  const isS3Domain = window.location.hostname.includes('games.s3.yandex.net')
  const hasAppId = window.location.search.includes('app-id=') || window.location.hash.includes('app-id=')

  return isYandexGamesDomain || isS3Domain || hasAppId
}

// Загрузка SDK Яндекс Игр
const loadYandexSDK = () => {
  return new Promise((resolve, reject) => {
    if (typeof (window as any).YaGames !== 'undefined') {
      console.log('✅ Yandex SDK уже загружен')
      resolve(true)
      return
    }

    // Используем SDK из iframe игры
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

// Инициализация SDK Яндекс Игр
const initYandexSDK = async () => {
  if (!checkYandexGamesEnvironment()) {
    console.log('ℹ️ Приложение запущено не в Яндекс Играх, пропускаем инициализацию Яндекс SDK')
    return
  }

  // Настраиваем мок-окружение для разработки
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost'
  if (isDev) {
    setupYandexGamesMockEnvironment()
    const cleanupInterceptor = setupPostMessageInterceptor()
        // Сохраняем cleanup для использования при размонтировании
    ;(window as any).__yandexGamesCleanup = cleanupInterceptor
  }

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

      // Пробуем инициализировать стики-баннер
      try {
        await initStickyBanner()
      } catch (e) {
        console.log('ℹ️ Стики-баннер не настроен')
      }
    }
  } catch (error: any) {
    console.error('❌ Ошибка инициализации Яндекс SDK:', error)

    if (import.meta.env.DEV) {
      console.log('ℹ️ [DevMode] Ошибка не критична, SDK будет работать в демо-режиме')
      // В dev-режиме эмулируем SDK
      emulateSDK()
    } else {
      isSDKReady.value = false
    }
  }
}

// Эмуляция SDK для разработки (если реальный не работает)
const emulateSDK = () => {
  console.log('🎮 [Emulator] Создаем эмулятор SDK')

  const emulator = {
    adv: {
      getBannerAdvStatus: async () => ({ stickyAdvIsShowing: false }),
      showBannerAdv: async () => ({ stickyAdvIsShowing: true }),
      hideBannerAdv: async () => ({ stickyAdvIsShowing: false }),
      showFullscreenAdv: ({ callbacks }: any) => {
        console.log('🎮 [Emulator] Показ полноэкранной рекламы')
        callbacks?.onOpen?.()
        setTimeout(() => callbacks?.onClose?.(true), 2000)
      },
      showRewardedVideo: ({ callbacks }: any) => {
        console.log('🎮 [Emulator] Показ rewarded видео')
        callbacks?.onOpen?.()
        setTimeout(() => {
          callbacks?.onRewarded?.()
          callbacks?.onClose?.(true)
        }, 1500)
      }
    },
    ready: async () => console.log('🎮 [Emulator] SDK готов'),
    getPlayer: async () => ({
      getID: () => 'emulated_player',
      getName: () => 'Тестовый игрок',
      getMode: () => 'emulated'
    })
  }

  ysdk.value = emulator
  isSDKReady.value = true
  console.log('✅ Эмулятор SDK готов к работе')
}

// Инициализация стики-баннера
const initStickyBanner = async () => {
  if (!ysdk.value || !ysdk.value.adv) return

  try {
    const status = await ysdk.value.adv.getBannerAdvStatus()
    isBannerShowing.value = status.stickyAdvIsShowing

    if (status.stickyAdvIsShowing) {
      console.log('📺 Стики-баннер уже показывается')
    } else if (status.reason) {
      console.log(`⚠️ Стики-баннер не показывается: ${status.reason}`)
      if (status.reason !== 'ADV_IS_NOT_CONNECTED') {
        await showStickyBanner()
      }
    } else {
      await showStickyBanner()
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке статуса баннера:', error)
  }
}

// Показать стики-баннер
const showStickyBanner = async () => {
  if (!ysdk.value || !ysdk.value.adv) {
    console.warn('⚠️ SDK не инициализирован для показа баннера')
    return
  }

  try {
    const result = await ysdk.value.adv.showBannerAdv()
    isBannerShowing.value = result.stickyAdvIsShowing
    if (result.stickyAdvIsShowing) {
      console.log('📺 Стики-баннер успешно показан')
    } else if (result.reason) {
      console.log(`⚠️ Не удалось показать стики-баннер: ${result.reason}`)
    }
  } catch (error) {
    console.error('❌ Ошибка показа стики-баннера:', error)
  }
}

// Скрыть стики-баннер
const hideStickyBanner = async () => {
  if (!ysdk.value || !ysdk.value.adv) return

  try {
    const result = await ysdk.value.adv.hideBannerAdv()
    isBannerShowing.value = result.stickyAdvIsShowing
    console.log('🔽 Стики-баннер скрыт')
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
          console.log('ℹ️ Полноэкранная реклама не показана')
        }
      },
      onError: (error: any) => {
        console.error('❌ Ошибка при показе полноэкранной рекламы:', error)
      }
    }
  })
}

// Показать рекламу с вознаграждением
const showRewardedVideo = () => {
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

// Инициализация приложения
const initialize = async () => {
  checkAdminRights()
  await initYandexSDK()

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

  // Очищаем обработчики сообщений
  if ((window as any).__yandexGamesCleanup) {
    (window as any).__yandexGamesCleanup()
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
  showRewardedVideo,
  showStickyBanner,
  hideStickyBanner,
  isSDKReady,
  isBannerShowing
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

          <!-- Индикатор статуса SDK (только для разработки) -->
          <div v-if="isDevMode" class="mt-4 pt-4 border-t border-gray-200">
            <div class="text-xs text-gray-500">
              SDK Status:
              <span :class="isSDKReady ? 'text-green-600' : 'text-yellow-600'">
                {{ isSDKReady ? '✅ Ready' : '⏳ Loading...' }}
              </span>
            </div>
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