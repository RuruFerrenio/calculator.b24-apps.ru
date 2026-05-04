<template>
  <div class="w-full h-full flex flex-col space-y-4 p-4">
    <!-- Header Card -->
    <B24Card class="flex-shrink-0">
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-b24-text-primary">PERT Оценка задачи</h2>
            <p class="text-sm text-b24-text-secondary mt-1">Трехточечная оценка с декомпозицией до 3 уровней</p>
          </div>
          <B24Button size="sm" @click="addRootTask" variant="outline">
            + Добавить задачу
          </B24Button>
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
      <B24TableWrapper
          class="w-full"
          size="sm"
          bordered
          row-hover
          :pin-rows="false"
          :pin-cols="false"
      >
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
            <tr class="bg-b24-surface-hover">
              <th class="w-8 px-3 py-2 text-left">#</th>
              <th class="px-3 py-2 text-left min-w-[200px]">Задача / Подзадача</th>
              <th class="px-3 py-2 text-right min-w-[100px]">Оптимистично (O)</th>
              <th class="px-3 py-2 text-right min-w-[100px]">Реалистично (M)</th>
              <th class="px-3 py-2 text-right min-w-[100px]">Пессимистично (P)</th>
              <th class="px-3 py-2 text-right min-w-[100px]">PERT оценка</th>
              <th class="px-3 py-2 text-center w-24">Действия</th>
            </tr>
            </thead>
            <tbody>
            <template v-for="(task, index) in tasks" :key="task.id">
              <TaskRow
                  :task="task"
                  :level="0"
                  :index="index"
                  @update="handleTaskUpdate"
                  @delete="handleTaskDelete"
                  @add-subtask="handleAddSubtask"
              />
            </template>
            </tbody>
            <tfoot v-if="tasks.length === 0">
            <tr>
              <td colspan="7" class="px-3 py-8 text-center text-b24-text-secondary">
                Нет задач. Нажмите "Добавить задачу" чтобы начать.
              </td>
            </tr>
            </tfoot>
          </table>
        </div>
      </B24TableWrapper>
    </B24Card>

    <!-- Action Buttons -->
    <div class="flex items-center justify-between gap-3 flex-shrink-0">
      <div class="flex gap-2">
        <B24Button size="sm" variant="ghost" @click="expandAll">
          Развернуть все
        </B24Button>
        <B24Button size="sm" variant="ghost" @click="collapseAll">
          Свернуть все
        </B24Button>
      </div>
      <div class="flex gap-2">
        <B24Button size="sm" @click="copyResults">
          Копировать результаты
        </B24Button>
        <B24Button
            v-if="showSendButton"
            size="sm"
            color="air-primary"
            @click="sendToChat"
        >
          Отправить в чат
        </B24Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TaskRow from './TaskRow.vue'
import { useToast } from '@bitrix24/b24ui-nuxt/composables/useToast'

// Props
interface Props {
  sendButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sendButton: true
})

// Types
export interface PertTask {
  id: string
  name: string
  optimistic: number | null
  realistic: number | null
  pessimistic: number | null
  children: PertTask[]
  isExpanded: boolean
  level: number
}

// Global declarations
declare global {
  interface Window {
    BX24?: {
      init: (callback: () => void) => void
      callMethod: (method: string, params: Record<string, unknown>, callback?: (result: unknown) => void) => Promise<unknown>
    }
  }
}

// Utils
const toast = useToast()
let nextId = 1

// State
const tasks = ref<PertTask[]>([])

// Helper functions
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

// Recursive task calculations
const recalcTaskTotals = (task: PertTask): { pert: number; optimistic: number; realistic: number; pessimistic: number; stdDev: number } => {
  if (!task.children || task.children.length === 0) {
    const pert = calculatePERT(task.optimistic ?? 0, task.realistic ?? 0, task.pessimistic ?? 0)
    const stdDev = calculateStdDeviation(task.optimistic ?? 0, task.pessimistic ?? 0)
    return {
      pert,
      optimistic: task.optimistic ?? 0,
      realistic: task.realistic ?? 0,
      pessimistic: task.pessimistic ?? 0,
      stdDev
    }
  }

  let totalPert = 0
  let totalOptimistic = 0
  let totalRealistic = 0
  let totalPessimistic = 0
  let totalVariance = 0

  for (const child of task.children) {
    const childTotals = recalcTaskTotals(child)
    totalPert += childTotals.pert
    totalOptimistic += childTotals.optimistic
    totalRealistic += childTotals.realistic
    totalPessimistic += childTotals.pessimistic
    totalVariance += Math.pow(childTotals.stdDev, 2)
  }

  return {
    pert: totalPert,
    optimistic: totalOptimistic,
    realistic: totalRealistic,
    pessimistic: totalPessimistic,
    stdDev: Math.sqrt(totalVariance)
  }
}

// Global totals
const totalPERT = computed(() => {
  let total = 0
  for (const task of tasks.value) {
    total += recalcTaskTotals(task).pert
  }
  return total
})

const totalOptimistic = computed(() => {
  let total = 0
  for (const task of tasks.value) {
    total += recalcTaskTotals(task).optimistic
  }
  return total
})

const totalRealistic = computed(() => {
  let total = 0
  for (const task of tasks.value) {
    total += recalcTaskTotals(task).realistic
  }
  return total
})

