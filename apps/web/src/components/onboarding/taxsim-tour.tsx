'use client'

import { useCallback, useEffect, useRef } from 'react'
import { CircleHelp } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { driver, type DriveStep, type Driver } from 'driver.js'
import { useAuth } from '@/components/auth/auth-provider'
import {
  markTourCompleted,
  readTourStep,
  saveTourStep,
  shouldStartTour,
} from '@/lib/onboarding-tour'

type TourStep = DriveStep & {
  element: string
  route: string
}

const TOUR_STEPS: TourStep[] = [
  {
    route: '/dashboard',
    element: '[data-tour="dashboard-overview"]',
    popover: {
      title: 'Visão geral do TaxSim',
      description:
        'O Dashboard resume a carga tributária, a projeção da reforma e as operações recentes da empresa.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    route: '/simulation',
    element: '[data-tour="simulation-ncm"]',
    waitForElement: 8000,
    popover: {
      title: 'Informe o NCM',
      description:
        'O NCM identifica fiscalmente o produto. Use oito dígitos e informe também o preço e a quantidade.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    route: '/simulation',
    element: '[data-tour="simulation-submit"]',
    popover: {
      title: 'Execute a simulação',
      description:
        'Com os itens preenchidos, calcule o cenário atual e o modelo da Reforma Tributária.',
      side: 'top',
      align: 'end',
    },
  },
  {
    route: '/simulation',
    element: '[data-tour="simulation-results"]',
    popover: {
      title: 'Compare os impostos',
      description:
        'O resultado aparece aqui, lado a lado: tributos do regime atual, IBS/CBS/IS e o impacto projetado.',
      side: 'top',
      align: 'center',
    },
  },
  {
    route: '/products',
    element: '[data-tour="products"]',
    waitForElement: 8000,
    popover: {
      title: 'Catálogo de Produtos',
      description:
        'Cadastre produtos com SKU, NCM e preço para reutilizá-los nas simulações e vendas.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    route: '/settings',
    element: '[data-tour="settings"]',
    waitForElement: 8000,
    popover: {
      title: 'Configurações fiscais',
      description:
        'Revise o regime tributário, a UF e o município da empresa: esses dados influenciam os cálculos.',
      side: 'top',
      align: 'start',
    },
  },
]

function waitForElement(selector: string, timeoutMs: number): Promise<Element | null> {
  const current = document.querySelector(selector)
  if (current) return Promise.resolve(current)

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector)
      if (!element) return

      window.clearTimeout(timeoutId)
      observer.disconnect()
      resolve(element)
    })

    const timeoutId = window.setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, timeoutMs)

    observer.observe(document.body, { childList: true, subtree: true })
  })
}

export function TaxSimTour() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const driverRef = useRef<Driver | null>(null)
  const pathnameRef = useRef(pathname)
  const initializedUserRef = useRef<string | null>(null)
  const launchingStepRef = useRef<number | null>(null)
  const isRouteHandoffRef = useRef(false)

  pathnameRef.current = pathname
  const userId = user?.id ?? null

  const launchStep = useCallback(
    async (stepIndex: number) => {
      if (!userId || launchingStepRef.current === stepIndex || driverRef.current) {
        return
      }

      const tourStep = TOUR_STEPS[stepIndex]
      if (!tourStep) return

      saveTourStep(window.localStorage, userId, stepIndex)

      if (pathnameRef.current !== tourStep.route) {
        router.push(tourStep.route)
        return
      }

      launchingStepRef.current = stepIndex

      try {
        if (stepIndex === 1) {
          const manualModeButton = await waitForElement(
            '[data-tour="simulation-manual-mode"]',
            8000,
          )
          if (manualModeButton instanceof HTMLElement) {
            manualModeButton.click()
          }
        }

        await waitForElement(tourStep.element, 8000)

        if (
          pathnameRef.current !== tourStep.route ||
          readTourStep(window.localStorage, userId, TOUR_STEPS.length) !== stepIndex
        ) {
          return
        }

        let tourDriver: Driver

        const moveToStep = (nextIndex: number) => {
          const nextStep = TOUR_STEPS[nextIndex]
          if (!nextStep) {
            tourDriver.destroy()
            return
          }

          saveTourStep(window.localStorage, userId, nextIndex)

          if (nextStep.route === pathnameRef.current) {
            tourDriver.moveTo(nextIndex)
            return
          }

          isRouteHandoffRef.current = true
          tourDriver.destroy()
          router.push(nextStep.route)
        }

        tourDriver = driver({
          steps: TOUR_STEPS,
          animate: true,
          smoothScroll: true,
          allowClose: true,
          allowScroll: true,
          overlayColor: '#09090b',
          overlayOpacity: 0.82,
          stagePadding: 8,
          stageRadius: 0,
          popoverClass: 'taxsim-tour-popover',
          popoverOffset: 12,
          showProgress: true,
          progressText: '{{current}} de {{total}}',
          nextBtnText: 'Próximo',
          prevBtnText: 'Voltar',
          doneBtnText: 'Concluir',
          onNextClick: (_element, _step, options) => {
            moveToStep((options.index ?? stepIndex) + 1)
          },
          onPrevClick: (_element, _step, options) => {
            moveToStep((options.index ?? stepIndex) - 1)
          },
          onCloseClick: () => tourDriver.destroy(),
          onDoneClick: () => tourDriver.destroy(),
          onDestroyed: () => {
            driverRef.current = null

            if (isRouteHandoffRef.current) {
              isRouteHandoffRef.current = false
              return
            }

            markTourCompleted(window.localStorage, userId)
          },
        })

        driverRef.current = tourDriver
        tourDriver.drive(stepIndex)
      } finally {
        launchingStepRef.current = null
      }
    },
    [router, userId],
  )

  useEffect(() => {
    if (!userId) return

    const savedStep = readTourStep(window.localStorage, userId, TOUR_STEPS.length)

    if (savedStep !== null) {
      void launchStep(savedStep)
      return
    }

    if (initializedUserRef.current === userId) return
    initializedUserRef.current = userId

    if (shouldStartTour(window.localStorage, userId, 'automatic')) {
      void launchStep(0)
    }
  }, [launchStep, pathname, userId])

  useEffect(() => {
    return () => {
      if (!driverRef.current) return
      isRouteHandoffRef.current = true
      driverRef.current.destroy()
    }
  }, [])

  function handleRestartTour() {
    if (!userId || !shouldStartTour(window.localStorage, userId, 'manual')) {
      return
    }

    if (driverRef.current) {
      isRouteHandoffRef.current = true
      driverRef.current.destroy()
    }

    saveTourStep(window.localStorage, userId, 0)
    void launchStep(0)
  }

  return (
    <button
      type="button"
      onClick={handleRestartTour}
      className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-none border border-[#34d399]/30 bg-[#18181b] px-3 py-2 text-sm font-medium text-[#fafafa] shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-colors hover:border-[#34d399] hover:bg-[#1f2a1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d399]/50"
      aria-label="Reabrir tour guiado"
    >
      <CircleHelp className="h-4 w-4 text-[#34d399]" />
      <span>Ajuda / Tour</span>
    </button>
  )
}
