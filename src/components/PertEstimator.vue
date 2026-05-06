<template>
  <div class="w-full h-full flex flex-col space-y-4 p-4">
    <!-- Two-column layout for top section -->
    <div class="flex flex-col lg:flex-row gap-4 flex-shrink-0">
      <!-- Left Column: PERT Summary Card -->
      <B24Card class="flex-1">
        <template #header>
          <div class="flex items-center gap-2">
            <span class="text-base font-semibold">Оценка задачи по PERT</span>
          </div>
        </template>
        <B24DescriptionList
            size="lg"
            :items="descriptionItems"
            :b24ui="{
              container: 'mt-2',
              labelWrapper: 'pt-2 sm:py-2',
              descriptionWrapper: 'pb-2 pt-1 sm:py-2',
              description: 'font-mono font-semibold'
            }"
        >
          <template #footer>
            <div class="flex flex-wrap gap-4 pt-2 border-t border-b24-border mt-2">
              <div class="flex items-center gap-2">
                <span class="text-xs text-b24-text-secondary">Стандартное отклонение:</span>
                <span class="text-sm font-mono font-semibold">σ = {{ formatNumber(totalStdDeviation) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-b24-text-secondary">95% Доверительный интервал:</span>
                <span class="text-sm font-mono">
                  {{ formatNumber(finalTotalPERT - 2 * totalStdDeviation) }} – {{ formatNumber(finalTotalPERT + 2 * totalStdDeviation) }}
                </span>
              </div>
            </div>
          </template>
        </B24DescriptionList>
      </B24Card>

      <!-- Right Column: Settings Card -->
      <B24Card class="flex-1">
        <template #header>
          <div class="flex items-center gap-2">
            <span class="text-base font-semibold">Настройки формулы PERT</span>
          </div>
        </template>
        <div class="space-y-4">
          <!-- Testing Markup Setting -->
          <div class="flex items-center justify-between py-2">
            <div>
              <h4 class="text-sm font-medium">Наценка на тестирование</h4>
              <p class="text-xs text-b24-text-secondary">Добавить процент к итоговой PERT оценке</p>
            </div>
            <div class="flex items-center gap-3">
              <B24Switch
                  v-model="settings.testingMarkupEnabled"
                  @update:model-value="handleSettingsChange"
              />
              <B24InputNumber
                  v-model="settings.testingMarkupPercent"
                  :min="0"
                  :max="100"
                  :step="1"
                  size="sm"
                  class="w-24"
                  :disabled="!settings.testingMarkupEnabled"
                  :format-options="{
                    style: 'percent',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }"
                  @update:model-value="handleSettingsChange"
              />
            </div>
          </div>

          <!-- Management Overhead Setting -->
          <div class="flex items-center justify-between py-2">
            <div>
              <h4 class="text-sm font-medium">Затраты на управление задачей</h4>
              <p class="text-xs text-b24-text-secondary">Добавить фиксированное значение к итоговой PERT оценке</p>
            </div>
            <div class="flex items-center gap-3">
              <B24Switch
                  v-model="settings.managementMarkupEnabled"
                  @update:model-value="handleSettingsChange"
              />
              <B24InputNumber
                  v-model="settings.managementMarkupValue"
                  :min="0"
                  :step="0.5"
                  size="sm"
                  class="w-24"
                  :disabled="!settings.managementMarkupEnabled"
                  :format-options="{
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                  }"
                  @update:model-value="handleSettingsChange"
              >
                <template #suffix>ч</template>
              </B24InputNumber>
            </div>
          </div>

          <!-- Step Setting -->
          <div class="flex items-center justify-between py-2">
            <div>
              <h4 class="text-sm font-medium">Шаг изменения значений (в часах)</h4>
              <p class="text-xs text-b24-text-secondary">Шаг для кнопок +/– в числовых полях</p>
            </div>
            <B24InputNumber
                v-model="settings.stepValue"
                :min="0.25"
                :max="100"
                :step="0.05"
                size="sm"
                class="w-24"
                :format-options="{
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
              }"
                @update:model-value="handleSettingsChange"
            />
          </div>
        </div>
      </B24Card>
    </div>

    <!-- Tasks Table -->
    <B24Card class="flex-1 overflow-hidden" :b24ui="{ body: 'p-0 sm:px-0 sm:py-0' }">
      <B24TableWrapper class="w-full" size="lg" bordered row-hover>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
            <tr class="bg-b24-surface-hover">
              <th class="px-3 py-2 text-left">Подзадача</th>
              <th class="px-3 py-2 text-left">Оптимистично</th>
              <th class="px-3 py-2 text-left">Реалистично</th>
              <th class="px-3 py-2 text-left">Пессимистично</th>
              <th class="px-3 py-2 text-center">PERT оценка</th>
              <th class="px-3 py-2 text-left">Действия</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(task, index) in tasks" :key="task.id" :class="{ 'bg-b24-surface-hover/50': index % 2 === 1 }">
              <!-- Task name -->
              <td class="px-3 py-2 align-middle">
                <B24Input
                    v-model="task.name"
                    placeholder="Название задачи"
                    size="md"
                    :class="{ 'font-semibold': index === 0 }"
                    @update:model-value="debouncedUpdate"
                />
              </td>

              <!-- Optimistic (O) -->
              <td class="px-3 py-2 align-middle">
                <B24InputNumber
                    v-model="task.optimistic"
                    :min="0"
                    :step="settings.stepValue"
                    placeholder="—"
                    size="md"
                    class="text-right"
                    @update:model-value="debouncedUpdate"
                />
              </td>

              <!-- Realistic (M) -->
              <td class="px-3 py-2 align-middle">
                <B24InputNumber
                    v-model="task.realistic"
                    :min="0"
                    :step="settings.stepValue"
                    placeholder="—"
                    size="md"
                    class="text-right"
                    @update:model-value="debouncedUpdate"
                />
              </td>

              <!-- Pessimistic (P) -->
              <td class="px-3 py-2 align-middle">
                <B24InputNumber
                    v-model="task.pessimistic"
                    :min="0"
                    :step="settings.stepValue"
                    placeholder="—"
                    size="md"
                    class="text-right"
                    @update:model-value="debouncedUpdate"
                />
              </td>

              <!-- PERT calculated value -->
              <td class="px-3 py-2 text-center align-middle font-mono font-medium">
                {{ calculatePERTValue(task) }}
              </td>

              <!-- Actions -->
              <td class="px-3 py-2 text-center align-middle whitespace-nowrap">
                <div class="flex items-center justify-center gap-1">
                  <B24Button
                      v-if="index !== 0"
                      size="md"
                      variant="ghost"
                      @click="deleteTask(task.id)"
                      title="Удалить"
                  >
                    <Cross30Icon class="w-3 h-3 text-red-600" />
                  </B24Button>
                </div>
              </td>
            </tr>
            </tbody>
            <tfoot>
            <tr>
              <td colspan="6" class="px-3 py-2">
                <B24Button size="lg" variant="outline" @click="addRow" class="w-full">
                  <AddToChecklistIcon class="w-3 h-3" />
                </B24Button>
              </td>
            </tr>
            </tfoot>
          </table>
        </div>
      </B24TableWrapper>
    </B24Card>

    <!-- Action Buttons -->
    <div class="flex items-center justify-end gap-3 flex-shrink-0">
      <div class="flex gap-2">
        <B24Button size="lg" @click="copyResults">Копировать результаты</B24Button>
        <B24Button v-if="showSendButton" size="lg" color="air-primary" @click="sendToChat">
          Отправить в чат
        </B24Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from '@bitrix24/b24ui-nuxt/composables/useToast'
