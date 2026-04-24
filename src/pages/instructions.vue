<script setup lang="ts">
import { ref, watch } from 'vue'

// Состояния настроек
const workdayStartEnabled = ref(false)
const workdayStartMethod = ref<'auto' | 'modal' | 'chat' | 'push'>('modal')
const workdayEndEnabled = ref(false)
const workdayEndMethod = ref<'auto' | 'modal' | 'chat' | 'push'>('modal')
const isProcessing = ref(false)

// Элементы навигации
const navItems = [
  { label: 'Настройка старта дня', to: '#workday-start' },
  { label: 'Настройка завершения дня', to: '#workday-end' },
  { label: 'Сравнение методов', to: '#comparison' },
  { label: 'Интеграция', to: '#placements' },
  { label: 'API Reference', to: '#api' },
]

// Элементы для RadioGroup старта
const startMethodItems = [
  {
    label: 'Автоматический старт',
    value: 'auto',
    description: 'Рабочий день начинается автоматически при открытии портала'
  },
  {
    label: 'Модальное окно',
    value: 'modal',
    description: 'Показывать окно с предложением начать рабочий день'
  },
  {
    label: 'Сообщение в чате',
    value: 'chat',
    description: 'Отправлять уведомление в чат Битрикс24'
  },
  {
    label: 'Push-уведомление',
    value: 'push',
    description: 'Отправлять push в мобильное приложение'
  }
]

// Элементы для RadioGroup завершения
const endMethodItems = [
  {
    label: 'Автоматическое завершение',
    value: 'auto',
    description: 'Рабочий день завершается автоматически'
  },
  {
    label: 'Модальное окно',
    value: 'modal',
    description: 'Показывать окно с предложением завершить рабочий день'
  },
  {
    label: 'Сообщение в чате',
    value: 'chat',
    description: 'Отправлять уведомление в чат Битрикс24'
  },
  {
    label: 'Push-уведомление',
    value: 'push',
    description: 'Отправлять push в мобильное приложение'
  }
]

// Колонки для таблицы сравнения
const comparisonColumns = [
  { key: 'method', label: 'Метод' },
  { key: 'description', label: 'Описание' },
  { key: 'bestFor', label: 'Для кого' }
]

// Данные таблицы сравнения
const comparisonRows = [
  {
    method: 'Автоматический',
    description: 'Действие выполняется без участия сотрудника на основе правил',
    bestFor: 'Дисциплинированных сотрудников',
    variant: 'success'
  },
  {
    method: 'Модальное окно',
    description: 'Всплывающее окно с действием, пока не будет выполнено',
    bestFor: 'Команд, нуждающихся в контроле',
    variant: 'primary'
  },
  {
    method: 'Чат-уведомление',
    description: 'Уведомление в общий или личный чат сотрудника',
    bestFor: 'Удалённых команд',
    variant: 'info'
  },
  {
    method: 'Push-уведомление',
    description: 'Мгновенное уведомление в мобильном приложении',
    bestFor: 'Мобильных сотрудников',
    variant: 'warning'
  }
]

// Функции-заглушки для демонстрации
async function toggleWorkdayStart(value: boolean) {
  isProcessing.value = true
  // Здесь реальная логика сохранения
  await new Promise(resolve => setTimeout(resolve, 500))
  isProcessing.value = false
}

async function toggleWorkdayEnd(value: boolean) {
  isProcessing.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  isProcessing.value = false
}

// Сохранение при изменении методов
watch(workdayStartMethod, async (newMethod) => {
  if (workdayStartEnabled.value) {
    isProcessing.value = true
    await new Promise(resolve => setTimeout(resolve, 300))
    isProcessing.value = false
  }
})

