<template>
  <B24App>
    <div class="w-full h-full p-4 space-y-4" :dir="direction">
      <!-- Дисплей калькулятора -->
      <B24Card class="overflow-hidden">
        <div class="p-3 relative">
          <div class="text-right space-y-0">
            <!-- История вычислений -->
            <div
                v-if="previousExpression"
                class="text-sm text-b24-text-secondary min-h-[16px] font-mono truncate"
            >
              {{ previousExpression }}
            </div>

            <!-- Текущий ввод через input -->
            <div class="relative">
              <input
                  ref="inputRef"
                  v-model="currentExpression"
                  type="text"
                  class="w-full text-right text-xl font-semibold text-b24-text-primary bg-transparent border-none outline-none calculator-input"
                  @keydown="handleKeyDown"
                  @input="onExpressionChange"
                  @focus="onInputFocus"
                  @blur="onInputBlur"
                  :placeholder="$t('calculator.placeholder')"
                  spellcheck="false"
                  :dir="direction"
              />
              <div class="absolute right-0 top-0 bottom-0 w-0 opacity-0 pointer-events-none">
                {{ currentExpression }}
              </div>
            </div>

            <!-- Результат с разделительной чертой -->
            <div class="border-t border-b24-border pt-1 mt-1">
              <div class="text-lg font-bold text-b24-primary truncate calculator-display" style="min-height: 24px;">
                {{ $t('calculator.equals') }} {{ formattedResult }}
              </div>
            </div>
          </div>
        </div>
      </B24Card>

      <!-- Кнопки быстрых действий -->
      <div class="flex items-center justify-between">
        <div class="flex space-x-2 w-full">
          <B24Button
              size="sm"
              variant="secondary"
              @click="copyToClipboard"
              class="text-xs w-full justify-center"
          >
            {{ $t('calculator.copy') }}
          </B24Button>
          <B24Button
              v-if="sendBtnActive"
              size="sm"
              variant="primary"
              @click="sendToChat"
              class="text-xs w-full justify-center"
          >
            {{ $t('calculator.send') }}
          </B24Button>
        </div>
      </div>

      <!-- Аккордеон для клавиатуры -->
      <B24Card class="overflow-hidden">
        <div
            class="cursor-pointer flex items-center justify-between hover:bg-b24-surface-hover transition-colors p-3"
            @click="toggleKeyboard"
        >
          <h3 class="text-sm font-semibold text-b24-text-primary">
            {{ $t('calculator.keyboardTitle') }}
          </h3>
          <div class="transform transition-transform" :class="{ 'rotate-180': keyboardOpen }">
            <i class="fas fa-chevron-down text-b24-text-secondary"></i>
          </div>
        </div>

        <!-- Клавиши калькулятора (скрываемое содержимое) -->
        <div v-if="keyboardOpen" class="pt-3 pb-3 px-3">
          <div class="grid grid-cols-4 gap-2 mt-3">
            <!-- Функциональные клавиши -->
            <B24Button
                size="lg"
                variant="secondary"
                @click="clear"
                class="calc-btn"
            >
              {{ $t('calculator.clear') }}
            </B24Button>
            <B24Button
                size="lg"
                variant="secondary"
                @click="backspace"
                class="calc-btn"
            >
              {{ $t('calculator.backspace') }}
            </B24Button>
            <B24Button
                size="lg"
                variant="secondary"
                @click="addPercentage"
                class="calc-btn"
            >
              {{ $t('calculator.percentage') }}
            </B24Button>
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('/')"
                class="calc-btn calc-btn-operation"
            >
              {{ $t('calculator.divide') }}
            </B24Button>

            <!-- Цифры 7-9 -->
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('7')"
                class="calc-btn calc-btn-number"
            >
              7
            </B24Button>
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('8')"
                class="calc-btn calc-btn-number"
            >
              8
            </B24Button>
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('9')"
                class="calc-btn calc-btn-number"
            >
              9
            </B24Button>
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('*')"
                class="calc-btn calc-btn-operation"
            >
              {{ $t('calculator.multiply') }}
            </B24Button>

            <!-- Цифры 4-6 -->
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('4')"
                class="calc-btn calc-btn-number"
            >
              4
            </B24Button>
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('5')"
                class="calc-btn calc-btn-number"
            >
              5
            </B24Button>
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('6')"
                class="calc-btn calc-btn-number"
            >
              6
            </B24Button>
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('-')"
                class="calc-btn calc-btn-operation"
            >
              {{ $t('calculator.subtract') }}
            </B24Button>

            <!-- Цифры 1-3 -->
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('1')"
                class="calc-btn calc-btn-number"
            >
              1
            </B24Button>
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('2')"
                class="calc-btn calc-btn-number"
            >
              2
            </B24Button>
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('3')"
                class="calc-btn calc-btn-number"
            >
              3
            </B24Button>
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('+')"
                class="calc-btn calc-btn-operation"
            >
              {{ $t('calculator.add') }}
            </B24Button>

            <!-- Нижний ряд -->
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('0')"
                class="calc-btn calc-btn-number col-span-2"
            >
              0
            </B24Button>
            <B24Button
                size="lg"
                variant="ghost"
                @click="addToExpression('.')"
                class="calc-btn calc-btn-number"
            >
              {{ $t('calculator.point') }}
            </B24Button>
            <B24Button
                size="lg"
                @click="calculate"
                class="calc-btn calc-btn-equals"
            >
              {{ $t('calculator.equalsBtn') }}
            </B24Button>
          </div>

          <!-- Дополнительные кнопки -->
          <div class="grid grid-cols-4 gap-2 mt-2">
            <B24Button
                size="sm"
                variant="ghost"
                @click="addParenthesis('(')"
                class="calc-btn"
            >
              {{ $t('calculator.openParen') }}
            </B24Button>
            <B24Button
                size="sm"
                variant="ghost"
                @click="addParenthesis(')')"
                class="calc-btn"
            >
              {{ $t('calculator.closeParen') }}
            </B24Button>
            <B24Button
                size="sm"
                variant="ghost"
                @click="addToExpression('^')"
                class="calc-btn"
            >
              {{ $t('calculator.power') }}
            </B24Button>
            <B24Button
                size="sm"
                variant="ghost"
                @click="addConstant('pi')"
                class="calc-btn"
            >
              {{ $t('calculator.pi') }}
            </B24Button>
          </div>
        </div>
      </B24Card>

      <!-- Аккордеон для инженерных функций -->
      <B24Card class="overflow-hidden">
        <div
            class="cursor-pointer flex items-center justify-between hover:bg-b24-surface-hover transition-colors p-3"
            @click="toggleEngineering"
        >
          <h3 class="text-sm font-semibold text-b24-text-primary">
            {{ $t('calculator.engineeringTitle') }}
          </h3>
          <div class="transform transition-transform" :class="{ 'rotate-180': engineeringOpen }">
            <i class="fas fa-calculator text-b24-text-secondary"></i>
          </div>
        </div>

        <!-- Инженерные функции (скрываемое содержимое) -->
        <div v-if="engineeringOpen" class="pt-3 pb-3 px-3">
          <!-- Тригонометрия -->
          <div class="mb-4">
            <h4 class="text-xs font-semibold text-b24-text-secondary mb-2 px-1">
              {{ $t('calculator.trigonometry') }}
            </h4>
            <div class="grid grid-cols-3 gap-2 mb-3">
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="wrapWithFunction('sin')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.sin') }}
              </B24Button>
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="wrapWithFunction('cos')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.cos') }}
              </B24Button>
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="wrapWithFunction('tan')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.tan') }}
              </B24Button>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="wrapWithFunction('asin')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.asin') }}
              </B24Button>
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="wrapWithFunction('acos')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.acos') }}
              </B24Button>
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="wrapWithFunction('atan')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.atan') }}
              </B24Button>
            </div>
          </div>

          <!-- Математические функции -->
          <div class="mb-4">
            <h4 class="text-xs font-semibold text-b24-text-secondary mb-2 px-1">
              {{ $t('calculator.mathematics') }}
            </h4>
            <div class="grid grid-cols-3 gap-2">
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="wrapWithFunction('sqrt')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.squareRoot') }}
              </B24Button>
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="addPower(2)"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.square') }}
              </B24Button>
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="addPower('y')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.power') }}
              </B24Button>
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="wrapWithFunction('ln')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.ln') }}
              </B24Button>
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="wrapWithFunction('log10')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.log10') }}
              </B24Button>
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="wrapWithFunction('exp')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.exp') }}
              </B24Button>
            </div>
          </div>

          <!-- Константы и факториал -->
          <div class="mb-4">
            <h4 class="text-xs font-semibold text-b24-text-secondary mb-2 px-1">
              {{ $t('calculator.constants') }}
            </h4>
            <div class="grid grid-cols-3 gap-2">
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="addConstant('pi')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.pi') }}
              </B24Button>
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="addConstant('e')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.e') }}
              </B24Button>
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="wrapWithFunction('factorial')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.factorial') }}
              </B24Button>
            </div>
          </div>

          <!-- Дополнительные функции -->
          <div>
            <h4 class="text-xs font-semibold text-b24-text-secondary mb-2 px-1">
              {{ $t('calculator.additional') }}
            </h4>
            <div class="grid grid-cols-3 gap-2">
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="wrapWithFunction('abs')"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.abs') }}
              </B24Button>
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="addReciprocal"
                  class="calc-btn-engineering"
              >
                {{ $t('calculator.reciprocal') }}
              </B24Button>
              <B24Button
                  size="sm"
                  variant="ghost"
                  @click="toggleAngleMode"
                  class="calc-btn-engineering"
              >
                {{ angleMode === 'deg' ? $t('calculator.deg') : $t('calculator.rad') }}
              </B24Button>
            </div>
          </div>
        </div>
      </B24Card>

      <!-- Аккордеон для истории -->
      <B24Card class="overflow-hidden">
        <div
            class="cursor-pointer flex items-center justify-between hover:bg-b24-surface-hover transition-colors p-3"
            @click="toggleHistory"
        >
          <h3 class="text-sm font-semibold text-b24-text-primary">
            {{ $t('calculator.historyTitle') }}
          </h3>
          <div class="flex items-center space-x-2">
            <span v-if="history.length > 0" class="text-xs text-b24-text-secondary">
              {{ $t('calculator.items', {count: history.length}) }}
            </span>
            <div class="transform transition-transform" :class="{ 'rotate-180': historyOpen }">
              <i class="fas fa-chevron-down text-b24-text-secondary"></i>
            </div>
          </div>
        </div>

        <!-- История (скрываемое содержимое) -->
        <div v-if="historyOpen" class="pt-3 pb-3 px-3">
          <div v-if="history.length === 0" class="text-center py-4">
            <p class="text-sm text-b24-text-secondary">
              {{ $t('calculator.emptyHistory') }}
            </p>
          </div>

          <div v-else class="space-y-2 max-h-40 overflow-y-auto">
            <div
                v-for="item in history.slice(0, 5)"
                :key="item.id"
                @click="restoreFromHistory(item)"
                class="history-item p-2 rounded cursor-pointer hover:bg-b24-surface-hover transition-colors"
            >
              <div class="flex justify-between items-start">
                <div class="text-sm text-b24-text-secondary font-mono truncate">
                  {{ item.expression }}
                </div>
                <span class="text-xs text-b24-text-tertiary ml-2 flex-shrink-0">
                  {{ item.timestamp }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex justify-start mt-3">
            <B24Button
                size="xs"
                variant="ghost"
                @click="clearHistory"
                class="text-xs w-full justify-center"
            >
              {{ $t('calculator.clearHistory') }}
            </B24Button>
          </div>
        </div>
      </B24Card>

      <!-- Аккордеон для справки (последний) -->
      <B24Card class="overflow-hidden">
        <div
            class="cursor-pointer flex items-center justify-between hover:bg-b24-surface-hover transition-colors p-3"
            @click="toggleHelp"
        >
          <h3 class="text-sm font-semibold text-b24-text-primary">
            {{ $t('calculator.helpTitle') }}
          </h3>
          <div class="transform transition-transform" :class="{ 'rotate-180': helpOpen }">
            <i class="fas fa-question-circle text-b24-text-secondary"></i>
          </div>
        </div>

        <!-- Справка по горячим клавишам (скрываемое содержимое) -->
        <div v-if="helpOpen" class="pt-3 pb-3 px-3">
          <!-- Основные клавиши -->
          <div class="mb-4">
            <h4 class="text-xs font-semibold text-b24-text-primary mb-2 px-1 pb-1 border-b border-b24-border">
              {{ $t('calculator.helpCategories.basic') }}
            </h4>
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-b24-text-secondary">
                  {{ $t('calculator.helpItems.calculate') }}
                </span>
                <div class="flex items-center space-x-1">
                  <kbd class="keyboard-key">
                    {{ $t('calculator.hotkeys.enter') }}
                  </kbd>
                  <span class="text-xs text-b24-text-tertiary">
                    {{ $t('calculator.helpItems.or') }}
                  </span>
                  <kbd class="keyboard-key">
                    {{ $t('calculator.hotkeys.equals') }}
                  </kbd>
                </div>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-b24-text-secondary">
                  {{ $t('calculator.helpItems.clearAll') }}
                </span>
                <div class="flex items-center space-x-1">
                  <kbd class="keyboard-key">
                    {{ $t('calculator.hotkeys.escape') }}
                  </kbd>
                  <span class="text-xs text-b24-text-tertiary">
                    {{ $t('calculator.helpItems.or') }}
                  </span>
                  <kbd class="keyboard-key">
                    {{ $t('calculator.hotkeys.delete') }}
                  </kbd>
                </div>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-b24-text-secondary">
                  {{ $t('calculator.helpItems.deleteLast') }}
                </span>
                <kbd class="keyboard-key">
                  {{ $t('calculator.hotkeys.backspace') }}
                </kbd>
              </div>
            </div>
          </div>

          <!-- Математические операции -->
          <div class="mb-4">
            <h4 class="text-xs font-semibold text-b24-text-primary mb-2 px-1 pb-1 border-b border-b24-border">
              {{ $t('calculator.helpCategories.operations') }}
            </h4>
            <div class="space-y-2">
              <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-b24-text-secondary">
                    {{ $t('calculator.helpItems.addition') }}
                  </span>
                  <kbd class="keyboard-key">
                    {{ $t('calculator.hotkeys.plus') }}
                  </kbd>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-b24-text-secondary">
                    {{ $t('calculator.helpItems.subtraction') }}
                  </span>
                  <kbd class="keyboard-key">
                    {{ $t('calculator.hotkeys.minus') }}
                  </kbd>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-b24-text-secondary">
                    {{ $t('calculator.helpItems.multiplication') }}
                  </span>
                  <kbd class="keyboard-key">
                    {{ $t('calculator.hotkeys.asterisk') }}
                  </kbd>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-b24-text-secondary">
                    {{ $t('calculator.helpItems.division') }}
                  </span>
                  <kbd class="keyboard-key">
                    {{ $t('calculator.hotkeys.slash') }}
                  </kbd>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-b24-text-secondary">
                    {{ $t('calculator.helpItems.power') }}
                  </span>
                  <kbd class="keyboard-key">
                    {{ $t('calculator.hotkeys.caret') }}
                  </kbd>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-b24-text-secondary">
                    {{ $t('calculator.helpItems.percent') }}
                  </span>
                  <kbd class="keyboard-key">
                    {{ $t('calculator.hotkeys.percent') }}
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          <!-- Скобки и константы -->
          <div class="mb-4">
            <h4 class="text-xs font-semibold text-b24-text-primary mb-2 px-1 pb-1 border-b border-b24-border">
              {{ $t('calculator.helpCategories.parentheses') }}
            </h4>
            <div class="space-y-2">
              <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-b24-text-secondary">
                    {{ $t('calculator.helpItems.openParenthesis') }}
                  </span>
                  <kbd class="keyboard-key">
                    {{ $t('calculator.hotkeys.openParen') }}
                  </kbd>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-b24-text-secondary">
                    {{ $t('calculator.helpItems.closeParenthesis') }}
                  </span>
                  <kbd class="keyboard-key">
                    {{ $t('calculator.hotkeys.closeParen') }}
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          <!-- Цифры -->
          <div class="mb-4">
            <h4 class="text-xs font-semibold text-b24-text-primary mb-2 px-1 pb-1 border-b border-b24-border">
              {{ $t('calculator.helpCategories.numbers') }}
            </h4>
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="text-b24-text-secondary">
                  {{ $t('calculator.helpItems.numbers') }}
                </span>
                <div class="flex items-center space-x-1">
                  <kbd class="keyboard-key number-key">0</kbd>
                  <span class="text-xs text-b24-text-tertiary">-</span>
                  <kbd class="keyboard-key number-key">9</kbd>
                </div>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-b24-text-secondary">
                  {{ $t('calculator.helpItems.decimalPoint') }}
                </span>
                <div class="flex items-center space-x-2">
                  <kbd class="keyboard-key">
                    {{ $t('calculator.hotkeys.period') }}
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          <!-- Примечание -->
          <div class="pt-3 border-t border-b24-border">
            <p class="text-xs text-b24-text-tertiary italic">
              {{ $t('calculator.helpIntro') }}
            </p>
          </div>
        </div>
      </B24Card>
    </div>
  </B24App>
</template>

<script setup>
import {ref, computed, onMounted, onUnmounted} from 'vue'
import {useToast} from '@bitrix24/b24ui-nuxt/composables/useToast'
import {useI18n} from 'vue-i18n'
import {languages} from '@/locales'

const {t, locale} = useI18n()
const bitrixData = window.bitrixData || {}
const dialogId = ref(bitrixData.dialogId)
const toast = useToast()

// Реактивные данные
const currentExpression = ref('')
const result = ref('')
const history = ref([])
const previousExpression = ref('')
const engineeringOpen = ref(false)
const keyboardOpen = ref(false)
const historyOpen = ref(false)
const helpOpen = ref(false)
const angleMode = ref('deg')
const lastResult = ref(null)
const inputRef = ref(null)
const sendBtnActive = ref(true)
const fitWindow = ref(true)
const lastSavedExpression = ref(null)
const lastSavedResult = ref(null)
const pollingInterval = ref(null)


// Определяем направление текста
const direction = computed(() => {
  const currentLang = languages.find(l => l.code === locale.value)
  return currentLang?.dir || 'ltr'
})

// Константы
const MATH_CONSTANTS = {
  pi: '3.141592653589793',
  e: '2.718281828459045'
}

// Специальные математические функции
const MATH_FUNCTIONS = {
  sin: (x, deg) => deg ? Math.sin(x * Math.PI / 180) : Math.sin(x),
  cos: (x, deg) => deg ? Math.cos(x * Math.PI / 180) : Math.cos(x),
  tan: (x, deg) => deg ? Math.tan(x * Math.PI / 180) : Math.tan(x),
  asin: (x, deg) => deg ? Math.asin(x) * 180 / Math.PI : Math.asin(x),
  acos: (x, deg) => deg ? Math.acos(x) * 180 / Math.PI : Math.acos(x),
  atan: (x, deg) => deg ? Math.atan(x) * 180 / Math.PI : Math.atan(x),
  sqrt: (x) => Math.sqrt(x),
  ln: (x) => Math.log(x),
  log10: (x) => Math.log10(x),
  exp: (x) => Math.exp(x),
  abs: (x) => Math.abs(x),
  factorial: (x) => {
    if (x < 0 || x > 170) throw new Error('Факториал определен для 0 ≤ n ≤ 170')
    let result = 1
    for (let i = 2; i <= Math.floor(x); i++) {
      result *= i
    }
    return result
  }
}

// Вычисляемые свойства
const displayExpression = computed(() => {
  // Заменяем символы для отображения
  let expr = currentExpression.value
      .replace(/\*/g, t('calculator.multiply'))
      .replace(/\//g, t('calculator.divide'))
      .replace(/\-/g, t('calculator.subtract'))
      .replace(/pi/g, t('calculator.pi'))
      .replace(/e/g, t('calculator.e'))
      .replace(/sqrt/g, t('calculator.squareRoot'))

  return expr || ''
})

const formattedResult = computed(() => {
  if (!result.value || result.value === '...') {
    return result.value || '0'
  }

  if (result.value === t('calculator.error') || result.value === t('calculator.divisionByZero')) {
    return result.value
  }

  try {
    const num = parseFloat(result.value)
    if (isNaN(num)) return result.value

    // Проверка на бесконечность
    if (!isFinite(num)) {
      return num > 0 ? t('calculator.infinity') : t('calculator.negativeInfinity')
    }

    // Округляем очень маленькие числа
    if (Math.abs(num) < 1e-12) return '0'

    // Форматируем число
    if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
      return num.toExponential(6)
    }

    // Форматируем с разделителями тысяч
    const parts = num.toString().split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

    if (parts[1]) {
      // Обрезаем лишние нули в дробной части
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

// Утилиты для уведомлений
const notification = {
  success: (messageKey, params = {}) => {
    toast.add({
      description: t(`notifications.success.${messageKey}`, params),
      variant: 'success'
    })
  },
  error: (messageKey, params = {}) => {
    toast.add({
      description: t(`notifications.error.${messageKey}`, params),
      variant: 'error'
    })
  },
  warning: (messageKey, params = {}) => {
    toast.add({
      description: t(`notifications.warning.${messageKey}`, params),
      variant: 'warning'
    })
  },
  info: (messageKey, params = {}) => {
    toast.add({
      description: t(`notifications.info.${messageKey}`, params),
      variant: 'info'
    })
  }
}

// Утилиты для Bitrix24
const bitrixUtils = {
  fitWindow: () => {
    try {
      BX24.fitWindow()
    } catch (error) {
      console.error('Ошибка при вызове BX24.fitWindow:', error)
    }
  },

  sendMessage: async (message) => {
    try {
      const currentDialogId = dialogId.value || BX24?.user?.id

      if (!currentDialogId) {
        throw new Error('Не удалось определить чат для отправки')
      }

      const result = await BX24.callMethod('im.message.add', {
        DIALOG_ID: currentDialogId,
        MESSAGE: message,
        SYSTEM: 'N'
      })

      return true
    } catch (error) {
      throw error
    }
  },

  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      throw new Error('Не удалось скопировать текст')
    }
  }
}

// Основные операции калькулятора
const calculator = {
  evaluateExpression: () => {
    try {
      if (!currentExpression.value || currentExpression.value.trim() === '') {
        result.value = ''
        return
      }

      const expr = currentExpression.value

      // Если выражение заканчивается на оператор, не вычисляем
      if (/[\+\-\*\/\^%]$/.test(expr)) {
        result.value = '...'
        return
      }

      try {
        const parsedExpr = calculator.parseExpression(expr)

        // Используем безопасную eval замену
        const evaluated = calculator.safeEval(parsedExpr)

        // Проверка на деление на ноль
        if (!isFinite(evaluated)) {
          // Проверяем, было ли деление на ноль
          if (expr.includes('/0') || expr.includes('/ 0')) {
            result.value = t('calculator.divisionByZero')
          } else {
            result.value = evaluated > 0 ? t('calculator.infinity') : t('calculator.negativeInfinity')
          }
        } else if (isNaN(evaluated)) {
          result.value = '...'
        } else {
          // Округляем для устранения ошибок округления
          const rounded = Math.round(evaluated * 1e12) / 1e12
          result.value = rounded.toString()
        }
      } catch (error) {
        console.log('Выражение пока не может быть вычислено:', error.message)
        result.value = '...'
      }
    } catch (error) {
      console.error('Ошибка вычисления:', error)
      result.value = t('calculator.error')
    }
  },

  // Безопасный eval через Function
  safeEval: (expr) => {
    try {
      // Создаем безопасную функцию с ограниченным контекстом
      const fn = new Function('return ' + expr)
      return fn()
    } catch (error) {
      throw error
    }
  },

  // Парсер математических выражений
  parseExpression: (expr) => {
    try {
      let processedExpr = expr

      // 1. Заменяем символы для вычисления
      processedExpr = processedExpr
          .replace(new RegExp(t('calculator.divide'), 'g'), '/')
          .replace(new RegExp(t('calculator.multiply'), 'g'), '*')
          .replace(new RegExp(t('calculator.subtract'), 'g'), '-')
          .replace(/\^/g, '**')
          .replace(new RegExp(t('calculator.pi'), 'g'), 'Math.PI')
          .replace(/pi/g, 'Math.PI')
          .replace(new RegExp(t('calculator.e'), 'g'), 'Math.E')

      // 2. Обработка процентов
      const percentWithNumberRegex = /(\d+(?:\.\d+)?)%\s*(\d+(?:\.\d+)?)/g
      processedExpr = processedExpr.replace(percentWithNumberRegex, (match, percent, number) => {
        return `(${percent}/100*${number})`
      })

      const singlePercentRegex = /(\d+(?:\.\d+)?)%$/g
      if (singlePercentRegex.test(processedExpr)) {
        processedExpr = processedExpr.replace(singlePercentRegex, (match, number) => {
          return `(${number}/100)`
        })
      }

      const percentInExpressionRegex = /(\d+(?:\.\d+)?)%/g
      processedExpr = processedExpr.replace(percentInExpressionRegex, (match, number) => {
        return `(${number}/100)`
      })

      // 3. Обработка математических функций
      const functionRegex = /(sin|cos|tan|asin|acos|atan|sqrt|ln|log10|exp|abs|factorial)\(([^)]+)\)/g

      processedExpr = processedExpr.replace(functionRegex, (match, func, arg) => {
        try {
          const processedArg = calculator.parseExpression(arg)
          const isTrig = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'].includes(func)

          if (isTrig && angleMode.value === 'deg') {
            if (func.startsWith('a')) {
              return `Math.${func}(${processedArg}) * 180 / Math.PI`
            } else {
              return `Math.${func}(${processedArg} * Math.PI / 180)`
            }
          } else {
            return `Math.${func}(${processedArg})`
          }
        } catch (error) {
          console.error('Ошибка обработки функции:', func, arg, error)
          throw error
        }
      })

      return processedExpr
    } catch (error) {
      console.error('Ошибка парсинга выражения:', expr, error)
      throw error
    }
  },

  calculate: () => {
    try {
      calculator.evaluateExpression()

      if (result.value && result.value !== '...' &&
          result.value !== t('calculator.error') && result.value !== t('calculator.divisionByZero') &&
          currentExpression.value) {

        const displayExpr = displayExpression.value
        const resultValue = formattedResult.value

        if (resultValue && resultValue !== '...' && resultValue !== '') {
          const currentUniqueKey = `${displayExpr}|${resultValue}`
          if (lastSavedExpression.value !== currentUniqueKey) {
            historyManager.add(`${displayExpr} ${t('calculator.equals')} ${resultValue}`)

            lastSavedExpression.value = currentUniqueKey
            lastSavedResult.value = result.value

            previousExpression.value = `${displayExpr} ${t('calculator.equals')} ${resultValue}`
            lastResult.value = result.value
          }
        }
      }
    } catch (error) {
      result.value = t('calculator.error')
      notification.error('calculationError')
    }
  },

  clear: () => {
    currentExpression.value = ''
    result.value = ''
    previousExpression.value = ''
    lastResult.value = null
    lastSavedExpression.value = null
    lastSavedResult.value = null
    focusInput()
  },

  backspace: () => {
    if (currentExpression.value.length > 0) {
      currentExpression.value = currentExpression.value.slice(0, -1)
      calculator.evaluateExpression()
    }
    focusInput()
  },

  addPercentage: () => {
    currentExpression.value += '%'
    calculator.evaluateExpression()
    focusInput()
  }
}

// Управление состоянием приложения
const appState = {
  toggle: (property) => {
    property.value = !property.value
  },

  toggleKeyboard: () => appState.toggle(keyboardOpen),
  toggleEngineering: () => appState.toggle(engineeringOpen),
  toggleHistory: () => appState.toggle(historyOpen),
  toggleHelp: () => appState.toggle(helpOpen),

  toggleAngleMode: () => {
    angleMode.value = angleMode.value === 'deg' ? 'rad' : 'deg'
    const modeText = angleMode.value === 'deg' ? t('calculator.degrees') : t('calculator.radians')
    notification.success('angleModeChanged', {mode: modeText})

    if (currentExpression.value) {
      calculator.evaluateExpression()
    }
  },

  focusInput: () => {
    if (inputRef.value) {
      inputRef.value.focus()
      setTimeout(() => {
        if (inputRef.value) {
          inputRef.value.selectionStart = inputRef.value.selectionEnd = currentExpression.value.length
        }
      }, 10)
    }
  }
}

// Добавление символов в выражение
const expressionManager = {
  debounceTimer: null,

  addToExpression: (value) => {
    currentExpression.value += value
    calculator.evaluateExpression()
    focusInput()
  },

  addParenthesis: (parenthesis) => {
    const lastChar = currentExpression.value.slice(-1)

    if (parenthesis === '(' && /[\d\)]/.test(lastChar)) {
      currentExpression.value += '*('
    } else {
      currentExpression.value += parenthesis
    }

    calculator.evaluateExpression()
    focusInput()
  },

  wrapWithFunction: (funcName) => {
    const expr = currentExpression.value

    if (!expr) {
      currentExpression.value = funcName + '('
    } else {
      const lastNumberRegex = /(-?\d*\.?\d+|\))(?![\d\.\)])/
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

    calculator.evaluateExpression()
    focusInput()
  },

  addFunction: (funcName) => {
    currentExpression.value += funcName + '('
    calculator.evaluateExpression()
    focusInput()
  },

  addPower: (power) => {
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
    calculator.evaluateExpression()
    focusInput()
  },

  addConstant: (constant) => {
    const lastChar = currentExpression.value.slice(-1)
    const value = constant === 'pi' ? 'pi' : 'e'

    if (/[\d\)]/.test(lastChar)) {
      currentExpression.value += '*' + value
    } else {
      currentExpression.value += value
    }

    calculator.evaluateExpression()
    focusInput()
  },

  addReciprocal: () => {
    const expr = currentExpression.value
    if (expr) {
      currentExpression.value = '1/(' + expr + ')'
    } else {
      currentExpression.value = '1/'
    }
    calculator.evaluateExpression()
    focusInput()
  }
}