import type { DescriptionListItem } from '@bitrix24/b24ui-nuxt'
import Cross30Icon from '@bitrix24/b24icons-vue/actions/Cross30Icon'
import AddToChecklistIcon from '@bitrix24/b24icons-vue/main/AddToChecklistIcon'


interface Props {
  sendButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sendButton: true,
})

export interface PertTask {
  id: string
  name: string
  optimistic: number | null
  realistic: number | null
  pessimistic: number | null
}

interface Settings {
  stepValue: number
  testingMarkupEnabled: boolean
  testingMarkupPercent: number
  managementMarkupEnabled: boolean
  managementMarkupValue: number
}

const toast = useToast()
let nextId = 1
let updateTimeout: ReturnType<typeof setTimeout> | null = null

const tasks = ref<PertTask[]>([])
const settings = ref<Settings>({
  stepValue: 0.5,
  testingMarkupEnabled: false,
  testingMarkupPercent: 0.2,
  managementMarkupEnabled: false,
  managementMarkupValue: 0,
})

const generateId = (): string => {
  return `${Date.now()}-${nextId++}`
}

const calculatePERT = (optimistic: number, realistic: number, pessimistic: number): number => {
  if (optimistic === null || realistic === null || pessimistic === null) return 0
  return (optimistic + 4 * realistic + pessimistic) / 6
}

