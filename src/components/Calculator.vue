<template>
  <div class="calculator-wrapper">
    <B24Card class="calculator-card">
      <div class="p-4 md:p-6">
        <!-- Заголовок калькулятора -->
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">Калькулятор</h3>
          </div>
          <B24Badge variant="outline" size="sm">Версия 1.0</B24Badge>
        </div>

        <!-- Дисплей калькулятора -->
        <div class="mb-6">
          <B24Input
              v-model="displayValue"
              placeholder="0"
              size="lg"
              readonly
              class="calculator-display"
              :class="{ 'calculator-display-error': isError }"
          >
            <template #prefix>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </template>
          </B24Input>

          <!-- Предыдущее выражение (если есть) -->
          <div v-if="previousExpression" class="text-right mt-2 text-sm text-gray-400">
            {{ previousExpression }} = {{ previousResult }}
          </div>
        </div>

        <!-- Аккордеон с кнопочной клавиатурой -->
        <B24Accordion
            v-model:open="keyboardOpen"
            :title="keyboardOpen ? 'Скрыть клавиатуру' : 'Показать клавиатуру'"
            variant="bordered"
            class="mb-4"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </template>

          <div class="calculator-buttons">
            <div class="grid grid-cols-4 gap-2">
              <!-- Первый ряд: очистка и операции -->
              <B24Button
                  @click="clearAll"
                  variant="outline"
                  size="lg"
                  class="calculator-btn"
                  color="air-secondary"
              >
                C
              </B24Button>
              <B24Button
                  @click="clearEntry"
                  variant="outline"
                  size="lg"
                  class="calculator-btn"
                  color="air-secondary"
              >
                CE
              </B24Button>
              <B24Button
                  @click="backspace"
                  variant="outline"
                  size="lg"
                  class="calculator-btn"
                  color="air-secondary"
              >
                ←
              </B24Button>
              <B24Button
                  @click="appendOperator('/')"
                  variant="primary"
                  size="lg"
                  class="calculator-btn calculator-operator"
                  :class="{ 'calculator-btn-active': currentOperator === '/' }"
              >
                ÷
              </B24Button>

              <!-- Второй ряд -->
              <B24Button
                  @click="appendNumber('7')"
                  variant="outline"
                  size="lg"
                  class="calculator-btn"
              >
                7
              </B24Button>
              <B24Button
                  @click="appendNumber('8')"
                  variant="outline"
                  size="lg"
                  class="calculator-btn"
              >
                8
              </B24Button>
              <B24Button
                  @click="appendNumber('9')"
                  variant="outline"
                  size="lg"
                  class="calculator-btn"
              >
                9
              </B24Button>
              <B24Button
                  @click="appendOperator('*')"
                  variant="primary"
                  size="lg"
                  class="calculator-btn calculator-operator"
                  :class="{ 'calculator-btn-active': currentOperator === '*' }"
              >
                ×
              </B24Button>

              <!-- Третий ряд -->
              <B24Button
                  @click="appendNumber('4')"
                  variant="outline"
                  size="lg"
                  class="calculator-btn"
              >
                4
              </B24Button>
              <B24Button
                  @click="appendNumber('5')"
                  variant="outline"
                  size="lg"
                  class="calculator-btn"
              >
                5
              </B24Button>
              <B24Button
                  @click="appendNumber('6')"
                  variant="outline"
                  size="lg"
                  class="calculator-btn"
              >
                6
              </B24Button>
              <B24Button
                  @click="appendOperator('-')"
                  variant="primary"
                  size="lg"
                  class="calculator-btn calculator-operator"
                  :class="{ 'calculator-btn-active': currentOperator === '-' }"
              >
                -
              </B24Button>

              <!-- Четвертый ряд -->
              <B24Button
                  @click="appendNumber('1')"
                  variant="outline"
                  size="lg"
                  class="calculator-btn"
              >
                1
              </B24Button>
              <B24Button
                  @click="appendNumber('2')"
                  variant="outline"
                  size="lg"
                  class="calculator-btn"
              >
                2
              </B24Button>
              <B24Button
                  @click="appendNumber('3')"
                  variant="outline"
                  size="lg"
                  class="calculator-btn"
              >
                3
              </B24Button>
              <B24Button
                  @click="appendOperator('+')"
                  variant="primary"
                  size="lg"
                  class="calculator-btn calculator-operator"
                  :class="{ 'calculator-btn-active': currentOperator === '+' }"
              >
                +
              </B24Button>

              <!-- Пятый ряд -->
              <B24Button
                  @click="appendNumber('0')"
                  variant="outline"
                  size="lg"
                  class="calculator-btn col-span-2"
              >
                0
              </B24Button>
              <B24Button
                  @click="appendDecimal"
                  variant="outline"
                  size="lg"
                  class="calculator-btn"
              >
                .
              </B24Button>
              <B24Button
                  @click="calculate"
                  variant="primary"
                  size="lg"
                  class="calculator-btn calculator-equals"
              >
                =
              </B24Button>
            </div>

            <!-- Дополнительные функции -->
            <div class="grid grid-cols-4 gap-2 mt-2">
              <B24Button
                  @click="appendPercentage"
                  variant="outline"
                  size="md"
                  class="calculator-btn calculator-function"
                  color="air-tertiary"
              >
                %
              </B24Button>
              <B24Button
                  @click="plusMinus"
                  variant="outline"
                  size="md"
                  class="calculator-btn calculator-function"
                  color="air-tertiary"
              >
                +/-
              </B24Button>
              <B24Button
                  @click="squareRoot"
                  variant="outline"
                  size="md"
                  class="calculator-btn calculator-function"
                  color="air-tertiary"
              >
                √
              </B24Button>
              <B24Button
                  @click="power"
                  variant="outline"
                  size="md"
                  class="calculator-btn calculator-function"
                  color="air-tertiary"
              >
                x²
              </B24Button>
            </div>
          </div>
        </B24Accordion>

        <!-- Советы по использованию -->
        <B24Alert variant="info" class="mt-4">
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </template>
          <div class="text-sm">
            <span class="font-medium">Совет:</span> Вы также можете использовать клавиатуру для ввода.
            Доступные клавиши: цифры (0-9), операции (+, -, *, /), Enter (=), Delete/C (очистка), Backspace (удаление), %.
          </div>
        </B24Alert>
      </div>
    </B24Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Состояние калькулятора
