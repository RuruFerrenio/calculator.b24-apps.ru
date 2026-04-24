<script setup lang="ts">
import { ref } from 'vue'

// Импорт иконок
import SettingsIcon from '@bitrix24/b24icons-vue/outline/SettingsIcon'
import AlertIcon from '@bitrix24/b24icons-vue/outline/AlertIcon'
import CircleCheckIcon from '@bitrix24/b24icons-vue/outline/CircleCheckIcon'
import TableEditorIcon from '@bitrix24/b24icons-vue/editor/TableEditorIcon'
import InfoCircleIcon from '@bitrix24/b24icons-vue/outline/InfoCircleIcon'
import CursorClickIcon from '@bitrix24/b24icons-vue/outline/CursorClickIcon'
import RocketIcon from '@bitrix24/b24icons-vue/outline/RocketIcon'
import ChatsWithCheckIcon from '@bitrix24/b24icons-vue/outline/ChatsWithCheckIcon'
import MobileSelectedIcon from '@bitrix24/b24icons-vue/outline/MobileSelectedIcon'

// Иконки для методов
import PlayLIcon from '@bitrix24/b24icons-vue/outline/PlayLIcon'
import WindowScreenIcon from '@bitrix24/b24icons-vue/social/WindowScreenIcon'
import NotificationIcon from '@bitrix24/b24icons-vue/outline/NotificationIcon'

const windowLocationOrigin = typeof window !== 'undefined' ? window.location.origin : ''

const selectedMethod = ref<string | null>(null)