// Управление истории
const historyManager = {
  add: (expression) => {
    history.value.unshift({
      id: Date.now(),
      expression,
      timestamp: new Date().toLocaleTimeString(locale.value, {hour: '2-digit', minute: '2-digit'}),
      rawExpression: currentExpression.value
    })

    history.value = history.value.slice(0, 20)
    historyManager.save()
  },

  clear: () => {
    history.value = []
    historyManager.save()
    lastSavedExpression.value = null
    lastSavedResult.value = null
    notification.success('historyCleared')
  },

  restore: (item) => {
    if (item.rawExpression) {
      currentExpression.value = item.rawExpression
    } else {
      const parts = item.expression.split(` ${t('calculator.equals')} `)
      if (parts.length === 2) {
        const expr = parts[0]
        currentExpression.value = expr
            .replace(new RegExp(t('calculator.multiply'), 'g'), '*')
            .replace(new RegExp(t('calculator.divide'), 'g'), '/')
            .replace(new RegExp(t('calculator.subtract'), 'g'), '-')
            .replace(new RegExp(t('calculator.pi'), 'g'), 'pi')
            .replace(new RegExp(t('calculator.squareRoot'), 'g'), 'sqrt')
            .replace(/\^/g, '^')
      }
    }

    calculator.evaluateExpression()
    previousExpression.value = item.expression

    lastSavedExpression.value = null
    lastSavedResult.value = null

    focusInput()
    notification.success('expressionRestored')
  },

  save: () => {
    try {
      localStorage.setItem('calculator_history', JSON.stringify(history.value))
    } catch (error) {
      console.error('Ошибка сохранения истории:', error)
    }
  },

  load: () => {
    try {
      const saved = localStorage.getItem('calculator_history')
      if (saved) {
        history.value = JSON.parse(saved) || []
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error)
    }
  }
}

