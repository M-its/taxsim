'use client'

import { Info } from 'lucide-react'

export function ComplianceBanner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`mx-auto flex w-full items-start justify-center gap-2 px-4 pt-4 text-xs text-[#71717a] ${className}`}
    >
      <Info
        className="mt-0.5 h-3 w-3 shrink-0 text-[#71717a]"
        aria-hidden="true"
      />
      <span>
        Este projeto é uma demonstração técnica de portfólio desenvolvida por
        Mitsrael ({' '}
        <a
          href="https://github.com/M-its"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#a1a1aa] transition-colors hover:text-[#fafafa]"
        >
          github.com/M-its
        </a>{' '}
        ). Não possui vínculo com a Receita Federal do Brasil. Os cálculos são
        baseados na calculadora oficial da RFB (uso público) e podem não
        refletir a legislação mais recente. Não utilize para fins fiscais reais.
      </span>
    </div>
  )
}
