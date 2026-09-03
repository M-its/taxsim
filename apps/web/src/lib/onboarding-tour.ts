export const ONBOARDING_TOUR_VERSION = '1'

export type TourLaunchMode = 'automatic' | 'manual'
export type TourStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function storageKey(userId: string, suffix: 'completed' | 'active-step'): string {
  return `taxsim:onboarding:${encodeURIComponent(userId)}:${suffix}:v${ONBOARDING_TOUR_VERSION}`
}

export function shouldStartTour(
  storage: TourStorage,
  userId: string,
  mode: TourLaunchMode,
): boolean {
  if (mode === 'manual') return true
  return storage.getItem(storageKey(userId, 'completed')) !== 'true'
}

export function markTourCompleted(storage: TourStorage, userId: string): void {
  storage.setItem(storageKey(userId, 'completed'), 'true')
  storage.removeItem(storageKey(userId, 'active-step'))
}

export function saveTourStep(storage: TourStorage, userId: string, stepIndex: number): void {
  storage.setItem(storageKey(userId, 'active-step'), String(stepIndex))
}

export function readTourStep(
  storage: TourStorage,
  userId: string,
  totalSteps: number,
): number | null {
  const rawStep = storage.getItem(storageKey(userId, 'active-step'))
  if (rawStep === null) return null

  const step = Number(rawStep)
  if (!Number.isInteger(step) || step < 0 || step >= totalSteps) {
    storage.removeItem(storageKey(userId, 'active-step'))
    return null
  }

  return step
}