// Утилиты для взаимодействия
const interaction = {
  copyToClipboard: async () => {
    try {
      const textToCopy = formattedResult.value !== '...' && formattedResult.value !== ''
          ? formattedResult.value
          : '0'
      await bitrixUtils.copyToClipboard(textToCopy)
      notification.success('copySuccess')
    } catch (error) {
      console.error('Ошибка копирования:', error)
      notification.error('copyError')
    }
  },

  sendToChat: async () => {
    try {
      const expression = previousExpression.value ||
          (currentExpression.value && result.value !== '...' && result.value !== '' ?
              `${displayExpression.value} ${t('calculator.equals')} ${formattedResult.value}` :
              formattedResult.value || '0')

      const message = expression
      await bitrixUtils.sendMessage(message)
      notification.success('sendSuccess')
    } catch (error) {
      console.error('Ошибка отправки:', error)
      notification.error('sendError')
    }
  }
}

// Обработка клавиатуры
const keyboardHandler = {
  handleKeyDown: (e) => {
    const key = e.key

    if (key === 'Backspace' && e.target.tagName !== 'INPUT') {
      e.preventDefault()
      calculator.backspace()
      return
    }

    if (e.target.tagName === 'INPUT') {
      if (/^[0-9\.\+\-\*\/\^\(\)%,]$/.test(key)) {
        return
      }

      if (key === 'Enter' || key === '=' || key === 'Escape' || key === 'Delete') {
        e.preventDefault()
      }
    }

    if (key === 'Enter' || key === '=') {
      e.preventDefault()
      calculator.calculate()
    } else if (key === 'Escape' || key === 'Delete') {
      e.preventDefault()
      calculator.clear()
    } else if (key === '^') {
      e.preventDefault()
      expressionManager.addPower('y')
    } else if (key === '(') {
      e.preventDefault()
      expressionManager.addParenthesis('(')
    } else if (key === ')') {
      e.preventDefault()
      expressionManager.addParenthesis(')')
    } else if (key === 'p' && e.ctrlKey) {
      e.preventDefault()
      expressionManager.addConstant('pi')
    } else if (key === 'e' && e.ctrlKey) {
      e.preventDefault()
      expressionManager.addConstant('e')
    }
  },

  onExpressionChange: () => {
    clearTimeout(expressionManager.debounceTimer)
    expressionManager.debounceTimer = setTimeout(() => {
      calculator.evaluateExpression()
    }, 150)
  },

  onInputFocus: () => {
    // При фокусе на input ничего не делаем
  },

  onInputBlur: () => {
    // При потере фокуса ничего не делаем
  }
}

