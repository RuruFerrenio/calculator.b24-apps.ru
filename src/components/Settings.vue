<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useToast } from '@bitrix24/b24ui-nuxt/composables/useToast'
import PlacementsManager from './PlacementsManager.vue'

const toast = useToast()

// Типы данных
interface WorkdaySettings {
  enabled: boolean
  method: 'auto' | 'modal' | 'chat' | 'push'
}

interface FormData {
  workdayStart: WorkdaySettings
  workdayEnd: WorkdaySettings
  weekendActivity: {
    enabled: boolean
  }
}

// Инициализируем formData как обычный объект, а не ref
const formData = ref<FormData>({
  workdayStart: {
    enabled: false,
    method: 'modal'
  },
  workdayEnd: {
    enabled: false,
    method: 'modal'
  },
  weekendActivity: {
    enabled: false
  }
})

const isProcessing = ref(false)
const isBitrixLoaded = ref(false)

// Функция для уведомлений
function showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
  if (typeof toast !== 'undefined') {
    toast.add({
      description: message,
      variant: type
    })
  }
}

function getWorkdayStartMethodText(): string {
  const methods: Record<'auto' | 'modal' | 'chat' | 'push', string> = {
    'auto': 'Автоматический старт',
    'modal': 'Модальное окно с предупреждением',
    'chat': 'Сообщение в чате',
    'push': 'Push-уведомление'
  }
  return methods[formData.value.workdayStart.method] || 'модальное окно'
}

function getWorkdayEndMethodText(): string {
  const methods: Record<'auto' | 'modal' | 'chat' | 'push', string> = {
    'auto': 'Автоматическое завершение',
    'modal': 'Модальное окно с предупреждением',
    'chat': 'Сообщение в чате',
    'push': 'Push-уведомление'
  }
  return methods[formData.value.workdayEnd.method] || 'модальное окно'
}

async function toggleWorkdayStart(newValue: boolean): Promise<void> {
  try {
    isProcessing.value = true
    if (isBitrixLoaded.value && typeof BX24 !== 'undefined') {
      await BX24.appOption.set('workday_start_enabled', newValue ? 'Y' : 'N')
    }
    formData.value.workdayStart.enabled = newValue
    showNotification('success', newValue ? 'Помощь в старте рабочего дня включена' : 'Помощь в старте рабочего дня выключена')
  } catch {
    showNotification('error', 'Ошибка сохранения настройки')
  } finally {
    isProcessing.value = false
  }
}

async function toggleWorkdayEnd(newValue: boolean): Promise<void> {
  try {
    isProcessing.value = true
    if (isBitrixLoaded.value && typeof BX24 !== 'undefined') {
      await BX24.appOption.set('workday_end_enabled', newValue ? 'Y' : 'N')
    }
    formData.value.workdayEnd.enabled = newValue
    showNotification('success', newValue ? 'Помощь в завершении рабочего дня включена' : 'Помощь в завершении рабочего дня выключена')
  } catch {
    showNotification('error', 'Ошибка сохранения настройки')
  } finally {
    isProcessing.value = false
  }
}

async function toggleWeekendActivity(newValue: boolean): Promise<void> {
  try {
    isProcessing.value = true
    if (isBitrixLoaded.value && typeof BX24 !== 'undefined') {
      await BX24.appOption.set('weekend_activity_enabled', newValue ? 'Y' : 'N')
    }
    formData.value.weekendActivity.enabled = newValue
    showNotification('success', newValue ? 'Активность в выходные включена' : 'Активность в выходные выключена')
  } catch {
    showNotification('error', 'Ошибка сохранения настройки')
  } finally {
    isProcessing.value = false
  }
}

async function updateWorkdayStartMethod(): Promise<void> {
  try {
    isProcessing.value = true
    if (isBitrixLoaded.value && typeof BX24 !== 'undefined') {
      await BX24.appOption.set('workday_start_method', formData.value.workdayStart.method)
    }
    const methodText = getWorkdayStartMethodText()
    showNotification('success', `Способ старта рабочего дня: ${methodText}`)
  } catch {
    showNotification('error', 'Ошибка сохранения способа старта')
  } finally {
    isProcessing.value = false
  }
}

