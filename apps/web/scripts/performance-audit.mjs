import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { spawn, execFileSync } from 'node:child_process'
import { readFile, writeFile, mkdir, cp, access } from 'node:fs/promises'
import { dirname, join, resolve, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { once } from 'node:events'

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const separator = arg.indexOf('=')
    return [arg.slice(2, separator), arg.slice(separator + 1)]
  }),
)
if (process.argv.includes('--help') || !args.build || !args.tools || !args.output) {
  console.log(`Usage: node scripts/performance-audit.mjs --build=/absolute/isolated/repo --tools=/absolute/tools --output=/absolute/outside/repo --phase=before
Prepare tools outside the repository: npm install lighthouse@12.8.2 (in a private package directory).
Prepare an isolated next build with NEXT_PUBLIC_API_URL=http://localhost:3339.
Audits run on loopback only; deterministic API replaces all auth/dashboard/sales reads.
Defaults: 3 cold runs, mobile 390x844 simulated 4G/4x CPU, desktop 1440x900/1x CPU.
Reports never block CI and never imply real-user INP or production backend performance.`)
  process.exit(process.argv.includes('--help') ? 0 : 1)
}
const webDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoDir = resolve(webDir, '../..')
const buildDir = resolve(args.build, 'apps/web')
const output = resolve(args.output, args.phase ?? 'before')
if (!relative(repoDir, output).startsWith('..'))
  throw new Error('Reports must be outside the checkout')
