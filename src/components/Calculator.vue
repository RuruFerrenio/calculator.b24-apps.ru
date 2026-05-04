<template>
  <B24App>
    <div class="w-full h-full px-4 space-y-4" :dir="direction">
      <!-- Display -->
      <B24Card class="overflow-hidden">
        <div class="p-3 relative">
          <div class="text-right space-y-0">
            <div
                v-if="previousExpression"
                class="text-sm text-b24-text-secondary min-h-[16px] font-mono truncate"
            >
              {{ previousExpression }}
            </div>

            <div class="relative">
              <input
                  ref="inputRef"
                  v-model="currentExpression"
                  type="text"
                  class="w-full text-right text-xl font-semibold text-b24-text-primary bg-transparent border-none outline-none calculator-input"
                  :placeholder="direction === 'rtl' ? '۰' : '0'"
                  spellcheck="false"
                  :dir="direction"
                  @keydown="handleKeyDown"
                  @input="onExpressionChange"
                  @focus="onInputFocus"
                  @blur="onInputBlur"
              />
            </div>

            <div class="border-t border-b24-border pt-1 mt-1">
              <div class="text-lg font-bold text-b24-primary truncate calculator-display" style="min-height: 24px">
                = {{ formattedResult }}
              </div>
            </div>
          </div>
        </div>
      </B24Card>

      <!-- Action Buttons -->
      <div class="flex items-center justify-between">
        <div class="flex space-x-2 w-full">
          <B24Button size="sm" @click="copyToClipboard" class="text-xs w-full justify-center">
            Копировать
          </B24Button>
          <B24Button
              v-if="sendBtnActive"
              size="sm"
              color="air-primary"
              @click="sendToChat"
              class="text-xs w-full justify-center"
          >
            Отправить
          </B24Button>
        </div>
      </div>

      <!-- Main Keyboard Accordion -->
      <B24Accordion
          :items="keyboardAccordionItems"
          :collapsible="true"
          :unmount-on-hide="false"
      >
        <template #body="{ item }">
          <div class="grid grid-cols-4 gap-2 mt-1">
            <B24Button size="lg" variant="secondary" @click="clear" class="calc-btn">C</B24Button>
            <B24Button size="lg" variant="secondary" @click="backspace" class="calc-btn">⌫</B24Button>
            <B24Button size="lg" variant="secondary" @click="addPercentage" class="calc-btn">%</B24Button>
            <B24Button size="lg" variant="ghost" @click="addToExpression('/')" class="calc-btn calc-btn-operation">÷</B24Button>

            <B24Button size="lg" variant="ghost" @click="addToExpression('7')" class="calc-btn calc-btn-number">7</B24Button>
            <B24Button size="lg" variant="ghost" @click="addToExpression('8')" class="calc-btn calc-btn-number">8</B24Button>
            <B24Button size="lg" variant="ghost" @click="addToExpression('9')" class="calc-btn calc-btn-number">9</B24Button>
            <B24Button size="lg" variant="ghost" @click="addToExpression('*')" class="calc-btn calc-btn-operation">×</B24Button>

            <B24Button size="lg" variant="ghost" @click="addToExpression('4')" class="calc-btn calc-btn-number">4</B24Button>
            <B24Button size="lg" variant="ghost" @click="addToExpression('5')" class="calc-btn calc-btn-number">5</B24Button>
            <B24Button size="lg" variant="ghost" @click="addToExpression('6')" class="calc-btn calc-btn-number">6</B24Button>
            <B24Button size="lg" variant="ghost" @click="addToExpression('-')" class="calc-btn calc-btn-operation">−</B24Button>

            <B24Button size="lg" variant="ghost" @click="addToExpression('1')" class="calc-btn calc-btn-number">1</B24Button>
            <B24Button size="lg" variant="ghost" @click="addToExpression('2')" class="calc-btn calc-btn-number">2</B24Button>
            <B24Button size="lg" variant="ghost" @click="addToExpression('3')" class="calc-btn calc-btn-number">3</B24Button>
            <B24Button size="lg" variant="ghost" @click="addToExpression('+')" class="calc-btn calc-btn-operation">+</B24Button>

            <B24Button size="lg" variant="ghost" @click="addToExpression('0')" class="calc-btn calc-btn-number col-span-2">0</B24Button>
            <B24Button size="lg" variant="ghost" @click="addToExpression('.')" class="calc-btn calc-btn-number">,</B24Button>
            <B24Button size="lg" @click="calculate" class="calc-btn calc-btn-equals">=</B24Button>
          </div>

          <div class="grid grid-cols-4 gap-2 mt-2">
            <B24Button size="sm" variant="ghost" @click="addParenthesis('(')" class="calc-btn">(</B24Button>
            <B24Button size="sm" variant="ghost" @click="addParenthesis(')')" class="calc-btn">)</B24Button>
            <B24Button size="sm" variant="ghost" @click="addToExpression('^')" class="calc-btn">xʸ</B24Button>
            <B24Button size="sm" variant="ghost" @click="addConstant('pi')" class="calc-btn">π</B24Button>
          </div>
        </template>
      </B24Accordion>

      <!-- Engineering Functions Accordion -->
      <B24Accordion :items="engineeringAccordionItems" :collapsible="true" :unmount-on-hide="false">
        <template #body>
          <div>
            <!-- Trigonometry -->
            <div class="mb-4">
              <h4 class="text-xs font-semibold text-b24-text-secondary mb-2 px-1">Тригонометрия</h4>
              <div class="grid grid-cols-3 gap-2 mb-3">
                <B24Button size="sm" variant="ghost" @click="wrapWithFunction('sin')" class="calc-btn-engineering">sin</B24Button>
                <B24Button size="sm" variant="ghost" @click="wrapWithFunction('cos')" class="calc-btn-engineering">cos</B24Button>
                <B24Button size="sm" variant="ghost" @click="wrapWithFunction('tan')" class="calc-btn-engineering">tan</B24Button>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <B24Button size="sm" variant="ghost" @click="wrapWithFunction('asin')" class="calc-btn-engineering">asin</B24Button>
                <B24Button size="sm" variant="ghost" @click="wrapWithFunction('acos')" class="calc-btn-engineering">acos</B24Button>
                <B24Button size="sm" variant="ghost" @click="wrapWithFunction('atan')" class="calc-btn-engineering">atan</B24Button>
              </div>
            </div>

            <!-- Mathematics -->
            <div class="mb-4">
              <h4 class="text-xs font-semibold text-b24-text-secondary mb-2 px-1">Математические</h4>
              <div class="grid grid-cols-3 gap-2">
                <B24Button size="sm" variant="ghost" @click="wrapWithFunction('sqrt')" class="calc-btn-engineering">√</B24Button>
                <B24Button size="sm" variant="ghost" @click="addPower(2)" class="calc-btn-engineering">x²</B24Button>
                <B24Button size="sm" variant="ghost" @click="addPower('y')" class="calc-btn-engineering">xʸ</B24Button>
                <B24Button size="sm" variant="ghost" @click="wrapWithFunction('ln')" class="calc-btn-engineering">ln</B24Button>
                <B24Button size="sm" variant="ghost" @click="wrapWithFunction('log10')" class="calc-btn-engineering">log₁₀</B24Button>
                <B24Button size="sm" variant="ghost" @click="wrapWithFunction('exp')" class="calc-btn-engineering">eˣ</B24Button>
              </div>
            </div>

            <!-- Constants & Factorial -->
            <div class="mb-4">
              <h4 class="text-xs font-semibold text-b24-text-secondary mb-2 px-1">Константы</h4>
              <div class="grid grid-cols-3 gap-2">
                <B24Button size="sm" variant="ghost" @click="addConstant('pi')" class="calc-btn-engineering">π</B24Button>
                <B24Button size="sm" variant="ghost" @click="addConstant('e')" class="calc-btn-engineering">e</B24Button>
                <B24Button size="sm" variant="ghost" @click="wrapWithFunction('factorial')" class="calc-btn-engineering">n!</B24Button>
              </div>
            </div>

            <!-- Additional -->
            <div>
              <h4 class="text-xs font-semibold text-b24-text-secondary mb-2 px-1">Дополнительно</h4>
              <div class="grid grid-cols-3 gap-2">
                <B24Button size="sm" variant="ghost" @click="wrapWithFunction('abs')" class="calc-btn-engineering">|x|</B24Button>
                <B24Button size="sm" variant="ghost" @click="addReciprocal" class="calc-btn-engineering">1/x</B24Button>
                <B24Button size="sm" variant="ghost" @click="toggleAngleMode" class="calc-btn-engineering">
                  {{ angleMode === 'deg' ? 'DEG' : 'RAD' }}
                </B24Button>
              </div>
            </div>
          </div>
        </template>
      </B24Accordion>

      <!-- History Accordion -->
      <B24Accordion :items="historyAccordionItems" :collapsible="true" :unmount-on-hide="false">
        <template #trailing="{ open }">
          <div class="flex items-center space-x-2">
            <span v-if="history.length > 0" class="text-xs text-b24-text-secondary">
              {{ history.length }} записей
            </span>
            <div class="transform transition-transform" :class="{ 'rotate-180': open }">
              <i class="fas fa-chevron-down text-b24-text-secondary"></i>
            </div>
          </div>
        </template>
        <template #body>
          <div>
            <div v-if="history.length === 0" class="text-center py-4">
              <p class="text-sm text-b24-text-secondary">История пуста</p>
            </div>

            <div v-else class="space-y-2 max-h-40 overflow-y-auto">
              <div
                  v-for="item in history.slice(0, 10)"
                  :key="item.id"
                  class="history-item p-2 rounded cursor-pointer hover:bg-b24-surface-hover transition-colors"
                  @click="restoreFromHistory(item)"
              >
                <div class="flex justify-between items-start">
                  <div class="text-sm text-b24-text-secondary font-mono truncate">{{ item.expression }}</div>
                  <span class="text-xs text-b24-text-tertiary ml-2 flex-shrink-0">{{ item.timestamp }}</span>
                </div>
              </div>
            </div>

            <div class="flex justify-start mt-3">
              <B24Button size="xs" variant="ghost" @click="clearHistory" class="text-xs w-full justify-center">
                Очистить историю
              </B24Button>
            </div>
          </div>
        </template>
      </B24Accordion>

      <!-- Help Accordion -->
      <B24Accordion :items="helpAccordionItems" :collapsible="true" :unmount-on-hide="false">
        <template #trailing="{ open }">
          <div class="transform transition-transform" :class="{ 'rotate-180': open }">
            <i class="fas fa-question-circle text-b24-text-secondary"></i>
          </div>
        </template>
        <template #body>
          <div>
            <div class="mb-4">
              <h4 class="text-xs font-semibold text-b24-text-primary mb-2 px-1 pb-1 border-b border-b24-border">
                Основные клавиши
              </h4>
              <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-b24-text-secondary">Вычислить</span>
                  <div class="flex items-center space-x-1">
                    <kbd class="keyboard-key">Enter</kbd>
                    <span class="text-xs text-b24-text-tertiary">или</span>
                    <kbd class="keyboard-key">=</kbd>
                  </div>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-b24-text-secondary">Очистить всё</span>
                  <div class="flex items-center space-x-1">
                    <kbd class="keyboard-key">Esc</kbd>
                    <span class="text-xs text-b24-text-tertiary">или</span>
                    <kbd class="keyboard-key">Del</kbd>
                  </div>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-b24-text-secondary">Удалить символ</span>
                  <kbd class="keyboard-key">Backspace</kbd>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-b24-border">
              <p class="text-xs text-b24-text-tertiary italic">
                Поддерживаются цифры 0-9, операции +, -, *, /, ^, %, скобки (), математические функции
              </p>
            </div>
          </div>
        </template>
      </B24Accordion>
    </div>
  </B24App>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from '@bitrix24/b24ui-nuxt/composables/useToast'