async function updateWorkdayEndMethod(): Promise<void> {
  try {
    isProcessing.value = true
    if (isBitrixLoaded.value && typeof BX24 !== 'undefined') {
      await BX24.appOption.set('workday_end_method', formData.value.workdayEnd.method)
    }
    const methodText = getWorkdayEndMethodText()
    showNotification('success', `Способ завершения рабочего дня: ${methodText}`)
  } catch {
    showNotification('error', 'Ошибка сохранения способа завершения')
  } finally {
    isProcessing.value = false
  }
}

async function saveWorkdayStartSettings(): Promise<void> {
  try {
    isProcessing.value = true
    if (isBitrixLoaded.value && typeof BX24 !== 'undefined') {
      await BX24.appOption.set('workday_start_enabled', formData.value.workdayStart.enabled ? 'Y' : 'N')
      await BX24.appOption.set('workday_start_method', formData.value.workdayStart.method)
    }
    showNotification('success', 'Настройки помощи в старте рабочего дня сохранены')
  } catch {
    showNotification('error', 'Ошибка сохранения настроек')
  } finally {
    isProcessing.value = false
  }
}

async function saveWorkdayEndSettings(): Promise<void> {
  try {
    isProcessing.value = true
    if (isBitrixLoaded.value && typeof BX24 !== 'undefined') {
      await BX24.appOption.set('workday_end_enabled', formData.value.workdayEnd.enabled ? 'Y' : 'N')
      await BX24.appOption.set('workday_end_method', formData.value.workdayEnd.method)
    }
    showNotification('success', 'Настройки помощи в завершении рабочего дня сохранены')
  } catch {
    showNotification('error', 'Ошибка сохранения настроек')
  } finally {
    isProcessing.value = false
  }
}

function normalizeBoolean(value: unknown): boolean {
  return value === 'Y' || value === true || value === 1
}

function normalizeMethod(value: unknown, validMethods: readonly string[]): 'auto' | 'modal' | 'chat' | 'push' | null {
  if (typeof value === 'string' && validMethods.includes(value)) {
    return value as 'auto' | 'modal' | 'chat' | 'push'
  }
  return null
}

async function loadSettings(): Promise<void> {
  if (!isBitrixLoaded.value || typeof BX24 === 'undefined') return

  try {
    const [
      workdayStartEnabled,
      workdayStartMethod,
      workdayEndEnabled,
      workdayEndMethod,
      weekendActivityEnabled
    ] = await Promise.all([
      BX24.appOption.get('workday_start_enabled'),
      BX24.appOption.get('workday_start_method'),
      BX24.appOption.get('workday_end_enabled'),
      BX24.appOption.get('workday_end_method'),
      BX24.appOption.get('weekend_activity_enabled')
    ])

    // Загрузка настроек старта рабочего дня
    formData.value.workdayStart.enabled = normalizeBoolean(workdayStartEnabled)

    const startMethod = normalizeMethod(workdayStartMethod, ['auto', 'modal', 'chat', 'push'])
    if (startMethod) {
      formData.value.workdayStart.method = startMethod
    }

    // Загрузка настроек завершения рабочего дня
    formData.value.workdayEnd.enabled = normalizeBoolean(workdayEndEnabled)

    const endMethod = normalizeMethod(workdayEndMethod, ['auto', 'modal', 'chat', 'push'])
    if (endMethod) {
      formData.value.workdayEnd.method = endMethod
    }

    // Загрузка настройки активности в выходные
    formData.value.weekendActivity.enabled = normalizeBoolean(weekendActivityEnabled)

  } catch (error) {
    console.error('Ошибка загрузки настроек:', error)
  }
}

// Жизненный цикл
onMounted(async () => {
  if (typeof BX24 !== 'undefined' && BX24.init) {
    BX24.init(async () => {
      isBitrixLoaded.value = true
      await loadSettings()
    })
  }
})

// Наблюдатели
watch(() => formData.value.workdayStart.method, () => {
  if (isProcessing.value) return
  updateWorkdayStartMethod()
})

watch(() => formData.value.workdayEnd.method, () => {
  if (isProcessing.value) return
  updateWorkdayEndMethod()
})
</script>

