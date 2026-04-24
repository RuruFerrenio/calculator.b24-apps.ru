<template>
  <div class="space-y-12">
    <!-- Hero секция -->
    <B24Hero
        title="Помощь в&nbsp;начале и&nbsp;завершении рабочего дня"
        description="Автоматизация учёта рабочего времени сотрудников Битрикс24: подробное описание функционала"
        variant="subtle"
        size="lg"
    />

    <!-- Основной контент документации -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Боковое меню навигации -->
      <aside class="lg:col-span-1">
        <B24Card variant="subtle" class="sticky top-8">
          <B24NavMenu
              orientation="vertical"
              :items="navItems"
              class="w-full"
              :ui="{ content: 'flex flex-col gap-1' }"
          />
        </B24Card>
      </aside>

      <!-- Основной контент -->
      <div class="lg:col-span-3 space-y-8">
        <!-- Блок старта рабочего дня -->
        <B24Section
            id="workday-start"
            title="Помощь в старте рабочего дня"
            description="Автоматическая помощь сотрудникам в своевременном начале рабочего дня"
        >
          <B24Card>
            <div class="space-y-6">
              <!-- Как это работает -->
              <B24Alert title="Как это работает" variant="info">
                <div class="space-y-3 text-sm">
                  <div class="flex items-start gap-3">
                    <span class="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5">1</span>
                    <p>При открытии страницы портала система проверяет, запущен ли рабочий день сотрудника и является ли текущее время рабочим согласно Рабочему графику.</p>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5">2</span>
                    <p><span class="font-medium">Автоматический старт:</span> рабочий день начинается автоматически без участия сотрудника.</p>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5">3</span>
                    <p><span class="font-medium">Модальное окно:</span> при каждом открытии страницы портала показывается окно с кнопкой "Начать рабочий день", пока сотрудник не начнёт рабочий день.</p>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5">4</span>
                    <p><span class="font-medium">Сообщение в чате:</span> в чат Битрикс24 отправляется уведомление с предложением начать рабочий день.</p>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5">5</span>
                    <p><span class="font-medium">Push-уведомление:</span> сотруднику отправляется push-уведомление в мобильное приложение Битрикс24.</p>
                  </div>
                </div>
              </B24Alert>

              <!-- Доступность -->
              <div class="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                <svg class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <p class="text-sm text-yellow-700 dark:text-yellow-500"><span class="font-medium">Функция доступна на тарифах "Базовый" и выше.</span></p>
              </div>
            </div>
          </B24Card>
        </B24Section>

        <!-- Блок завершения рабочего дня -->
        <B24Section
            id="workday-end"
            title="Помощь в завершении рабочего дня"
            description="Автоматическая помощь сотрудникам в своевременном завершении рабочего дня"
        >
          <B24Card>
            <div class="space-y-6">
              <B24Alert title="Как это работает" variant="info">
                <div class="space-y-3 text-sm">
                  <div class="flex items-start gap-3">
                    <span class="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5">1</span>
                    <p>При открытии страницы портала система проверяет, запущен ли рабочий день сотрудника и не превышает ли текущее время окончание рабочего дня по графику.</p>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5">2</span>
                    <p><span class="font-medium">Автоматическое завершение:</span> рабочий день завершается автоматически без участия сотрудника.</p>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5">3</span>
                    <p><span class="font-medium">Модальное окно:</span> при каждом открытии страницы портала показывается окно с кнопкой "Завершить рабочий день", пока сотрудник не завершит рабочий день.</p>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5">4</span>
                    <p><span class="font-medium">Сообщение в чате:</span> в чат Битрикс24 отправляется уведомление с предложением завершить рабочий день.</p>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5">5</span>
                    <p><span class="font-medium">Push-уведомление:</span> сотруднику отправляется push-уведомление в мобильное приложение Битрикс24.</p>
                  </div>
                </div>
              </B24Alert>

              <div class="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                <svg class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <p class="text-sm text-yellow-700 dark:text-yellow-500"><span class="font-medium">Функция доступна на тарифах "Базовый" и выше.</span></p>
              </div>
            </div>
          </B24Card>
        </B24Section>

        <!-- Интерактивная сравнительная таблица методов -->
        <B24Section
            id="comparison"
            title="Сравнение методов уведомления"
            description="Интерактивная таблица: наведите на метод или нажмите для детального описания"
        >
          <B24Card>
            <div class="space-y-6">
              <!-- Интерактивная таблица -->
              <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                  <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th class="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-100 w-1/4">Метод</th>
                    <th class="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-100 w-1/2">Описание</th>
                    <th class="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-100 w-1/4">Рекомендация</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr
                      v-for="method in comparisonMethods"
                      :key="method.value"
                      class="border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-all duration-200"
                      :class="{
                        'bg-blue-50 dark:bg-blue-950/30': hoveredMethod === method.value || selectedMethod === method.value,
                        'hover:bg-gray-50 dark:hover:bg-gray-800/50': hoveredMethod !== method.value && selectedMethod !== method.value
                      }"
                      @mouseenter="hoveredMethod = method.value"
                      @mouseleave="hoveredMethod = null"
                      @click="selectedMethod = selectedMethod === method.value ? null : method.value"
                  >
                    <td class="py-4 px-4 font-medium text-gray-900 dark:text-gray-100">
                      {{ method.name }}
                    </td>
                    <td class="py-4 px-4 text-gray-600 dark:text-gray-400">
                      {{ method.shortDescription }}
                    </td>
                    <td class="py-4 px-4">
                      <B24Badge :variant="method.badgeVariant" size="sm">
                        {{ method.recommendation }}
                      </B24Badge>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>

              <!-- Детальное описание при наведении/выборе -->
              <B24Collapse v-model="hasSelectedOrHovered" :ui="{ wrapper: 'mt-6' }">
                <B24Alert
                    :variant="selectedMethodDetails?.alertVariant || 'info'"
                    class="transition-all duration-200"
                >
                  <template #title>
                    <div class="flex items-center justify-between">
                      <span>{{ selectedMethodDetails?.title || hoveredMethodDetails?.title || 'Выберите метод' }}</span>
                      <span v-if="selectedMethod" class="text-xs opacity-70">Нажмите ещё раз, чтобы закрыть</span>
                      <span v-else-if="hoveredMethod" class="text-xs opacity-70">Нажмите для закрепления</span>
                    </div>
                  </template>
                  <div class="space-y-2 text-sm">
                    <p>{{ selectedMethodDetails?.description || hoveredMethodDetails?.description || 'Наведите курсор на любой метод в таблице или нажмите на него, чтобы увидеть подробное описание.' }}</p>
                    <div v-if="selectedMethodDetails?.pros || hoveredMethodDetails?.pros" class="mt-3 pt-2 border-t border-current/20">
                      <p class="font-medium text-sm mb-1">Преимущества:</p>
                      <ul class="list-disc list-inside space-y-1 text-sm">
                        <li v-for="pro in (selectedMethodDetails?.pros || hoveredMethodDetails?.pros)" :key="pro">{{ pro }}</li>
                      </ul>
                    </div>
                  </div>
                </B24Alert>
              </B24Collapse>

              <!-- Подсказка по интерактиву -->
              <div class="text-center text-xs text-gray-400 dark:text-gray-500">
                <svg class="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>
                </svg>
                Интерактивная таблица: наведите на строку для предпросмотра, нажмите для закрепления детального описания
              </div>
            </div>
          </B24Card>
        </B24Section>

        <!-- Быстрая таблица соответствия сценариев -->
        <B24Section
            id="scenarios"
            title="Сценарии использования"
            description="Какой метод подходит для разных ситуаций"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <B24Card
                v-for="scenario in scenarios"
                :key="scenario.title"
                class="hover:shadow-md transition-shadow"
            >
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                     :class="scenario.iconBgClass">
                  <component :is="scenario.icon" class="w-5 h-5" :class="scenario.iconClass" />
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-gray-100">{{ scenario.title }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ scenario.description }}</p>
                  <div class="mt-3">
                    <B24Badge :variant="scenario.methodBadge" size="sm">
                      Рекомендуемый метод: {{ scenario.recommendedMethod }}
                    </B24Badge>
                  </div>
                </div>
              </div>
            </B24Card>
          </div>
        </B24Section>

        <!-- Управление встройками -->
        <B24Section
            id="placements"
            title="Места встройки"
            description="Где и как приложение интегрируется в интерфейс Битрикс24"
        >
        </B24Section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Иконки для сценариев