import { evaluate } from 'mathjs'

// Types
interface HistoryItem {
  id: number
  expression: string
  timestamp: string
  rawExpression: string
}

interface BitrixData {
  dialogId?: string
  sendBtnActive?: boolean
  fitWindow?: boolean
}

// Global declarations
declare global {
  interface Window {
    bitrixData?: BitrixData
    BX24?: {
      init: (callback: () => void) => void
      fitWindow: () => void
      callMethod: (method: string, params: Record<string, unknown>, callback?: (result: unknown) => void) => Promise<unknown>
      user?: {
        id: string
      }
    }
  }
}

// Utils
const toast = useToast()

// Data from Bitrix
const bitrixData: BitrixData = window.bitrixData || {}
const dialogId = ref<string | undefined>(bitrixData.dialogId)

// Reactive state
const currentExpression = ref<string>('')
const result = ref<string>('')
const history = ref<HistoryItem[]>([])
const previousExpression = ref<string>('')
const engineeringOpen = ref<boolean>(false)
const keyboardOpen = ref<boolean>(false)
const historyOpen = ref<boolean>(false)
const helpOpen = ref<boolean>(false)
const angleMode = ref<'deg' | 'rad'>('deg')
const inputRef = ref<HTMLInputElement | null>(null)
const sendBtnActive = ref<boolean>(true)
const fitWindow = ref<boolean>(true)
const lastSavedExpression = ref<string | null>(null)