<template>
  <div>
    <!-- Блок 1: Активность в выходные -->
    <B24Card class="mb-8">
      <div class="p-0 md:p-6">
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900">
                Работа в выходные
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Разрешить работу приложения в выходные дни
              </p>
            </div>
            <div class="ml-4 flex items-center space-x-4">
              <div class="w-2 h-2 rounded-full"
                   :class="formData.weekendActivity.enabled ? 'bg-green-500' : 'bg-red-500'"></div>
              <B24Switch
                  :model-value="formData.weekendActivity.enabled"
                  @update:model-value="toggleWeekendActivity"
                  :disabled="isProcessing"
              />
            </div>
          </div>
        </div>
      </div>
    </B24Card>
    <!-- Блок 2: Помощь в старте рабочего дня -->
    <B24Card class="mb-8">
      <div class="p-0 md:p-6">
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900">
                Помощь в старте рабочего дня
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Автоматическая помощь сотрудникам в своевременном начале рабочего дня
              </p>
            </div>
            <div class="ml-4 flex items-center space-x-4">
              <div class="w-2 h-2 rounded-full"
                   :class="formData.workdayStart.enabled ? 'bg-green-500' : 'bg-red-500'"></div>
              <B24Switch
                  :model-value="formData.workdayStart.enabled"
                  @update:model-value="toggleWorkdayStart"
                  :disabled="isProcessing"
              />
            </div>
          </div>

          <!-- Настройки помощи -->
          <div v-if="formData.workdayStart.enabled" class="space-y-4 pt-4 border-t">
            <B24Form
                :state="formData"
                class="space-y-4"
                @submit="saveWorkdayStartSettings"
            >
              <!-- Способ старта рабочего дня -->
              <B24FormField
                  label="Способ старта рабочего дня"
                  name="workdayStartMethod"
                  :help-text="`Текущий способ: ${getWorkdayStartMethodText()}`"
              >
                <B24RadioGroup
                    :model-value="formData.workdayStart.method"
                    @update:model-value="(val) => formData.workdayStart.method = val"
                    :disabled="isProcessing"
                    :items="[
                        {
                            label: 'Автоматический старт',
                            value: 'auto',
                            description: 'Рабочий день начинается автоматически при открытии'
                        },
                        {
                            label: 'Модальное окно с предупреждением',
                            value: 'modal',
                            description: 'Показывать окно с предложением начать рабочий день'
                        },
                        {
                            label: 'Сообщение в чате',
                            value: 'chat',
                            description: 'Отправлять уведомление в чат Б24'
                        },
                        {
                            label: 'Push-уведомление',
                            value: 'push',
                            description: 'Отправлять push-уведомление в мобильное приложение'
                        }
                    ]"
                    orientation="horizontal"
                    variant="card"
                    size="sm"
                    default-value="modal"
                    indicator="end"
                    class="overflow-scroll md:overflow-auto"
                />
              </B24FormField>
            </B24Form>

            <!-- Информация о системе помощи -->
            <div class="space-y-4 mt-6">
              <h4 class="text-sm font-medium text-gray-900">
                Как работает помощь в старте рабочего дня
              </h4>
              <div class="space-y-3">
                <div class="flex items-start">
                  <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span class="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <p class="text-sm text-gray-700">
                      При открытии страницы портала, система проверяет, запущен ли рабочий день пользователя и является ли текущее время рабочим (берется из настроек Рабочего графика).
                    </p>
                  </div>
                </div>
                <div class="flex items-start">
                  <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span class="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <div>
                    <p class="text-sm text-gray-700">
                      <span class="font-medium">Автоматический старт:</span> рабочий день начинается автоматически без участия сотрудника.
                    </p>
                  </div>
                </div>
                <div class="flex items-start">
                  <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span class="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <div>
                    <p class="text-sm text-gray-700">
                      <span class="font-medium">Модальное окно:</span> при каждом открытии страницы портала показывается окно с кнопкой "Начать рабочий день", пока сотрудник не начнет рабочий день.
                    </p>
                  </div>
                </div>
                <div class="flex items-start">
                  <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span class="text-xs font-medium text-blue-600">4</span>
                  </div>
                  <div>
                    <p class="text-sm text-gray-700">
                      <span class="font-medium">Сообщение в чате:</span> в чат Битрикс24 отправляется уведомление с предложением начать рабочий день.
                    </p>
                  </div>
                </div>
                <div class="flex items-start">
                  <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span class="text-xs font-medium text-blue-600">5</span>
                  </div>
                  <div>
                    <p class="text-sm text-gray-700">
                      <span class="font-medium">Push-уведомление:</span> сотруднику отправляется push-уведомление в мобильное приложение Битрикс24.
                    </p>
                  </div>
                </div>
                <div class="flex items-start mt-2 p-3 bg-yellow-50 rounded-lg">
                  <svg class="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  <div class="text-sm text-yellow-700">
                    <span class="font-medium">Функция доступна на тарифах "Профессиональный" и выше.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </B24Card>
    <!-- Блок 3: Помощь в завершении рабочего дня -->
    <B24Card class="mb-8">
      <div class="p-0 md:p-6">
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900">
                Помощь в завершении рабочего дня
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Автоматическая помощь сотрудникам в своевременном завершении рабочего дня
              </p>
            </div>
            <div class="ml-4 flex items-center space-x-4">
              <div class="w-2 h-2 rounded-full"
                   :class="formData.workdayEnd.enabled ? 'bg-green-500' : 'bg-red-500'"></div>
              <B24Switch
                  :model-value="formData.workdayEnd.enabled"
                  @update:model-value="toggleWorkdayEnd"
                  :disabled="isProcessing"
              />
            </div>
          </div>

          <!-- Настройки помощи в завершении -->
          <div v-if="formData.workdayEnd.enabled" class="space-y-4 pt-4 border-t">
            <B24Form
                :state="formData"
                class="space-y-4"
                @submit="saveWorkdayEndSettings"
            >
              <!-- Способ завершения рабочего дня -->
              <B24FormField
                  label="Способ завершения рабочего дня"
                  name="workdayEndMethod"
                  :help-text="`Текущий способ: ${getWorkdayEndMethodText()}`"
              >
                <B24RadioGroup
                    :model-value="formData.workdayEnd.method"
                    @update:model-value="(val) => formData.workdayEnd.method = val"
                    :disabled="isProcessing"
                    :items="[
                        {
                            label: 'Автоматическое завершение',
                            value: 'auto',
                            description: 'Рабочий день завершается автоматически'
                        },
                        {
                            label: 'Модальное окно с предупреждением',
                            value: 'modal',
                            description: 'Показывать окно с предложением завершить рабочий день'
                        },
                        {
                            label: 'Сообщение в чате',
                            value: 'chat',
                            description: 'Отправлять уведомление в чат Б24'
                        },
                        {
                            label: 'Push-уведомление',
                            value: 'push',
                            description: 'Отправлять push-уведомление в мобильное приложение'
                        }
                    ]"
                    orientation="horizontal"
                    variant="card"
                    size="sm"
                    default-value="modal"
                    indicator="end"
                    class="overflow-scroll md:overflow-auto"
                />
              </B24FormField>
            </B24Form>

            <!-- Информация о системе помощи в завершении -->
            <div class="space-y-4 mt-6">
              <h4 class="text-sm font-medium text-gray-900">
                Как работает помощь в завершении рабочего дня
              </h4>
              <div class="space-y-3">
                <div class="flex items-start">
                  <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span class="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <p class="text-sm text-gray-700">
                      При открытии страницы портала, система проверяет, запущен ли рабочий день пользователя и является ли текущее время рабочим (берется из настроек Рабочего графика).
                    </p>
                  </div>
                </div>
                <div class="flex items-start">
                  <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span class="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <div>
                    <p class="text-sm text-gray-700">
                      <span class="font-medium">Автоматическое завершение:</span> рабочий день закрывается автоматически без участия сотрудника
                    </p>
                  </div>
                </div>
                <div class="flex items-start">
                  <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span class="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <div>
                    <p class="text-sm text-gray-700">
                      <span class="font-medium">Модальное окно:</span> при каждом открытии страницы портала показывается окно с кнопкой "Завершить рабочий день", пока сотрудник не завершит рабочий день.
                    </p>
                  </div>
                </div>
                <div class="flex items-start">
                  <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span class="text-xs font-medium text-blue-600">4</span>
                  </div>
                  <div>
                    <p class="text-sm text-gray-700">
                      <span class="font-medium">Сообщение в чате:</span> в чат Битрикс24 отправляется уведомление с предложением завершить рабочий день.
                    </p>
                  </div>
                </div>
                <div class="flex items-start">
                  <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span class="text-xs font-medium text-blue-600">5</span>
                  </div>
                  <div>
                    <p class="text-sm text-gray-700">
                      <span class="font-medium">Push-уведомление:</span> сотруднику отправляется push-уведомление в мобильное приложение Битрикс24.
                    </p>
                  </div>
                </div>
                <div class="flex items-start mt-2 p-3 bg-yellow-50 rounded-lg">
                  <svg class="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  <div class="text-sm text-yellow-700">
                    <span class="font-medium">Функция доступна на тарифах "Профессиональный" и выше.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </B24Card>

    <!-- Управление встройками -->
    <PlacementsManager class="mt-8" />
  </div>
</template>