// Данные о методах
const methods = [
  {
    name: 'Автоматический',
    icon: PlayLIcon,
    iconClass: 'text-green-500',
    shortDescription: 'Действие выполняется автоматически без участия сотрудника',
    pros: [
      'Не отвлекает сотрудников',
      'Полная автоматизация процесса',
      'Идеально для формального учёта времени'
    ],
    cons: [
      'Сотрудник не контролирует процесс',
      'Возможны ошибки при синхронизации'
    ]
  },
  {
    name: 'Модальное окно',
    icon: WindowScreenIcon,
    iconClass: 'text-blue-500',
    shortDescription: 'Всплывающее окно с кнопкой действия, пока не будет выполнено',
    pros: [
      'Действие нельзя пропустить',
      'Максимальная вовлечённость сотрудника',
      'Подходит для обязательного учёта времени'
    ],
    cons: [
      'Может раздражать сотрудников',
      'Требует ручного подтверждения'
    ]
  },
  {
    name: 'Сообщение в чате',
    icon: ChatsWithCheckIcon,
    iconClass: 'text-purple-500',
    shortDescription: 'Уведомление отправляется в чат Битрикс24',
    pros: [
      'Удобно для команд, работающих в чатах',
      'Действие можно выполнить прямо из чата',
      'Остаётся история уведомлений'
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
    shortDescription: 'Мгновенное уведомление в мобильном приложении',
    pros: [
      'Мгновенное оповещение',
      'Подходит для мобильных сотрудников',
      'Высокий охват'
    ],
    cons: [
      'Требует установленного мобильного приложения',
      'Может быть заблокировано настройками телефона'
    ]
  }
]

// Детальные описания методов
function getMethodDetails(methodName: string) {
  const details: Record<string, any> = {
    'Автоматический': {
      title: 'Автоматический метод',
      fullDescription: 'Система самостоятельно выполняет действие (начало или завершение рабочего дня) без какого-либо участия сотрудника. Не требует подтверждения или реакции от пользователя. Рабочий день начинается или завершается в заданное время автоматически.',
      pros: [
        'Не требует действий от сотрудника',
        'Идеально для дисциплинированных команд',
        'Нет риска забыть отметить начало/конец дня'
      ],
      cons: [
        'Сотрудник может не заметить, что день начался/закончился',
        'Не подходит для строгого контроля'
      ]
    },
    'Модальное окно': {
      title: 'Модальное окно с предупреждением',
      fullDescription: 'При каждом открытии страницы портала показывается всплывающее окно с предложением выполнить действие. Окно будет появляться снова и снова, пока сотрудник его не выполнит. Самый надёжный способ уведомления.',
      pros: [
        'Действие невозможно пропустить',
        'Высокая надёжность',
        'Сотрудник точно выполнит действие'
      ],
      cons: [
        'Может раздражать при частом появлении',
        'Требует ручного подтверждения'
      ]
    },
    'Сообщение в чате': {
      title: 'Сообщение в чате',
      fullDescription: 'В чат Битрикс24 (личный или общий) отправляется уведомление с предложением выполнить действие. Сотрудник может нажать на кнопку в сообщении, чтобы выполнить действие. Уведомление остается в истории чата.',
      pros: [
        'Удобно для команд, работающих в чатах',
        'Действие выполняется прямо из чата',
        'Остаётся история уведомлений'
      ],
      cons: [
        'Сообщение может затеряться',
        'Требует внимания сотрудника'
      ]
    },
    'Push-уведомление': {
      title: 'Push-уведомление',
      fullDescription: 'Сотруднику отправляется push-уведомление в мобильное приложение Битрикс24. Нажатие на уведомление открывает портал с предложением выполнить действие. Мгновенный способ доставки.',
      pros: [
        'Мгновенная доставка',
        'Подходит для мобильных сотрудников',
        'Не требует открытого браузера'
      ],
      cons: [
        'Требуется установленное мобильное приложение',
        'Может быть отключено в настройках телефона',
        'Ограничения на некоторых устройствах'
      ]
    }
  }
  return details[methodName] || details['Автоматический']
}
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
          <div class="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4">
            <div class="flex items-start gap-2">
              <AlertIcon class="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div class="text-sm">
                <p class="font-medium text-yellow-800 dark:text-yellow-400 mb-2">
                  Важное предварительное условие
                </p>
                <p>
                  В разделе
                  <span class="font-semibold bg-yellow-100 dark:bg-yellow-900/50 px-1.5 py-0.5 rounded">Рабочие графики</span>
                  должен быть обязательно заведён <span class="font-semibold">хотя бы один график работы</span>.
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <CircleCheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p>Настройки для приложения берутся для конкретного сотрудника из графика, за которым он закреплён.</p>
          </div>

          <div class="flex items-start gap-3">
            <CircleCheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p>Настройки находятся в подразделе <span class="font-semibold">«Начало и завершение дня»</span> внутри графика работы.</p>
          </div>
        </div>

        <!-- Кнопка перехода к рабочим графикам -->
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <B24Button
              :href="`${windowLocationOrigin}/timeman/schedules/`"
              target="_blank"
              variant="primary"
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
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <TableEditorIcon class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Сравнение методов начала и завершения рабочего дня
          </h2>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Доступно 4 способа уведомления сотрудников. Нажмите на строку с методом для просмотра детального описания.
        </p>

        <B24TableWrapper
            class="overflow-x-auto w-full"
            size="md"
            zebra
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
                @click="selectedMethod = selectedMethod === method.name ? null : method.name"
                class="cursor-pointer transition-all duration-200"
                :class="{ 'bg-blue-50 dark:bg-blue-950/30': selectedMethod === method.name }"
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
                  <li v-for="pro in method.pros.slice(0, 2)" :key="pro">{{ pro }}</li>
                </ul>
              </td>
              <td class="text-gray-600 dark:text-gray-400">
                <ul class="list-disc list-inside space-y-0 text-sm">
                  <li v-for="con in method.cons.slice(0, 2)" :key="con">{{ con }}</li>
                </ul>
              </td>
            </tr>
            </tbody>
          </table>
        </B24TableWrapper>

        <!-- Детальное описание выбранного метода -->
        <div v-if="selectedMethod" class="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div class="flex items-start gap-3">
            <InfoCircleIcon class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 class="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                {{ getMethodDetails(selectedMethod).title }}
              </h4>
              <p class="text-sm text-blue-700 dark:text-blue-300 mb-3">
                {{ getMethodDetails(selectedMethod).fullDescription }}
              </p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <p class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">✅ Плюсы:</p>
                  <ul class="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li v-for="pro in getMethodDetails(selectedMethod).pros" :key="pro">{{ pro }}</li>
                  </ul>
                </div>
                <div>
                  <p class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">⚠️ Минусы:</p>
                  <ul class="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li v-for="con in getMethodDetails(selectedMethod).cons" :key="con">{{ con }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          <CursorClickIcon class="inline-block w-4 h-4 mr-1" />
          Нажмите на строку с методом, чтобы увидеть подробное описание
        </div>
      </B24Card>
    </div>

    <!-- Дополнительная информация о типах методов -->
    <B24Card>
      <div class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <RocketIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Как выбрать подходящий метод?
          </h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <CircleCheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Для дисциплинированных сотрудников</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Подойдёт автоматический метод — сотрудники не будут отвлекаться на уведомления.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <AlertCircleIcon class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Для команд, нуждающихся в контроле</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Модальное окно — самый надёжный способ, так как его нельзя проигнорировать.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <ChatsWithCheckIcon class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Для удалённых команд</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Уведомление в чате — сотрудники активны в чатах и увидят уведомление.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <MobileSelectedIcon class="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">Для мобильных сотрудников</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Push-уведомление — сотрудники получат оповещение даже в мобильном приложении.</p>
            </div>
          </div>
        </div>
      </div>
    </B24Card>
  </div>
</template>