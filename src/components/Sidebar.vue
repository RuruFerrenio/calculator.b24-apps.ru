<script setup lang="ts">
import MailIcon from '@bitrix24/b24icons-vue/main/MailIcon'
import StarIcon from '@bitrix24/b24icons-vue/outline/AiStarsQuestionIcon'
import ShieldCheckIcon from '@bitrix24/b24icons-vue/outline/ShieldCheckedIcon'
import PowerIcon from '@bitrix24/b24icons-vue/outline/PowerIcon'
import SettingsIcon from '@bitrix24/b24icons-vue/outline/SettingsIcon'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

declare const BX24: any

const router = useRouter()

// Состояние для проверки прав администратора
const isAdmin = ref(false)
const isBitrixLoaded = ref(false)

    // Загрузка скрипта кнопки сайта
    (function(w: Window, d: Document, u: string) {
      var s = d.createElement('script');
      s.async = true;
      s.src = u + '?' + (Date.now() / 60000 | 0);
      var h = d.getElementsByTagName('script')[0];
      h.parentNode.insertBefore(s, h);
    })(window, document, 'https://cdn-ru.bitrix24.ru/b37550306/crm/site_button/loader_1_bt7q7g.js');

const handleReview = (): void => {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') {
    console.warn('BX24 не доступен');
    return;
  }

  BX24.openPath(
      '/marketplace/detail/tekhnogalera.chistoe_vremya/',
      function(result: any) {
        console.log(result);
      }
  );
};

// Функция перехода на страницу настроек
const goToSettings = (): void => {
  if (router && isAdmin.value) {
    router.push('/settings')
  }
};

// Получение информации о текущем пользователе
function getCurrentUser(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!isBitrixLoaded.value || typeof BX24 === 'undefined') {
      reject(new Error('BX24 не доступен'));
      return;
    }

    BX24.callMethod(
        'user.current',
        {},
        function(result: any) {
          if (result.error()) {
            console.error('Ошибка получения текущего пользователя:', result.error());
            reject(result.error());
            return;
          }
          resolve(result.data());
        }
    );
  });
}

// Проверка прав администратора через REST API
async function checkAdminRights(): Promise<boolean> {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') {
    return false;
  }

  try {
    // Получаем текущего пользователя
    const user = await getCurrentUser();

    // Проверяем права администратора
    if (user.ADMIN === 'Y') {
      return true;
    }

    // Альтернативный способ: проверка через метод user.access
    return new Promise((resolve) => {
      BX24.callMethod(
          'user.access',
          {
            'USER_ID': user.ID,
            'TASK_NAME': 'edit_users'
          },
          function(result: any) {
            if (result.error()) {
              console.error('Ошибка проверки прав доступа:', result.error());
              resolve(false);
              return;
            }
            resolve(result.data() === true);
          }
      );
    });
  } catch (error) {
    console.error('Ошибка при проверке прав администратора:', error);
    return false;
  }
}

// Инициализация приложения
function initialize() {
  console.log('Инициализация приложения');

  if (typeof BX24 !== 'undefined') {
    console.log('BX24 обнаружен, ожидаем инициализацию');

    BX24.init(async () => {
      console.log('REST API доступен');
      isBitrixLoaded.value = true;

      try {
        isAdmin.value = await checkAdminRights();
        console.log('Права администратора:', isAdmin.value);
      } catch (error) {
        console.error('Ошибка при инициализации:', error);
        isAdmin.value = false;
      }
    });
  } else {
    console.warn('BX24 не доступен');
    isBitrixLoaded.value = false;
    isAdmin.value = false;
  }
}

onMounted(() => {
  initialize();
});
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
                  v-if="isAdmin"
                  @click="goToSettings"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <SettingsIcon class="w-5 h-5 mr-3 text-gray-500" />
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

.cursor-not-allowed {
  cursor: not-allowed;
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