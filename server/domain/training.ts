import { COUNTER_TARGET } from '../../shared/constants'
import type { ActivityListItem, CounterSummary } from '../../shared/types'

export function deriveTrainingFlags(sport: ActivityListItem['sport'], classification: ActivityListItem['classification']) {
  const affectsRunningCounter = sport === 'running'
  const affectsCyclingCounter = sport === 'cycling'
  const isEasySession = classification === 'zone2' && (affectsRunningCounter || affectsCyclingCounter)
  const isHardSession = classification === 'interval' && (affectsRunningCounter || affectsCyclingCounter)

  return {
    isEasySession,
    isHardSession,
    affectsRunningCounter,
    affectsCyclingCounter
  }
}

export function buildCounterSummary(sport: CounterSummary['sport'], activities: ActivityListItem[]): CounterSummary {
  let easyStreak = 0
  let lastResetAt: string | null = null

  const ordered = [...activities]
    .filter((activity) => activity.sport === sport)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  for (const activity of ordered) {
    if (activity.classification === 'interval') {
      lastResetAt = activity.startDate
      break
    }

    if (activity.classification === 'zone2') {
      easyStreak += 1
    }
  }

  const remainingUntilInterval = Math.max(COUNTER_TARGET - easyStreak, 0)

  return {
    sport,
    easyStreak,
    remainingUntilInterval,
    intervalDue: easyStreak >= COUNTER_TARGET,
    lastResetAt
  }
}
