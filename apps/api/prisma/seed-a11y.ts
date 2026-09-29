import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import taxRules from './data/tax-rules-data'
import { seedTaxRules } from '../src/lib/tax-rule-seed.js'

if (process.env.A11Y_SEED_ALLOWED !== 'true' || process.env.NODE_ENV !== 'test') {
  throw new Error('The accessibility seed only runs with NODE_ENV=test and A11Y_SEED_ALLOWED=true')
}

const prisma = new PrismaClient()

const ids = {
  company: '00000000-0000-4000-8000-000000000001',
  user: '00000000-0000-4000-8000-000000000002',
  notebook: '00000000-0000-4000-8000-000000000101',
  keyboard: '00000000-0000-4000-8000-000000000102',
  client: '00000000-0000-4000-8000-000000000201',
} as const

async function resetDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.splitPaymentEvent.deleteMany(),
    prisma.saleItem.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.product.deleteMany(),
    prisma.client.deleteMany(),
    prisma.user.deleteMany(),
    prisma.company.deleteMany(),
    prisma.taxRule.deleteMany(),
    prisma.ncmCatalog.deleteMany(),
  ])
}

async function seedSales(): Promise<void> {
  const statuses = [
    'DRAFT',
    'DRAFT',
    'DRAFT',
    'DRAFT',
    'DRAFT',
    'DRAFT',
    'CONFIRMED',
    'CANCELLED',
  ] as const

  for (let index = 0; index < statuses.length; index += 1) {
    const sequence = String(index + 1).padStart(12, '0')
    const saleId = `10000000-0000-4000-8000-${sequence}`
    const itemId = `20000000-0000-4000-8000-${sequence}`
    const quantity = index + 1
    const totalAmount = (2500 * quantity).toFixed(2)

    await prisma.sale.create({
      data: {
        id: saleId,
        companyId: ids.company,
        clientId: ids.client,
        status: statuses[index],
        totalAmount,
        totalPis: (2.75 * quantity).toFixed(2),
        totalCofins: (12.75 * quantity).toFixed(2),
        totalIcms: (47.75 * quantity).toFixed(2),
        totalIss: '0.00',
        totalIbs: (450 * quantity).toFixed(2),
        totalCbs: (225 * quantity).toFixed(2),
        totalIs: '0.00',
        createdAt: new Date(Date.UTC(2026, 8, 20 - index, 12, 0, 0)),
        items: {
          create: {
            id: itemId,
            productId: ids.notebook,
            quantity,
            unitPrice: '2500.00',
            ncmCode: '84713012',
            totalPrice: totalAmount,
            pisRate: '0.0011',
            cofinsRate: '0.0051',
            icmsRate: '0.0191',
            issRate: '0.0000',
            ibsRate: '0.1800',
            cbsRate: '0.0900',
            isRate: '0.0000',
          },
        },
      },
    })
  }
}

async function main(): Promise<void> {
  await resetDatabase()
  await seedTaxRules(prisma, taxRules)

  await prisma.ncmCatalog.createMany({
    data: [
      {
        code: '84713012',
        description: 'Máquinas automáticas para processamento de dados, portáteis',
        validFrom: new Date('2022-04-01T00:00:00.000Z'),
        validUntil: new Date('2035-12-31T00:00:00.000Z'),
      },
      {
        code: '84716052',
        description: 'Teclados para máquinas automáticas de processamento de dados',
        validFrom: new Date('2022-04-01T00:00:00.000Z'),
        validUntil: new Date('2035-12-31T00:00:00.000Z'),
      },
      {
        code: '85171300',
        description: 'Telefones inteligentes (smartphones)',
        validFrom: new Date('2022-04-01T00:00:00.000Z'),
        validUntil: new Date('2035-12-31T00:00:00.000Z'),
      },
    ],
  })

  await prisma.company.create({
    data: {
      id: ids.company,
      name: 'Empresa Acessibilidade Ltda',
      document: '04252011000110',
      taxRegime: 'SIMPLES_NACIONAL',
      municipioCode: 4314902,
      uf: 'RS',
    },
  })

  await prisma.user.create({
    data: {
      id: ids.user,
      companyId: ids.company,
      name: 'Pessoa de Teste',
      email: 'a11y@taxsim.test',
      passwordHash: await bcrypt.hash('A11yTest!2026', 4),
      role: 'OWNER',
    },
  })

  await prisma.product.createMany({
    data: [
      {
        id: ids.notebook,
        companyId: ids.company,
        name: 'Notebook de Teste',
        sku: 'A11Y-NOTEBOOK',
        ncmCode: '84713012',
        unitPrice: '2500.00',
      },
      {
        id: ids.keyboard,
        companyId: ids.company,
        name: 'Teclado de Teste',
        sku: 'A11Y-TECLADO',
        ncmCode: '84716052',
        unitPrice: '150.00',
      },
    ],
  })

  await prisma.client.create({
    data: {
      id: ids.client,
      companyId: ids.company,
      name: 'Cliente de Teste',
      document: '52998224725',
      email: 'cliente@taxsim.test',
    },
  })

  await seedSales()
  console.log('Accessibility test database seeded.')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