const totalPessimistic = computed(() => {
  let total = 0
  for (const task of tasks.value) {
    total += recalcTaskTotals(task).pessimistic
  }
  return total
})

const totalStdDeviation = computed(() => {
  let totalVariance = 0
  for (const task of tasks.value) {
    const taskTotals = recalcTaskTotals(task)
    totalVariance += Math.pow(taskTotals.stdDev, 2)
  }
  return Math.sqrt(totalVariance)
})

const showSendButton = computed(() => props.sendButton)

// Formatting
const formatNumber = (value: number): string => {
  if (isNaN(value)) return '0'
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

// Task operations
const addRootTask = () => {
  const newTask: PertTask = {
    id: generateId(),
    name: `Задача ${tasks.value.length + 1}`,
    optimistic: null,
    realistic: null,
    pessimistic: null,
    children: [],
    isExpanded: true,
    level: 0
  }
  tasks.value.push(newTask)
  saveToLocalStorage()
}

const handleTaskUpdate = (updatedTask: PertTask) => {
  const updateInTree = (tasksList: PertTask[]): boolean => {
    for (let i = 0; i < tasksList.length; i++) {
      if (tasksList[i].id === updatedTask.id) {
        tasksList[i] = { ...updatedTask, children: tasksList[i].children }
        return true
      }
      if (updateInTree(tasksList[i].children)) {
        return true
      }
    }
    return false
  }
  updateInTree(tasks.value)
  saveToLocalStorage()
}

const handleTaskDelete = (taskId: string) => {
  const deleteFromTree = (tasksList: PertTask[]): boolean => {
    for (let i = 0; i < tasksList.length; i++) {
      if (tasksList[i].id === taskId) {
        tasksList.splice(i, 1)
        return true
      }
      if (deleteFromTree(tasksList[i].children)) {
        return true
      }
    }
    return false
  }
  deleteFromTree(tasks.value)
  saveToLocalStorage()
  showNotification('Задача удалена', 'info')
}

const handleAddSubtask = (parentTask: PertTask) => {
  if (parentTask.level >= 2) {
    showNotification('Максимальная глубина декомпозиции - 3 уровня', 'warning')
    return
  }

  const newSubtask: PertTask = {
    id: generateId(),
    name: `Подзадача ${parentTask.children.length + 1}`,
    optimistic: null,
    realistic: null,
    pessimistic: null,
    children: [],
    isExpanded: true,
    level: parentTask.level + 1
  }

  const addToParent = (tasksList: PertTask[]): boolean => {
    for (let i = 0; i < tasksList.length; i++) {
      if (tasksList[i].id === parentTask.id) {
        tasksList[i].children.push(newSubtask)
        return true
      }
      if (addToParent(tasksList[i].children)) {
        return true
      }
    }
    return false
  }

  addToParent(tasks.value)
  saveToLocalStorage()
  showNotification('Подзадача добавлена', 'success')
}

// Expand / Collapse
const expandAll = () => {
  const expand = (task: PertTask) => {
    task.isExpanded = true
    task.children.forEach(expand)
  }
  tasks.value.forEach(expand)
}

const collapseAll = () => {
  const collapse = (task: PertTask) => {
    task.isExpanded = false
    task.children.forEach(collapse)
  }
  tasks.value.forEach(collapse)
}

// Format results for export
const formatTaskTree = (task: PertTask, depth = 0): string => {
  const indent = '  '.repeat(depth)
  const totals = recalcTaskTotals(task)
  let result = `${indent}• ${task.name}\n`
  result += `${indent}  Оптимистично: ${formatNumber(totals.optimistic)} | Реалистично: ${formatNumber(totals.realistic)} | Пессимистично: ${formatNumber(totals.pessimistic)}\n`
  result += `${indent}  PERT: ${formatNumber(totals.pert)} | σ: ${formatNumber(totals.stdDev)}\n`
  for (const child of task.children) {
    result += formatTaskTree(child, depth + 1)
  }
  return result
}

const getFormattedResults = (): string => {
  let result = '📊 PERT Оценка задачи\n\n'
  for (const task of tasks.value) {
    result += formatTaskTree(task)
    result += '\n'
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

// Local Storage
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
    // Default demo data
    tasks.value = [
      {
        id: generateId(),
        name: 'Разработка модуля авторизации',
        optimistic: 5,
        realistic: 8,
        pessimistic: 15,
        children: [
          {
            id: generateId(),
            name: 'Дизайн интерфейса',
            optimistic: 2,
            realistic: 3,
            pessimistic: 5,
            children: [],
            isExpanded: true,
            level: 1
          },
          {
            id: generateId(),
            name: 'Бэкенд разработка',
            optimistic: 3,
            realistic: 5,
            pessimistic: 10,
            children: [],
            isExpanded: true,
            level: 1
          }
        ],
        isExpanded: true,
        level: 0
      },
      {
        id: generateId(),
        name: 'Тестирование и отладка',
        optimistic: 2,
        realistic: 4,
        pessimistic: 7,
        children: [],
        isExpanded: true,
        level: 0
      }
    ]
  } catch (error) {
    console.error('Error loading from localStorage:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadFromLocalStorage()
  if (window.BX24) {
    window.BX24.init(() => {
      console.log('Bitrix24 SDK initialized')
    })
  }
})
</script>