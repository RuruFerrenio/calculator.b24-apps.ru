<template>
  <template v-for="(task, idx) in [localTask]" :key="task.id">
    <!-- Main task row -->
    <tr :class="{ 'bg-b24-surface-hover/50': level % 2 === 1 }">
      <!-- Expand/collapse and index -->
      <td class="px-3 py-2 text-left align-middle">
        <div class="flex items-center" :style="{ marginLeft: `${level * 20}px` }">
          <button
              v-if="task.children && task.children.length > 0"
              @click="toggleExpand"
              class="p-1 mr-1 hover:bg-b24-surface-hover rounded transition-colors"
          >
            <i :class="task.isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="text-xs text-b24-text-secondary"></i>
          </button>
          <span v-else class="w-5 mr-1"></span>
          <span class="text-b24-text-secondary text-xs">{{ index + 1 }}</span>
        </div>
      </td>

      <!-- Task name -->
      <td class="px-3 py-2 align-middle">
        <div :style="{ marginLeft: `${task.children?.length ? 0 : level * 20 + 20}px` }">
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
          <button
              v-if="level < 2"
              @click="addSubtask"
              class="p-1 text-b24-text-secondary hover:text-b24-primary transition-colors"
              title="Добавить подзадачу"
          >
            <i class="fas fa-plus text-xs"></i>
          </button>
          <button
              @click="deleteTask"
              class="p-1 text-b24-text-secondary hover:text-red-500 transition-colors"
              title="Удалить"
          >
            <i class="fas fa-trash-alt text-xs"></i>
          </button>
        </div>
      </td>
    </tr>

    <!-- Render children if expanded -->
    <template v-if="task.isExpanded && task.children?.length">
      <TaskRow
          v-for="(child, childIndex) in task.children"
          :key="child.id"
          :task="child"
          :level="level + 1"
          :index="childIndex"
          @update="handleChildUpdate"
          @delete="handleChildDelete"
          @add-subtask="handleChildAddSubtask"
      />
    </template>
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
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'update', task: PertTask): void
  (e: 'delete', taskId: string): void
  (e: 'add-subtask', parentTask: PertTask): void
}>()

// Local reactive copy
const localTask = ref<PertTask>({ ...props.task })

// Watch for external changes
watch(() => props.task, (newTask) => {
  localTask.value = { ...newTask }
}, { deep: true })

// Computed PERT value
const pertValue = computed(() => {
  const o = localTask.value.optimistic ?? 0
  const m = localTask.value.realistic ?? 0
  const p = localTask.value.pessimistic ?? 0
  if (o === 0 && m === 0 && p === 0) return '—'
  const pert = (o + 4 * m + p) / 6
  return pert.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
})

// Methods
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

const handleChildAddSubtask = (parentChild: PertTask) => {
  emit('add-subtask', parentChild)
}
</script>