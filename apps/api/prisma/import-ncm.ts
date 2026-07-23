import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

interface NcmJsonEntry {
  Codigo: string
  Descricao: string
  Data_Inicio: string
  Data_Fim: string
}

interface NcmCatalogRoot {
  Nomenclaturas: NcmJsonEntry[]
}

function parseDate(value: string): Date {
  const [day, month, year] = value.split('/')
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`)
}

function normalizeCode(code: string): string {
  return code.replace(/[.\s]/g, '')
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main(): Promise<void> {
  const prisma = new PrismaClient()

  try {
    const filePath = path.join(__dirname, 'data', 'Tabela_NCM_Vigente_20260710.json')
    const raw = fs.readFileSync(filePath, 'utf-8')
    const json = JSON.parse(raw) as NcmCatalogRoot

    const entries = json.Nomenclaturas ?? []
    const filtered = entries.filter((entry) => normalizeCode(entry.Codigo).length === 8)

    console.log(`Importing ${filtered.length} NCM entries...`)

    for (let i = 0; i < filtered.length; i++) {
      const entry = filtered[i]
      const code = normalizeCode(entry.Codigo)

      await prisma.ncmCatalog.upsert({
        where: { code },
        update: {
          description: entry.Descricao,
          validFrom: parseDate(entry.Data_Inicio),
          validUntil: parseDate(entry.Data_Fim),
        },
        create: {
          code,
          description: entry.Descricao,
          validFrom: parseDate(entry.Data_Inicio),
          validUntil: parseDate(entry.Data_Fim),
        },
      })

      if ((i + 1) % 1000 === 0) {
        console.log(`  ${i + 1} entries processed...`)
      }
    }

    console.log(`Done. Imported ${filtered.length} NCM codes.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