// Direction for RTL/LTR
const direction = computed(() => {
  const match = currentExpression.value.match(/[\u0600-\u06FF]/)
  if (match) return 'rtl'
  return 'ltr'
})

// Debounce timer
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Accordion items
const keyboardAccordionItems = ref([
  {
    label: 'Основная клавиатура',
    value: 'keyboard',
  },
])

const engineeringAccordionItems = ref([
  {
    label: 'Инженерные функции',
    value: 'engineering',
  },
])

const historyAccordionItems = ref([
  {
    label: 'История',
    value: 'history',
  },
])

const helpAccordionItems = ref([
  {
    label: 'Справка',
    value: 'help',
  },
])

// Helper functions
const showNotification = (message: string, variant: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  toast.add({
    description: message,
    variant,
  })
}

const focusInput = () => {
  setTimeout(() => {
    if (inputRef.value) {
      inputRef.value.focus()
      inputRef.value.selectionStart = inputRef.value.selectionEnd = currentExpression.value.length
    }
  }, 10)
}

// Safe evaluation with math.js
const evaluateExpression = (): void => {
  try {
    if (!currentExpression.value || currentExpression.value.trim() === '') {
      result.value = ''
      return
    }

    const expr = currentExpression.value

    // Don't evaluate if ends with operator
    if (/[\+\-\*\/\^%]$/.test(expr)) {
      result.value = '...'
      return
    }

    // Prepare expression for math.js
    let preparedExpr = expr.replace(/\^/g, '^').replace(/pi/g, 'pi').replace(/e(?![a-z])/g, 'e')

    // Handle percentage
    preparedExpr = preparedExpr.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)')

    // Handle angle mode for trig functions
    if (angleMode.value === 'deg') {
      preparedExpr = preparedExpr.replace(/sin\(([^)]+)\)/g, 'sin($1 * pi / 180)')
      preparedExpr = preparedExpr.replace(/cos\(([^)]+)\)/g, 'cos($1 * pi / 180)')
      preparedExpr = preparedExpr.replace(/tan\(([^)]+)\)/g, 'tan($1 * pi / 180)')
      preparedExpr = preparedExpr.replace(/asin\(([^)]+)\)/g, '(asin($1) * 180 / pi)')
      preparedExpr = preparedExpr.replace(/acos\(([^)]+)\)/g, '(acos($1) * 180 / pi)')
      preparedExpr = preparedExpr.replace(/atan\(([^)]+)\)/g, '(atan($1) * 180 / pi)')
    }

    // Evaluate using math.js
    const evaluated = evaluate(preparedExpr) as number

    if (!isFinite(evaluated)) {
      if (expr.includes('/0') || expr.includes('/ 0')) {
        result.value = 'Деление на ноль'
      } else {
        result.value = evaluated > 0 ? '∞' : '-∞'
      }
    } else if (isNaN(evaluated)) {
      result.value = '...'
    } else {
      // Round to avoid floating point errors
      const rounded = Math.round(evaluated * 1e12) / 1e12
      result.value = rounded.toString()
    }
  } catch (error) {
    console.error('Evaluation error:', error)
    result.value = '...'
  }
}

