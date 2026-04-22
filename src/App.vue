<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Sidebar from './components/Sidebar.vue'

// Функция для получения куки
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

const openAppMode = ref<'default' | 'modal'>('default')
const modalType = ref<'start' | 'end' | null>(null)
const isLoading = ref(true)

const tgLink = computed(() => {
  return (
      typeof window !== 'undefined' && window.navigator?.language.includes('ru')
  )
      ? 'https://t.me/bitrix24apps'
      : 'https://t.me/b24_dev'
})

onMounted(() => {
  // Читаем куки при загрузке
  const mode = getCookie('open_app_mode')
  const type = getCookie('modal_type')

  console.log('open_app_mode:', mode)
  console.log('modal_type:', type)

  if (mode === 'modal') {
    openAppMode.value = 'modal'
    if (type === 'start' || type === 'end') {
      modalType.value = type
    }
  } else {
    openAppMode.value = 'default'
  }
  isLoading.value = false

  const script = document.createElement('script')
  script.src = '//api.bitrix24.com/api/v1/'
  script.async = true
  document.head.appendChild(script)
})
</script>

<template>
  <Suspense>
    <B24App>
      <div class="p-0 md:p-6">
        <div class="mt-0 md:mt-2 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <!-- Если кука default - показываем основной контент + сайдбар -->
          <template v-if="openAppMode === 'default'">
            <div class="lg:col-span-2">
              <RouterView />
            </div>
            <div class="lg:col-span-1">
              <Sidebar />
            </div>
          </template>

          <!-- Если кука modal - показываем только пустой div -->
          <div v-else-if="openAppMode === 'modal'" class="lg:col-span-3">
            <!-- Пустой контейнер -->
          </div>

          <!-- Состояние загрузки -->
          <div v-else class="lg:col-span-3">
            Загрузка...
          </div>
        </div>
      </div>
    </B24App>
  </Suspense>
</template>