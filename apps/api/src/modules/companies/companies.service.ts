import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../shared/errors/AppError.js'
import type { TaxRegime } from '@prisma/client'

export type UpdateCompanyInput = {
  name: string
  taxRegime: TaxRegime
  municipioCode: number
  uf: string
}

export const updateCompany = async (
  companyId: string,
  input: UpdateCompanyInput,
) => {
  try {
    return await prisma.company.update({
      where: { id: companyId },
      data: {
        name: input.name,
        taxRegime: input.taxRegime,
        municipioCode: input.municipioCode,
        uf: input.uf,
      },
    })
  } catch (error) {
    throw AppError.notFound('Company not found')
  }
}
