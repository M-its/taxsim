'use client'

import type { CSSProperties } from 'react'

type PageStateAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never }

interface PageStateProps {
  title: string
  description: string
  code?: string
  primaryAction: PageStateAction
  secondaryAction?: PageStateAction
  fullScreen?: boolean
  supportId?: string
  technicalDetails?: string
}

const actionStyle: CSSProperties = {
  alignItems: 'center',
  backgroundColor: '#34d399',
  border: '1px solid #34d399',
  color: '#09090b',
  cursor: 'pointer',
  display: 'inline-flex',
  fontSize: '0.875rem',
  fontWeight: 600,
  justifyContent: 'center',
  minHeight: '2.5rem',
  padding: '0.5rem 1rem',
  textDecoration: 'none',
}

const secondaryActionStyle: CSSProperties = {
  ...actionStyle,
  backgroundColor: 'transparent',
  borderColor: '#3f3f46',
  color: '#fafafa',
}

function Action({
  action,
  secondary = false,
}: {
  action: PageStateAction
  secondary?: boolean
}) {
  const style = secondary ? secondaryActionStyle : actionStyle

  if (action.href) {
    return <a href={action.href} style={style}>{action.label}</a>
  }

  return (
    <button type="button" onClick={action.onClick} style={style}>
      {action.label}
    </button>
  )
}

export function PageState({
  title,
  description,
  code,
  primaryAction,
  secondaryAction,
  fullScreen = false,
  supportId,
  technicalDetails,
}: PageStateProps) {
  return (
    <section
      aria-labelledby="page-state-title"
      style={{
        alignItems: 'center',
        backgroundColor: fullScreen ? '#09090b' : '#18181b',
        border: fullScreen ? 'none' : '1px solid #27272a',
        color: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: fullScreen ? '100vh' : 'min(70vh, 40rem)',
        padding: '2rem 1rem',
        textAlign: 'center',
      }}
    >
      {code && (
        <p
          aria-hidden="true"
          style={{
            color: '#34d399',
            fontSize: 'clamp(2.5rem, 10vw, 4rem)',
            fontWeight: 700,
            lineHeight: 1,
            margin: '0 0 0.75rem',
          }}
        >
          {code}
        </p>
      )}
      <h1
        id="page-state-title"
        style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}
      >
        {title}
      </h1>
      <p
        style={{
          color: '#a1a1aa',
          margin: '0.75rem 0 0',
          maxWidth: '34rem',
        }}
      >
        {description}
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'center',
          marginTop: '1.5rem',
        }}
      >
        <Action action={primaryAction} />
        {secondaryAction && <Action action={secondaryAction} secondary />}
      </div>
      {supportId && (
        <p style={{ color: '#71717a', fontSize: '0.75rem', margin: '1.25rem 0 0' }}>
          Identificador para suporte: <code>{supportId}</code>
        </p>
      )}
      {technicalDetails && (
        <details
          style={{
            color: '#a1a1aa',
            fontSize: '0.75rem',
            marginTop: '1rem',
            maxWidth: '42rem',
            textAlign: 'left',
          }}
        >
          <summary style={{ cursor: 'pointer' }}>Detalhes técnicos (desenvolvimento)</summary>
          <pre style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
            {technicalDetails}
          </pre>
        </details>
      )}
    </section>
  )
}

export function ErrorState(
  props: Omit<PageStateProps, 'title' | 'description'> &
    Partial<Pick<PageStateProps, 'title' | 'description'>>,
) {
  return (
    <PageState
      {...props}
      title={props.title ?? 'Não foi possível carregar esta página'}
      description={
        props.description ??
        'Ocorreu um erro inesperado. Tente novamente em alguns instantes.'
      }
    />
  )
}