const displayValue = ref<string>('0')
const previousExpression = ref<string>('')
const previousResult = ref<string>('')
const currentValue = ref<number>(0)
const storedValue = ref<number | null>(null)
const currentOperator = ref<string | null>(null)
const waitingForOperand = ref<boolean>(false)
const isError = ref<boolean>(false)
const keyboardOpen = ref<boolean>(false)

// Форматирование числа для отображения
const formatNumber = (num: number): string => {
  if (isNaN(num) || !isFinite(num)) {
    return 'Ошибка'
  }

  // Ограничиваем количество знаков после запятой
  if (Math.abs(num) > 1e15) {
    return num.toExponential(8)
  }

  const formatted = num.toString()

  // Ограничиваем общую длину
  if (formatted.length > 20) {
    return num.toExponential(8)
  }

  return formatted
}

// Обновление дисплея
const updateDisplay = (value: string | number): void => {
  if (typeof value === 'number') {
    displayValue.value = formatNumber(value)
  } else {
    // Ограничиваем длину ввода
    if (value.length > 20) {
      displayValue.value = value.slice(0, 20)
    } else {
      displayValue.value = value
    }
  }
  isError.value = false
}

// Добавление цифры
const appendNumber = (num: string): void => {
  if (isError.value) {
    clearAll()
  }

  if (waitingForOperand.value) {
    displayValue.value = num
    waitingForOperand.value = false
  } else {
    if (displayValue.value === '0' && num === '0') return
    if (displayValue.value === '0') {
      displayValue.value = num
    } else {
      displayValue.value += num
    }
  }

  // Ограничиваем длину
  if (displayValue.value.length > 20) {
    displayValue.value = displayValue.value.slice(0, 20)
  }
}

