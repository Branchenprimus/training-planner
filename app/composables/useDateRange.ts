import { DATE_RANGES, type DateRange } from '~/shared/constants'

export function useDateRange(defaultRange: DateRange = '30d') {
  const selectedRange = ref<DateRange>(defaultRange)

  return {
    selectedRange,
    ranges: DATE_RANGES
  }
}