// Calculator operations
const calculate = (): void => {
  evaluateExpression()

  if (result.value && result.value !== '...' && result.value !== 'Деление на ноль' && currentExpression.value) {
    const displayExpr = currentExpression.value
    const resultValue = formattedResult.value

    if (resultValue && resultValue !== '...' && resultValue !== '') {
      const currentUniqueKey = `${displayExpr}|${resultValue}`
      if (lastSavedExpression.value !== currentUniqueKey) {
        history.value.unshift({
          id: Date.now(),
          expression: `${displayExpr} = ${resultValue}`,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          rawExpression: currentExpression.value,
        })

        if (history.value.length > 20) {
          history.value = history.value.slice(0, 20)
        }

        saveHistory()
        lastSavedExpression.value = currentUniqueKey
        previousExpression.value = `${displayExpr} = ${resultValue}`
      }
    }
  }
}

const clear = (): void => {
  currentExpression.value = ''
  result.value = ''
  previousExpression.value = ''
  lastSavedExpression.value = null
  focusInput()
}

const backspace = (): void => {
  if (currentExpression.value.length > 0) {
    currentExpression.value = currentExpression.value.slice(0, -1)
    evaluateExpression()
  }
  focusInput()
}

const addToExpression = (value: string): void => {
  currentExpression.value += value
  evaluateExpression()
  focusInput()
}