await access(join(buildDir, '.next/BUILD_ID'))
const fixture = JSON.parse(await readFile(new URL('./performance-fixture.json', import.meta.url)))
const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')
const toolRequire = createRequire(join(resolve(args.tools), 'package.json'))
const { default: lighthouse } = await import(pathToFileURL(toolRequire.resolve('lighthouse')))
const { default: puppeteer } = await import(pathToFileURL(toolRequire.resolve('puppeteer-core')))
const standalone = join(buildDir, '.next/standalone/apps/web')
await cp(join(buildDir, '.next/static'), join(standalone, '.next/static'), { recursive: true })
await cp(join(buildDir, 'public'), join(standalone, 'public'), { recursive: true })
await mkdir(output, { recursive: true })
const baseUrl = 'http://127.0.0.1:3102'
let authenticated = false
let browser
let server
const requests = []
const api = createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', baseUrl)
  response.setHeader('Access-Control-Allow-Credentials', 'true')
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (request.method === 'OPTIONS') {
    response.writeHead(204).end()
    return
  }
  const path = new URL(request.url, 'http://localhost:3339').pathname
  requests.push({ path, method: request.method })
  let status = 200
  let body
  if (path === '/auth/refresh') {
    status = authenticated ? 200 : 401
    body = authenticated
      ? { accessToken: 'synthetic-laboratory-token' }
      : { error: { message: 'No laboratory session' } }
  } else if (path === '/auth/me' && authenticated) body = fixture.profile
  else if (path === '/dashboard/summary' && authenticated) body = fixture.summary
  else if (path === '/sales' && authenticated) body = fixture.sales
  else {
    status = 404
    body = {}
  }
  setTimeout(() => {
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    response.end(JSON.stringify(body))
  }, fixture.apiDelayMs)
})
const profiles = {
  mobile: {
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
  },
  desktop: {
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
  },
}
const pages = [
  { name: 'landing', path: '/', authenticated: false },
  { name: 'login', path: '/login', authenticated: false },
  { name: 'dashboard', path: '/dashboard', authenticated: true },
]
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const runs = []
try {
  api.listen(3339, '127.0.0.1')
  await once(api, 'listening')
  server = spawn(process.execPath, [join(standalone, 'server.js')], {
    cwd: standalone,
    env: { ...process.env, HOSTNAME: '127.0.0.1', PORT: '3102' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let serverLog = ''
  server.stdout.on('data', (chunk) => {
    serverLog += chunk
  })
  server.stderr.on('data', (chunk) => {
    serverLog += chunk
  })
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${serverLog}`)
    try {
      if ((await fetch(`${baseUrl}/api/health`)).ok) break
    } catch {
      /* wait for loopback */
    }
    await new Promise((done) => setTimeout(done, 200))
    if (attempt === 99) throw new Error('Production build did not become ready')
  }
  for (const [profileName, profile] of Object.entries(profiles)) {
    for (const target of pages) {
      authenticated = target.authenticated
      for (let index = 1; index <= 3; index++) {
        requests.length = 0
        browser = await puppeteer.launch({
          executablePath: chromium.executablePath(),
          headless: true,
          args: ['--no-sandbox', '--disable-dev-shm-usage'],
        })
        const audited = await browser.newPage()
        await audited.goto(`${baseUrl}/api/health`)
        await audited.evaluate(() =>
          localStorage.setItem('taxsim:onboarding:perf-user:completed:v1', 'true'),
        )
        const session = await audited.target().createCDPSession()
        await session.send('Network.clearBrowserCache')
        const result = await lighthouse(
          `${baseUrl}${target.path}`,
          {
            port: Number(new URL(browser.wsEndpoint()).port),
            logLevel: 'error',
            output: ['json', 'html'],
            onlyCategories: ['performance'],
            disableStorageReset: true,
            throttlingMethod: 'simulate',
            ...profile,
          },
          undefined,
          audited,
        )
        if (result.lhr.runtimeError) throw new Error(JSON.stringify(result.lhr.runtimeError))
        const lhr = result.lhr
        if (new URL(lhr.finalDisplayedUrl).pathname !== target.path)
          throw new Error('Audit redirected to a different page')
        await audited.waitForFunction(
          (expected) => document.body.innerText.includes(expected),
          { timeout: 12000 },
          target.name === 'login'
            ? 'Entrar no TaxSim'
            : target.name === 'dashboard'
              ? 'Operações Recentes'
              : 'Do NCM à comparação tributária.',
        )
        const bodyText = await audited.evaluate(() => document.body.innerText)
        if (target.name === 'dashboard') {
          if (
            !bodyText.includes('4.800,00') ||
            !bodyText.includes('Carga Tributária: Atual vs Reforma') ||
            !bodyText.includes('Operações Recentes') ||
            (await audited.evaluate(
              () => document.querySelectorAll('.recharts-wrapper').length,
            )) !== 2
          )
            throw new Error('Dashboard lacks populated KPIs, both charts, or recent sales')
          for (const path of ['/auth/me', '/dashboard/summary', '/sales'])
            if (!requests.some((request) => request.path === path))
              throw new Error(`Dashboard did not load ${path}`)
        } else if (
          !bodyText.includes(
            target.name === 'login' ? 'Entrar no TaxSim' : 'Do NCM à comparação tributária.',
          )
        )
          throw new Error('Expected public page did not render')
        const network = lhr.audits['network-requests'].details.items
        if (
          network.some(
            (item) =>
              item.url.startsWith('http') &&
              !['127.0.0.1', 'localhost'].includes(new URL(item.url).hostname),
          )
        )
          throw new Error('Unexpected external application request')
        const transferred = (type) =>
          network
            .filter((item) => item.resourceType === type)
            .reduce((total, item) => total + (item.transferSize ?? 0), 0)
        const name = `${profileName}-${target.name}-${index}`
        const metrics = {
          score: Math.round(lhr.categories.performance.score * 100),
          lcpMs: lhr.audits['largest-contentful-paint'].numericValue,
          cls: lhr.audits['cumulative-layout-shift'].numericValue,
          tbtMs: lhr.audits['total-blocking-time'].numericValue,
          jsBytes: transferred('Script'),
          fontBytes: transferred('Font'),
          imageBytes: transferred('Image'),
        }
        runs.push({
          name,
          page: target.name,
          profile: profileName,
          index,
          metrics,
          versions: { lighthouse: lhr.lighthouseVersion, userAgent: lhr.userAgent },
          settings: lhr.configSettings,
          warnings: lhr.runWarnings,
          apiRequests: [...requests],
        })
        await writeFile(join(output, `${name}.json`), result.report[0])
        await writeFile(join(output, `${name}.html`), result.report[1])
        if (index === 1)
          await audited.screenshot({
            path: join(output, `${profileName}-${target.name}.png`),
            fullPage: true,
          })
        console.log(JSON.stringify({ phase: args.phase, name, ...metrics }))
        await browser.close()
        browser = null
        await writeFile(join(output, 'runs.json'), JSON.stringify(runs, null, 2))
      }
    }
  }
  const summaries = Object.keys(profiles).flatMap((profile) =>
    pages.map((page) => {
      const relevant = runs.filter((run) => run.profile === profile && run.page === page.name)
      return {
        profile,
        page: page.name,
        metrics: Object.fromEntries(
          Object.keys(relevant[0].metrics).map((key) => [
            key,
            median(relevant.map((run) => run.metrics[key])),
          ]),
        ),
      }
    }),
  )
  const report = {
    date: new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }),
    phase: args.phase ?? 'before',
    revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoDir, encoding: 'utf8' }).trim(),
    sourceDirty: Boolean(
      execFileSync('git', ['diff', '--name-only', '--', 'apps/web/src'], {
        cwd: repoDir,
        encoding: 'utf8',
      }).trim(),
    ),
    fixtureVersion: fixture.version,
    protocol:
      'Three fresh Chrome processes per page/profile; cold HTTP cache, onboarding completion flag only retained; simulated throttling; loopback HTTP; synthetic API with 100ms per response. No database/RFB. Transfer sizes include response overhead, not decoded JS sizes. Not real-user INP or production API/network performance.',
    profiles,
    summaries,
    runs,
  }
  await writeFile(join(output, 'summary.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ summaries }))
} finally {
  if (browser) await browser.close().catch(() => {})
  if (server) server.kill('SIGTERM')
  api.close()
}
