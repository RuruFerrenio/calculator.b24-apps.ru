<template>
  <div class="w-full h-full p-4 space-y-4" :dir="direction">
    <!-- Дисплей калькулятора -->
    <B24Card class="overflow-hidden">
      <div class="p-4">
        <div class="text-right space-y-2">
          <!-- История вычислений -->
          <div
              v-if="previousExpression"
              class="text-sm text-b24-text-secondary min-h-[20px] font-mono truncate"
          >
            {{ previousExpression }}
          </div>

          <!-- Текущий ввод -->
          <B24Input
              ref="inputRef"
              v-model="currentExpression"
              :placeholder="t('calculator.placeholder')"
              size="lg"
              class="text-right font-mono text-xl"
              @keydown="handleKeyDown"
              @input="onExpressionChange"
          />

          <!-- Результат -->
          <div class="border-t border-b24-border pt-2 mt-2">
            <div class="text-lg font-bold text-b24-primary truncate" style="min-height: 28px;">
              {{ t('calculator.equals') }} {{ formattedResult }}
            </div>
          </div>
        </div>
      </div>
    </B24Card>

    <!-- Кнопки быстрых действий -->
    <div class="flex gap-2">
      <B24Button
          variant="secondary"
          size="sm"
          @click="copyToClipboard"
          class="flex-1 justify-center"
      >
        <template #prefix>
          <i class="fas fa-copy"></i>
        </template>
        {{ t('calculator.copy') }}
      </B24Button>
      <B24Button
          v-if="sendBtnActive"
          variant="primary"
          size="sm"
          @click="sendToChat"
          class="flex-1 justify-center"
      >
        <template #prefix>
          <i class="fas fa-paper-plane"></i>
        </template>
        {{ t('calculator.send') }}
      </B24Button>
    </div>

    <!-- Аккордеон для клавиатуры -->
    <B24Collapse v-model="keyboardOpen">
      <B24CollapseItem :title="t('calculator.keyboardTitle')" value="keyboard">
        <div class="pt-2 pb-1">
          <!-- Основные кнопки -->
          <div class="grid grid-cols-4 gap-2 mb-2">
            <B24Button variant="secondary" size="md" @click="clear">
              {{ t('calculator.clear') }}
            </B24Button>
            <B24Button variant="secondary" size="md" @click="backspace">
              <i class="fas fa-backspace"></i>
            </B24Button>
            <B24Button variant="secondary" size="md" @click="addPercentage">
              {{ t('calculator.percentage') }}
            </B24Button>
            <B24Button variant="ghost" size="md" @click="addToExpression('/')">
              {{ t('calculator.divide') }}
            </B24Button>

            <B24Button variant="ghost" size="md" @click="addToExpression('7')">7</B24Button>
            <B24Button variant="ghost" size="md" @click="addToExpression('8')">8</B24Button>
            <B24Button variant="ghost" size="md" @click="addToExpression('9')">9</B24Button>
            <B24Button variant="ghost" size="md" @click="addToExpression('*')">
              {{ t('calculator.multiply') }}
            </B24Button>

            <B24Button variant="ghost" size="md" @click="addToExpression('4')">4</B24Button>
            <B24Button variant="ghost" size="md" @click="addToExpression('5')">5</B24Button>
            <B24Button variant="ghost" size="md" @click="addToExpression('6')">6</B24Button>
            <B24Button variant="ghost" size="md" @click="addToExpression('-')">
              {{ t('calculator.subtract') }}
            </B24Button>

            <B24Button variant="ghost" size="md" @click="addToExpression('1')">1</B24Button>
            <B24Button variant="ghost" size="md" @click="addToExpression('2')">2</B24Button>
            <B24Button variant="ghost" size="md" @click="addToExpression('3')">3</B24Button>
            <B24Button variant="ghost" size="md" @click="addToExpression('+')">
              {{ t('calculator.add') }}
            </B24Button>

            <B24Button variant="ghost" size="md" @click="addToExpression('0')" class="col-span-2">0</B24Button>
            <B24Button variant="ghost" size="md" @click="addToExpression('.')">.</B24Button>
            <B24Button variant="primary" size="md" @click="calculate">
              {{ t('calculator.equalsBtn') }}
            </B24Button>
          </div>

          <!-- Дополнительные кнопки -->
          <div class="grid grid-cols-4 gap-2 mt-2">
            <B24Button variant="ghost" size="sm" @click="addParenthesis('(')">
              {{ t('calculator.openParen') }}
            </B24Button>
            <B24Button variant="ghost" size="sm" @click="addParenthesis(')')">
              {{ t('calculator.closeParen') }}
            </B24Button>
            <B24Button variant="ghost" size="sm" @click="addToExpression('^')">
              {{ t('calculator.power') }}
            </B24Button>
            <B24Button variant="ghost" size="sm" @click="addConstant('pi')">
              {{ t('calculator.pi') }}
            </B24Button>
          </div>
        </div>
      </B24CollapseItem>
    </B24Collapse>

    <!-- Аккордеон для инженерных функций -->
    <B24Collapse v-model="engineeringOpen">
      <B24CollapseItem :title="t('calculator.engineeringTitle')" value="engineering">
        <div class="pt-2 pb-1 space-y-4">
          <!-- Тригонометрия -->
          <div>
            <div class="text-xs font-semibold text-b24-text-secondary mb-2 block">
              {{ t('calculator.trigonometry') }}
            </div>
            <div class="grid grid-cols-3 gap-2">
              <B24Button variant="ghost" size="sm" @click="wrapWithFunction('sin')">sin</B24Button>
              <B24Button variant="ghost" size="sm" @click="wrapWithFunction('cos')">cos</B24Button>
              <B24Button variant="ghost" size="sm" @click="wrapWithFunction('tan')">tan</B24Button>
              <B24Button variant="ghost" size="sm" @click="wrapWithFunction('asin')">asin</B24Button>
              <B24Button variant="ghost" size="sm" @click="wrapWithFunction('acos')">acos</B24Button>
              <B24Button variant="ghost" size="sm" @click="wrapWithFunction('atan')">atan</B24Button>
            </div>
          </div>

          <!-- Математические функции -->
          <div>
            <div class="text-xs font-semibold text-b24-text-secondary mb-2 block">
              {{ t('calculator.mathematics') }}
            </div>
            <div class="grid grid-cols-3 gap-2">
              <B24Button variant="ghost" size="sm" @click="wrapWithFunction('sqrt')">√</B24Button>
              <B24Button variant="ghost" size="sm" @click="addPower(2)">x²</B24Button>
              <B24Button variant="ghost" size="sm" @click="addPower('y')">xʸ</B24Button>
              <B24Button variant="ghost" size="sm" @click="wrapWithFunction('ln')">ln</B24Button>
              <B24Button variant="ghost" size="sm" @click="wrapWithFunction('log10')">log₁₀</B24Button>
              <B24Button variant="ghost" size="sm" @click="wrapWithFunction('exp')">eˣ</B24Button>
            </div>
          </div>

          <!-- Константы -->
          <div>
            <div class="text-xs font-semibold text-b24-text-secondary mb-2 block">
              {{ t('calculator.constants') }}
            </div>
            <div class="grid grid-cols-3 gap-2">
              <B24Button variant="ghost" size="sm" @click="addConstant('pi')">π</B24Button>
              <B24Button variant="ghost" size="sm" @click="addConstant('e')">e</B24Button>
              <B24Button variant="ghost" size="sm" @click="wrapWithFunction('factorial')">n!</B24Button>
            </div>
          </div>

          <!-- Дополнительно -->
          <div>
            <div class="text-xs font-semibold text-b24-text-secondary mb-2 block">
              {{ t('calculator.additional') }}
            </div>
            <div class="grid grid-cols-3 gap-2">
              <B24Button variant="ghost" size="sm" @click="wrapWithFunction('abs')">|x|</B24Button>
              <B24Button variant="ghost" size="sm" @click="addReciprocal">1/x</B24Button>
              <B24Button variant="secondary" size="sm" @click="toggleAngleMode">
                {{ angleMode === 'deg' ? 'DEG' : 'RAD' }}
              </B24Button>
            </div>
          </div>
        </div>
      </B24CollapseItem>
    </B24Collapse>

    <!-- Аккордеон для истории -->
    <B24Collapse v-model="historyOpen">
      <B24CollapseItem :title="t('calculator.historyTitle')" value="history">
        <div class="pt-2 pb-1">
          <div v-if="history.length === 0" class="text-center py-4">
            <div class="text-b24-text-secondary">
              {{ t('calculator.emptyHistory') }}
            </div>
          </div>

          <div v-else class="space-y-2 max-h-48 overflow-y-auto mb-3">
            <div
                v-for="item in history.slice(0, 10)"
                :key="item.id"
                @click="restoreFromHistory(item)"
                class="history-item p-2 rounded cursor-pointer hover:bg-b24-surface-hover transition-colors"
            >
              <div class="flex justify-between items-start gap-2">
                <div class="text-sm font-mono truncate flex-1">
                  {{ item.expression }}
                </div>
                <div class="text-xs text-b24-text-tertiary flex-shrink-0">
                  {{ item.timestamp }}
                </div>
              </div>
            </div>
          </div>

          <B24Button variant="ghost" size="xs" @click="clearHistory" class="w-full justify-center">
            {{ t('calculator.clearHistory') }}
          </B24Button>
        </div>
      </B24CollapseItem>
    </B24Collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// Типы
