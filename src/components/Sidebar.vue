<script setup lang="ts">
import MailIcon from '@bitrix24/b24icons-vue/main/MailIcon'
import StarIcon from '@bitrix24/b24icons-vue/outline/AiStarsQuestionIcon'
import ShieldCheckIcon from '@bitrix24/b24icons-vue/outline/ShieldCheckedIcon'
import LoaderClockIcon from '@bitrix24/b24icons-vue/animated/LoaderClockIcon'

(function(w: Window, d: Document, u: string) {
  var s = d.createElement('script');
  s.async = true;
  s.src = u + '?' + (Date.now() / 60000 | 0);
  var h = d.getElementsByTagName('script')[0];
  h.parentNode.insertBefore(s, h);
})(window, document, 'https://cdn-ru.bitrix24.ru/b37550306/crm/site_button/loader_1_bt7q7g.js');

const handleReview = (): void => {
  if (typeof (window as any).BX24 !== 'undefined') {
    (window as any).BX24.init(() => {
      (window as any).BX24.openPath(
          '/marketplace/detail/tekhnogalera.chistoe_vremya/',
          function(result: any) {
            console.log(result);
          }
      );
    });
  } else {
    console.warn('BX24 не доступен');
  }
};
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
              <LoaderClockIcon class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Автоматический старт и завершение рабочего дня</h3>
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
/* Стили для неактивных ссылок */
.cursor-pointer {
  cursor: pointer;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 640px) {
  .text-3xl {
    font-size: 1.875rem;
  }

  .text-xl {
    font-size: 1.25rem;
  }
}
</style>