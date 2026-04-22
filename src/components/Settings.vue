<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useToast } from '@bitrix24/b24ui-nuxt/composables/useToast'
import PlacementsManager from './PlacementsManager.vue'

// Импортируем недостающие компоненты
import {
  B24PageHeader,
  B24Card,
  B24Switch,
  B24Form,
  B24FormField,
  B24RadioGroup
} from '@bitrix24/b24ui-nuxt'

const toast = useToast()

// Типы данных
interface WorkdaySettings {
  enabled: boolean
  method: 'auto' | 'modal'
}

interface FormData {
  workdayStart: WorkdaySettings
  workdayEnd: WorkdaySettings
}

// Класс для работы с системой
class SettingsSystem {
  public isProcessing = ref(false)
  public isBitrixLoaded = ref(false)
  public formData = ref<FormData>({
    workdayStart: {
      enabled: false,
      method: 'modal'
    },
    workdayEnd: {
      enabled: false,
      method: 'modal'
    }
  })

  // Единая функция для уведомлений
  private showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    if (typeof toast !== 'undefined') {
      toast.add({
        description: message,
        variant: type
      })
    }
  }

  public getWorkdayStartMethodText(): string {
    const methods: Record<'auto' | 'modal', string> = {
      'auto': 'Автоматический старт',
      'modal': 'Модальное окно с предупреждением'
    }
    return methods[this.formData.value.workdayStart.method] || 'модальное окно'
  }

  public getWorkdayEndMethodText(): string {
    const methods: Record<'auto' | 'modal', string> = {
      'auto': 'Автоматическое завершение',
      'modal': 'Модальное окно с предупреждением'
    }
    return methods[this.formData.value.workdayEnd.method] || 'модальное окно'
  }

  public async toggleWorkdayStart(newValue: boolean): Promise<void> {
    try {
      this.isProcessing.value = true
      if (this.isBitrixLoaded.value && typeof BX24 !== 'undefined') {
        await BX24.appOption.set('workday_start_enabled', newValue ? 'Y' : 'N')
      }
      this.formData.value.workdayStart.enabled = newValue
      this.showNotification('success', newValue ? 'Помощь в старте рабочего дня включена' : 'Помощь в старте рабочего дня выключена')
    } catch {
      this.showNotification('error', 'Ошибка сохранения настройки')
    } finally {
      this.isProcessing.value = false
    }
  }

  public async toggleWorkdayEnd(newValue: boolean): Promise<void> {
    try {
      this.isProcessing.value = true
      if (this.isBitrixLoaded.value && typeof BX24 !== 'undefined') {
        await BX24.appOption.set('workday_end_enabled', newValue ? 'Y' : 'N')
      }
      this.formData.value.workdayEnd.enabled = newValue
      this.showNotification('success', newValue ? 'Помощь в завершении рабочего дня включена' : 'Помощь в завершении рабочего дня выключена')
    } catch {
      this.showNotification('error', 'Ошибка сохранения настройки')
    } finally {
      this.isProcessing.value = false
    }
  }

  public async updateWorkdayStartMethod(): Promise<void> {
    try {
      this.isProcessing.value = true
      if (this.isBitrixLoaded.value && typeof BX24 !== 'undefined') {
        await BX24.appOption.set('workday_start_method', this.formData.value.workdayStart.method)
      }
      const methodText = this.getWorkdayStartMethodText()
      this.showNotification('success', `Способ старта рабочего дня: ${methodText}`)
    } catch {
      this.showNotification('error', 'Ошибка сохранения способа старта')
    } finally {
      this.isProcessing.value = false
    }
  }

  public async updateWorkdayEndMethod(): Promise<void> {
    try {
      this.isProcessing.value = true
      if (this.isBitrixLoaded.value && typeof BX24 !== 'undefined') {
        await BX24.appOption.set('workday_end_method', this.formData.value.workdayEnd.method)
      }
      const methodText = this.getWorkdayEndMethodText()
      this.showNotification('success', `Способ завершения рабочего дня: ${methodText}`)
    } catch {
      this.showNotification('error', 'Ошибка сохранения способа завершения')
    } finally {
      this.isProcessing.value = false
    }
  }

  public async saveWorkdayStartSettings(): Promise<void> {
    try {
      this.isProcessing.value = true
      if (this.isBitrixLoaded.value && typeof BX24 !== 'undefined') {
        await BX24.appOption.set('workday_start_enabled', this.formData.value.workdayStart.enabled ? 'Y' : 'N')
        await BX24.appOption.set('workday_start_method', this.formData.value.workdayStart.method)
      }
      this.showNotification('success', 'Настройки помощи в старте рабочего дня сохранены')
    } catch {
      this.showNotification('error', 'Ошибка сохранения настроек')
    } finally {
      this.isProcessing.value = false
    }
  }

  public async saveWorkdayEndSettings(): Promise<void> {
    try {
      this.isProcessing.value = true
      if (this.isBitrixLoaded.value && typeof BX24 !== 'undefined') {
        await BX24.appOption.set('workday_end_enabled', this.formData.value.workdayEnd.enabled ? 'Y' : 'N')
        await BX24.appOption.set('workday_end_method', this.formData.value.workdayEnd.method)
      }
      this.showNotification('success', 'Настройки помощи в завершении рабочего дня сохранены')
    } catch {
      this.showNotification('error', 'Ошибка сохранения настроек')
    } finally {
      this.isProcessing.value = false
    }
  }

  private normalizeBoolean(value: unknown): boolean {
    return value === 'Y' || value === true || value === 1
  }

  private normalizeMethod(value: unknown, validMethods: readonly string[]): 'auto' | 'modal' | null {
    if (typeof value === 'string' && validMethods.includes(value)) {
      return value as 'auto' | 'modal'
    }
    return null
  }

  public async loadSettings(): Promise<void> {
    if (!this.isBitrixLoaded.value || typeof BX24 === 'undefined') return

    try {
      const [
        workdayStartEnabled,
        workdayStartMethod,
        workdayEndEnabled,
        workdayEndMethod
      ] = await Promise.all([
        BX24.appOption.get('workday_start_enabled'),
        BX24.appOption.get('workday_start_method'),
        BX24.appOption.get('workday_end_enabled'),
        BX24.appOption.get('workday_end_method')
      ])

      // Загрузка настроек старта рабочего дня
      this.formData.value.workdayStart.enabled = this.normalizeBoolean(workdayStartEnabled)

      const startMethod = this.normalizeMethod(workdayStartMethod, ['auto', 'modal'])
      if (startMethod) {
        this.formData.value.workdayStart.method = startMethod
      }

      // Загрузка настроек завершения рабочего дня
      this.formData.value.workdayEnd.enabled = this.normalizeBoolean(workdayEndEnabled)

      const endMethod = this.normalizeMethod(workdayEndMethod, ['auto', 'modal'])
      if (endMethod) {
        this.formData.value.workdayEnd.method = endMethod
      }

    } catch (error) {
      console.error('Ошибка загрузки настроек:', error)
    }
  }
}