interface HistoryItem {
  id: number
  expression: string
  timestamp: string
  rawExpression: string
}

// Реактивные данные
const currentExpression = ref<string>('')
const result = ref<string>('')
const history = ref<HistoryItem[]>([])
const previousExpression = ref<string>('')
const engineeringOpen = ref<boolean>(false)
const keyboardOpen = ref<boolean>(true)
const historyOpen = ref<boolean>(false)
const angleMode = ref<'deg' | 'rad'>('deg')
const inputRef = ref<any>(null)
const sendBtnActive = ref<boolean>(true)
const lastSavedExpression = ref<string | null>(null)

// Направление текста
const direction = computed(() => {
  return locale.value === 'ar' || locale.value === 'he' ? 'rtl' : 'ltr'
})

// Форматированный результат
const formattedResult = computed(() => {
  if (!result.value || result.value === '...') {
    return result.value || '0'
  }

  if (result.value === 'Ошибка' || result.value === 'Деление на ноль') {
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
      if (parts[1] === '') return parts[0]
      return parts.join(',')
    }

    return parts[0]
  } catch {
    return result.value
  }
})

// Факториал
const factorial = (n: number): number => {
  if (n < 0 || n > 170) throw new Error('Factorial out of range')
  let result = 1
  for (let i = 2; i <= Math.floor(n); i++) {
    result *= i
  }
  return result
}

