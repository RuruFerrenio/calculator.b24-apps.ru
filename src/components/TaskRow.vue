<template>
  <template v-for="(task, idx) in [localTask]" :key="task.id">
    <!-- Main task row -->
    <tr :class="{ 'bg-b24-surface-hover/50': level % 2 === 1 }">
      <!-- Task name with indentation -->
      <td class="px-3 py-2 align-middle">
        <div class="flex items-center" :style="{ marginLeft: `${level * 20}px` }">
          <button
              v-if="task.children && task.children.length > 0"
              @click="toggleExpand"
              class="p-1 mr-1 hover:bg-b24-surface-hover rounded transition-colors flex-shrink-0"
          >
            <i :class="task.isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="text-xs text-b24-text-secondary"></i>
          </button>
          <div v-else class="w-5 mr-1 flex-shrink-0"></div>
          <input
              v-model="localTask.name"
              type="text"
              placeholder="Название задачи"
              class="w-full bg-transparent border-none outline-none text-sm focus:ring-0 p-0"
              :class="{ 'font-semibold': level === 0 }"
              @input="emitUpdate"
          />
        </div>
      </td>

      <!-- Optimistic (O) -->
      <td class="px-3 py-2 text-right align-middle">
        <input
            v-model.number="localTask.optimistic"
            type="number"
            step="0.5"
            min="0"
            placeholder="—"
            class="w-24 text-right bg-transparent border border-b24-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-b24-primary"
            @input="emitUpdate"
        />
      </td>

      <!-- Realistic (M) -->
      <td class="px-3 py-2 text-right align-middle">
        <input
            v-model.number="localTask.realistic"
            type="number"
            step="0.5"
            min="0"
            placeholder="—"
            class="w-24 text-right bg-transparent border border-b24-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-b24-primary"
            @input="emitUpdate"
        />
      </td>

      <!-- Pessimistic (P) -->
      <td class="px-3 py-2 text-right align-middle">
        <input
            v-model.number="localTask.pessimistic"
            type="number"
            step="0.5"
            min="0"
            placeholder="—"
            class="w-24 text-right bg-transparent border border-b24-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-b24-primary"
            @input="emitUpdate"
        />
      </td>

      <!-- PERT calculated value -->
      <td class="px-3 py-2 text-right align-middle font-mono font-medium">
        {{ pertValue }}
      </td>

      <!-- Actions -->
      <td class="px-3 py-2 text-center align-middle whitespace-nowrap">
        <div class="flex items-center justify-center gap-1">
          <B24Button
              v-if="level < 2"
              size="xs"
              variant="ghost"
              @click="decompose"
              title="Декомпозировать"
          >
            📊
          </B24Button>
          <B24Button
              v-if="level < 2"
              size="xs"
              variant="ghost"
              @click="addSubtask"
              title="Добавить подзадачу"
          >
            +
          </B24Button>
          <B24Button
              v-if="!isFirstRow"
              size="xs"
              variant="ghost"
              @click="deleteTask"
              title="Удалить"
              color="red"
          >
            🗑
          </B24Button>
        </div>
      </td>
    </tr>

    <!-- Render children if expanded -->
    <template v-if="task.isExpanded && task.children?.length">
      <TaskRowComponent
          v-for="(child, childIndex) in task.children"
          :key="child.id"
          :task="child"
          :level="level + 1"
          :is-first-row="false"
          @update="handleChildUpdate"
          @delete="handleChildDelete"
          @add-subtask="handleChildAddSubtask"
          @decompose="handleChildDecompose"
      />
    </template>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PertTask } from './PertEstimator.vue'

interface Props {
  task: PertTask
  level: number
  isFirstRow: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update', task: PertTask): void
  (e: 'delete', taskId: string): void
  (e: 'add-subtask', parentTask: PertTask): void
  (e: 'decompose', parentTask: PertTask): void
}>()

const localTask = ref<PertTask>({ ...props.task })

watch(
    () => props.task,
    (newTask) => {
      localTask.value = { ...newTask }
    },
    { deep: true }
)

const pertValue = computed(() => {
  const o = localTask.value.optimistic ?? 0
  const m = localTask.value.realistic ?? 0
  const p = localTask.value.pessimistic ?? 0
  if (o === 0 && m === 0 && p === 0) return '—'
  const pert = (o + 4 * m + p) / 6
  return pert.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
})

const toggleExpand = () => {
  localTask.value.isExpanded = !localTask.value.isExpanded
  emitUpdate()
}

const emitUpdate = () => {
  emit('update', localTask.value)
}

const addSubtask = () => {
  emit('add-subtask', localTask.value)
}

const decompose = () => {
  emit('decompose', localTask.value)
}

const deleteTask = () => {
  emit('delete', localTask.value.id)
}

const handleChildUpdate = (updatedChild: PertTask) => {
  const childIndex = localTask.value.children.findIndex((c) => c.id === updatedChild.id)
  if (childIndex !== -1) {
    localTask.value.children[childIndex] = updatedChild
    // Пересчитываем родительские значения на основе детей
    recalcParentFromChildren()
    emitUpdate()
  }
}

const handleChildDelete = (childId: string) => {
  localTask.value.children = localTask.value.children.filter((c) => c.id !== childId)
  recalcParentFromChildren()
  emitUpdate()
}

const handleChildAddSubtask = (parentChild: PertTask) => {
  emit('add-subtask', parentChild)
}

const handleChildDecompose = (parentChild: PertTask) => {
  emit('decompose', parentChild)
}

const recalcParentFromChildren = () => {
  if (localTask.value.children.length === 0) return

  let totalOptimistic = 0
  let totalRealistic = 0
  let totalPessimistic = 0

  for (const child of localTask.value.children) {
    const childTotals = calculateChildTotals(child)
    totalOptimistic += childTotals.optimistic
    totalRealistic += childTotals.realistic
    totalPessimistic += childTotals.pessimistic
  }

  localTask.value.optimistic = totalOptimistic
  localTask.value.realistic = totalRealistic
  localTask.value.pessimistic = totalPessimistic
}

const calculateChildTotals = (task: PertTask): { optimistic: number; realistic: number; pessimistic: number } => {
  if (!task.children || task.children.length === 0) {
    return {
      optimistic: task.optimistic ?? 0,
      realistic: task.realistic ?? 0,
      pessimistic: task.pessimistic ?? 0,
    }
  }

  let totalOptimistic = 0
  let totalRealistic = 0
  let totalPessimistic = 0

  for (const child of task.children) {
    const childTotals = calculateChildTotals(child)
    totalOptimistic += childTotals.optimistic
    totalRealistic += childTotals.realistic
    totalPessimistic += childTotals.pessimistic
  }

  return {
    optimistic: totalOptimistic,
    realistic: totalRealistic,
    pessimistic: totalPessimistic,
  }
}
</script>