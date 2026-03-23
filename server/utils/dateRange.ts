import type { DateRange } from '../../shared/constants'

export function resolveRangeStart(range: DateRange): string | undefined {
  if (range === 'all') {
    return undefined
  }

  const now = new Date()
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  now.setDate(now.getDate() - days)
  return now.toISOString()
}
