<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'

const tgLink = computed(() => {
  return (
    typeof window !== 'undefined' && window.navigator?.language.includes('ru')
  )
    ? 'https://t.me/bitrix24apps'
    : 'https://t.me/b24_dev'
})

onMounted(() => {
  const script = document.createElement('script')
  script.src = '//api.bitrix24.com/api/v1/'
  script.async = true
  document.head.appendChild(script)
})
</script>

<template>
  <Suspense>
    <B24App>
      <!--<B24Header>
        <template #left>
          <RouterLink to="/">
            <AppLogo class="w-auto h-[40px] shrink-0" />
          </RouterLink>

          <TemplateMenu />
        </template>

        <template #right>
          <B24ColorModeButton :content="{ align: 'end', side: 'bottom' }" />

          <B24Button
            :to="tgLink"
            target="_blank"
            aria-label="Telegram"
            color="air-tertiary-no-accent"
            :icon="TelegramIcon"
            size="sm"
          />
          <B24Button
            to="https://github.com/bitrix24/starter-b24ui-vue"
            target="_blank"
            aria-label="GitHub"
            color="air-tertiary-no-accent"
            :icon="GitHubIcon"
            size="sm"
          />
        </template>
      </B24Header>-->

      <B24Main>
        <div class="flex gap-6">
          <!-- Сайдбар -->
          <div class="w-80 flex-shrink-0">
            <Sidebar />
          </div>

          <!-- Основной контент -->
          <div class="flex-1 min-w-0">
            <RouterView />
          </div>
        </div>
      </B24Main>

      <!--<B24Separator :icon="Bitrix24Icon" />

      <B24Footer>
        <template #left>
          <ProseP
            small
            accent="less"
            class="mb-0"
          >
            Built with Bitrix24 UI • &copy; {{ new Date().getFullYear() }}
          </ProseP>
        </template>
      </B24Footer>-->
    </B24App>
  </Suspense>
</template>
