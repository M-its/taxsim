/**
 * Prisma seed entrypoint.
 *
 * Available seeded NCMs (global tax_rules table — no company_id):
 *
 * - 84713012: Notebook
 * - 85171200: Smartphone
 * - 84713019: Tablet
 * - 85285200: Monitor
 * - 84716052: Teclado
 * - 84716053: Mouse
 * - 61091000: Camiseta de algodão
 * - 62034200: Calça de algodão (masculina)
 * - 64039900: Calçado de couro
 * - 22021000: Refrigerante
 * - 20019000: Conserva de legumes
 * - 48025610: Papel A4 para impressão
 * - 96081000: Caneta esferográfica
 * - 94033000: Móvel de madeira para escritório
 * - 87032210: Veículo de passageiros (Imposto Seletivo)
 * - 22030000: Cerveja (Imposto Seletivo)
 * - 22082000: Destilados — Imposto Seletivo
 * - 24022000: Cigarros (Imposto Seletivo)
 * - 85235100: Dispositivo de memória (pendrive)
 * - 84715000: Computador desktop
 * - 99999999: Software (serviço) — tributado via ISS
 *
 * tax_rules is global: these rows apply to every company/tenant.
 */

import { PrismaClient } from '@prisma/client'
import taxRules from './data/tax-rules-data'
import { seedTaxRules } from '../src/lib/tax-rule-seed.js'

const prisma = new PrismaClient()

async function main() {
  console.log(`Seeding ${taxRules.length} tax rules into the global tax_rules table...`)
  const count = await seedTaxRules(prisma, taxRules)
  console.log(`Seeded ${count} tax rules.`)
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
