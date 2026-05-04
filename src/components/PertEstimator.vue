<template>
  <div class="w-full h-full flex flex-col space-y-4 p-4">
    <!-- Header Card with DescriptionList -->
    <B24Card class="flex-shrink-0">
      <B24DescriptionList
          legend="PERT Оценка задачи"
          text="Трехточечная оценка с автоматическим расчетом"
          size="sm"
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
                {{ formatNumber(totalPERT - 2 * totalStdDeviation) }} – {{ formatNumber(totalPERT + 2 * totalStdDeviation) }}
              </span>
            </div>
          </div>
        </template>
      </B24DescriptionList>
    </B24Card>

    <!-- Tasks Table -->
    <B24Card class="flex-1 overflow-hidden" :b24ui="{ body: 'p-0 sm:px-0 sm:py-0' }">
      <B24TableWrapper class="w-full" size="sm" bordered row-hover>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
            <tr class="bg-b24-surface-hover">
              <th class="px-3 py-2 text-left">Задача</th>
              <th class="px-3 py-2 text-left">Оптимистично (O)</th>
              <th class="px-3 py-2 text-left">Реалистично (M)</th>
              <th class="px-3 py-2 text-left">Пессимистично (P)</th>
              <th class="px-3 py-2 text-right min-w-[100px]">PERT оценка</th>
              <th class="px-3 py-2 text-center w-24">Действия</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(task, index) in tasks" :key="task.id" :class="{ 'bg-b24-surface-hover/50': index % 2 === 1 }">
              <!-- Task name -->
              <td class="px-3 py-2 align-middle">
                <B24Input
                    v-model="task.name"
                    placeholder="Название задачи"
                    size="sm"
                    :class="{ 'font-semibold': index === 0 }"
                    @update:model-value="debouncedUpdate"
                />
              </td>

              <!-- Optimistic (O) -->
              <td class="px-3 py-2 align-middle">
                <B24Input
                    v-model.number="task.optimistic"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="—"
                    size="sm"
                    class="text-right"
                    @update:model-value="debouncedUpdate"
                />
              </td>

              <!-- Realistic (M) -->
              <td class="px-3 py-2 align-middle">
                <B24Input
                    v-model.number="task.realistic"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="—"
                    size="sm"
                    class="text-right"
                    @update:model-value="debouncedUpdate"
                />
              </td>

              <!-- Pessimistic (P) -->
              <td class="px-3 py-2 align-middle">
                <B24Input
                    v-model.number="task.pessimistic"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="—"
                    size="sm"
                    class="text-right"
                    @update:model-value="debouncedUpdate"
                />
              </td>

              <!-- PERT calculated value -->
              <td class="px-3 py-2 text-right align-middle font-mono font-medium">
                {{ calculatePERTValue(task) }}
              </td>

              <!-- Actions -->
              <td class="px-3 py-2 text-center align-middle whitespace-nowrap">
                <div class="flex items-center justify-center gap-1">
                  <B24Button
                      v-if="index !== 0"
                      size="xs"
                      variant="ghost"
                      @click="deleteTask(task.id)"
                      title="Удалить"
                      color="red"
                  >
                    🗑
                  </B24Button>
                </div>
              </td>
            </tr>
            </tbody>
            <tfoot>
            <tr>
              <td colspan="6" class="px-3 py-2">
                <B24Button size="sm" variant="outline" @click="addRow" class="w-full">
                  + Добавить строку
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
        <B24Button size="sm" @click="copyResults">Копировать результаты</B24Button>
        <B24Button v-if="showSendButton" size="sm" color="air-primary" @click="sendToChat">
          Отправить в чат
        </B24Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@bitrix24/b24ui-nuxt/composables/useToast'
import type { DescriptionListItem } from '@bitrix24/b24ui-nuxt'
import TargetIcon from '@bitrix24/b24icons-vue/main/TargetIcon'
import CircleCheckIcon from '@bitrix24/b24icons-vue/outline/CircleCheckIcon'
import ClockIcon from '@bitrix24/b24icons-vue/outline/ClockIcon'
import AlertIcon from '@bitrix24/b24icons-vue/outline/AlertIcon'

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

const toast = useToast()
let nextId = 1
let updateTimeout: ReturnType<typeof setTimeout> | null = null

const tasks = ref<PertTask[]>([])

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

// DescriptionList items
const descriptionItems = computed<DescriptionListItem[]>(() => [
  {
    label: 'PERT оценка',
    description: formatNumber(totalPERT.value),
    icon: TargetIcon,
  },
  {
    label: 'Оптимистично',
    description: formatNumber(totalOptimistic.value),
    icon: CircleCheckIcon,
  },
  {
    label: 'Реалистично',
    description: formatNumber(totalRealistic.value),
    icon: ClockIcon,
  },
  {
    label: 'Пессимистично',
    description: formatNumber(totalPessimistic.value),
    icon: AlertIcon,
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

const addRow = () => {
  const newTask: PertTask = {
    id: generateId(),
    name: `Задача ${tasks.value.length + 1}`,
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
  showNotification('Задача удалена', 'info')
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
  result += `  Стандартное отклонение: σ = ${formatNumber(totalStdDeviation.value)}\n`
  result += `  95% Доверительный интервал: ${formatNumber(totalPERT.value - 2 * totalStdDeviation.value)} – ${formatNumber(totalPERT.value + 2 * totalStdDeviation.value)}\n`

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

const saveToLocalStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.value))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length) {
        tasks.value = parsed
        return
      }
    }
    tasks.value = [
      {
        id: generateId(),
        name: 'Основная задача',
        optimistic: 5,
        realistic: 8,
        pessimistic: 15,
      },
    ]
  } catch (error) {
    console.error('Error loading from localStorage:', error)
  }
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