// Инициализация
const initialize = () => {
  historyManager.load()

  if (bitrixData && typeof bitrixData.sendBtnActive !== 'undefined') {
    sendBtnActive.value = Boolean(bitrixData.sendBtnActive)
  }

  if (bitrixData && typeof bitrixData.fitWindow !== 'undefined') {
    fitWindow.value = Boolean(bitrixData.fitWindow)
  }

  if (typeof BX24 !== 'undefined') {
    BX24.init(() => {
      console.log('Bitrix24 SDK инициализирован')
      if(fitWindow.value){
        bitrixUtils.fitWindow()
      }
      //startProfilePolling()
    })
  } else {
    console.warn('Битрикс24 SDK не найден')
  }

  document.addEventListener('keydown', keyboardHandler.handleKeyDown)
  setTimeout(() => focusInput(), 100)
}

const cleanup = () => {
  document.removeEventListener('keydown', keyboardHandler.handleKeyDown)
  if (expressionManager.debounceTimer) {
    clearTimeout(expressionManager.debounceTimer)
  }
  stopProfilePolling()
}

const startProfilePolling = () => {
  stopProfilePolling()
  fetchAndSendProfile()
  pollingInterval.value = setInterval(fetchAndSendProfile, 10000)
}

const stopProfilePolling = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

