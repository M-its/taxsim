import type { NcmDiagnosis, NcmEligibilityStatus } from './api'

export type NcmIssueReason =
  'INVALID_FORMAT' | 'NCM_NOT_FOUND' | 'NCM_NOT_CURRENT' | 'NO_ACTIVE_RULE'

export interface NcmServerIssue {
  itemIndex: number
  ncmCode: string
  reason: NcmIssueReason
  details: string
}

export function isBlockingNcmStatus(status: NcmEligibilityStatus): boolean {
  return status !== 'ELIGIBLE' && status !== 'UNVERIFIED'
}

export function getNcmStatusMessage(status: NcmEligibilityStatus): string {
  switch (status) {
    case 'ELIGIBLE':
      return 'NCM elegível para este regime.'
    case 'INVALID_FORMAT':
      return 'NCM deve conter exatamente 8 dígitos.'
    case 'NOT_FOUND':
      return 'NCM não encontrado no catálogo.'
    case 'NOT_CURRENT':
      return 'NCM existe no catálogo, mas não está vigente.'
    case 'NO_ACTIVE_RULE':
      return 'NCM vigente, mas não simulável neste regime por falta de regra fiscal.'
    case 'CONFIGURATION_UNAVAILABLE':
      return 'A configuração fiscal deste NCM está temporariamente indisponível.'
    case 'UNVERIFIED':
      return 'Não foi possível verificar o status agora. A validação será repetida ao simular.'
  }
}

export function serverReasonToStatus(reason: NcmIssueReason): NcmEligibilityStatus {
  switch (reason) {
    case 'INVALID_FORMAT':
      return 'INVALID_FORMAT'
    case 'NCM_NOT_FOUND':
      return 'NOT_FOUND'
    case 'NCM_NOT_CURRENT':
      return 'NOT_CURRENT'
    case 'NO_ACTIVE_RULE':
      return 'NO_ACTIVE_RULE'
  }
}

export function extractNcmServerIssues(details: unknown): NcmServerIssue[] {
  if (!details || typeof details !== 'object' || !('issues' in details)) return []
  const issues = (details as { issues?: unknown }).issues
  if (!Array.isArray(issues)) return []

  return issues.filter((issue): issue is NcmServerIssue => {
    if (!issue || typeof issue !== 'object') return false
    const candidate = issue as Partial<NcmServerIssue>
    return (
      Number.isInteger(candidate.itemIndex) &&
      typeof candidate.ncmCode === 'string' &&
      typeof candidate.details === 'string' &&
      ['INVALID_FORMAT', 'NCM_NOT_FOUND', 'NCM_NOT_CURRENT', 'NO_ACTIVE_RULE'].includes(
        candidate.reason ?? '',
      )
    )
  })
}

export function unavailableDiagnosis(code: string): NcmDiagnosis {
  return { code, description: null, status: 'UNVERIFIED' }
}
