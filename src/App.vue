<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Sidebar from './components/Sidebar.vue'

// Режим отображения приложения
const appMode = ref<'default' | 'modal'>('default')

// Проверяем режим из userOption
const checkAppMode = () => {
  console.log('Проверка режима')
  appMode.value = BX24.userOption.get('open_app_mode')
  console.log(appMode.value)
}

const tgLink = computed(() => {
  return (
      typeof window !== 'undefined' && window.navigator?.language.includes('ru')
  )
      ? 'https://t.me/bitrix24apps'
      : 'https://t.me/b24_dev'
})

onMounted(() => {
  const script = document.createElement('script')
  script.src = '//api.bitrix24.com/api/v1/'
  script.async = true
  document.head.appendChild(script)

  // Периодически проверяем режим
  checkAppMode()

  // Подписываемся на изменения userOption
  setInterval(() => {
    checkAppMode()
  }, 1000)
})
</script>

<template>
  <Suspense>
    <B24App>
      <!-- Режим default - показываем сайдбар и основной контент -->
      <div v-if="appMode === 'default'" class="p-0 md:p-6">
        <div class="mt-0 md:mt-2 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <!-- Основной контент (колонка 2/3) -->
          <div class="lg:col-span-2">
            <RouterView />
          </div>

          <!-- Сайдбар (колонка 1/3) -->
          <div class="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </div>

      <!-- Режим modal - показываем пустой контейнер под новый компонент -->
      <div v-else-if="appMode === 'modal'" class="modal-container">
        <!-- Здесь будет новый компонент, который ты добавишь позже -->
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <div class="loader">Загрузка модального окна...</div>
          </div>
        </div>
      </div>
    </B24App>
  </Suspense>
</template>

<style scoped>
.modal-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.loader {
  font-size: 14px;
  color: #666;
}
</style>