const fetchAndSendProfile = async () => {
  try {
    const result = await BX24.callMethod("profile", {})
  } catch (error) {
    console.error('Ошибка при получении/отправке профиля:', error)
  }
}


// Экспорт методов для использования в шаблоне
const toggleEngineering = appState.toggleEngineering
const toggleKeyboard = appState.toggleKeyboard
const toggleHistory = appState.toggleHistory
const toggleHelp = appState.toggleHelp
const toggleAngleMode = appState.toggleAngleMode
const focusInput = appState.focusInput

const addToExpression = expressionManager.addToExpression
const addParenthesis = expressionManager.addParenthesis
const addFunction = expressionManager.addFunction
const wrapWithFunction = expressionManager.wrapWithFunction
const addPower = expressionManager.addPower
const addConstant = expressionManager.addConstant
const addReciprocal = expressionManager.addReciprocal
const addPercentage = calculator.addPercentage
const calculate = calculator.calculate
const clear = calculator.clear
const backspace = calculator.backspace

// История
const clearHistory = historyManager.clear
const restoreFromHistory = historyManager.restore

// Взаимодействие
const copyToClipboard = interaction.copyToClipboard
const sendToChat = interaction.sendToChat

// Обработчики input
const handleKeyDown = keyboardHandler.handleKeyDown
const onExpressionChange = keyboardHandler.onExpressionChange
const onInputFocus = keyboardHandler.onInputFocus
const onInputBlur = keyboardHandler.onInputBlur