// Парсер выражений
const parseExpression = (expr: string): string => {
  let processedExpr = expr

  processedExpr = processedExpr
      .replace(/\*/g, '*')
      .replace(/\//g, '/')
      .replace(/\^/g, '**')
      .replace(/pi/g, 'Math.PI')
      .replace(/e(?![a-z])/gi, 'Math.E')

  const percentRegex = /(\d+(?:\.\d+)?)%/g
  processedExpr = processedExpr.replace(percentRegex, (_, num) => `(${num}/100)`)

  const functionRegex = /(sin|cos|tan|asin|acos|atan|sqrt|ln|log10|exp|abs|factorial)\(([^)]+)\)/g
  processedExpr = processedExpr.replace(functionRegex, (match, func, arg) => {
    const processedArg = parseExpression(arg)
    const isTrig = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'].includes(func)

    if (isTrig && angleMode.value === 'deg') {
      if (func.startsWith('a')) {
        return `Math.${func}(${processedArg}) * 180 / Math.PI`
      } else {
        return `Math.${func}(${processedArg} * Math.PI / 180)`
      }
    } else if (func === 'ln') {
      return `Math.log(${processedArg})`
    } else if (func === 'log10') {
      return `Math.log10(${processedArg})`
    } else if (func === 'exp') {
      return `Math.exp(${processedArg})`
    } else if (func === 'factorial') {
      return `factorial(${processedArg})`
    }
    return `Math.${func}(${processedArg})`
  })

  return processedExpr
}

