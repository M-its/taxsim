import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const seedNcms = [
  { ncmCode: '84713012', taxRegime: 'SIMPLES_NACIONAL' as const, pisRate: '0.0082', cofinsRate: '0.0378', icmsRate: '0.1800', issRate: '0.0000' },
  { ncmCode: '84713012', taxRegime: 'LUCRO_PRESUMIDO' as const, pisRate: '0.0082', cofinsRate: '0.0378', icmsRate: '0.1800', issRate: '0.0000' },
  { ncmCode: '84713012', taxRegime: 'LUCRO_REAL' as const, pisRate: '0.0065', cofinsRate: '0.0300', icmsRate: '0.1800', issRate: '0.0000' },
  { ncmCode: '24021000', taxRegime: 'SIMPLES_NACIONAL' as const, pisRate: '0.0082', cofinsRate: '0.0378', icmsRate: '0.1200', issRate: '0.0000' },
  { ncmCode: '24021000', taxRegime: 'LUCRO_PRESUMIDO' as const, pisRate: '0.0082', cofinsRate: '0.0378', icmsRate: '0.1200', issRate: '0.0000' },
  { ncmCode: '24021000', taxRegime: 'LUCRO_REAL' as const, pisRate: '0.0065', cofinsRate: '0.0300', icmsRate: '0.1200', issRate: '0.0000' },
  { ncmCode: '22030000', taxRegime: 'SIMPLES_NACIONAL' as const, pisRate: '0.0082', cofinsRate: '0.0378', icmsRate: '0.1700', issRate: '0.0000' },
  { ncmCode: '22030000', taxRegime: 'LUCRO_PRESUMIDO' as const, pisRate: '0.0082', cofinsRate: '0.0378', icmsRate: '0.1700', issRate: '0.0000' },
  { ncmCode: '22030000', taxRegime: 'LUCRO_REAL' as const, pisRate: '0.0065', cofinsRate: '0.0300', icmsRate: '0.1700', issRate: '0.0000' },
]

async function main() {
  console.log('Seeding tax_rules...')

  for (const rule of seedNcms) {
    await prisma.taxRule.upsert({
      where: {
        ncmCode_taxRegime_status: {
          ncmCode: rule.ncmCode,
          taxRegime: rule.taxRegime,
          status: 'ACTIVE',
        },
      },
      update: {},
      create: {
        ncmCode: rule.ncmCode,
        taxRegime: rule.taxRegime,
        status: 'ACTIVE',
        cClassTrib: '000001',
        cst: '000',
        pisRate: Number(rule.pisRate),
        cofinsRate: Number(rule.cofinsRate),
        icmsRate: Number(rule.icmsRate),
        issRate: Number(rule.issRate),
      },
    })
  }

  console.log(`Seeded ${seedNcms.length} tax rules.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
