<script setup lang="ts">
// Импорт иконок
import SettingsIcon from '@bitrix24/b24icons-vue/outline/SettingsIcon'
import TableEditorIcon from '@bitrix24/b24icons-vue/editor/TableEditorIcon'

// Иконки для методов
import PlayLIcon from '@bitrix24/b24icons-vue/outline/PlayLIcon'
import WindowScreenIcon from '@bitrix24/b24icons-vue/social/WindowScreenIcon'
import NotificationIcon from '@bitrix24/b24icons-vue/outline/NotificationIcon'
import ChatsWithCheckIcon from '@bitrix24/b24icons-vue/outline/ChatsWithCheckIcon'

import { ref, onMounted } from 'vue'

// Реактивные переменные
const bitrixDomain = ref('')

// Данные о методах
const methods = [
  {
    name: 'Автоматический',
    icon: PlayLIcon,
    iconClass: 'text-green-500',
    shortDescription: 'Действие выполняется автоматически без участия сотрудника при первом открытии страницы портала битрикс24',
    pros: [
      'Полная автоматизация процесса',
      'Не прерывает рабочий процесс'
    ],
    cons: [
      'Сотрудник не контролирует процесс начала/завершения рабочего дня',
    ]
  },
  {
    name: 'Модальное окно',
    icon: WindowScreenIcon,
    iconClass: 'text-blue-500',
    shortDescription: 'Всплывающее окно с кнопкой действия, пока не будет выполнено',
    pros: [
      'Сотрудник точно не забудет запустить рабочий день',
      'Контроль за началом/завершением остается за сотрудником',
      'Стильно',
      'Рекомендуем, это самый лучший и удобный из представленных вариантов'
    ],
    cons: [
      'Если сотрудник приступил к работе раньше или заканчивает рабочий день позже указанного времени в графике, модальное окно может появиться посреди рабочего процесса',
    ]
  },
  {
    name: 'Сообщение в чате',
    icon: ChatsWithCheckIcon,
    iconClass: 'text-purple-500',
    shortDescription: 'Уведомление отправляется в личный чат сотруднику в Битрикс24',
    pros: [
      'Менее удобно, чем модальное окно, но если модальное окно не подошло - это неплохая альтернатива',
      'Не прерывает рабочий процесс'
    ],
    cons: [
      'Может затеряться среди других сообщений',
      'Требует внимания сотрудника'
    ]
  },
  {
    name: 'Push-уведомление',
    icon: NotificationIcon,
    iconClass: 'text-orange-500',
    shortDescription: 'Уведомление push-формата в правом верхнем углу',
    pros: [
      'Менее удобно, чем модальное окно, но если модальное окно не подошло - это неплохая альтернатива',
      'Заметное звуковое сопровождение',
      'Не прерывает рабочий процесс'
    ],
    cons: [
      'Может затеряться среди других сообщений',
      'Требует внимания сотрудника'
    ]
  }
]

// Функция для получения домена через BX24.getDomain()
function getBitrixDomain(): string | null {
  if (typeof BX24 !== 'undefined' && BX24.getDomain) {
    try {
      const domain = BX24.getDomain()
      if (domain && typeof domain === 'string') {
        return domain
      }
    } catch (error) {
    }
  }
  return null
}

// Получение реального домена через инициализацию BX24
onMounted(() => {
  if (typeof BX24 !== 'undefined' && BX24.init) {
    // Ждем инициализации BX24 перед получением домена
    BX24.init(() => {
      const domain = getBitrixDomain()
      if (domain) {
        bitrixDomain.value = domain
      } else {
        console.error('Не удалось получить домен через BX24.getDomain()')
        // Fallback - пробуем получить из window.location
        if (typeof window !== 'undefined' && window.location) {
          const fallbackDomain = window.location.hostname
          bitrixDomain.value = fallbackDomain
        }
      }
    })
  } else {
    // Fallback для случая, когда BX24 нет
    if (typeof window !== 'undefined' && window.location) {
      const fallbackDomain = window.location.hostname
      bitrixDomain.value = fallbackDomain
    }
  }
})
</script>

<template>
  <div class="mx-auto mb-8">
    <!-- Часть 1: Настройка на стороне Битрикс24 -->
    <B24Card class="mb-8">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <SettingsIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Настройка на стороне Битрикс24
          </h2>
        </div>

        <div class="space-y-4 text-gray-700 dark:text-gray-300">
          <div class="flex items-start gap-3">
            <p>
              В разделе
              <span class="font-semibold">Рабочие графики</span>
              должен быть обязательно заведён <span class="font-semibold">хотя бы один график работы, которому относится пользователь, запустивший приложение.</span>
            </p>
          </div>

          <div class="flex items-start gap-3">
            <p>Настройки для приложения берутся для конкретного сотрудника из графика, за которым он закреплён.</p>
          </div>

          <div class="flex items-start gap-3">
            <p>Настройки находятся в подразделе <span class="font-semibold">«Начало и завершение дня»</span> внутри графика работы.</p>
          </div>
        </div>

        <!-- Кнопка перехода к рабочим графикам -->
        <div class="mt-6 pt-4">
          <B24Button
              :href="`https://${bitrixDomain}/timeman/schedules/`"
              target="_blank"
              color="air-primary"
              :disabled="!bitrixDomain"
          >
            <template #left-icon>
              <SettingsIcon class="w-4 h-4" />
            </template>
            Перейти к рабочим графикам
          </B24Button>
        </div>
      </div>
    </B24Card>

    <!-- Часть 2: Сравнительная таблица методов -->
    <div class="mb-8">
      <B24Card>
        <div class="flex items-center gap-3 mb-4 p-6">
          <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <TableEditorIcon class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Сравнение методов начала и завершения рабочего дня
          </h2>
        </div>

        <B24TableWrapper
            class="overflow-x-auto w-full p-6"
            size="md"
            row-hover
            rounded
            :b24ui="{
            base: '[&>table>thead>tr]:border-gray-200 dark:[&>table>thead>tr]:border-gray-700 [&>table>tbody>tr]:border-gray-100 dark:[&>table>tbody>tr]:border-gray-800'
          }"
        >
          <table class="min-w-full">
            <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="text-left font-medium text-gray-900 dark:text-gray-100 w-1/4">Метод</th>
              <th class="text-left font-medium text-gray-900 dark:text-gray-100 w-1/3">Описание</th>
              <th class="text-left font-medium text-gray-900 dark:text-gray-100 w-1/4">Плюсы</th>
              <th class="text-left font-medium text-gray-900 dark:text-gray-100 w-1/4">Минусы</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="method in methods"
                :key="method.name"
            >
              <td class="font-medium text-gray-900 dark:text-gray-100">
                <div class="flex items-center gap-2">
                  <component :is="method.icon" class="w-4 h-4" :class="method.iconClass" />
                  {{ method.name }}
                </div>
              </td>
              <td class="text-gray-600 dark:text-gray-400">{{ method.shortDescription }}</td>
              <td class="text-gray-600 dark:text-gray-400">
                <ul class="list-disc list-inside space-y-0 text-sm">
                  <li v-for="pro in method.pros" :key="pro">{{ pro }}</li>
                </ul>
              </td>
              <td class="text-gray-600 dark:text-gray-400">
                <ul class="list-disc list-inside space-y-0 text-sm">
                  <li v-for="con in method.cons" :key="con">{{ con }}</li>
                </ul>
              </td>
            </tr>
            </tbody>
          </table>
        </B24TableWrapper>
      </B24Card>
    </div>
  </div>
</template>