// Инициализация системы
const settingsSystem = new SettingsSystem()

// Жизненный цикл
onMounted(async () => {
  if (typeof BX24 !== 'undefined' && BX24.init) {
    BX24.init(async () => {
      settingsSystem.isBitrixLoaded.value = true
      await settingsSystem.loadSettings()
    })
  }
})

// Наблюдатели
watch(() => settingsSystem.formData.value.workdayStart.method, () => {
  if (settingsSystem.isProcessing.value) return
  settingsSystem.updateWorkdayStartMethod()
})

watch(() => settingsSystem.formData.value.workdayEnd.method, () => {
  if (settingsSystem.isProcessing.value) return
  settingsSystem.updateWorkdayEndMethod()
})
</script>

<template>
  <div>
    <B24PageHeader
        title="Контроль времени сотрудников"
        description="Система мониторинга активности и рабочего времени"
    />

    <!-- Блок 1: Помощь в старте рабочего дня -->
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
                   :class="settingsSystem.formData.workdayStart.enabled ? 'bg-green-500' : 'bg-red-500'"></div>
              <B24Switch
                  :model-value="settingsSystem.formData.workdayStart.enabled"
                  @update:model-value="settingsSystem.toggleWorkdayStart"
                  :disabled="settingsSystem.isProcessing"
              />
            </div>
          </div>

          <!-- Настройки помощи -->
          <div v-if="settingsSystem.formData.workdayStart.enabled" class="space-y-4 pt-4 border-t">
            <B24Form
                :state="settingsSystem.formData"
                class="space-y-4"
                @submit="settingsSystem.saveWorkdayStartSettings"
            >
              <!-- Способ старта рабочего дня -->
              <B24FormField
                  label="Способ старта рабочего дня"
                  name="workdayStartMethod"
                  :help-text="`Текущий способ: ${settingsSystem.getWorkdayStartMethodText()}`"
              >
                <B24RadioGroup
                    :model-value="settingsSystem.formData.workdayStart.method"
                    @update:model-value="(val) => settingsSystem.formData.workdayStart.method = val"
                    :disabled="settingsSystem.isProcessing"
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
                      Данные о начале рабочего дня сохраняются и используются в статистике рабочего дня
                    </p>
                  </div>
                </div>
                <div class="flex items-start mt-2 p-3 bg-yellow-50 rounded-lg">
                  <svg class="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  <div class="text-sm text-yellow-700">
                    <span class="font-medium">Функция доступна на тарифах "Базовый" и выше.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </B24Card>

    <!-- Блок 2: Помощь в завершении рабочего дня -->
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
                   :class="settingsSystem.formData.workdayEnd.enabled ? 'bg-green-500' : 'bg-red-500'"></div>
              <B24Switch
                  :model-value="settingsSystem.formData.workdayEnd.enabled"
                  @update:model-value="settingsSystem.toggleWorkdayEnd"
                  :disabled="settingsSystem.isProcessing"
              />
            </div>
          </div>

          <!-- Настройки помощи в завершении -->
          <div v-if="settingsSystem.formData.workdayEnd.enabled" class="space-y-4 pt-4 border-t">
            <B24Form
                :state="settingsSystem.formData"
                class="space-y-4"
                @submit="settingsSystem.saveWorkdayEndSettings"
            >
              <!-- Способ завершения рабочего дня -->
              <B24FormField
                  label="Способ завершения рабочего дня"
                  name="workdayEndMethod"
                  :help-text="`Текущий способ: ${settingsSystem.getWorkdayEndMethodText()}`"
              >
                <B24RadioGroup
                    :model-value="settingsSystem.formData.workdayEnd.method"
                    @update:model-value="(val) => settingsSystem.formData.workdayEnd.method = val"
                    :disabled="settingsSystem.isProcessing"
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
                <div class="flex items-start mt-2 p-3 bg-yellow-50 rounded-lg">
                  <svg class="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  <div class="text-sm text-yellow-700">
                    <span class="font-medium">Функция доступна на тарифах "Базовый" и выше.</span>
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