// Добавление десятичной точки
const appendDecimal = (): void => {
  if (isError.value) {
    clearAll()
  }

  if (waitingForOperand.value) {
    displayValue.value = '0.'
    waitingForOperand.value = false
  } else if (!displayValue.value.includes('.')) {
    displayValue.value += '.'
  }
}

// Добавление оператора
const appendOperator = (operator: string): void => {
  if (isError.value) {
    clearAll()
  }

  const inputValue = parseFloat(displayValue.value)

  if (storedValue.value !== null && currentOperator.value && !waitingForOperand.value) {
    const result = performCalculation()
    if (result !== null) {
      updateDisplay(result)
      storedValue.value = result
      currentValue.value = result
    } else {
      return
    }
  } else {
    storedValue.value = inputValue
    currentValue.value = inputValue
  }

  currentOperator.value = operator
  waitingForOperand.value = true
}

// Выполнение вычисления
const performCalculation = (): number | null => {
  if (storedValue.value === null || currentOperator.value === null) return null

  const current = parseFloat(displayValue.value)
  let result: number

  switch (currentOperator.value) {
    case '+':
      result = storedValue.value + current
      break
    case '-':
      result = storedValue.value - current
      break
    case '*':
      result = storedValue.value * current
      break
    case '/':
      if (current === 0) {
        isError.value = true
        updateDisplay('Ошибка: деление на 0')
        return null
      }
      result = storedValue.value / current
      break
    default:
      return null
  }

  // Сохраняем выражение для отображения
  previousExpression.value = `${formatNumber(storedValue.value)} ${currentOperator.value} ${formatNumber(current)}`
  previousResult.value = formatNumber(result)

  return result
}

// Вычисление результата
const calculate = (): void => {
  if (isError.value) {
    clearAll()
    return
  }

  if (currentOperator.value && !waitingForOperand.value) {
    const result = performCalculation()
    if (result !== null) {
      updateDisplay(result)
      storedValue.value = result
      currentValue.value = result
      currentOperator.value = null
      waitingForOperand.value = true
    }
  } else if (!waitingForOperand.value && previousExpression.value) {
    // Если есть предыдущий результат, используем его для продолжения
    const current = parseFloat(displayValue.value)
    updateDisplay(current)
  }
}

// Полная очистка
const clearAll = (): void => {
  displayValue.value = '0'
  storedValue.value = null
  currentOperator.value = null
  waitingForOperand.value = false
  isError.value = false
  previousExpression.value = ''
  previousResult.value = ''
}

// Очистка последнего ввода
const clearEntry = (): void => {
  if (isError.value) {
    clearAll()
  } else {
    displayValue.value = '0'
    waitingForOperand.value = false
  }
}

// Удаление последнего символа
const backspace = (): void => {
  if (isError.value) {
    clearAll()
    return
  }

  if (!waitingForOperand.value) {
    if (displayValue.value.length > 1) {
      displayValue.value = displayValue.value.slice(0, -1)
    } else {
      displayValue.value = '0'
    }
  }
}

// Смена знака
const plusMinus = (): void => {
  if (isError.value) {
    clearAll()
    return
  }

  const current = parseFloat(displayValue.value)
  const newValue = -current
  updateDisplay(newValue)

  if (!waitingForOperand.value && storedValue.value !== null && currentOperator.value) {
    // Обновляем текущее значение для последующих операций
  }
}

// Процент
const appendPercentage = (): void => {
  if (isError.value) {
    clearAll()
    return
  }

  const current = parseFloat(displayValue.value)
  let result: number

  if (storedValue.value !== null && currentOperator.value) {
    // Процент от сохраненного значения
    result = storedValue.value * (current / 100)
  } else {
    result = current / 100
  }

  updateDisplay(result)

  if (!waitingForOperand.value && storedValue.value !== null && currentOperator.value) {
    waitingForOperand.value = true
  }
}

