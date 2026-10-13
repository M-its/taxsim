'use client'

import Link from 'next/link'
import { ArrowDown, ArrowRight, Database, FileSearch, ScanSearch } from 'lucide-react'
import { AuthProvider, useAuth } from '@/components/auth/auth-provider'
import { SessionRecovery } from '@/components/auth/session-recovery'
import example from '@/lib/landing-example.json'
import { formatCurrency } from '@/lib/formatters'

const capabilities = [
  {
    title: 'Compare os modelos',
    text: 'Veja a composição dos tributos por item e os totais da simulação.',
    icon: ScanSearch,
  },
  {
    title: 'Entenda os bloqueios',
    text: 'NCM vigente, regra ativa e configuração são verificados antes de calcular.',
    icon: FileSearch,
  },
  {
    title: 'Explore a operação',
    text: 'Produtos, clientes e vendas organizados em uma aplicação multi-tenant.',
    icon: Database,
  },
]

function SessionActions({
  header = false,
  onAccent = false,
}: {
  header?: boolean
  onAccent?: boolean
}) {
  const { isAuthenticated, sessionStatus } = useAuth()
  const confirmed = isAuthenticated && sessionStatus === 'authenticated'
  const primary = onAccent
    ? 'bg-zinc-950 text-white hover:bg-zinc-800'
    : 'bg-emerald-400 text-zinc-950 hover:bg-emerald-300'
  return (
    <div className={header ? 'flex flex-col items-end gap-1' : 'flex flex-wrap items-center gap-3'}>
      {/* Cross the public/auth boundary with document navigation so native hash
          history entries restore the landing document, not the auth router tree. */}
      <a
        href="/register"
        className={`inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${primary}`}
      >
        {header ? (
          <>
            <span className="lg:hidden">Experimentar</span>
            <span className="hidden lg:inline">Experimentar demonstração</span>
          </>
        ) : (
          'Experimentar demonstração'
        )}
        <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
      </a>
      <div className={`relative ${header ? 'min-h-8 w-36' : 'min-h-11 w-40'}`}>
        {!header && (
          <a
            href="/login"
            className={`absolute inset-0 inline-flex items-center justify-center border px-3 text-sm transition-colors ${onAccent ? 'border-zinc-900 text-zinc-950 hover:bg-emerald-300' : 'border-zinc-600 text-white hover:bg-zinc-900'} ${confirmed ? 'invisible' : ''}`}
          >
            Entrar
          </a>
        )}
        <a
          href="/dashboard"
          className={`absolute inset-0 inline-flex items-center ${header ? 'justify-end' : 'justify-center'} text-sm underline underline-offset-4 ${onAccent ? 'text-zinc-950' : 'text-zinc-300 hover:text-white'} ${confirmed ? '' : 'invisible'}`}
        >
          Ir ao dashboard
        </a>
      </div>
    </div>
  )
}

