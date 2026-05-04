<template>
  <B24App>
    <div class="w-full h-full" :class="containerPaddingClass">
      <div class="space-y-4">
        <!-- Form Title -->
        <B24Card>
          <div class="p-4">
            <h2 class="text-lg font-semibold text-b24-text-primary mb-1">Создание голосования</h2>
            <p class="text-sm text-b24-text-secondary">Создайте опрос и отправьте его в текущий чат</p>
          </div>
        </B24Card>

        <!-- Main Form -->
        <B24Form
            ref="formRef"
            :state="formState"
            :validate="validateForm"
            class="space-y-4"
            @submit="onSubmit"
            @error="onError"
        >
          <!-- Question Field -->
          <B24Card>
            <div class="p-4 space-y-4">
              <B24FormField label="Вопрос" name="question" required>
                <B24Textarea
                    v-model="formState.question"
                    placeholder="Введите текст вопроса..."
                    :rows="3"
                    autoresize
                    :maxrows="6"
                />
              </B24FormField>

              <!-- Options Section -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium text-b24-text-primary">
                    Варианты ответов <span class="text-b24-text-tertiary">(минимум 2, максимум 10)</span>
                  </label>
                  <B24Button
                      v-if="formState.options.length < 10"
                      size="sm"
                      variant="ghost"
                      @click="addOption"
                      class="text-xs"
                  >
                    + Добавить вариант
                  </B24Button>
                </div>

                <div class="space-y-3">
                  <div
                      v-for="(option, index) in formState.options"
                      :key="index"
                      class="flex items-start gap-2"
                  >
                    <div class="flex-1">
                      <B24FormField :name="`options.${index}`" :error-pattern="new RegExp(`^options\\.${index}$`)">
                        <B24Input
                            v-model="option.text"
                            :placeholder="`Вариант ${index + 1}`"
                            class="w-full"
                        />
                      </B24FormField>
                    </div>
                    <B24Button
                        v-if="formState.options.length > 2"
                        size="sm"
                        variant="ghost"
                        color="air-primary-alert"
                        @click="removeOption(index)"
                        class="mt-0.5"
                    >
                      <span class="text-lg">×</span>
                    </B24Button>
                  </div>
                </div>

                <div v-if="formState.options.length < 2" class="mt-2 text-sm text-b24-text-alert">
                  Добавьте минимум 2 варианта ответа
                </div>
                <div v-if="formState.options.length === 10" class="mt-2 text-sm text-b24-text-secondary">
                  Достигнут максимум вариантов ответов (10)
                </div>
              </div>
            </div>
          </B24Card>

          <!-- Settings Card -->
          <B24Card>
            <div class="p-4 space-y-4">
              <h3 class="text-sm font-semibold text-b24-text-primary">Настройки голосования</h3>

              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-b24-text-primary">Анонимное голосование</div>
                  <div class="text-xs text-b24-text-secondary">Результаты не будут показывать, кто как проголосовал</div>
                </div>
                <B24Switch v-model="formState.anonymous" />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-b24-text-primary">Разрешить переголосование</div>
                  <div class="text-xs text-b24-text-secondary">Участники смогут изменить свой ответ</div>
                </div>
                <B24Switch v-model="formState.allowChange" />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-b24-text-primary">Множественный выбор</div>
                  <div class="text-xs text-b24-text-secondary">Участники смогут выбрать несколько вариантов</div>
                </div>
                <B24Switch v-model="formState.multipleChoice" />
              </div>
            </div>
          </B24Card>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-3">
            <B24Button
                variant="secondary"
                @click="resetForm"
                :disabled="loading"
            >
              Сбросить
            </B24Button>
            <B24Button
                color="air-primary"
                type="submit"
                :loading="loading"
            >
              Отправить голосование
            </B24Button>
          </div>
        </B24Form>

        <!-- Help Accordion -->
        <B24Accordion
            :items="helpAccordionItems"
            :collapsible="true"
            :unmount-on-hide="false"
        >
          <template #trailing="{ open }">
            <div class="transform transition-transform" :class="{ 'rotate-180': open }">
              <i class="fas fa-question-circle text-b24-text-secondary"></i>
            </div>
          </template>
          <template #body>
            <div class="space-y-3">
              <div>
                <h4 class="text-xs font-semibold text-b24-text-primary mb-2">О голосованиях</h4>
                <p class="text-xs text-b24-text-secondary">
                  Голосование будет отправлено в текущий чат. Участники смогут проголосовать,
                  а вы сможете отслеживать результаты в реальном времени.
                </p>
              </div>
              <div class="pt-2 border-t border-b24-border">
                <p class="text-xs text-b24-text-tertiary">
                  <span class="font-semibold">Примечание:</span> Минимум 2 варианта ответа, максимум 10.
                  Вопрос не может быть пустым.
                </p>
              </div>
            </div>
          </template>
        </B24Accordion>
      </div>
    </div>
  </B24App>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from '@bitrix24/b24ui-nuxt/composables/useToast'