// Безопасное вычисление
const safeEval = (expr: string): number => {
  const fn = new Function('factorial', 'return ' + expr)
  return fn(factorial)
}

// Вычисление
const evaluateExpression = () => {
  try {
    if (!currentExpression.value || currentExpression.value.trim() === '') {
      result.value = ''
      return
    }

    const expr = currentExpression.value

    if (/[\+\-\*\/\^%]$/.test(expr)) {
      result.value = '...'
      return
    }

    try {
      const parsedExpr = parseExpression(expr)
      const evaluated = safeEval(parsedExpr)

      if (!isFinite(evaluated)) {
        if (expr.includes('/0') || expr.includes('/ 0')) {
          result.value = 'Деление на ноль'
        } else {
          result.value = evaluated > 0 ? '∞' : '-∞'
        }
      } else if (isNaN(evaluated)) {
        result.value = '...'
      } else {
        const rounded = Math.round(evaluated * 1e12) / 1e12
        result.value = rounded.toString()
      }
    } catch (error) {
      result.value = '...'
    }
  } catch (error) {
    console.error('Ошибка вычисления:', error)
    result.value = 'Ошибка'
  }
}

// Основные операции
const calculate = () => {
  evaluateExpression()

  if (result.value && result.value !== '...' &&
      result.value !== 'Ошибка' &&
      result.value !== 'Деление на ноль' &&
      currentExpression.value) {

    const displayExpr = currentExpression.value
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
    const resultValue = formattedResult.value

    if (resultValue && resultValue !== '...' && resultValue !== '') {
      const currentUniqueKey = `${displayExpr}|${resultValue}`
      if (lastSavedExpression.value !== currentUniqueKey) {
        history.value.unshift({
          id: Date.now(),
          expression: `${displayExpr} = ${resultValue}`,
          timestamp: new Date().toLocaleTimeString(),
          rawExpression: currentExpression.value
        })
        history.value = history.value.slice(0, 20)
        saveHistory()

        lastSavedExpression.value = currentUniqueKey
        previousExpression.value = `${displayExpr} = ${resultValue}`
      }
    }
  }
}

const clear = () => {
  currentExpression.value = ''
  result.value = ''
  previousExpression.value = ''
  lastSavedExpression.value = null
  focusInput()
}

const backspace = () => {
  if (currentExpression.value.length > 0) {
    currentExpression.value = currentExpression.value.slice(0, -1)
    evaluateExpression()
  }
  focusInput()
}

const addPercentage = () => {
  currentExpression.value += '%'
  evaluateExpression()
  focusInput()
}

const addToExpression = (value: string) => {
  currentExpression.value += value
  evaluateExpression()
  focusInput()
}

const addParenthesis = (parenthesis: string) => {
  const lastChar = currentExpression.value.slice(-1)
  if (parenthesis === '(' && /[\d\)]/.test(lastChar)) {
    currentExpression.value += '*('
  } else {
    currentExpression.value += parenthesis
  }
  evaluateExpression()
  focusInput()
}

const wrapWithFunction = (funcName: string) => {
  const expr = currentExpression.value
  if (!expr) {
    currentExpression.value = funcName + '('
  } else {
    const lastNumberRegex = /(-?\d*\.?\d+|\))(?![\d\.])/
    const matches = expr.match(lastNumberRegex)
    if (matches && matches[1]) {
      const lastNumber = matches[1]
      const lastNumberIndex = expr.lastIndexOf(lastNumber)
      if (lastNumberIndex !== -1) {
        const before = expr.substring(0, lastNumberIndex)
        const after = expr.substring(lastNumberIndex + lastNumber.length)
        currentExpression.value = before + funcName + '(' + lastNumber + ')' + after
      }
    } else {
      currentExpression.value = funcName + '(' + expr + ')'
    }
  }
  evaluateExpression()
  focusInput()
}

