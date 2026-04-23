<script setup lang="ts">
import MailIcon from '@bitrix24/b24icons-vue/main/MailIcon'
import StarIcon from '@bitrix24/b24icons-vue/outline/AiStarsQuestionIcon'
import ShieldCheckIcon from '@bitrix24/b24icons-vue/outline/ShieldCheckedIcon'
import PowerIcon from '@bitrix24/b24icons-vue/outline/PowerIcon'
import SettingsIcon from '@bitrix24/b24icons-vue/outline/SettingsIcon'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Загрузка скрипта
(function(w: Window, d: Document, u: string) {
  var s = d.createElement('script');
  s.async = true;
  s.src = u + '?' + (Date.now() / 60000 | 0);
  var h = d.getElementsByTagName('script')[0];
  h.parentNode.insertBefore(s, h);
})(window, document, 'https://cdn-ru.bitrix24.ru/b37550306/crm/site_button/loader_1_bt7q7g.js');

const router = useRouter()

// Состояние для проверки прав администратора
const isAdmin = ref(false)
const isLoading = ref(true)

const handleReview = (): void => {
  BX24.init(() => {
    BX24.openPath(
        '/marketplace/detail/tekhnogalera.chistoe_vremya/',
        function(result: any) {
          console.log(result);
        }
    );
  });
};

// Функция перехода на страницу настроек
const goToSettings = (): void => {
  if (router && isAdmin.value) {
    router.push('/settings')
  }
};

// Инициализация проверки прав администратора
const initialize = () => {
  isLoading.value = true

  BX24.init(() => {
    isAdmin.value = BX24.isAdmin()
    isLoading.value = false
  })
}

onMounted(() => {
  initialize()
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
              <PowerIcon class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Удобное начало и завершение рабочего дня</h3>
              <p class="text-sm text-gray-500">Версия 1.0.0</p>
            </div>
          </div>

          <div class="space-y-3">
            <h4 class="text-sm font-medium text-gray-900">Меню</h4>
            <!-- Панель навигации -->
            <nav class="space-y-2">
              <!-- Техническая поддержка -->
              <a
                  href="mailto:technogalera@yandex.ru?subject=Поддержка приложения Чистое время"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <MailIcon class="w-5 h-5 mr-3 text-gray-500" />
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

              <!-- Настройки - видно только администраторам -->
              <div
                  v-if="isAdmin && !isLoading"
                  @click="goToSettings"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <SettingsIcon class="w-5 h-5 mr-3 text-gray-500" />
                Настройки
              </div>

              <!-- Заглушка для обычных пользователей -->
              <div
                  v-else-if="!isAdmin && !isLoading"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-400 cursor-not-allowed"
                  title="Доступно только администраторам"
              >
                <SettingsIcon class="w-5 h-5 mr-3 text-gray-400" />
                Настройки
              </div>
            </nav>
          </div>

          <!-- Информация о безопасности -->
          <div class="pt-4 border-t">
            <div class="flex items-start">
              <ShieldCheckIcon class="w-5 h-5 text-green-500 mr-2 mt-0.5" />
              <div>
                <p class="text-xs text-gray-600">
                  Данные об активности пользователей хранятся во внутреннем персональном хранилище портала Bitrix24.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </B24Card>
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