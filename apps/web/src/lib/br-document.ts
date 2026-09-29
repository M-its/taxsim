export type DocumentValidationFailure = 'FORMAT' | 'CHECK_DIGITS'
export type BrazilianDocumentKind = 'CPF' | 'CNPJ'

export type DocumentValidationResult =
  | { valid: true; normalized: string }
  | { valid: false; normalized: string; reason: DocumentValidationFailure }

const DOCUMENT_FORMATTING = /[.\-/\s]/g
const CNPJ_FORMAT = /^[A-Z0-9]{12}\d{2}$/
const CPF_FORMAT = /^\d{11}$/

export function normalizeCnpj(value: string): string {
  return value.replace(DOCUMENT_FORMATTING, '').toUpperCase()
}

export function normalizeCpf(value: string): string {
  return value.replace(DOCUMENT_FORMATTING, '')
}

export function identifyDocumentKind(value: string): BrazilianDocumentKind {
  const normalized = value.replace(DOCUMENT_FORMATTING, '')
  return /[A-Za-z]/.test(normalized) || normalized.length > 11 ? 'CNPJ' : 'CPF'
}

export function sanitizeCnpjInput(value: string): string {
  const alphanumeric = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const base = alphanumeric.slice(0, 12)
  const checkDigits = alphanumeric.slice(12).replace(/\D/g, '').slice(0, 2)
  return `${base}${checkDigits}`
}

export function sanitizeCpfInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

export function sanitizeDocumentInput(value: string): string {
  return identifyDocumentKind(value) === 'CNPJ' ? sanitizeCnpjInput(value) : sanitizeCpfInput(value)
}

function applyProgressiveMask(value: string, groupSizes: number[], separators: string[]): string {
  let offset = 0
  let masked = ''

  groupSizes.forEach((size, index) => {
    const group = value.slice(offset, offset + size)
    if (!group) return
    if (index > 0) masked += separators[index - 1]
    masked += group
    offset += size
  })

  return masked
}

export function formatCnpj(value: string): string {
  return applyProgressiveMask(sanitizeCnpjInput(value), [2, 3, 3, 4, 2], ['.', '.', '/', '-'])
}

export function formatCpf(value: string): string {
  return applyProgressiveMask(sanitizeCpfInput(value), [3, 3, 3, 2], ['.', '.', '-'])
}

export function formatDocument(value: string): string {
  return identifyDocumentKind(value) === 'CNPJ' ? formatCnpj(value) : formatCpf(value)
}

function cnpjCharacterValue(character: string): number {
  return character.charCodeAt(0) - 48
}

function calculateCnpjDigit(base: string): number {
  let weight = 2
  let sum = 0

  for (let index = base.length - 1; index >= 0; index -= 1) {
    sum += cnpjCharacterValue(base[index]) * weight
    weight = weight === 9 ? 2 : weight + 1
  }

  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

export function validateCnpj(value: string): DocumentValidationResult {
  const normalized = normalizeCnpj(value)
  if (!CNPJ_FORMAT.test(normalized)) {
    return { valid: false, normalized, reason: 'FORMAT' }
  }

  const base = normalized.slice(0, 12)
  const firstDigit = calculateCnpjDigit(base)
  const secondDigit = calculateCnpjDigit(`${base}${firstDigit}`)
  if (normalized.slice(12) !== `${firstDigit}${secondDigit}`) {
    return { valid: false, normalized, reason: 'CHECK_DIGITS' }
  }

  return { valid: true, normalized }
}

function calculateCpfDigit(base: string, initialWeight: number): number {
  const sum = [...base].reduce(
    (total, digit, index) => total + Number(digit) * (initialWeight - index),
    0,
  )
  const remainder = (sum * 10) % 11
  return remainder === 10 ? 0 : remainder
}

export function validateCpf(value: string): DocumentValidationResult {
  const normalized = normalizeCpf(value)
  if (!CPF_FORMAT.test(normalized)) {
    return { valid: false, normalized, reason: 'FORMAT' }
  }
  if (/^(\d)\1{10}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'CHECK_DIGITS' }
  }

  const firstDigit = calculateCpfDigit(normalized.slice(0, 9), 10)
  const secondDigit = calculateCpfDigit(`${normalized.slice(0, 9)}${firstDigit}`, 11)
  if (normalized.slice(9) !== `${firstDigit}${secondDigit}`) {
    return { valid: false, normalized, reason: 'CHECK_DIGITS' }
  }

  return { valid: true, normalized }
}

export function validateBrazilianDocument(
  value: string,
): DocumentValidationResult & { kind: BrazilianDocumentKind } {
  const kind = identifyDocumentKind(value)
  return {
    kind,
    ...(kind === 'CNPJ' ? validateCnpj(value) : validateCpf(value)),
  }
}

export function publicDocumentErrorMessage(kind: BrazilianDocumentKind): string {
  return kind === 'CNPJ' ? 'CNPJ inválido' : 'CPF inválido'
}
