'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Database,
  FileSearch,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react'
import { AuthProvider, useAuth } from '@/components/auth/auth-provider'

const capabilities = [
  {
    number: '01',
    title: 'Simulação comparativa',
    text: 'Compara o modelo tributário atual ao IVA Dual e preserva a rastreabilidade de cada item calculado.',
    icon: ScanSearch,
  },
  {
    number: '02',
    title: 'Classificação fiscal verificável',
    text: 'Cruza NCM vigente, regras por regime e compatibilidade com a calculadora antes de apresentar resultados.',
    icon: FileSearch,
  },
  {
    number: '03',
    title: 'Operação SaaS real',
    text: 'Organiza produtos, clientes e vendas em uma aplicação multi-tenant com estados de falha explícitos.',
    icon: Database,
  },
]

const security = [
  'Sessão com refresh token HttpOnly e rotação',
  'Isolamento de dados derivado da sessão',
  'Validação de contratos externos em runtime',
  'Circuit breaker na integração de cálculo',
]

const accessibility = [
  'Baseline WCAG 2.2 AA nos fluxos principais',
  'Navegação por teclado e foco gerenciado',
  'Regressões axe em desktop e viewport móvel',
  'Movimento reduzido e alternativas textuais',
]

function SessionActions({ onAccent = false }: { onAccent?: boolean }) {
  const { isAuthenticated, isLoading } = useAuth()
  const primary = onAccent
    ? 'bg-[#09090b] text-white hover:bg-zinc-800'
    : 'bg-emerald-400 text-zinc-950 hover:bg-emerald-300'
  const secondary = onAccent
    ? 'border-zinc-900 text-zinc-950 hover:bg-emerald-300'
    : 'border-zinc-600 text-white hover:border-zinc-300 hover:bg-zinc-900'

  if (isLoading) {
    return <span role="status" className="text-sm text-zinc-400">Verificando sessão…</span>
  }

  if (isAuthenticated) {
    return (
      <Link href="/dashboard" className={`inline-flex min-h-11 items-center gap-2 border px-5 py-2.5 text-sm font-semibold transition-colors ${primary}`}>
        Ir ao dashboard <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href="/login" className={`inline-flex min-h-11 items-center border px-5 py-2.5 text-sm font-semibold transition-colors ${secondary}`}>
        Entrar
      </Link>
      <Link href="/register" className={`inline-flex min-h-11 items-center gap-2 border border-transparent px-5 py-2.5 text-sm font-semibold transition-colors ${primary}`}>
        Experimentar demonstração <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  )
}

function ArchitectureDiagram() {
  return (
    <div
      role="img"
      aria-label="Arquitetura de alto nível: a interface Next.js envia requisições para uma API Fastify, que coordena PostgreSQL, o motor tributário e a calculadora pública da Receita Federal."
      className="grid gap-px overflow-hidden border border-zinc-700 bg-zinc-700 md:grid-cols-[1fr_auto_1fr_auto_1.4fr]"
    >
      <div className="flex min-h-32 flex-col justify-between bg-zinc-950 p-5">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-400">Interface</span>
        <strong className="text-xl">Next.js</strong>
      </div>
      <div aria-hidden="true" className="hidden items-center bg-zinc-950 px-2 text-emerald-400 md:flex">→</div>
      <div className="flex min-h-32 flex-col justify-between bg-zinc-950 p-5">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-400">Aplicação</span>
        <strong className="text-xl">API Fastify</strong>
      </div>
      <div aria-hidden="true" className="hidden items-center bg-zinc-950 px-2 text-emerald-400 md:flex">→</div>
      <div className="grid gap-px bg-zinc-700 sm:grid-cols-3 md:grid-cols-1">
        {['PostgreSQL', 'Motor tributário', 'Calculadora RFB'].map((label) => (
          <div key={label} className="flex items-center bg-zinc-950 p-5 font-medium">{label}</div>
        ))}
      </div>
    </div>
  )
}

function LandingContent() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 selection:bg-emerald-400 selection:text-zinc-950">
      <a href="#conteudo" className="sr-only z-50 bg-emerald-400 px-4 py-3 font-semibold text-zinc-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Pular para o conteúdo
      </a>

      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/" aria-label="TaxSim — página inicial" className="font-mono text-sm font-bold uppercase tracking-[0.22em]">
            Tax<span className="text-emerald-400">Sim</span>
          </Link>
          <nav aria-label="Navegação principal" className="hidden items-center gap-7 text-sm text-zinc-300 md:flex">
            <a href="#produto" className="hover:text-white">Produto</a>
            <a href="#arquitetura" className="hover:text-white">Arquitetura</a>
            <a href="#qualidade" className="hover:text-white">Qualidade</a>
          </nav>
          <div className="hidden sm:block"><SessionActions /></div>
        </div>
      </header>

      <main id="conteudo">
        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.4fr_0.6fr] lg:px-8 lg:py-28">
          <div>
            <p className="mb-7 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Portfólio full-stack · demonstração técnica</p>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-8xl">
              Engenharia fiscal para uma reforma em movimento.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-300">
              O TaxSim explora como produto, arquitetura e qualidade se encontram em um SaaS fiscal: do NCM ao resultado comparativo, com falhas visíveis e decisões verificáveis.
            </p>
            <div className="mt-10"><SessionActions /></div>
          </div>
          <aside className="self-end border-l border-emerald-400 pl-5 text-sm leading-6 text-zinc-400">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-200">Problema de engenharia</p>
            <p className="mt-3">Regras em transição, integrações externas e dados fiscais exigem mais que uma interface convincente: exigem limites claros e comportamento previsível.</p>
          </aside>
        </section>

        <section id="produto" aria-labelledby="produto-title" className="border-y border-zinc-800 bg-zinc-950">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">01 / Produto</p>
            <h2 id="produto-title" className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Do dado de entrada ao diagnóstico, sem esconder as arestas.</h2>
            <div className="mt-14 grid border-y border-zinc-800 md:grid-cols-3 md:divide-x md:divide-zinc-800">
              {capabilities.map(({ number, title, text, icon: Icon }) => (
                <article key={number} className="border-b border-zinc-800 py-8 md:border-b-0 md:px-7 md:first:pl-0 md:last:pr-0">
                  <div className="flex items-center justify-between"><span className="font-mono text-xs text-zinc-400">{number}</span><Icon aria-hidden="true" className="size-5 text-emerald-400" /></div>
                  <h3 className="mt-10 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 leading-7 text-zinc-400">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="arquitetura" aria-labelledby="arquitetura-title" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.6fr_1.4fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">02 / Arquitetura</p>
              <h2 id="arquitetura-title" className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Componentes com responsabilidades explícitas.</h2>
              <p className="mt-5 leading-7 text-zinc-400">A interface coordena a jornada; a API protege contratos e isolamento; o motor traduz classificação fiscal em uma requisição controlada.</p>
            </div>
            <ArchitectureDiagram />
          </div>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-zinc-800 pt-6 font-mono text-xs uppercase tracking-[0.14em] text-zinc-400">
            <span>TypeScript</span><span>Next.js</span><span>Fastify</span><span>PostgreSQL</span><span>Prisma</span><span>Docker</span>
          </div>
        </section>

        <section id="qualidade" aria-labelledby="qualidade-title" className="border-y border-zinc-800 bg-zinc-950">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">03 / Qualidade</p>
            <h2 id="qualidade-title" className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Segurança e acessibilidade como arquitetura, não acabamento.</h2>
            <div className="mt-14 grid gap-px border border-zinc-800 bg-zinc-800 md:grid-cols-2">
              {[
                { title: 'Segurança por fronteiras', items: security, icon: ShieldCheck },
                { title: 'Acesso por padrão', items: accessibility, icon: LockKeyhole },
              ].map(({ title, items, icon: Icon }) => (
                <article key={title} className="bg-[#09090b] p-7 sm:p-9">
                  <Icon aria-hidden="true" className="size-6 text-emerald-400" />
                  <h3 className="mt-7 text-2xl font-semibold">{title}</h3>
                  <ul className="mt-6 space-y-4 text-zinc-300">
                    {items.map((item) => <li key={item} className="flex gap-3"><span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-emerald-400" />{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-emerald-400 text-zinc-950">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-12 sm:flex-row sm:items-center lg:px-8">
            <div><p className="font-mono text-xs font-bold uppercase tracking-[0.18em]">Explore o sistema</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Veja as decisões em funcionamento.</h2></div>
            <SessionActions onAccent />
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>Projeto de demonstração técnica, sem vínculo com a Receita Federal. Não deve ser usado para cálculos fiscais reais.</p>
          <p className="shrink-0 font-mono text-xs uppercase tracking-[0.16em]">TaxSim · Mitsrael</p>
        </div>
      </footer>
    </div>
  )
}

export function LandingPage() {
  return <AuthProvider><LandingContent /></AuthProvider>
}