import type { FormError, FormErrorEvent, FormSubmitEvent } from '@bitrix24/b24ui-nuxt'

// Props
interface Props {
  containerPadding?: 'p-0' | 'p-1' | 'p-2' | 'p-3' | 'p-4' | 'p-5' | 'p-6'
}

const props = withDefaults(defineProps<Props>(), {
  containerPadding: 'p-4'
})

// Types
interface Option {
  text: string
}

interface FormState {
  question: string
  options: Option[]
  anonymous: boolean
  allowChange: boolean
  multipleChoice: boolean
}

interface BitrixData {
  dialogId?: string
  chatId?: number
}

// Global declarations
declare global {
  interface Window {
    bitrixData?: BitrixData
    BX24?: {
      init: (callback: () => void) => void
      fitWindow: () => void
      placement: {
        info: () => { placement: string; options: Record<string, unknown> }
      }
      callMethod: (
          method: string,
          params: Record<string, unknown>,
          callback?: (result: { error: () => { (): string; (): string }; data: () => unknown }) => void
      ) => Promise<unknown>
    }
  }
}

// Composables
const toast = useToast()

// Data from Bitrix
const bitrixData: BitrixData = window.bitrixData || {}
const dialogId = ref<string | undefined>(bitrixData.dialogId)
const chatId = ref<number | undefined>(bitrixData.chatId)

// Reactive state
const loading = ref(false)
const formRef = ref()

// Form state
const formState = reactive<FormState>({
  question: '',
  options: [
    { text: '' },
    { text: '' }
  ],
  anonymous: false,
  allowChange: false,
  multipleChoice: false
})

// Help accordion item
const helpAccordionItems = ref([
  {
    label: 'Справка',
    value: 'help',
  },
])

// Computed container padding
const containerPaddingClass = computed(() => props.containerPadding)

// Helper functions
const showNotification = (message: string, variant: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  toast.add({
    description: message,
    variant,
  })
}

// Form validation
const validateForm = (state: Partial<FormState>): FormError[] => {
  const errors: FormError[] = []

  // Validate question
  if (!state.question || state.question.trim() === '') {
    errors.push({ name: 'question', message: 'Введите текст вопроса' })
  }

  // Validate options
  if (state.options) {
    const validOptions = state.options.filter(opt => opt.text && opt.text.trim() !== '')

    if (validOptions.length < 2) {
      errors.push({ name: 'options', message: 'Добавьте минимум 2 варианта ответа' })
    }

    if (validOptions.length > 10) {
      errors.push({ name: 'options', message: 'Максимум 10 вариантов ответа' })
    }

    // Check for duplicate options
    const optionTexts = validOptions.map(opt => opt.text.trim().toLowerCase())
    const duplicates = optionTexts.filter((text, index) => optionTexts.indexOf(text) !== index)
    if (duplicates.length > 0) {
      errors.push({ name: 'options', message: 'Варианты ответов не должны повторяться' })
    }

    // Check each option
    state.options.forEach((option, index) => {
      if (!option.text || option.text.trim() === '') {
        errors.push({ name: `options.${index}`, message: 'Заполните вариант ответа' })
      }
    })
  }

  return errors
}

// Form actions
const addOption = () => {
  if (formState.options.length < 10) {
    formState.options.push({ text: '' })
  }
}

const removeOption = (index: number) => {
  if (formState.options.length > 2) {
    formState.options.splice(index, 1)
  }
}

const resetForm = () => {
  formState.question = ''
  formState.options = [
    { text: '' },
    { text: '' }
  ]
  formState.anonymous = false
  formState.allowChange = false
  formState.multipleChoice = false
  showNotification('Форма очищена', 'info')
}

