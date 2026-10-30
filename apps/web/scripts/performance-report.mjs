import { readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'

const directory = process.argv[2]
if (!directory) throw new Error('Usage: node scripts/performance-report.mjs /absolute/report-directory')
const base = resolve(directory)
const before = JSON.parse(await readFile(join(base, 'before/summary.json')))
const experiment = JSON.parse(await readFile(join(base, 'after/summary.json')))
const goals = { scorePublic: 90, scoreDashboard: 80, lcpMs: 2500, cls: 0.1, tbtMs: 200, jsPublicBytes: 180000, jsDashboardBytes: 400000, fontBytes: 150000, initialImageBytes: 300000, mainImageBytes: 150000 }
const pending = before.summaries.flatMap(row => {
  const score = row.page === 'dashboard' ? goals.scoreDashboard : goals.scorePublic
  const thresholds = { score, lcpMs: goals.lcpMs, cls: goals.cls, tbtMs: goals.tbtMs, jsBytes: row.page === 'dashboard' ? goals.jsDashboardBytes : goals.jsPublicBytes, fontBytes: goals.fontBytes, imageBytes: goals.initialImageBytes }
  return Object.entries(thresholds).filter(([key, target]) => key === 'score' ? row.metrics[key] < target : row.metrics[key] > target).map(([metric, target]) => ({ page: row.page, profile: row.profile, metric, observed: row.metrics[metric], target, status: 'known_open_not_corrected_in_timebox' }))
})
const report = {
  date: before.date, baselineRevision: before.revision,
  applicationChangesRetained: false,
  decision: 'Moved MotionPreferences and driver.css to the private layout experimentally. JS transfer fell by only 1.6 kB on public pages, without consistent latency/score improvement. Experiment reverted; baseline is the final retained application. No architecture/chart refactoring within this timebox.',
  protocol: before.protocol, profiles: before.profiles, goals,
  versions: { node: process.version, lighthouse: before.runs[0].versions.lighthouse, browserUserAgent: before.runs[0].versions.userAgent },
  baseline: before.summaries, discardedExperiment: experiment.summaries, pending,
  furtherWork: [
    'Profile main-thread scripting/hydration on mobile, especially dashboard/Recharts, before choosing another change.',
    'Assess lazy chart/tour loading with reserved layout and text alternatives; requires a separate bounded round and regression review.',
    'Assess unused font preloads on login; not changed or measured in this round.',
    'Real HTTP/2/TLS/CDN, production backend latency and real-user INP are not represented by loopback synthetic laboratory measurements.',
  ],
  caveats: ['Three runs are a small sample; wide TBT spread means no causality claim from individual scores.', 'JavaScript/font/image values are actual transfer bytes including HTTP overhead; not decoded bundle size.', 'No main image is used; the main-image budget is not applicable. OG was not loaded.', 'Only an authenticated populated dashboard was accepted; no empty account, loading-only, or error screen substituted for it.'],
  reproduction: [
    'Prepare an external private package directory and install lighthouse@12.8.2 there. Use the project Playwright Chromium installation.',
    'Create an isolated checkout copy and symlink its apps/web/node_modules to installed project dependencies.',
    'Build with NEXT_PUBLIC_API_URL=http://localhost:3339 pnpm exec next build. Never share the production .next with a running next dev.',
    'From apps/web: node scripts/performance-audit.mjs --build=/absolute/isolated/repo --tools=/absolute/private/tools --output=/absolute/outside/checkout --phase=before',
    'For a candidate, repeat with --phase=after and identical tools, fixture, profiles and machine conditions.',
    'node scripts/performance-report.mjs /absolute/report-directory compares the original baseline to the discarded experiment from this round. All artifacts remain outside the checkout; no CI gate or scheduled run.',
  ],
  checkpoint: 'C: awaiting approval; no documentation cleanup, private backup or issue changes performed',
}
await writeFile(join(base, 'report.json'), JSON.stringify(report, null, 2))
const number = (value, digits = 0) => value.toLocaleString('pt-BR', { maximumFractionDigits: digits })
const rows = before.summaries.map(row => {
  const alternate = experiment.summaries.find(item => item.page === row.page && item.profile === row.profile)
  return `<tr><th>${row.page} · ${row.profile}</th><td>${row.metrics.score} → ${alternate.metrics.score}</td><td>${number(row.metrics.lcpMs / 1000, 2)} → ${number(alternate.metrics.lcpMs / 1000, 2)}</td><td>${number(row.metrics.tbtMs)} → ${number(alternate.metrics.tbtMs)}</td><td>${number(row.metrics.cls, 4)}</td><td>${number(row.metrics.jsBytes / 1000, 1)}</td><td>${number(row.metrics.fontBytes / 1000, 1)}</td><td><a href="before/${row.profile}-${row.page}-1.html">Original</a> · <a href="after/${row.profile}-${row.page}-1.html">Experimento</a></td></tr>`
}).join('')
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TaxSim — performance de laboratório</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:1100px;margin:auto;padding:32px;color:#18181b;background:#fafafa}h1{font-size:28px}h2{font-size:21px;margin-top:32px}a{color:#065f46}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border-bottom:1px solid #d4d4d8;padding:10px;text-align:left;vertical-align:top}.scroll{overflow:auto}code{overflow-wrap:anywhere}li{margin:8px 0}</style><main><h1>TaxSim: baseline medido, metas mobile ainda abertas</h1><p>${before.date} · Lighthouse ${report.versions.lighthouse} · mediana de três execuções por página/perfil. Produção local isolada, API sintética determinística; nenhum banco ou RFB reais.</p><h2>Decisão da rodada</h2><p>O experimento de restringir animações/CSS do tour à área privada poupou cerca de 1,6 kB de JS público, mas não confirmou melhora consistente. Foi revertido. <strong>A coluna original representa a aplicação mantida.</strong> Não houve redução silenciosa de metas nem nova arquitetura.</p><h2>Original → experimento descartado</h2><div class="scroll"><table><thead><tr><th>Página e perfil</th><th>Nota /100</th><th>LCP (s)</th><th>TBT (ms)</th><th>CLS original</th><th>JS original (kB)</th><th>Fontes (kB)</th><th>Relatórios</th></tr></thead><tbody>${rows}</tbody></table></div><p>Metas: nota ≥90 públicas/≥80 dashboard; LCP ≤2,5 s; CLS ≤0,1; TBT ≤200 ms; JS ≤180/400 kB; fontes ≤150 kB. Sem imagem principal: limite não aplicável. Bytes efetivamente transferidos, não tamanho decodificado.</p><h2>Pendências explícitas</h2><ul>${pending.map(item => `<li>${item.page} · ${item.profile}: ${item.metric} = ${number(item.observed, 3)}; referência ${item.target}. Conhecido, não corrigido nesta rodada limitada.</li>`).join('')}</ul><h2>Próxima investigação, sem implementação nesta rodada</h2><ul>${report.furtherWork.map(item => `<li>${escape(item)}</li>`).join('')}</ul><h2>Protocolo e limites</h2><p>Mobile 390×844, RTT 150 ms, 1.638,4 kbps e CPU 4× simulados; desktop 1440×900, RTT 40 ms, 10.240 kbps e CPU 1×. Navegador novo/cache HTTP frio por execução, tour já concluído, fixture de seis meses e cinco operações, API com atraso fixo de 100 ms. Variação de TBT observada: amostra pequena não comprova causalidade. TBT não é INP de usuários reais.</p><p>${escape(report.versions.browserUserAgent)}</p><h2>Reprodução</h2><ol>${report.reproduction.map(item => `<li><code>${escape(item)}</code></li>`).join('')}</ol><h2>Checkpoint C</h2><p>Aguardando aprovação. Documentação pública, cópia privada, remoções e issues não foram alteradas.</p><p><a href="report.json">Dados, metas e pendências em JSON</a></p></main></html>`
await writeFile(join(base, 'report.html'), html)
console.log(JSON.stringify({ retained: before.summaries, pendingCount: pending.length, applicationChangesRetained: false }))