watch(workdayEndMethod, async (newMethod) => {
  if (workdayEndEnabled.value) {
    isProcessing.value = true
    await new Promise(resolve => setTimeout(resolve, 300))
    isProcessing.value = false
  }
})
</script>
<template>
  <div class="space-y-12">
    <!-- Hero секция -->
    <B24Hero
        title="Помощь в&nbsp;начале и&nbsp;завершении рабочего дня"
        description="Автоматизируйте учёт рабочего времени сотрудников. Настройте удобные способы напоминаний: от автоматического старта до push-уведомлений."
        variant="subtle"
        size="lg"
    >
      <template #actions>
        <div class="flex flex-wrap gap-4 mt-2">
          <B24Button
              label="Начать настройку"
              :to="{ hash: '#settings' }"
              color="primary"
              size="lg"
          />
          <B24Button
              label="Документация API"
              to="https://dev.1c-bitrix.ru/learning/course/index.php?COURSE_ID=99"
              target="_blank"
              variant="outline"
              size="lg"
          />
        </div>
      </template>
    </B24Hero>

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
      <div class="lg:col-span-3 space-y-8" id="settings">
        <!-- Блок настроек старта рабочего дня -->
        <B24Section
            id="workday-start"
            title="Помощь в старте рабочего дня"
            description="Автоматическая помощь сотрудникам в своевременном начале рабочего дня"
        >
          <B24Card>
            <div class="space-y-6">
              <!-- Переключатель и статус -->
              <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <p class="font-medium">Включить помощь в старте рабочего дня</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Система будет отслеживать начало рабочего дня сотрудников
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <B24Status
                      :variant="workdayStartEnabled ? 'success' : 'danger'"
                      size="sm"
                  >
                    {{ workdayStartEnabled ? 'Активно' : 'Отключено' }}
                  </B24Status>
                  <B24Switch
                      v-model="workdayStartEnabled"
                      :disabled="isProcessing"
                      @update:model-value="toggleWorkdayStart"
                  />
                </div>
              </div>

              <!-- Настройки, отображаемые при включении -->
              <B24Collapse v-model="workdayStartEnabled">
                <!-- Способ старта -->
                <B24FormField
                    label="Способ старта рабочего дня"
                    help-text="Выберите, как система будет уведомлять сотрудников о необходимости начать рабочий день"
                >
                  <B24RadioGroup
                      v-model="workdayStartMethod"
                      :items="startMethodItems"
                      orientation="horizontal"
                      variant="card"
                      size="sm"
                      indicator="end"
                      class="overflow-x-auto pb-2"
                  />
                </B24FormField>

                <!-- Описание работы -->
                <B24Alert
                    title="Как это работает"
                    variant="info"
                    class="mt-6"
                >
                  <div class="space-y-2 text-sm">
                    <p>• При открытии страницы портала система проверяет, запущен ли рабочий день сотрудника и является ли текущее время рабочим согласно Рабочему графику.</p>
                    <p>• Если рабочий день не начат, применяется выбранный способ уведомления.</p>
                    <p class="mt-2 text-yellow-600 dark:text-yellow-500">
                      <strong>Важно:</strong> Функция доступна на тарифах "Базовый" и выше.
                    </p>
                  </div>
                </B24Alert>
              </B24Collapse>
            </div>
          </B24Card>
        </B24Section>

        <!-- Блок настроек завершения рабочего дня -->
        <B24Section
            id="workday-end"
            title="Помощь в завершении рабочего дня"
            description="Автоматическая помощь сотрудникам в своевременном завершении рабочего дня"
        >
          <B24Card>
            <div class="space-y-6">
              <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <p class="font-medium">Включить помощь в завершении рабочего дня</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Система будет отслеживать завершение рабочего дня сотрудников
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <B24Status
                      :variant="workdayEndEnabled ? 'success' : 'danger'"
                      size="sm"
                  >
                    {{ workdayEndEnabled ? 'Активно' : 'Отключено' }}
                  </B24Status>
                  <B24Switch
                      v-model="workdayEndEnabled"
                      :disabled="isProcessing"
                      @update:model-value="toggleWorkdayEnd"
                  />
                </div>
              </div>

              <B24Collapse v-model="workdayEndEnabled">
                <B24FormField
                    label="Способ завершения рабочего дня"
                    help-text="Выберите, как система будет уведомлять сотрудников о необходимости завершить рабочий день"
                >
                  <B24RadioGroup
                      v-model="workdayEndMethod"
                      :items="endMethodItems"
                      orientation="horizontal"
                      variant="card"
                      size="sm"
                      indicator="end"
                      class="overflow-x-auto pb-2"
                  />
                </B24FormField>

                <B24Alert
                    title="Как это работает"
                    variant="info"
                    class="mt-6"
                >
                  <div class="space-y-2 text-sm">
                    <p>• Система проверяет, запущен ли рабочий день и не превышает ли текущее время окончание рабочего дня по графику.</p>
                    <p>• При необходимости завершения дня применяется выбранный способ уведомления.</p>
                    <p class="mt-2 text-yellow-600 dark:text-yellow-500">
                      <strong>Важно:</strong> Функция доступна на тарифах "Базовый" и выше.
                    </p>
                  </div>
                </B24Alert>
              </B24Collapse>
            </div>
          </B24Card>
        </B24Section>

        <!-- Таблица сравнения методов -->
        <B24Section
            id="comparison"
            title="Сравнение методов"
            description="Детальное описание каждого способа уведомления"
        >
          <B24Table
              :columns="comparisonColumns"
              :rows="comparisonRows"
              :ui="{ wrapper: 'overflow-x-auto', td: 'py-4' }"
          >
            <template #method="{ row }">
              <div class="font-medium">{{ row.method }}</div>
            </template>
            <template #description="{ row }">
              <div class="text-gray-600 dark:text-gray-400">{{ row.description }}</div>
            </template>
            <template #bestFor="{ row }">
              <B24Badge :variant="row.variant" size="sm">{{ row.bestFor }}</B24Badge>
            </template>
          </B24Table>
        </B24Section>

        <!-- Интеграция с встройками -->
        <B24Section
            id="placements"
            title="Интеграция с встройками"
            description="Управление местами встройки приложения в интерфейс Битрикс24"
        >
        </B24Section>

        <!-- Документация API -->
        <B24Section
            id="api"
            title="API Reference"
            description="Методы для программного управления настройками"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <B24Card>
              <h4 class="font-mono text-sm font-semibold mb-2">BX24.appOption.set</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Установка значения опции приложения</p>
              <B24Codeblock language="typescript" class="text-xs">
                <pre>// Установка настройки
await BX24.appOption.set('workday_start_enabled', 'Y');
await BX24.appOption.set('workday_start_method', 'modal');</pre>
              </B24Codeblock>
            </B24Card>

            <B24Card>
              <h4 class="font-mono text-sm font-semibold mb-2">BX24.appOption.get</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Получение значения опции приложения</p>
              <B24Codeblock language="typescript" class="text-xs">
                <pre>// Получение настройки
const enabled = await B24AppOption.get('workday_start_enabled');
const method = await B24AppOption.get('workday_start_method');</pre>
              </B24Codeblock>
            </B24Card>
          </div>
        </B24Section>
      </div>
    </div>
  </div>
</template>