// Квадратный корень
const squareRoot = (): void => {
  if (isError.value) {
    clearAll()
    return
  }

  const current = parseFloat(displayValue.value)

  if (current < 0) {
    isError.value = true
    updateDisplay('Ошибка: отрицательный корень')
    return
  }

  const result = Math.sqrt(current)
  updateDisplay(result)

  if (!waitingForOperand.value && storedValue.value !== null && currentOperator.value) {
    waitingForOperand.value = true
  }
}

// Возведение в квадрат
const power = (): void => {
  if (isError.value) {
    clearAll()
    return
  }

  const current = parseFloat(displayValue.value)
  const result = Math.pow(current, 2)
  updateDisplay(result)

  if (!waitingForOperand.value && storedValue.value !== null && currentOperator.value) {
    waitingForOperand.value = true
  }
}

// Обработка клавиатурного ввода
const handleKeyboardInput = (event: KeyboardEvent): void => {
  const key = event.key

  // Цифры
  if (/^[0-9]$/.test(key)) {
    event.preventDefault()
    appendNumber(key)
  }
  // Десятичная точка
  else if (key === '.' || key === ',') {
    event.preventDefault()
    appendDecimal()
  }
  // Операторы
  else if (key === '+') {
    event.preventDefault()
    appendOperator('+')
  }
  else if (key === '-') {
    event.preventDefault()
    appendOperator('-')
  }
  else if (key === '*') {
    event.preventDefault()
    appendOperator('*')
  }
  else if (key === '/') {
    event.preventDefault()
    appendOperator('/')
  }
  // Вычисление
  else if (key === 'Enter' || key === '=') {
    event.preventDefault()
    calculate()
  }
  // Полная очистка
  else if (key === 'Delete' || key === 'Escape') {
    event.preventDefault()
    clearAll()
  }
  // Удаление символа
  else if (key === 'Backspace') {
    event.preventDefault()
    backspace()
  }
  // Процент
  else if (key === '%') {
    event.preventDefault()
    appendPercentage()
  }
}

// Монтирование и размонтирование
onMounted(() => {
  window.addEventListener('keydown', handleKeyboardInput)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboardInput)
})
</script>

<style scoped>
.calculator-wrapper {
  max-width: 600px;
  margin: 0 auto;
}

.calculator-card {
  transition: all 0.3s ease;
}

.calculator-display :deep(input) {
  font-size: 24px;
  font-weight: 500;
  text-align: right;
  background-color: #f8f9fa;
  font-family: 'Courier New', monospace;
}

.calculator-display-error :deep(input) {
  color: #dc2626;
  background-color: #fef2f2;
}

.calculator-buttons {
  padding: 4px;
}

.calculator-btn {
  transition: all 0.2s ease;
  font-weight: 600;
}

.calculator-btn:active {
  transform: scale(0.95);
}

.calculator-operator {
  background-color: #3b82f6;
  color: white;
}

.calculator-operator:hover {
  background-color: #2563eb;
}

.calculator-btn-active {
  background-color: #1d4ed8;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.calculator-equals {
  background-color: #10b981;
  color: white;
}

.calculator-equals:hover {
  background-color: #059669;
}

.calculator-function {
  background-color: #f3f4f6;
  color: #374151;
}

.calculator-function:hover {
  background-color: #e5e7eb;
}

/* Анимация для аккордеона */
:deep(.b24-accordion__content) {
  transition: all 0.3s ease;
}

/* Стили для кнопок на мобильных устройствах */
@media (max-width: 640px) {
  .calculator-btn {
    font-size: 18px;
    padding: 12px 8px;
  }

  .calculator-display :deep(input) {
    font-size: 20px;
  }
}
</style>