const addPower = (power: number | string) => {
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
          currentExpression.value = before + '(' + lastNumber + '^' + power + ')' + after
        }
      } else {
        currentExpression.value += '^' + power
      }
    } else {
      currentExpression.value += '^' + power
    }
  }
  evaluateExpression()
  focusInput()
}

const addConstant = (constant: string) => {
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

const addReciprocal = () => {
  const expr = currentExpression.value
  if (expr) {
    currentExpression.value = '1/(' + expr + ')'
  } else {
    currentExpression.value = '1/'
  }
  evaluateExpression()
  focusInput()
}

// История
const saveHistory = () => {
  try {
    localStorage.setItem('calculator_history', JSON.stringify(history.value))
  } catch (error) {
    console.error('Ошибка сохранения истории:', error)
  }
}

const loadHistory = () => {
  try {
    const saved = localStorage.getItem('calculator_history')
    if (saved) {
      history.value = JSON.parse(saved) || []
    }
  } catch (error) {
    console.error('Ошибка загрузки истории:', error)
  }
}

const clearHistory = () => {
  history.value = []
  saveHistory()
  lastSavedExpression.value = null
}

const restoreFromHistory = (item: HistoryItem) => {
  if (item.rawExpression) {
    currentExpression.value = item.rawExpression
  } else {
    const parts = item.expression.split(' = ')
    if (parts.length === 2) {
      currentExpression.value = parts[0]
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
    }
  }
  evaluateExpression()
  previousExpression.value = item.expression
  lastSavedExpression.value = null
  focusInput()
}

// Копирование и отправка
const copyToClipboard = async () => {
  try {
    const textToCopy = formattedResult.value !== '...' && formattedResult.value !== ''
        ? formattedResult.value
        : '0'
    await navigator.clipboard.writeText(textToCopy)
  } catch (error) {
    console.error('Ошибка копирования:', error)
  }
}

const sendToChat = async () => {
  try {
    const expression = previousExpression.value ||
        (currentExpression.value && result.value !== '...' && result.value !== ''
            ? `${currentExpression.value.replace(/\*/g, '×').replace(/\//g, '÷')} = ${formattedResult.value}`
            : formattedResult.value || '0')

    if (typeof BX24 !== 'undefined' && BX24.callMethod) {
      const dialogId = (window as any).bitrixData?.dialogId
      if (dialogId) {
        BX24.callMethod('im.message.add', {
          DIALOG_ID: dialogId,
          MESSAGE: expression,
          SYSTEM: 'N'
        })
      }
    }
  } catch (error) {
    console.error('Ошибка отправки:', error)
  }
}

// Переключения
const toggleAngleMode = () => {
  angleMode.value = angleMode.value === 'deg' ? 'rad' : 'deg'
  if (currentExpression.value) {
    evaluateExpression()
  }
}

const focusInput = () => {
  setTimeout(() => {
    if (inputRef.value) {
      inputRef.value.focus()
    }
  }, 10)
}

// Обработка клавиатуры
const handleKeyDown = (e: KeyboardEvent) => {
  const key = e.key

  if (key === 'Backspace' && (e.target as HTMLElement).tagName !== 'INPUT') {
    e.preventDefault()
    backspace()
    return
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

const onExpressionChange = () => {
  evaluateExpression()
}

// Инициализация
onMounted(() => {
  loadHistory()

  const bitrixData = (window as any).bitrixData || {}
  if (typeof bitrixData.sendBtnActive !== 'undefined') {
    sendBtnActive.value = Boolean(bitrixData.sendBtnActive)
  }

  if (typeof BX24 !== 'undefined' && BX24.init) {
    BX24.init(() => {
      console.log('Bitrix24 SDK инициализирован')
      if (typeof BX24.fitWindow === 'function') {
        BX24.fitWindow()
      }
    })
  }

  document.addEventListener('keydown', handleKeyDown)
  setTimeout(() => focusInput(), 100)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.history-item {
  transition: background-color 0.2s ease;
}

.history-item:active {
  transform: scale(0.98);
}

[dir="rtl"] .text-right {
  text-align: left;
}
</style>