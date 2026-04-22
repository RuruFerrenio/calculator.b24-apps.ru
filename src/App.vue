<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'

const route = useRoute()

const tgLink = computed(() => {
  return (
      typeof window !== 'undefined' && window.navigator?.language.includes('ru')
  )
      ? 'https://t.me/bitrix24apps'
      : 'https://t.me/b24_dev'
})

const allQueryParams = computed(() => route.query)

onMounted(() => {
  console.log('All GET parameters:', route.query)

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
          <div class="lg:col-span-2">
            <RouterView />
          </div>

          <div class="lg:col-span-1">
            <Sidebar />

            <!-- Вывод всех GET параметров (опционально) -->
            <div v-if="Object.keys(allQueryParams).length" class="mt-4 p-4 bg-gray-100 rounded">
              <h3 class="font-bold mb-2">GET Parameters:</h3>
              <pre>{{ JSON.stringify(allQueryParams, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </B24App>
  </Suspense>
</template>