const addPercentage = (): void => {
  currentExpression.value += '%'
  evaluateExpression()
  focusInput()
}

const addParenthesis = (parenthesis: string): void => {
  const lastChar = currentExpression.value.slice(-1)

  if (parenthesis === '(' && /[\d\)]/.test(lastChar)) {
    currentExpression.value += '*('
  } else {
    currentExpression.value += parenthesis
  }

  evaluateExpression()
  focusInput()
}

const wrapWithFunction = (funcName: string): void => {
  const expr = currentExpression.value

  if (!expr) {
    currentExpression.value = `${funcName}(`
  } else {
    const lastNumberRegex = /(-?\d*\.?\d+|\))(?![\d\.\)])/
    const matches = expr.match(lastNumberRegex)

    if (matches && matches[1]) {
      const lastNumber = matches[1]
      const lastNumberIndex = expr.lastIndexOf(lastNumber)

      if (lastNumberIndex !== -1) {
        const before = expr.substring(0, lastNumberIndex)
        const after = expr.substring(lastNumberIndex + lastNumber.length)
        currentExpression.value = before + `${funcName}(` + lastNumber + ')' + after
      }
    } else {
      currentExpression.value = `${funcName}(` + expr + ')'
    }
  }

  evaluateExpression()
  focusInput()
}

const addPower = (power: number | string): void => {
  if (power === 'y') {
    currentExpression.value += '^'
  } else {
    const expr = currentExpression.value
    if (expr) {
      const lastNumberRegex = /(-?\d*\.?\d+)(?![\d\.])/
      const matches = expr.match(lastNumberRegex)

      if (matches && matches[1]) {
        const lastNumber = matches[1]
        const lastNumberIndex = expr.lastIndexOf(lastNumber)

        if (lastNumberIndex !== -1) {
          const before = expr.substring(0, lastNumberIndex)
          const after = expr.substring(lastNumberIndex + lastNumber.length)
          currentExpression.value = before + `(${lastNumber}^${power})` + after
        }
      } else {
        currentExpression.value += `^${power}`
      }
    } else {
      currentExpression.value += `^${power}`
    }
  }
  evaluateExpression()
  focusInput()
}