// Vote creation helper
const createVoteData = () => {
  // Filter out empty options
  const validOptions = formState.options
      .filter(opt => opt.text && opt.text.trim() !== '')
      .map(opt => ({ MESSAGE: opt.text.trim() }))

  return {
    chatId: chatId.value,
    IM_MESSAGE_VOTE_DATA: {
      QUESTIONS: [
        {
          QUESTION: formState.question.trim(),
          FIELD_TYPE: formState.multipleChoice ? 1 : 0,
          ANSWERS: validOptions
        }
      ],
      ANONYMITY: formState.anonymous ? 1 : 0,
      OPTIONS: formState.allowChange ? 1 : 0
    },
    templateId: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Get chat ID from placement info
// Get chat ID from placement info
const getChatIdFromPlacement = async (): Promise<number | null> => {
  return new Promise((resolve) => {
    if (window.BX24) {
      try {
        // Try to get placement info
        const placementInfo = window.BX24.placement.info()
        console.log('Placement info:', placementInfo)

        // Extract dialog ID from options
        const options = placementInfo.options as Record<string, unknown>
        const dialogId = options.dialogId as string

        if (dialogId) {
          // Parse chat ID from formats: "chat3", "chat_3", "3", "chat123"
          let numericId: number | null = null

          if (typeof dialogId === 'string') {
            // Extract numbers from string (e.g., "chat3" -> 3, "chat_123" -> 123)
            const match = dialogId.match(/\d+/)
            if (match) {
              numericId = parseInt(match[0], 10)
            }
          } else if (typeof dialogId === 'number') {
            numericId = dialogId
          }

          if (numericId && !isNaN(numericId)) {
            console.log('Extracted chat ID:', numericId, 'from dialogId:', dialogId)
            resolve(numericId)
            return
          }
        }

        // Try other possible fields
        const possibleIds = [
          options.chatId,
          options.CHAT_ID,
          options.ID,
          options.id
        ]

        for (const id of possibleIds) {
          if (id) {
            let numericId: number | null = null

            if (typeof id === 'string') {
              const match = id.match(/\d+/)
              if (match) {
                numericId = parseInt(match[0], 10)
              }
            } else if (typeof id === 'number') {
              numericId = id
            }

            if (numericId && !isNaN(numericId)) {
              console.log('Found chat ID from alternative field:', numericId)
              resolve(numericId)
              return
            }
          }
        }

        console.warn('Chat ID not found in placement info')
        resolve(null)
      } catch (error) {
        console.error('Error getting placement info:', error)
        resolve(null)
      }
    } else {
      console.warn('BX24 not available')
      resolve(null)
    }
  })
}

// Send vote to chat
const sendVote = async (): Promise<{ success: boolean; messageId?: number; voteId?: number }> => {
  return new Promise((resolve, reject) => {
    if (!window.BX24) {
      reject(new Error('Bitrix24 SDK не доступен'))
      return
    }

    const voteData = createVoteData()

    if (!voteData.chatId) {
      reject(new Error('Не удалось определить ID чата'))
      return
    }

    console.log('Sending vote with data:', voteData)

    window.BX24.callMethod(
        'vote.Integration.Im.send',
        voteData,
        (result) => {
          if (result.error()) {
            console.error('Vote creation error:', result.error())
            reject(new Error(result.error() as string))
          } else {
            const data = result.data() as { messageId: number; voteId: number }
            console.log('Vote created successfully:', data)
            resolve({
              success: true,
              messageId: data.messageId,
              voteId: data.voteId
            })
          }
        }
    )
  })
}

// Form submission handler
const onSubmit = async (event: FormSubmitEvent<FormState>) => {
  loading.value = true

  try {
    // Ensure we have valid options
    const validOptions = event.data.options.filter(opt => opt.text && opt.text.trim() !== '')

    if (validOptions.length < 2) {
      showNotification('Добавьте минимум 2 варианта ответа', 'error')
      return
    }

    // Get chat ID if not already available
    if (!chatId.value) {
      const placementChatId = await getChatIdFromPlacement()
      if (placementChatId) {
        chatId.value = placementChatId
      }
    }

    if (!chatId.value) {
      showNotification('Не удалось определить чат для отправки голосования', 'error')
      return
    }

    // Send vote
    const result = await sendVote()

    if (result.success) {
      showNotification('Голосование успешно отправлено в чат!', 'success')
      resetForm()
    }
  } catch (error) {
    console.error('Error sending vote:', error)

    let errorMessage = 'Ошибка при отправке голосования'

    if (error instanceof Error) {
      const errorMsg = error.message
      if (errorMsg.includes('Access denied') || errorMsg.includes('403')) {
        errorMessage = 'Недостаточно прав для создания голосования'
      } else if (errorMsg.includes('chatId') || errorMsg.includes('чат')) {
        errorMessage = 'Не удалось отправить голосование в чат'
      } else if (errorMsg.includes('400')) {
        errorMessage = 'Проверьте правильность заполнения формы'
      } else {
        errorMessage = errorMsg
      }
    }

    showNotification(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

// Error handler
const onError = (event: FormErrorEvent) => {
  console.error('Form validation errors:', event.errors)
  if (event.errors && event.errors.length > 0) {
    showNotification(event.errors[0].message, 'error')

    // Focus first field with error
    if (event.errors[0]?.id) {
      const element = document.getElementById(event.errors[0].id)
      element?.focus()
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
}

// Lifecycle
onMounted(async () => {
  // Initialize Bitrix24 SDK
  if (typeof window.BX24 !== 'undefined') {
    window.BX24.init(() => {
      console.log('Bitrix24 SDK initialized')

      try {
        window.BX24?.fitWindow()
      } catch (error) {
        console.error('Error calling fitWindow:', error)
      }

      // Try to get chat ID from placement
      getChatIdFromPlacement().then(id => {
        if (id) {
          chatId.value = id
          console.log('Chat ID obtained:', id)
        }
      })
    })
  } else {
    console.warn('Bitrix24 SDK not found')
    showNotification('Bitrix24 SDK не найден. Проверьте окружение.', 'warning')
  }
})
</script>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
}

:deep(.b24-card-body) {
  padding: 0 !important;
}

:deep(.b24-form-field .b24-form-field) {
  margin-bottom: 0;
}
</style>