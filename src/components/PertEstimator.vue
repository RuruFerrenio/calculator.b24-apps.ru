<template>
  <div class="w-full h-full flex flex-col space-y-4 p-4">
    <!-- Header Card -->
    <B24Card class="flex-shrink-0">
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-b24-text-primary">PERT Оценка задачи</h2>
            <p class="text-sm text-b24-text-secondary mt-1">Трехточечная оценка</p>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
          <div class="bg-b24-surface-hover rounded-lg p-3">
            <div class="text-xs text-b24-text-secondary">Общая PERT оценка</div>
            <div class="text-xl font-bold text-b24-primary">{{ formatNumber(totalPERT) }}</div>
          </div>
          <div class="bg-b24-surface-hover rounded-lg p-3">
            <div class="text-xs text-b24-text-secondary">Общая оптимистичная</div>
            <div class="text-xl font-bold text-green-600">{{ formatNumber(totalOptimistic) }}</div>
          </div>
          <div class="bg-b24-surface-hover rounded-lg p-3">
            <div class="text-xs text-b24-text-secondary">Общая реалистичная</div>
            <div class="text-xl font-bold text-blue-600">{{ formatNumber(totalRealistic) }}</div>
          </div>
          <div class="bg-b24-surface-hover rounded-lg p-3">
            <div class="text-xs text-b24-text-secondary">Общая пессимистичная</div>
            <div class="text-xl font-bold text-red-600">{{ formatNumber(totalPessimistic) }}</div>
          </div>
        </div>

        <!-- Std Deviation & Confidence -->
        <div class="flex flex-wrap gap-4 pt-2 border-t border-b24-border">
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
      </div>
    </B24Card>

    <!-- Tasks Table -->
    <B24Card class="flex-1 overflow-hidden" :b24ui="{ body: 'p-0 sm:px-0 sm:py-0' }">
      <B24TableWrapper class="w-full" size="sm" bordered row-hover>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
            <tr class="bg-b24-surface-hover">
              <th class="px-3 py-2 text-left min-w-[200px]">Задача</th>
              <th class="px-3 py-2 text-right min-w-[100px]">Оптимистично (O)</th>
              <th class="px-3 py-2 text-right min-w-[100px]">Реалистично (M)</th>
              <th class="px-3 py-2 text-right min-w-[100px]">Пессимистично (P)</th>
              <th class="px-3 py-2 text-right min-w-[100px]">PERT оценка</th>
              <th class="px-3 py-2 text-center w-24">Действия</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(task, index) in tasks" :key="task.id" :class="{ 'bg-b24-surface-hover/50': index % 2 === 1 }">
              <!-- Task name -->
              <td class="px-3 py-2 align-middle">
                <input
                    v-model="task.name"
                    type="text"
                    placeholder="Название задачи"
                    class="w-full bg-transparent border-none outline-none text-sm focus:ring-0 p-0"
                    :class="{ 'font-semibold': index === 0 }"
                    @input="handleTaskUpdate(task)"
                />
              </td>

              <!-- Optimistic (O) -->
              <td class="px-3 py-2 text-right align-middle">
                <input
                    v-model.number="task.optimistic"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="—"
                    class="w-24 text-right bg-transparent border border-b24-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-b24-primary"
                    @input="handleTaskUpdate(task)"
                />
              </td>

              <!-- Realistic (M) -->
              <td class="px-3 py-2 text-right align-middle">
                <input
                    v-model.number="task.realistic"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="—"
                    class="w-24 text-right bg-transparent border border-b24-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-b24-primary"
                    @input="handleTaskUpdate(task)"
                />
              </td>

              <!-- Pessimistic (P) -->
              <td class="px-3 py-2 text-right align-middle">
                <input
                    v-model.number="task.pessimistic"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="—"
                    class="w-24 text-right bg-transparent border border-b24-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-b24-primary"
                    @input="handleTaskUpdate(task)"
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

const handleTaskUpdate = (updatedTask: PertTask) => {
  const index = tasks.value.findIndex(t => t.id === updatedTask.id)
  if (index !== -1) {
    tasks.value[index] = { ...updatedTask }
    saveToLocalStorage()
  }
}

const deleteTask = (taskId: string) => {
  // Не удаляем первую строку
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
    // Default demo data - только первая строка
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