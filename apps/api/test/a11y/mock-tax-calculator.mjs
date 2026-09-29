import { createServer } from 'node:http'

const port = Number(process.env.MOCK_CALCULATOR_PORT ?? 8080)

function money(value) {
  return Number(value).toFixed(2)
}

const server = createServer((request, response) => {
  if (request.method === 'GET' && (request.url === '/health' || request.url === '/api')) {
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ status: 'ok', service: 'deterministic-tax-calculator' }))
    return
  }

  if (request.method !== 'POST' || request.url !== '/api/calculadora/regime-geral') {
    response.writeHead(404, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ error: 'not_found' }))
    return
  }

  let rawBody = ''
  request.setEncoding('utf8')
  request.on('data', (chunk) => {
    rawBody += chunk
  })
  request.on('end', () => {
    try {
      const input = JSON.parse(rawBody)
      const objetos = input.itens.map((item) => {
        const ibs = Number(item.baseCalculo) * 0.18
        const cbs = Number(item.baseCalculo) * 0.09
        return {
          nObj: item.numero,
          tribCalc: {
            IBSCBS: {
              gIBSCBS: {
                gIBSUF: { pIBSUF: '0.1200' },
                gIBSMun: { pIBSMun: '0.0600' },
                vIBS: money(ibs),
                gCBS: { pCBS: '0.0900', vCBS: money(cbs) },
              },
            },
          },
        }
      })

      const totalIbs = objetos.reduce(
        (sum, item) => sum + Number(item.tribCalc.IBSCBS.gIBSCBS.vIBS),
        0,
      )
      const totalCbs = objetos.reduce(
        (sum, item) => sum + Number(item.tribCalc.IBSCBS.gIBSCBS.gCBS.vCBS),
        0,
      )

      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end(
        JSON.stringify({
          objetos,
          total: {
            tribCalc: {
              IBSCBSTot: {
                gIBS: { vIBS: money(totalIbs) },
                gCBS: { vCBS: money(totalCbs) },
              },
            },
          },
        }),
      )
    } catch {
      response.writeHead(400, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: 'invalid_json' }))
    }
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Deterministic tax calculator listening on ${port}`)
})
