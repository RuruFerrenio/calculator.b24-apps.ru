<!-- app.vue (исправленный) -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import WorkdayManager from './components/WorkdayManager.vue'

const route = useRoute()

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

// Теперь showSidebar зависит от openAppMode
const showSidebar = computed(() => {
  // Если мы в modal режиме - сайдбар не показываем
  if (openAppMode.value !== 'default') return false

  // В default режиме показываем на определенных страницах
  return route.path === '/' ||
      route.path === '/settings' ||
      route.path === '/instructions'
})

onMounted(() => {
  // Читаем куки при загрузке
  const mode = getCookie('open_app_mode')
  const type = getCookie('modal_type')

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
  <div v-if="!isLoading">
    <Suspense>
      <B24App>
        <div class="p-0 md:p-6">
          <div class="mt-0 md:mt-2 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <!-- Если кука default - показываем основной контент + сайдбар (только на нужных страницах) -->
            <template v-if="openAppMode === 'default'">
              <!-- Контент занимает всю ширину, если сайдбар не показывается -->
              <div :class="showSidebar ? 'lg:col-span-2' : 'lg:col-span-3'">
                <RouterView />
              </div>
              <!-- Сайдбар - показываем только на указанных страницах -->
              <div v-if="showSidebar" class="lg:col-span-1">
                <Sidebar />
              </div>
            </template>

            <!-- Если кука modal - показываем WorkdayManager -->
            <div v-else-if="openAppMode === 'modal'" class="lg:col-span-3">
              <WorkdayManager
                  v-if="modalType"
                  :mode="modalType"
                  :auto-close-delay="2000"
              />
              <div v-else class="text-center py-12">
                <p class="text-gray-500">Не указан тип операции</p>
              </div>
            </div>
          </div>
        </div>
      </B24App>
    </Suspense>
  </div>
  <div v-else class="text-center py-12">
    Загрузка...
  </div>
</template>