import RocketIcon from '@bitrix24/b24icons-vue/main/RocketIcon'
import BellIcon from '@bitrix24/b24icons-vue/outline/BellIcon'
import ChatIcon from '@bitrix24/b24icons-vue/outline/ChatIcon'
import DeviceMobileIcon from '@bitrix24/b24icons-vue/outline/DeviceMobileIcon'

// Состояния для интерактивной таблицы
const hoveredMethod = ref<string | null>(null)
const selectedMethod = ref<string | null>(null)

const hasSelectedOrHovered = computed(() => !!(selectedMethod.value || hoveredMethod.value))

// Данные для сравнительной таблицы
const comparisonMethods = [
  {
    value: 'auto',
    name: 'Автоматический',
    shortDescription: 'Действие выполняется автоматически без участия сотрудника',
    recommendation: 'Для дисциплинированных команд',
    badgeVariant: 'success',
    details: {
      title: 'Автоматический метод',
      description: 'Система самостоятельно выполняет действие (начало или завершение рабочего дня) без какого-либо участия сотрудника. Не требует подтверждения или реакции от пользователя.',
      pros: [
        'Полная автоматизация процесса',
        'Не отвлекает сотрудников',
        'Идеально для формального учёта времени'
      ],
      alertVariant: 'success'
    }
  },
  {
    value: 'modal',
    name: 'Модальное окно',
    shortDescription: 'Всплывающее окно с кнопкой действия, пока не будет выполнено',
    recommendation: 'Для команд, нуждающихся в контроле',
    badgeVariant: 'primary',
    details: {
      title: 'Модальное окно',
      description: 'При каждом открытии страницы портала показывается всплывающее окно с предложением выполнить действие. Окно будет появляться снова и снова, пока сотрудник его не выполнит.',
      pros: [
        'Максимальная вовлечённость сотрудника',
        'Действие не может быть пропущено',
        'Подходит для обязательного учёта времени'
      ],
      alertVariant: 'primary'
    }
  },
  {
    value: 'chat',
    name: 'Сообщение в чате',
    shortDescription: 'Уведомление отправляется в чат Битрикс24',
    recommendation: 'Для удалённых команд',
    badgeVariant: 'info',
    details: {
      title: 'Сообщение в чате',
      description: 'В чат Битрикс24 (личный или общий) отправляется уведомление с предложением выполнить действие. Сотрудник может нажать на кнопку в сообщении, чтобы выполнить действие.',
      pros: [
        'Удобно для команд, работающих в чатах',
        'Действие можно выполнить прямо из чата',
        'Остаётся история уведомлений'
      ],
      alertVariant: 'info'
    }
  },
  {
    value: 'push',
    name: 'Push-уведомление',
    shortDescription: 'Мгновенное уведомление в мобильном приложении',
    recommendation: 'Для мобильных сотрудников',
    badgeVariant: 'warning',
    details: {
      title: 'Push-уведомление',
      description: 'Сотруднику отправляется push-уведомление в мобильное приложение Битрикс24. Нажатие на уведомление открывает портал с предложением выполнить действие.',
      pros: [
        'Мгновенное оповещение даже в мобильном приложении',
        'Подходит для полевых сотрудников',
        'Высокий охват'
      ],
      alertVariant: 'warning'
    }
  }
]

