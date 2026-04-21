<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'

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
})
</script>

<template>
  <Suspense>
    <B24App>
      <!-- Сайдбар - как в первом коде, вынесен в отдельную колонку -->
      <div class="p-0 md:p-6">
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
    </B24App>
  </Suspense>
</template>