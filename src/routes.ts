// src/routes.ts
import type { RouteRecordRaw } from 'vue-router'

// Функция проверки необходимости перенаправления
function shouldRedirectToDynamicPage(query: Record<string, unknown>): boolean {
  const parameters = query.parameters as string
  const mode = query.mode as string

  return (
    mode === 'workdaystart' ||
    mode === 'workdayend' ||
    (parameters && typeof parameters === 'string' && (
      parameters.includes('workdaystart') ||
      parameters.includes('workdayend')
    ))
  )
}

// Кастомные маршруты с редиректами
export const customRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'install',
    // Добавляем beforeEnter для перенаправления
    beforeEnter: (to, from, next) => {
      if (shouldRedirectToDynamicPage(to.query)) {
        next({
          path: '/widgets/dynamic-page',
          query: to.query
        })
      } else {
        next()
      }
    },
    // lazy load компонента
    component: () => import('./pages/index.vue')
  }
]