const addConstant = (constant: 'pi' | 'e'): void => {
  const lastChar = currentExpression.value.slice(-1)
  const value = constant === 'pi' ? 'pi' : 'e'

  if (/[\d\)]/.test(lastChar)) {
    currentExpression.value += '*' + value
  } else {
    currentExpression.value += value
  }

  evaluateExpression()
  focusInput()
}

const addReciprocal = (): void => {
  const expr = currentExpression.value
  if (expr) {
    currentExpression.value = '1/(' + expr + ')'
  } else {
    currentExpression.value = '1/'
  }
  evaluateExpression()
  focusInput()
}

// History management
const saveHistory = (): void => {
  try {
    localStorage.setItem('calculator_history', JSON.stringify(history.value))
  } catch (error) {
    console.error('Error saving history:', error)
  }
}

const loadHistory = (): void => {
  try {
    const saved = localStorage.getItem('calculator_history')
    if (saved) {
      history.value = JSON.parse(saved) || []
    }
  } catch (error) {
    console.error('Error loading history:', error)
  }
}

const clearHistory = (): void => {
  history.value = []
  saveHistory()
  lastSavedExpression.value = null
  showNotification('История очищена', 'success')
}

const restoreFromHistory = (item: HistoryItem): void => {
  if (item.rawExpression) {
    currentExpression.value = item.rawExpression
  } else {
    const parts = item.expression.split(' = ')
    if (parts.length === 2) {
      currentExpression.value = parts[0]
    }
  }

  evaluateExpression()
  previousExpression.value = item.expression
  lastSavedExpression.value = null
  focusInput()
  showNotification('Выражение восстановлено', 'success')
}

// Interaction
const copyToClipboard = async (): Promise<void> => {
  try {
    const textToCopy = formattedResult.value !== '...' && formattedResult.value !== '' ? formattedResult.value : '0'
    await navigator.clipboard.writeText(textToCopy)
    showNotification('Скопировано в буфер обмена', 'success')
  } catch (error) {
    console.error('Copy error:', error)
    showNotification('Не удалось скопировать', 'error')
  }
}