function ExampleComparison() {
  const { scenario, display } = example
  const reformGroup = example.reformResponse.objetos[0].tribCalc.IBSCBS.gIBSCBS
  const percentage = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 })
  const ibsRate = Number(reformGroup.gIBSUF.pIBSUF) + Number(reformGroup.gIBSMun.pIBSMun)
  return (
    <section aria-labelledby="exemplo-title" className="min-w-0 border border-zinc-700 bg-zinc-950">
      <div className="border-b border-zinc-800 p-5 sm:p-6">
        <h2 id="exemplo-title" className="text-xl font-semibold">
          {scenario.product}
        </h2>
        <p className="mt-2 text-sm text-zinc-300">
          {scenario.quantity} unidade × {formatCurrency(scenario.unitPrice)}
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          NCM <span className="font-mono">{scenario.ncmCode}</span> · Lucro Real
        </p>
      </div>
      <div className="grid grid-cols-1 divide-y divide-zinc-800 min-[380px]:grid-cols-2 min-[380px]:divide-x min-[380px]:divide-y-0">
        <div className="min-w-0 p-5 sm:p-6">
          <h3 className="text-sm font-medium text-zinc-300">Modelo atual</h3>
          <p className="mt-3 font-numbers text-3xl font-semibold tracking-tight">
            {formatCurrency(display.currentTax)}
          </p>
          <dl className="mt-5 space-y-2 text-sm text-zinc-400">
            {(
              [
                ['PIS', display.pis],
                ['COFINS', display.cofins],
                ['ICMS', display.icms],
                ['ISS', display.iss],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-x-2">
                <dt>{label}</dt>
                <dd className="font-numbers text-zinc-200">{formatCurrency(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="min-w-0 p-5 sm:p-6">
          <h3 className="text-sm font-medium text-zinc-300">
            IVA Dual · exemplo {scenario.date.slice(0, 4)}
          </h3>
          <p className="mt-3 font-numbers text-3xl font-semibold tracking-tight">
            {formatCurrency(display.reformTax)}
          </p>
          <dl className="mt-5 space-y-2 text-sm text-zinc-400">
            {(
              [
                ['IBS', display.ibs],
                ['CBS', display.cbs],
                ['IS', display.is],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-x-2">
                <dt>{label}</dt>
                <dd className="font-numbers text-zinc-200">{formatCurrency(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="space-y-2 border-t border-zinc-800 p-5 text-sm leading-6 text-zinc-400 sm:p-6">
        <p>
          Exemplo didático com valores demonstrativos, sem validade fiscal e sem vínculo com a
          Receita Federal.
        </p>
        <p>
          Cenário de {scenario.date.split('-').reverse().join('/')}, São Paulo/SP: venda doméstica
          comum, sem benefício ou regime especial. IBS {percentage.format(ibsRate)}% e CBS{' '}
          {percentage.format(Number(reformGroup.gCBS.pCBS))}% são premissas desta resposta
          sintética, não uma projeção da carga definitiva.
        </p>
        <p>
          Modelo atual calculado pelo motor do TaxSim; reformado processado a partir de uma resposta
          simulada versionada. Nenhuma consulta à RFB ao abrir esta página.
        </p>
      </div>
    </section>
  )
}

function ArchitectureDiagram() {
  return (
    <div
      role="img"
      aria-label="A interface Next.js envia requisições à API Fastify. A API acessa PostgreSQL, executa o motor tributário interno e consulta a calculadora RFB; esses três componentes são dependências da API, não uma cadeia entre si."
      className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1.2fr]"
    >
      <div className="border border-zinc-700 bg-zinc-950 p-5">
        <p className="text-sm text-zinc-400">Interface</p>
        <p className="mt-2 text-xl font-semibold">Next.js</p>
      </div>
      <div aria-hidden="true" className="flex justify-center text-emerald-400">
        <ArrowDown className="size-5 md:hidden" />
        <ArrowRight className="hidden size-5 md:block" />
      </div>
      <div className="border border-zinc-700 bg-zinc-950 p-5">
        <p className="text-sm text-zinc-400">Aplicação</p>
        <p className="mt-2 text-xl font-semibold">API Fastify</p>
      </div>
      <div aria-hidden="true" className="flex justify-center text-emerald-400">
        <ArrowDown className="size-5 md:hidden" />
        <ArrowRight className="hidden size-5 md:block" />
      </div>
      <div className="grid gap-2 border-l border-zinc-700 pl-3">
        {['PostgreSQL', 'Motor tributário', 'Calculadora RFB'].map((label) => (
          <div
            key={label}
            className="border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-medium"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

function LandingContent() {
  return (
    <div className="taxsim-landing min-h-screen bg-[#09090b] text-zinc-50 selection:bg-emerald-400 selection:text-zinc-950">
      <Link
        href="#conteudo"
        className="landing-skip-link sr-only z-50 border-2 border-zinc-950 bg-emerald-400 px-4 py-3 font-semibold text-zinc-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </Link>
      <header className="border-b border-zinc-800">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-start gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-8">
          <Link
            href="/"
            aria-label="TaxSim — página inicial"
            className="inline-flex min-h-11 w-fit items-center text-2xl font-bold tracking-tight"
          >
            Tax<span className="text-emerald-400">Sim</span>
          </Link>
          <nav
            aria-label="Navegação principal"
            className="hidden min-h-11 items-center gap-7 text-sm text-zinc-300 md:flex"
          >
            <Link href="#produto" className="hover:text-white">
              Produto
            </Link>
            <Link href="#arquitetura" className="hover:text-white">
              Arquitetura
            </Link>
            <Link href="#qualidade" className="hover:text-white">
              Segurança e acessibilidade
            </Link>
          </nav>
          <div className="justify-self-end">
            <SessionActions header />
          </div>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="focus:outline-none!">
        <section className="mx-auto grid max-w-7xl items-start gap-10 px-5 py-12 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-16">
          <div className="min-w-0 lg:pt-6">
            <h1 className="max-w-xl text-[clamp(2.25rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-balance">
              Do NCM à comparação tributária.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
              Compare o modelo atual com o IVA Dual (IBS/CBS/IS), veja a composição dos tributos e
              entenda o que impede uma simulação.
            </p>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400">
              Demonstração técnica de um SaaS fiscal multi-tenant. Um portfólio full-stack para
              explorar produto, arquitetura e qualidade em funcionamento.
            </p>
            <div className="mt-8">
              <SessionActions />
            </div>
            <div className="mt-4">
              <SessionRecovery />
            </div>
            <a
              href="https://github.com/M-its/taxsim"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-11 items-center text-sm text-zinc-300 underline underline-offset-4 hover:text-white"
            >
              Explorar código e decisões no GitHub{' '}
              <span className="sr-only">(abre em nova aba)</span>
              <ArrowRight aria-hidden="true" className="ml-2 size-4" />
            </a>
          </div>
          <ExampleComparison />
        </section>
        <section
          id="produto"
          aria-labelledby="produto-title"
          className="border-y border-zinc-800 bg-zinc-950"
        >
          <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
            <h2 id="produto-title" className="text-3xl font-semibold tracking-tight">
              Da entrada ao resultado, com diagnóstico.
            </h2>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {capabilities.map(({ title, text, icon: Icon }) => (
                <article key={title}>
                  <Icon aria-hidden="true" className="size-5 text-emerald-400" />
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 max-w-prose text-base leading-7 text-zinc-400">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section
          id="arquitetura"
          aria-labelledby="arquitetura-title"
          className="mx-auto max-w-7xl px-5 py-12 lg:px-8"
        >
          <h2 id="arquitetura-title" className="text-3xl font-semibold tracking-tight">
            Como a simulação acontece.
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-400">
            A API valida a sessão, as entradas e a elegibilidade fiscal. O motor calcula o modelo
            atual; a integração com a calculadora RFB fornece o reformado.
          </p>
          <div className="mt-8">
            <ArchitectureDiagram />
          </div>
          <p className="mt-6 text-sm leading-6 text-zinc-400">
            TypeScript · Next.js · Fastify · PostgreSQL · Prisma · Docker
          </p>
        </section>
        <section
          id="qualidade"
          aria-labelledby="qualidade-title"
          className="border-y border-zinc-800 bg-zinc-950"
        >
          <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
            <h2 id="qualidade-title" className="text-3xl font-semibold tracking-tight">
              Limites claros. Qualidade verificável.
            </h2>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <article>
                <h3 className="text-lg font-semibold">Segurança e confiabilidade</h3>
                <p className="mt-3 text-base leading-7 text-zinc-400">
                  Refresh token HttpOnly com rotação, isolamento por sessão e validação de contratos
                  externos. Falhas de cálculo são explícitas, com circuit breaker na integração.
                </p>
              </article>
              <article>
                <h3 className="text-lg font-semibold">Acessibilidade</h3>
                <p className="mt-3 text-base leading-7 text-zinc-400">
                  Baseline WCAG 2.2 AA nos fluxos principais, teclado e foco gerenciado. Testes axe
                  em desktop e mobile, alternativas textuais e respeito a movimento reduzido.
                </p>
              </article>
            </div>
          </div>
        </section>
        <section className="landing-accent bg-emerald-400 text-zinc-950">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 py-10 md:flex-row md:items-center lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              Explore as decisões em funcionamento.
            </h2>
            <SessionActions onAccent />
          </div>
        </section>
      </main>
      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm leading-6 text-zinc-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p className="max-w-3xl">
            Projeto de demonstração técnica, sem vínculo com a Receita Federal. Não deve ser usado
            para cálculos fiscais reais.
          </p>
          <p className="shrink-0">TaxSim · Mitsrael</p>
        </div>
      </footer>
    </div>
  )
}

export function LandingPage() {
  return (
    <AuthProvider>
      <LandingContent />
    </AuthProvider>
  )
}
