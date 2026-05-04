<template>
  <!-- Main task row -->
  <tr :class="{ 'bg-b24-surface-hover/30': level % 2 === 1 }">
    <!-- Expand/collapse button -->
    <td class="px-3 py-2 text-left align-middle">
      <div :style="{ marginLeft: `${level * 24}px` }">
        <button
            v-if="hasChildren"
            @click="toggleChildren"
            class="p-1 hover:bg-b24-surface-hover rounded transition-colors"
            :title="task.showChildren ? 'Свернуть подзадачи' : 'Развернуть подзадачи'"
        >
          <i :class="task.showChildren ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="text-xs text-b24-text-secondary"></i>
        </button>
        <span v-else class="w-6 inline-block"></span>
      </div>
    </td>

    <!-- Task name -->
    <td class="px-3 py-2 align-middle">
      <input
          v-model="localTask.name"
          type="text"
          placeholder="Название задачи"
          class="w-full bg-transparent border-none outline-none text-sm focus:ring-0 p-0"
          :class="{ 'font-semibold': level === 0 }"
          @input="emitUpdate"
      />
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
        <button
            v-if="level < 2"
            @click="addSubtask"
            class="p-1 text-b24-text-secondary hover:text-b24-primary transition-colors"
            title="Декомпозировать задачу (добавить подзадачу)"
        >
          <i class="fas fa-plus text-xs"></i>
        </button>
        <button
            v-if="!isFirst"
            @click="deleteTask"
            class="p-1 text-b24-text-secondary hover:text-red-500 transition-colors"
            title="Удалить задачу"
        >
          <i class="fas fa-trash-alt text-xs"></i>
        </button>
      </div>
    </td>
  </tr>

  <!-- Child tasks (shown when expanded) -->
  <template v-if="task.showChildren && hasChildren">
    <TaskRow
        v-for="(child, childIndex) in task.children"
        :key="child.id"
        :task="child"
        :level="level + 1"
        :index="childIndex"
        :is-first="false"
        @update="handleChildUpdate"
        @delete="handleChildDelete"
        @toggle-children="handleChildToggleChildren"
        @add-subtask="handleChildAddSubtask"
    />
  </template>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PertTask } from './PertEstimator.vue'

// Props
interface Props {
  task: PertTask
  level: number
  index: number
  isFirst: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'update', task: PertTask): void
  (e: 'delete', taskId: string): void
  (e: 'toggle-children', taskId: string): void
  (e: 'add-subtask', parentTask: PertTask): void
}>()

// Local reactive copy
const localTask = ref<PertTask>({ ...props.task })

// Watch for external changes
watch(() => props.task, (newTask) => {
  localTask.value = { ...newTask }
}, { deep: true })

// Computed
const hasChildren = computed(() => localTask.value.children && localTask.value.children.length > 0)

const pertValue = computed(() => {
  const o = localTask.value.optimistic ?? 0
  const m = localTask.value.realistic ?? 0
  const p = localTask.value.pessimistic ?? 0
  if (o === 0 && m === 0 && p === 0 && !hasChildren.value) return '—'
  const pert = (o + 4 * m + p) / 6
  return pert.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
})

// Methods
const toggleChildren = () => {
  emit('toggle-children', localTask.value.id)
}

const emitUpdate = () => {
  emit('update', localTask.value)
}

const addSubtask = () => {
  emit('add-subtask', localTask.value)
}

const deleteTask = () => {
  emit('delete', localTask.value.id)
}

const handleChildUpdate = (updatedChild: PertTask) => {
  const childIndex = localTask.value.children.findIndex(c => c.id === updatedChild.id)
  if (childIndex !== -1) {
    localTask.value.children[childIndex] = updatedChild
    emitUpdate()
  }
}

const handleChildDelete = (childId: string) => {
  localTask.value.children = localTask.value.children.filter(c => c.id !== childId)
  emitUpdate()
}

const handleChildToggleChildren = (childId: string) => {
  const child = localTask.value.children.find(c => c.id === childId)
  if (child) {
    child.showChildren = !child.showChildren
    emitUpdate()
  }
}

const handleChildAddSubtask = (parentChild: PertTask) => {
  emit('add-subtask', parentChild)
}
</script>