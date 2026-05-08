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

// Загрузка SDK Яндекс Игр
const loadYandexSDK = () => {
  return new Promise((resolve, reject) => {
    // Проверяем, загружен ли уже SDK
    if (typeof (window as any).YaGames !== 'undefined') {
      console.log('Yandex SDK уже загружен')
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://yandex.ru/games/sdk/v2'  // Правильный URL для SDK Яндекс Игр [citation:2][citation:10]
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
  try {
    await loadYandexSDK()

    // Инициализация через YaGames [citation:2]
    if (typeof (window as any).YaGames !== 'undefined') {
      const sdk = await (window as any).YaGames.init()
      ysdk.value = sdk
      isSDKReady.value = true
      console.log('✅ Яндекс SDK инициализирован успешно')

      // Сообщаем SDK, что игра готова [citation:10]
      if (sdk && sdk.ready) {
        sdk.ready()
      }

      // Показываем стикер-баннер (он включается в консоли разработчика, но можно и через API)
      showStickyBanner()
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации Яндекс SDK:', error)
    isSDKReady.value = false
  }
}

// Показать стикер-баннер (если включен в консоли)
const showStickyBanner = () => {
  if (ysdk.value && ysdk.value.adv) {
    try {
      // В Яндекс Играх стикер-баннер обычно настраивается в консоли разработчика,
      // но можно управлять через API: показать/скрыть [citation:4][citation:7]
      if (ysdk.value.adv.showStickyBanner) {
        ysdk.value.adv.showStickyBanner()
        console.log('Стикер-баннер показан')
      }
    } catch (error) {
      console.error('Ошибка показа стикер-баннера:', error)
    }
  }
}

// Скрыть стикер-баннер
const hideStickyBanner = () => {
  if (ysdk.value && ysdk.value.adv && ysdk.value.adv.hideStickyBanner) {
    try {
      ysdk.value.adv.hideStickyBanner()
      console.log('Стикер-баннер скрыт')
    } catch (error) {
      console.error('Ошибка скрытия стикер-баннера:', error)
    }
  }
}

// Показать полноэкранную рекламу [citation:2][citation:6]
const showFullscreenAd = () => {
  if (!ysdk.value || !ysdk.value.adv) {
    console.warn('SDK не инициализирован')
    return
  }

  try {
    ysdk.value.adv.showFullscreenAdv({
      callbacks: {
        onOpen: () => {
          console.log('📺 Fullscreen реклама открылась')
        },
        onClose: (wasShown: boolean) => {
          console.log('📺 Fullscreen реклама закрылась, была показана:', wasShown)
          // Здесь можно добавить логику после закрытия рекламы
          if (wasShown) {
            // Реклама была показана и закрыта
          }
        },
        onError: (error: any) => {
          console.error('❌ Ошибка Fullscreen рекламы:', error)
        }
      }
    })
  } catch (error) {
    console.error('Ошибка вызова Fullscreen рекламы:', error)
  }
}

// Показать рекламу с наградой [citation:2][citation:6]
const showRewardedAd = () => {
  if (!ysdk.value || !ysdk.value.adv) {
    console.warn('SDK не инициализирован')
    return
  }

  try {
    ysdk.value.adv.showRewardedVideo({
      callbacks: {
        onOpen: () => {
          console.log('🎁 Rewarded реклама открылась')
        },
        onRewarded: () => {
          console.log('🎁 Награда за просмотр рекламы!')
          // Здесь выдаем награду игроку
          // Например: добавить монеты, бонусы и т.д.
        },
        onClose: () => {
          console.log('🎁 Rewarded реклама закрылась')
        },
        onError: (error: any) => {
          console.error('❌ Ошибка Rewarded рекламы:', error)
        }
      }
    })
  } catch (error) {
    console.error('Ошибка вызова Rewarded рекламы:', error)
  }
}

// Инициализация
const initialize = async () => {
  checkAdminRights()

  // Загружаем и инициализируем SDK Яндекс Игр
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
}

onMounted(() => {
  initialize()
})

onUnmounted(() => {
  cleanup()
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
                  href="mailto:technogalera@yandex.ru?subject=Поддержка приложения Удобное начало и завершение рабочего дня"
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