const calculateStdDeviation = (optimistic: number, pessimistic: number): number => {
  if (optimistic === null || pessimistic === null) return 0
  return (pessimistic - optimistic) / 6
}

const calculatePERTValue = (task: PertTask): string => {
  const o = task.optimistic ?? 0
  const m = task.realistic ?? 0
  const p = task.pessimistic ?? 0
  if (o === 0 && m === 0 && p === 0) return '—'
  const pert = (o + 4 * m + p) / 6
  return pert.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const totalPERT = computed(() => {
  let total = 0
  for (const task of tasks.value) {
    total += calculatePERT(task.optimistic ?? 0, task.realistic ?? 0, task.pessimistic ?? 0)
  }
  return total
})

// Final PERT with markups applied
const finalTotalPERT = computed(() => {
  let result = totalPERT.value

  // Apply testing markup (percentage)
  if (settings.value.testingMarkupEnabled) {
    result += result * settings.value.testingMarkupPercent
  }

  // Apply management markup (fixed value)
  if (settings.value.managementMarkupEnabled) {
    result += settings.value.managementMarkupValue
  }

  return result
})

const totalOptimistic = computed(() => {
  let total = 0
  for (const task of tasks.value) {
    total += task.optimistic ?? 0
  }
  return total
})

const totalRealistic = computed(() => {
  let total = 0
  for (const task of tasks.value) {
    total += task.realistic ?? 0
  }
  return total
})

const totalPessimistic = computed(() => {
  let total = 0
  for (const task of tasks.value) {
    total += task.pessimistic ?? 0
  }
  return total
})

const totalStdDeviation = computed(() => {
  let totalVariance = 0
  for (const task of tasks.value) {
    const stdDev = calculateStdDeviation(task.optimistic ?? 0, task.pessimistic ?? 0)
    totalVariance += Math.pow(stdDev, 2)
  }
  return Math.sqrt(totalVariance)
})

const showSendButton = computed(() => props.sendButton)

const formatNumber = (value: number): string => {
  if (isNaN(value)) return '0'
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

// DescriptionList items - using finalTotalPERT with markups
const descriptionItems = computed<DescriptionListItem[]>(() => [
  {
    label: 'Итоговая оценка',
    description: formatNumber(finalTotalPERT.value),
    class: 'font-bold',
  },
  {
    label: 'Оптимистично',
    description: formatNumber(totalOptimistic.value),
    class: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Реалистично',
    description: formatNumber(totalRealistic.value),
    class: 'text-blue-600 dark:text-blue-400',
  },
  {
    label: 'Пессимистично',
    description: formatNumber(totalPessimistic.value),
    class: 'text-orange-600 dark:text-orange-400',
  },
])

const debouncedUpdate = () => {
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }
  updateTimeout = setTimeout(() => {
    saveToLocalStorage()
  }, 300)
}

const handleSettingsChange = () => {
  saveToLocalStorage()
}

const addRow = () => {
  const newTask: PertTask = {
    id: generateId(),
    name: `Подзадача ${tasks.value.length + 1}`,
    optimistic: null,
    realistic: null,
    pessimistic: null,
  }
  tasks.value.push(newTask)
  saveToLocalStorage()
}

const deleteTask = (taskId: string) => {
  if (tasks.value[0]?.id === taskId) {
    showNotification('Первую строку нельзя удалить', 'warning')
    return
  }

  tasks.value = tasks.value.filter(t => t.id !== taskId)
  saveToLocalStorage()
  showNotification('Подзадача удалена', 'info')
}

const getFormattedResults = (): string => {
  let result = '📊 PERT Оценка задачи\n\n'

  for (const task of tasks.value) {
    const pert = calculatePERT(task.optimistic ?? 0, task.realistic ?? 0, task.pessimistic ?? 0)
    result += `• ${task.name}\n`
    result += `  Оптимистично: ${formatNumber(task.optimistic ?? 0)} | Реалистично: ${formatNumber(task.realistic ?? 0)} | Пессимистично: ${formatNumber(task.pessimistic ?? 0)}\n`
    result += `  PERT: ${formatNumber(pert)}\n\n`
  }

  result += '─'.repeat(40) + '\n'
  result += `📈 ИТОГО:\n`
  result += `  Оптимистично: ${formatNumber(totalOptimistic.value)}\n`
  result += `  Реалистично: ${formatNumber(totalRealistic.value)}\n`
  result += `  Пессимистично: ${formatNumber(totalPessimistic.value)}\n`
  result += `  PERT оценка: ${formatNumber(totalPERT.value)}\n`

  if (settings.value.testingMarkupEnabled || settings.value.managementMarkupEnabled) {
    result += `\n📈 НАЦЕНКИ:\n`
    if (settings.value.testingMarkupEnabled) {
      result += `  Тестирование (+${Math.round(settings.value.testingMarkupPercent * 100)}%): ${formatNumber(totalPERT.value * settings.value.testingMarkupPercent)}\n`
    }
    if (settings.value.managementMarkupEnabled) {
      result += `  Управление задачей (+${formatNumber(settings.value.managementMarkupValue)}): ${formatNumber(settings.value.managementMarkupValue)}\n`
    }
    result += `  ИТОГО с наценками: ${formatNumber(finalTotalPERT.value)}\n`
  }

  result += `\n  Стандартное отклонение: σ = ${formatNumber(totalStdDeviation.value)}\n`
  result += `  95% Доверительный интервал: ${formatNumber(finalTotalPERT.value - 2 * totalStdDeviation.value)} – ${formatNumber(finalTotalPERT.value + 2 * totalStdDeviation.value)}\n`

  return result
}

const copyResults = async () => {
  try {
    const text = getFormattedResults()
    await navigator.clipboard.writeText(text)
    showNotification('Результаты скопированы в буфер обмена', 'success')
  } catch (error) {
    console.error('Copy error:', error)
    showNotification('Не удалось скопировать', 'error')
  }
}

const sendToChat = async () => {
  try {
    const message = getFormattedResults()
    if (window.BX24) {
      await window.BX24.callMethod('im.message.add', {
        DIALOG_ID: window.BX24?.user?.id,
        MESSAGE: message,
        SYSTEM: 'N',
      })
      showNotification('Отправлено в чат', 'success')
    } else {
      showNotification('Bitrix24 SDK не доступен', 'error')
    }
  } catch (error) {
    console.error('Send error:', error)
    showNotification('Ошибка отправки', 'error')
  }
}

const showNotification = (message: string, variant: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  toast.add({
    description: message,
    variant,
  })
}

const STORAGE_KEY = 'pert_tasks_data'
const SETTINGS_STORAGE_KEY = 'pert_settings_data'

const saveToLocalStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.value))
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings.value))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

const loadFromLocalStorage = () => {
  try {
    // Load tasks
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length) {
        tasks.value = parsed
      } else {
        setDefaultTasks()
      }
    } else {
      setDefaultTasks()
    }

    // Load settings
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings)
      settings.value = {
        stepValue: parsedSettings.stepValue ?? 0.5,
        testingMarkupEnabled: parsedSettings.testingMarkupEnabled ?? false,
        testingMarkupPercent: parsedSettings.testingMarkupPercent ?? 0.2,
        managementMarkupEnabled: parsedSettings.managementMarkupEnabled ?? false,
        managementMarkupValue: parsedSettings.managementMarkupValue ?? 0,
      }
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error)
    setDefaultTasks()
  }
}

const setDefaultTasks = () => {
  tasks.value = [
    {
      id: generateId(),
      name: 'Основная задача',
      optimistic: 5,
      realistic: 8,
      pessimistic: 15,
    },
  ]
}

onMounted(() => {
  loadFromLocalStorage()
  if (window.BX24) {
    window.BX24.init(() => {
      console.log('Bitrix24 SDK initialized')
    })
  }
})
</script>