// Хуки жизненного цикла
onMounted(() => {
  initialize()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.calculator-display {
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  word-break: break-all;
  overflow-wrap: break-word;
  min-height: 1.5em;
  user-select: text;
}

/* Стили для input */
.calculator-input {
  font-feature-settings: "tnum";
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

.operation-active {
  background-color: rgba(47, 198, 246, 0.15) !important;
  border-color: var(--b24-primary-color) !important;
  color: var(--b24-primary-color) !important;
}

.history-item {
  transition: background-color 0.2s ease;
}

/* Стили для кнопок */
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

/* Стили для инженерных кнопок */
.calc-btn-engineering {
  background-color: var(--b24-surface-color);
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  min-height: 36px;
}

.calc-btn-engineering:hover {
  background-color: rgba(47, 198, 246, 0.1) !important;
}

/* Анимация для аккордеона */
.rotate-180 {
  transform: rotate(180deg);
}

/* Компактные отступы для карточек */
:deep(.b24-card-body) {
  padding: 0 !important;
}

/* Стили для аккордеона инженерных функций */
.engineering-section {
  border-bottom: 1px solid var(--b24-border-color);
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
}

.engineering-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.engineering-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--b24-text-secondary);
  margin-bottom: 0.5rem;
  padding-left: 0.25rem;
}

/* Подсветка фокуса */
.calculator-input:focus {
  outline: 2px solid var(--b24-primary-color);
  outline-offset: -2px;
  border-radius: 4px;
}

/* Стили для клавиш в справке */
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

.keyboard-key.number-key {
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  font-size: 11px;
}

/* Стили для справки */
.help-section {
  margin-bottom: 1rem;
}

.help-section:last-child {
  margin-bottom: 0;
}

.help-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--b24-text-secondary);
  margin-bottom: 0.5rem;
  padding-left: 0.25rem;
}

.help-key-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* RTL поддержка */
[dir="rtl"] .calculator-input {
  text-align: left;
}

[dir="rtl"] .calculator-display {
  text-align: left;
}

[dir="rtl"] .text-right {
  text-align: left;
}

[dir="rtl"] .flex-row-reverse {
  flex-direction: row-reverse;
}

[dir="rtl"] .ml-2 {
  margin-left: 0;
  margin-right: 0.5rem;
}

[dir="rtl"] .ml-auto {
  margin-left: 0;
  margin-right: auto;
}

[dir="rtl"] .space-x-2 > :not([hidden]) ~ :not([hidden]) {
  margin-left: 0;
  margin-right: 0.5rem;
}

[dir="rtl"] .space-x-1 > :not([hidden]) ~ :not([hidden]) {
  margin-left: 0;
  margin-right: 0.25rem;
}
</style>