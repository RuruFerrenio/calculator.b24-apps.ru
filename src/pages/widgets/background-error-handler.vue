<script setup lang="ts">
import { onMounted } from 'vue'

// URL обработчика фоновой встройки
const HANDLERS = {
  pageBackgroundWorker: `${window.location.origin}/dist/widgets/background-handler`
}

// Конфигурация встройки
const PLACEMENT_CONFIG = {
  PAGE_BACKGROUND_WORKER: {
    title: 'Фоновый счетчик',
    description: 'Подсчитывает время, проведенное пользователем на странице',
    options: {
      errorHandlerUrl: `${window.location.origin}/dist/widgets/background-error-handler`
    }
  }
}

// Функции для работы с Bitrix24 API
const bitrixAPI = {
  call: (method, params) => {
    return new Promise((resolve, reject) => {
      if (typeof BX24 === 'undefined' || typeof BX24.callMethod === 'undefined') {
        reject(new Error('Библиотека Bitrix24 не доступна'))
        return
      }

      BX24.callMethod(method, params, (result) => {
        if (result.error()) {
          reject(new Error(result.error().getError()))
        } else {
          resolve(result.data())
        }
      })
    })
  },

  installFinish: () => {
    return new Promise((resolve, reject) => {
      if (typeof BX24 === 'undefined') {
        reject(new Error('Библиотека Bitrix24 не доступна'))
        return
      }

      BX24.installFinish()
      resolve()
    })
  },

  getPlacements: () => {
    return new Promise((resolve, reject) => {
      BX24.callMethod('placement.list', {}, (result) => {
        if (result.error()) {
          reject(new Error(result.error().getError()))
        } else {
          resolve(result.data())
        }
      })
    })
  }
}

// Менеджер встроек
const placementManager = {
  getConfig: (placementType) => {
    const config = PLACEMENT_CONFIG[placementType]
    if (!config) {
      throw new Error(`Неизвестный тип встройки: ${placementType}`)
    }
    return config
  },

  unbind: async (placementType, handler) => {
    try {
      await bitrixAPI.call('placement.unbind', {
        PLACEMENT: placementType,
        HANDLER: handler
      })
      return true
    } catch (error) {
      return null
    }
  },

  bind: async (placementType, handler) => {
    try {
      const config = placementManager.getConfig(placementType)

      const placementConfig = {
        PLACEMENT: placementType,
        HANDLER: handler,
        OPTIONS: config.options,
        LANG_ALL: {
          ru: {
            TITLE: config.title,
            DESCRIPTION: config.description,
            GROUP_NAME: 'Инструменты контроля времени'
          },
          en: {
            TITLE: config.title,
            DESCRIPTION: config.description,
            GROUP_NAME: 'Time control tools'
          },
          be: {
            TITLE: config.title,
            DESCRIPTION: config.description,
            GROUP_NAME: 'Інструменты кантролю часу'
          },
          kk: {
            TITLE: config.title,
            DESCRIPTION: config.description,
            GROUP_NAME: 'Уақытты бақылау құралдары'
          }
        }
      }

      await bitrixAPI.call('placement.bind', placementConfig)
      return true
    } catch (error) {
      throw error
    }
  },

  reinstall: async (placementType, handler) => {
    try {
      const placements = await bitrixAPI.getPlacements()

      const existingPlacement = placements.find(p =>
          p.PLACEMENT === placementType && p.HANDLER === handler
      )

      if (existingPlacement) {
        await placementManager.unbind(placementType, handler)
      }

      await placementManager.bind(placementType, handler)

      return true
    } catch (error) {
      throw error
    }
  }
}

// Регистрация фоновой встройки
const registerPageBackgroundWorker = async () => {
  try {
    await placementManager.reinstall('PAGE_BACKGROUND_WORKER', HANDLERS.pageBackgroundWorker)
    return true
  } catch (error) {
    throw error
  }
}

// Основная функция
const run = async () => {
  try {
    await registerPageBackgroundWorker()
    await bitrixAPI.installFinish()
  } catch (error) {
    // Обработка ошибки
  }
}

onMounted(() => {
  run()
})
</script>

<template>
  <div style="display: none;"></div>
</template>