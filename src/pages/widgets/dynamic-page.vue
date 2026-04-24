<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import WorkdayManager from "../../components/WorkdayManager.vue";

const route = useRoute()
const modalType = ref<'start' | 'end' | null>(null)

onMounted(() => {
  console.log('Содержимое запроса')
  console.log(route.query)
  const modeParam = route.query.mode

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