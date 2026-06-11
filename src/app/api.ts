// api.ts

const BASE_URL = 'https://economia.awesomeapi.com.br/json';

// Interface para a cotação retornada pela API
interface CotacaoAPI {
  bid: string;
  ask: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
}

// Interface para a cotação normalizada (números)
interface CotacaoNormalizada {
  bid: number;
  ask: number;
  high: number;
  low: number;
  varBid: number;
  pctChange: number;
}

// Interface para o retorno da função converter
interface RespostaConversao {
  [key: string]: CotacaoNormalizada;
}

// Interface para o cache
interface CacheEntry {
  timestamp: number;
  dados: RespostaConversao;
}

// Tipo para o objeto de moedas estáticas
type MoedasEstaticas = Record<string, string>;

// Tipo para as taxas base
type TaxasBaseBRL = Record<string, number>;

const MOEDAS_ESTATICAS: MoedasEstaticas = {
  USD: 'Dólar Americano',
  EUR: 'Euro',
  GBP: 'Libra Esterlina',
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  ARS: 'Peso Argentino',
  JPY: 'Iene Japonês',
  CAD: 'Dólar Canadense',
  AUD: 'Dólar Australiano',
  CHF: 'Franco Suíço',
  CNY: 'Yuan Chinês',
  MXN: 'Peso Mexicano',
  CLP: 'Peso Chileno',
  COP: 'Peso Colombiano',
  PEN: 'Sol Peruano',
  UYU: 'Peso Uruguaio',
  BOB: 'Boliviano',
  PYG: 'Guarani Paraguaio',
  VES: 'Bolívar Venezuelano',
  NOK: 'Coroa Norueguesa',
  SEK: 'Coroa Sueca',
  DKK: 'Coroa Dinamarquesa',
  NZD: 'Dólar Neozelandês',
  SGD: 'Dólar de Singapura',
  HKD: 'Dólar de Hong Kong',
  KRW: 'Won Sul-Coreano',
  INR: 'Rúpia Indiana',
  ZAR: 'Rand Sul-Africano',
  TRY: 'Lira Turca',
  RUB: 'Rublo Russo',
};

const cache = new Map<string, CacheEntry>();
const TTL = 90000; // 90 segundos
let ultimaRequisicao: number = 0;
const MIN_INTERVALO = 3000; // 3 segundos

// Tabela de taxas base (sempre em relação ao BRL)
const TAXAS_BASE_BRL: TaxasBaseBRL = {
  USD: 5.12,
  EUR: 5.48,
  BTC: 350000,
  GBP: 6.35,
  ARS: 0.011,
  JPY: 0.035,
};

// Gera mock para QUALQUER par usando taxas base ou inversão
function gerarMock(origem: string, destino: string): CotacaoNormalizada {
  // Se for par direto com BRL (ex: USD-BRL)
  if (destino === 'BRL' && TAXAS_BASE_BRL[origem]) {
    const taxa = TAXAS_BASE_BRL[origem];
    return {
      bid: taxa,
      ask: taxa * 1.01,
      high: taxa * 1.02,
      low: taxa * 0.98,
      varBid: 0,
      pctChange: 0,
    };
  }
  // Se for BRL para outra moeda (ex: BRL-USD) → usa inversa
  if (origem === 'BRL' && TAXAS_BASE_BRL[destino]) {
    const taxa = 1 / TAXAS_BASE_BRL[destino];
    return {
      bid: taxa,
      ask: taxa * 1.01,
      high: taxa * 1.02,
      low: taxa * 0.98,
      varBid: 0,
      pctChange: 0,
    };
  }
  // Pares entre duas moedas estrangeiras (ex: USD-EUR) → estimativa via BRL
  if (TAXAS_BASE_BRL[origem] && TAXAS_BASE_BRL[destino]) {
    const taxa = TAXAS_BASE_BRL[destino] / TAXAS_BASE_BRL[origem];
    return {
      bid: taxa,
      ask: taxa * 1.01,
      high: taxa * 1.02,
      low: taxa * 0.98,
      varBid: 0,
      pctChange: 0,
    };
  }
  // Fallback genérico (nunca deve chegar aqui)
  const taxa = 1.0;
  return {
    bid: taxa,
    ask: taxa * 1.01,
    high: taxa * 1.02,
    low: taxa * 0.98,
    varBid: 0,
    pctChange: 0,
  };
}

async function aguardarIntervalo(): Promise<void> {
  const agora = Date.now();
  const decorrido = agora - ultimaRequisicao;
  if (decorrido < MIN_INTERVALO) {
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVALO - decorrido));
  }
  ultimaRequisicao = Date.now();
}

async function fetchWithRetry(par: string, tentativa: number = 1): Promise<any> {
  const maxTentativas = 2;
  const backoff = tentativa * 1500;
  try {
    const resposta = await fetch(`${BASE_URL}/last/${par}`);
    if (!resposta.ok) {
      if (resposta.status === 429 && tentativa < maxTentativas) {
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(par, tentativa + 1);
      }
      throw new Error(`HTTP ${resposta.status}`);
    }
    return await resposta.json();
  } catch (error) {
    if (tentativa < maxTentativas && error instanceof Error && error.message.includes('429')) {
      return fetchWithRetry(par, tentativa + 1);
    }
    throw error;
  }
}

export async function buscarMoedas(): Promise<MoedasEstaticas> {
  return MOEDAS_ESTATICAS;
}

export async function converter(origem: string, destino: string): Promise<RespostaConversao> {
  const de = origem.trim().toUpperCase();
  const para = destino.trim().toUpperCase();
  const chaveCache = `${de}-${para}`;
  const chaveEsperada = `${de}${para}`;

  // Verifica cache
  const cached = cache.get(chaveCache);
  if (cached && (Date.now() - cached.timestamp) < TTL) {
    return cached.dados;
  }

  await aguardarIntervalo();
  const par = `${de}-${para}`;

  try {
    const dados: Record<string, CotacaoAPI> = await fetchWithRetry(par);
    let chaveReal: string = chaveEsperada;
    if (!dados[chaveReal]) {
      const alternativas = Object.keys(dados);
      const encontrada = alternativas.find(k =>
        k.toUpperCase() === chaveEsperada || k.toUpperCase().replace('-', '') === chaveEsperada
      );
      if (encontrada) chaveReal = encontrada;
      else throw new Error(`Chave ${chaveEsperada} não encontrada`);
    }
    const cotacao = dados[chaveReal];
    const normalizada: CotacaoNormalizada = {
      bid: Number(cotacao.bid) || 0,
      ask: Number(cotacao.ask) || 0,
      high: Number(cotacao.high) || 0,
      low: Number(cotacao.low) || 0,
      varBid: Number(cotacao.varBid) || 0,
      pctChange: Number(cotacao.pctChange) || 0,
    };
    const resultado: RespostaConversao = { [chaveEsperada]: normalizada };
    cache.set(chaveCache, { timestamp: Date.now(), dados: resultado });
    return resultado;
  } catch (error) {
    console.warn(`⚠️ Mock para ${de}→${para}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    const mockData = gerarMock(de, para);
    const resultadoMock: RespostaConversao = { [chaveEsperada]: mockData };
    // Guarda mock no cache por 30 segundos
    cache.set(chaveCache, { timestamp: Date.now() + 30000, dados: resultadoMock });
    return resultadoMock;
  }
}