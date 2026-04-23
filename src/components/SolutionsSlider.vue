<template>
  <div>
    <B24Card>
      <div class="p-6">
        <div class="space-y-4">
          <!-- Заголовок слайдера -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-1">Другие решения</h3>
            <p class="text-sm text-gray-500">Расширьте возможности вашего портала</p>
          </div>

          <!-- Контейнер слайдера -->
          <div
              class="relative"
              @mouseenter="stopAutoplay"
              @mouseleave="startAutoplay"
          >
            <div class="overflow-hidden rounded-lg">
              <div
                  class="flex transition-transform duration-500 ease-in-out"
                  :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
              >
                <div
                    v-for="(solution, idx) in solutions"
                    :key="solution.id"
                    class="w-full flex-shrink-0"
                >
                  <div class="p-0">
                    <!-- Иконка решения -->
                    <div class="p-4 pb-0 flex items-center justify-between">
                      <div
                          class="w-12 h-12 rounded-lg flex items-center justify-center"
                          :class="solution.color"
                      >
                        <component :is="solution.iconComponent" class="w-6 h-6 text-white" />
                      </div>
                      <div class="flex items-center space-x-2">
                        <span
                            v-if="solution.badge"
                            class="px-2 py-1 text-xs font-medium rounded-full"
                            :class="solution.badgeClass"
                        >
                          {{ solution.badge }}
                        </span>
                      </div>
                    </div>

                    <!-- Название и описание -->
                    <div class="p-4 pt-3">
                      <h4 class="text-base font-semibold text-gray-900 mb-2">
                        {{ solution.title }}
                      </h4>
                      <p class="text-sm text-gray-600 mb-4">
                        {{ solution.description }}
                      </p>

                      <!-- Особенности -->
                      <div class="space-y-1.5 mb-4">
                        <div
                            v-for="(feature, index) in solution.features"
                            :key="index"
                            class="flex items-center text-sm text-gray-500"
                        >
                          <svg class="w-3.5 h-3.5 mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span class="truncate">{{ feature }}</span>
                        </div>
                      </div>

                      <!-- Кнопка действия -->
                      <div>
                        <B24Button
                            :variant="solution.installed ? 'outline' : 'primary'"
                            :href="solution.link"
                            target="_blank"
                            class="w-full justify-center"
                        >
                          {{ solution.installed ? 'Открыть' : 'Подробнее' }}
                          <svg class="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </B24Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Индикаторы прогресса -->
            <div class="mt-4 flex items-center justify-between">
              <div class="text-xs text-gray-500">
                {{ currentIndex + 1 }} из {{ totalSlides }}
              </div>
              <div class="flex space-x-1">
                <button
                    v-for="index in totalSlides"
                    :key="index"
                    @click="goToSlide(index - 1)"
                    class="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    :class="currentIndex === index - 1 ? 'bg-blue-600 w-4' : 'bg-gray-300 hover:bg-gray-400'"
                    :aria-label="`Перейти к слайду ${index}`"
                />
              </div>
            </div>
          </div>

          <!-- Кнопки навигации -->
          <div class="flex justify-between gap-2">
            <B24Button
                variant="secondary"
                size="small"
                @click="prevSlide"
                :disabled="currentIndex === 0"
                class="flex-1 justify-center"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </B24Button>
            <B24Button
                variant="secondary"
                size="small"
                @click="nextSlide"
                :disabled="currentIndex === totalSlides - 1"
                class="flex-1 justify-center"
            >
              Далее
              <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </B24Button>
          </div>
        </div>
      </div>
    </B24Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { markRaw } from 'vue'

// Иконки для решений
const ChartBarIcon = {
  template: `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  `
}

const CalendarIcon = {
  template: `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  `
}

// Тип для решения
interface Solution {
  id: number
  title: string
  description: string
  iconComponent: any
  color: string
  features: string[]
  link: string
  installed: boolean
  badge: string | null
  badgeClass: string
}

// Данные решений (2 элемента)
const solutions: Solution[] = [
  {
    id: 1,
    title: 'Smart Reports',
    description: 'Автоматическая генерация отчетов и аналитика в реальном времени',
    iconComponent: markRaw(ChartBarIcon),
    color: 'bg-purple-500',
    features: ['Автоматические отчёты', 'Аналитика в реальном времени', 'Интеграция с CRM'],
    link: 'https://marketplace.bitrix24.ru/smart-reports',
    installed: false,
    badge: 'Новинка',
    badgeClass: 'bg-purple-100 text-purple-800'
  },
  {
    id: 2,
    title: 'Task Planner',
    description: 'Планирование задач и контроль сроков выполнения',
    iconComponent: markRaw(CalendarIcon),
    color: 'bg-green-500',
    features: ['Автораспределение задач', 'Гант-диаграммы', 'Контроль сроков'],
    link: 'https://marketplace.bitrix24.ru/task-planner',
    installed: false,
    badge: null,
    badgeClass: ''
  }
]

const currentIndex = ref(0)
const autoplayInterval = ref<number | null>(null)
const totalSlides = computed(() => solutions.length)

// Навигация
const nextSlide = () => {
  if (currentIndex.value < totalSlides.value - 1) {
    currentIndex.value++
  }
}

const prevSlide = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const goToSlide = (index: number) => {
  if (index >= 0 && index < totalSlides.value) {
    currentIndex.value = index
  }
}

// Автопрокрутка
const startAutoplay = () => {
  stopAutoplay()
  autoplayInterval.value = window.setInterval(() => {
    if (currentIndex.value < totalSlides.value - 1) {
      currentIndex.value++
    } else {
      currentIndex.value = 0
    }
  }, 5000)
}

const stopAutoplay = () => {
  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value)
    autoplayInterval.value = null
  }
}

onMounted(() => {
  startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
})
</script>

<style scoped>
/* Анимация для перехода слайдов */
.transition-transform {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Кнопки навигации */
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

button:not(:disabled):hover {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>