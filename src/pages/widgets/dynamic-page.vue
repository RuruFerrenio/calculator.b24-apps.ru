<script setup lang="ts">
import { ref, onMounted } from 'vue'
import WorkdayManager from "../../components/WorkdayManager.vue";

const modalType = ref<'start' | 'end' | null>(null)

onMounted(() => {
  // Получаем параметр mode из URL
  const urlParams = new URLSearchParams(window.location.search)
  const modeParam = urlParams.get('mode')

  // Проверяем, что параметр имеет корректное значение
  if (modeParam === 'start' || modeParam === 'end') {
    modalType.value = modeParam
  } else {
    modalType.value = null
    console.warn('Неверное значение параметра mode:', modeParam)
  }
})
</script>

<template>
  <div class="lg:col-span-3">
    <WorkdayManager
        v-if="modalType"
        :mode="modalType"
        :auto-close-delay="2000"
    />
    <div v-else class="text-center py-12">
      <p class="text-gray-500">Не указан тип операции</p>
    </div>
  </div>
</template>