const sendToChat = async (): Promise<void> => {
  try {
    const expression =
        previousExpression.value ||
        (currentExpression.value && result.value !== '...' && result.value !== ''
            ? `${currentExpression.value} = ${formattedResult.value}`
            : formattedResult.value || '0')

    const currentDialogId = dialogId.value || window.BX24?.user?.id

    if (!currentDialogId) {
      throw new Error('Не удалось определить чат')
    }

    if (window.BX24) {
      await window.BX24.callMethod('im.message.add', {
        DIALOG_ID: currentDialogId,
        MESSAGE: expression,
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

// UI toggles
const toggleAngleMode = (): void => {
  angleMode.value = angleMode.value === 'deg' ? 'rad' : 'deg'
  showNotification(`Режим: ${angleMode.value === 'deg' ? 'Градусы' : 'Радианы'}`, 'info')

  if (currentExpression.value) {
    evaluateExpression()
  }
}

// Keyboard handling
const handleKeyDown = (e: KeyboardEvent): void => {
  const key = e.key

  if (key === 'Backspace' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
    e.preventDefault()
    backspace()
    return
  }

  if ((e.target as HTMLElement)?.tagName === 'INPUT') {
    if (/^[0-9\.\+\-\*\/\^\(\)%,]$/.test(key)) {
      return
    }

    if (key === 'Enter' || key === '=' || key === 'Escape' || key === 'Delete') {
      e.preventDefault()
    }
  }

  if (key === 'Enter' || key === '=') {
    e.preventDefault()
    calculate()
  } else if (key === 'Escape' || key === 'Delete') {
    e.preventDefault()
    clear()
  } else if (key === '^') {
    e.preventDefault()
    addPower('y')
  } else if (key === '(') {
    e.preventDefault()
    addParenthesis('(')
  } else if (key === ')') {
    e.preventDefault()
    addParenthesis(')')
  }
}

const onExpressionChange = (): void => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    evaluateExpression()
  }, 150)
}

const onInputFocus = (): void => {
  // No action needed
}

const onInputBlur = (): void => {
  // No action needed
}

// Computed
const formattedResult = computed<string>(() => {
  if (!result.value || result.value === '...') {
    return result.value || '0'
  }

  if (result.value === 'Деление на ноль' || result.value === '∞' || result.value === '-∞') {
    return result.value
  }

  try {
    const num = parseFloat(result.value)
    if (isNaN(num)) return result.value

    if (!isFinite(num)) {
      return num > 0 ? '∞' : '-∞'
    }

    if (Math.abs(num) < 1e-12) return '0'

    if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
      return num.toExponential(6)
    }

    const parts = num.toString().split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

    if (parts[1]) {
      parts[1] = parts[1].replace(/0+$/, '')
      if (parts[1] === '') {
        return parts[0]
      }
      return parts.join(',')
    }

    return parts[0]
  } catch {
    return result.value
  }
})

// Lifecycle
onMounted(() => {
  loadHistory()

  if (bitrixData && typeof bitrixData.sendBtnActive !== 'undefined') {
    sendBtnActive.value = Boolean(bitrixData.sendBtnActive)
  }

  if (bitrixData && typeof bitrixData.fitWindow !== 'undefined') {
    fitWindow.value = Boolean(bitrixData.fitWindow)
  }

  if (typeof window.BX24 !== 'undefined') {
    window.BX24.init(() => {
      console.log('Bitrix24 SDK initialized')
      if (fitWindow.value) {
        try {
          window.BX24?.fitWindow()
        } catch (error) {
          console.error('Error calling fitWindow:', error)
        }
      }
    })
  } else {
    console.warn('Bitrix24 SDK not found')
  }

  document.addEventListener('keydown', handleKeyDown)
  focusInput()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>

<style scoped>
.calculator-display {
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  word-break: break-all;
  overflow-wrap: break-word;
  min-height: 1.5em;
  user-select: text;
}

.calculator-input {
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
  font-family: inherit;
  width: 100%;
  text-align: right;
  caret-color: var(--b24-primary-color);
}

.calculator-input::placeholder {
  color: var(--b24-text-secondary);
  opacity: 0.6;
}

.calculator-input:focus {
  outline: none;
  box-shadow: none;
}

.history-item {
  transition: background-color 0.2s ease;
}

.calc-btn {
  transition: all 0.1s ease;
  user-select: none;
  min-height: 44px;
}

.calc-btn:active {
  transform: scale(0.95);
}

.calc-btn-number {
  background-color: var(--b24-surface-color);
}

.calc-btn-operation {
  background-color: rgba(47, 198, 246, 0.1);
  color: var(--b24-primary-color);
}

.calc-btn-operation:hover {
  background-color: rgba(47, 198, 246, 0.2) !important;
}

.calc-btn-equals {
  background-color: var(--b24-primary-color);
  color: white;
}

.calc-btn-equals:hover {
  background-color: #1eb4e0 !important;
}

.calc-btn-engineering {
  background-color: var(--b24-surface-color);
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  min-height: 36px;
}

.calc-btn-engineering:hover {
  background-color: rgba(47, 198, 246, 0.1) !important;
}

.rotate-180 {
  transform: rotate(180deg);
}

:deep(.b24-card-body) {
  padding: 0 !important;
}

.calculator-input:focus {
  outline: 2px solid var(--b24-primary-color);
  outline-offset: -2px;
  border-radius: 4px;
}

.keyboard-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  color: var(--b24-text-primary);
  background-color: var(--b24-surface-hover);
  border: 1px solid var(--b24-border-color);
  border-radius: 4px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
  user-select: none;
}

[dir='rtl'] .calculator-input {
  text-align: left;
}

[dir='rtl'] .calculator-display {
  text-align: left;
}

[dir='rtl'] .text-right {
  text-align: left;
}

[dir='rtl'] .space-x-2 > :not([hidden]) ~ :not([hidden]) {
  margin-left: 0;
  margin-right: 0.5rem;
}
</style>