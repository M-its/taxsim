import { readFileSync, writeFileSync } from 'node:fs'
import { calculateLandingExample } from './landing-example.js'

const target = new URL('../../web/src/lib/landing-example.json', import.meta.url)
const example = JSON.parse(readFileSync(target, 'utf8'))
example.display = calculateLandingExample(example)
writeFileSync(target, `${JSON.stringify(example, null, 2)}\n`)
console.log('Fixture demonstrativa recalculada sem banco ou chamada externa.')
