import { deleteCookie, getQuery, sendRedirect } from 'h3'
import { useRuntimeConfig } from '#imports'

function normalizeRedirectTarget(value: unknown): string {
  if (typeof value !== 'string') {
    return '/'
  }

  const trimmed = value.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '/'
  }

  return trimmed
}

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)
  const next = normalizeRedirectTarget(query.next)

  deleteCookie(event, config.sessionCookieName, { path: '/' })

  return sendRedirect(event, next)
})