// Получение деталей для выбранного или наведённого метода
const selectedMethodDetails = computed(() => {
  if (!selectedMethod.value) return null
  return comparisonMethods.find(m => m.value === selectedMethod.value)?.details
})

const hoveredMethodDetails = computed(() => {
  if (!hoveredMethod.value || selectedMethod.value) return null
  return comparisonMethods.find(m => m.value === hoveredMethod.value)?.details
})

// Данные для сценариев использования
const scenarios = [
  {
    title: 'Офисные сотрудники',
    description: 'Работают за компьютером в офисе, доступ к порталу в течение всего дня.',
    recommendedMethod: 'Модальное окно',
    methodBadge: 'primary',
    icon: RocketIcon,
    iconBgClass: 'bg-blue-100 dark:bg-blue-900',
    iconClass: 'text-blue-600 dark:text-blue-400'
  },
  {
    title: 'Дисциплинированная команда',
    description: 'Сотрудники самостоятельно следят за своим временем.',
    recommendedMethod: 'Автоматический',
    methodBadge: 'success',
    icon: BellIcon,
    iconBgClass: 'bg-green-100 dark:bg-green-900',
    iconClass: 'text-green-600 dark:text-green-400'
  },
  {
    title: 'Удалённые сотрудники',
    description: 'Работают из дома, активно используют чаты для коммуникации.',
    recommendedMethod: 'Сообщение в чате',
    methodBadge: 'info',
    icon: ChatIcon,
    iconBgClass: 'bg-purple-100 dark:bg-purple-900',
    iconClass: 'text-purple-600 dark:text-purple-400'
  },
  {
    title: 'Полевые сотрудники',
    description: 'Часто в разъездах, используют мобильное приложение.',
    recommendedMethod: 'Push-уведомление',
    methodBadge: 'warning',
    icon: DeviceMobileIcon,
    iconBgClass: 'bg-orange-100 dark:bg-orange-900',
    iconClass: 'text-orange-600 dark:text-orange-400'
  }
]

// Элементы навигации
const navItems = [
  { label: 'Помощь в старте дня', to: '#workday-start' },
  { label: 'Помощь в завершении дня', to: '#workday-end' },
  { label: 'Сравнение методов', to: '#comparison' },
  { label: 'Сценарии использования', to: '#scenarios' },
  { label: 'Места встройки', to: '#placements' }
]
</script>