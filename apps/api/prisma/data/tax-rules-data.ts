/**
 * Seed de Regras Fiscais (Tax Rules) - ERP SaaS
 *
 * Este arquivo contém alíquotas reais de PIS, COFINS, ICMS e ISS para os NCMs mais comuns
 * no mercado brasileiro, contemplando os regimes tributários SIMPLES_NACIONAL, LUCRO_PRESUMIDO e LUCRO_REAL.
 *
 * Os dados seguem a legislação vigente em 2026, com base na Reforma Tributária (LC 214/2025)
 * para os campos cClassTrib (6 dígitos) e cst (3 dígitos).
 *
 * Observações:
 * - Alíquotas do Simples Nacional são efetivas (proporção do total pago no regime), baseadas no Anexo I (comércio) e Anexo III (serviços).
 * - ICMS médio nacional de 18% para produtos; valores diferenciados para bebidas alcoólicas e cigarros.
 * - Produtos sujeitos ao Imposto Seletivo permanecem na regra geral de IBS/CBS; o IS é tratado separadamente.
 * - Para serviços (software), utiliza-se NCM fictício "99999999" e alíquota de ISS de 5%.
 *
 * Formato compatível com Prisma e o schema TaxRule.
 */

const taxRules = [
  // =============================================
  // 1. NCM 84713012 - Notebook
  // =============================================
  {
    ncmCode: '84713012',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '84713012',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '84713012',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 2. NCM 85171200 - Smartphone
  // =============================================
  {
    ncmCode: '85171200',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '85171200',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '85171200',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 3. NCM 84713019 - Tablet
  // =============================================
  {
    ncmCode: '84713019',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '84713019',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '84713019',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 4. NCM 85285200 - Monitor
  // =============================================
  {
    ncmCode: '85285200',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '85285200',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '85285200',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 5. NCM 84716052 - Teclado
  // =============================================
  {
    ncmCode: '84716052',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '84716052',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '84716052',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 6. NCM 84716053 - Mouse
  // =============================================
  {
    ncmCode: '84716053',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '84716053',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '84716053',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 7. NCM 61091000 - Camiseta de algodão
  // =============================================
  {
    ncmCode: '61091000',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '61091000',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '61091000',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 8. NCM 62034200 - Calça de algodão (masculina)
  // =============================================
  {
    ncmCode: '62034200',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '62034200',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '62034200',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 9. NCM 64039900 - Calçado de couro
  // =============================================
  {
    ncmCode: '64039900',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '64039900',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '64039900',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 10. NCM 22021000 - Refrigerante
  // =============================================
  {
    ncmCode: '22021000',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '22021000',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '22021000',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 11. NCM 20019000 - Conserva de legumes
  // =============================================
  {
    ncmCode: '20019000',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '20019000',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '20019000',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 12. NCM 48025610 - Papel A4 para impressão
  // =============================================
  {
    ncmCode: '48025610',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '48025610',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '48025610',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 13. NCM 96081000 - Caneta esferográfica
  // =============================================
  {
    ncmCode: '96081000',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '96081000',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '96081000',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 14. NCM 94033000 - Móvel de madeira para escritório
  // =============================================
  {
    ncmCode: '94033000',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '94033000',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '94033000',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 15. NCM 87032210 - Veículo de passageiros (Imposto Seletivo)
  // =============================================
  {
    ncmCode: '87032210',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001', // regra geral de IBS/CBS; o Imposto Seletivo é tratado separadamente
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '87032210',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '87032210',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 16. NCM 22030000 - Cerveja (Imposto Seletivo)
  // =============================================
  {
    ncmCode: '22030000',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '22030000',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.2500', // ICMS mais alto para cerveja
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '22030000',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.2500',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 17. NCM 22082000 - Destilados (aguardente, etc.) - Imposto Seletivo
  // =============================================
  {
    ncmCode: '22082000',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '22082000',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.2500',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '22082000',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.2500',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 18. NCM 24022000 - Cigarros (Imposto Seletivo)
  // =============================================
  {
    ncmCode: '24022000',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '24022000',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.3000', // ICMS elevado para cigarros
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '24022000',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.3000',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 19. NCM 85235100 - Dispositivo de memória (pendrive)
  // =============================================
  {
    ncmCode: '85235100',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '85235100',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '85235100',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 20. NCM 84715000 - Computador desktop
  // =============================================
  {
    ncmCode: '84715000',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0191',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '84715000',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '84715000',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.1800',
    issRate: '0.0000',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },

  // =============================================
  // 21. NCM 99999999 (fictício) - Software (serviço) - tributado via ISS
  // =============================================
  {
    ncmCode: '99999999',
    taxRegime: 'SIMPLES_NACIONAL',
    pisRate: '0.0011',
    cofinsRate: '0.0051',
    icmsRate: '0.0000',
    issRate: '0.0500', // ISS 5% (média nacional)
    cClassTrib: '000001', // regra geral de IBS/CBS para software genérico
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '99999999',
    taxRegime: 'LUCRO_PRESUMIDO',
    pisRate: '0.0065',
    cofinsRate: '0.0300',
    icmsRate: '0.0000',
    issRate: '0.0500',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
  {
    ncmCode: '99999999',
    taxRegime: 'LUCRO_REAL',
    pisRate: '0.0165',
    cofinsRate: '0.0760',
    icmsRate: '0.0000',
    issRate: '0.0500',
    cClassTrib: '000001',
    cst: '000',
    status: 'ACTIVE',
  },
]

export default taxRules
