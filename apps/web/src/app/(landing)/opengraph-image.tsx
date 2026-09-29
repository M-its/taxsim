import { ImageResponse } from 'next/og'

export const alt =
  'TaxSim — demonstração técnica de engenharia fiscal para a Reforma Tributária'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#09090b',
          color: '#fafafa',
          padding: '68px 76px',
          fontFamily: 'Arial, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage:
              'linear-gradient(rgba(63,63,70,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(63,63,70,0.22) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'linear-gradient(to left, black, transparent 74%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '14px',
            height: '100%',
            display: 'flex',
            background: '#34d399',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 24,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ display: 'flex', fontWeight: 700 }}>TaxSim</span>
          <span style={{ display: 'flex', color: '#a1a1aa', fontSize: 18 }}>
            demonstração técnica
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: '860px' }}>
          <div
            style={{
              display: 'flex',
              color: '#34d399',
              fontSize: 20,
              letterSpacing: '0.12em',
              marginBottom: 22,
              textTransform: 'uppercase',
            }}
          >
            Portfólio full-stack
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 62,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: '-0.045em',
            }}
          >
            Engenharia fiscal para uma reforma em movimento.
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid #3f3f46',
            paddingTop: 24,
            color: '#a1a1aa',
            fontSize: 18,
          }}
        >
          <span style={{ display: 'flex' }}>Next.js · Fastify · PostgreSQL · TypeScript</span>
          <span style={{ display: 'flex', color: '#34d399' }}>taxsim-web.duckdns.org</span>
        </div>
      </div>
    ),
    size,
  )
}
