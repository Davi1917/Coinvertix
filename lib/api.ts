// api.ts

const BASE_URL = 'https://economia.awesomeapi.com.br/json';

// Interface para a moeda utilizada no seletor do app
export interface Moeda {
  codigo: string;
  nome: string;
  bandeira: string;
}

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
export interface CotacaoNormalizada {
  bid: number;
  ask: number;
  high: number;
  low: number;
  varBid: number;
  pctChange: number;
}

// Interface para o retorno interno de conversão
interface RespostaConversao {
  [key: string]: CotacaoNormalizada;
}

// Interface para o cache
interface CacheEntry {
  timestamp: number;
  dados: RespostaConversao;
}

const MOEDAS_ESTATICAS: Record<string, string> = {
  USD: 'Dólar Americano',
  EUR: 'Euro',
  GBP: 'Libra Esterlina',
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  ARS: 'Peso Argentino',
  JPY: 'Iene Japonês',
  BRL: 'Real Brasileiro',
  CAD: 'Dólar Canadense',
  AUD: 'Dólar Australiano',
  CHF: 'Franco Suíço',
  CNY: 'Yuan Chinês',
  ILS: 'Novo Shekel Israelense',
};

const BANDEIRAS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', BTC: '₿', ETH: '♦️',
  ARS: '🇦🇷', JPY: '🇯🇵', BRL: '🇧🇷', CAD: '🇨🇦', AUD: '🇦🇺',
  CHF: '🇨🇭', CNY: '🇨🇳', ILS: '🇮🇱',
};

// Taxas fixas de backup baseadas em BRL
const TAXAS_BASE_BRL: Record<string, number> = {
  USD: 5.00, EUR: 5.40, GBP: 6.30, BTC: 350000, ETH: 18000,
  ARS: 0.0058, JPY: 0.032, BRL: 1.0, CAD: 3.65, AUD: 3.30,
  CHF: 5.55, CNY: 0.69, ILS: 1.35,
};

const cache = new Map<string, CacheEntry>();
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutos

let ultimoFetchTime = 0;
async function aguardarIntervalo(): Promise<void> {
  const agora = Date.now();
  const diff = agora - ultimoFetchTime;
  if (diff < 200) {
    await new Promise((resolve) => setTimeout(resolve, 200 - diff));
  }
  ultimoFetchTime = Date.now();
}

async function fetchWithRetry(urlPart: string, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/last/${urlPart}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
}

/**
 * Retorna uma lista de moedas estruturadas e tipadas para popular os seletores do App.
 */
export async function buscarMoedas(): Promise<Moeda[]> {
  return Object.keys(MOEDAS_ESTATICAS).map((codigo) => ({
    codigo,
    nome: MOEDAS_ESTATICAS[codigo],
    bandeira: BANDEIRAS[codigo] || '🏳️',
  }));
}

/**
 * Consulta a taxa interna de conversão direta. Retorna a cotação normalizada completa.
 */
export async function converterApi(de: string, para: string): Promise<RespostaConversao> {
  const deUpper = de.toUpperCase();
  const paraUpper = para.toUpperCase();
  const chaveEsperada = `${deUpper}${paraUpper}`;
  const chaveCache = `${deUpper}-${paraUpper}`;

  const cached = cache.get(chaveCache);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
    return cached.dados;
  }

  await aguardarIntervalo();
  const par = `${deUpper}-${paraUpper}`;

  try {
    const dados: Record<string, CotacaoAPI> = await fetchWithRetry(par);
    let chaveReal: string = chaveEsperada;
    if (!dados[chaveReal]) {
      const alternativas = Object.keys(dados);
      const encontrada = alternativas.find(
        (k) => k.toUpperCase() === chaveEsperada || k.toUpperCase().replace('-', '') === chaveEsperada
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
    console.warn(`⚠️ Mock para ${deUpper}→${paraUpper}:`, error instanceof Error ? error.message : error);

    const taxaDeParaBRL = TAXAS_BASE_BRL[deUpper] || 1.0;
    const taxaParaParaBRL = TAXAS_BASE_BRL[paraUpper] || 1.0;
    const taxaCruzada = taxaDeParaBRL / taxaParaParaBRL;

    const mockResultado: RespostaConversao = {
      [chaveEsperada]: {
        bid: taxaCruzada,
        ask: taxaCruzada * 1.002,
        high: taxaCruzada * 1.01,
        low: taxaCruzada * 0.99,
        varBid: 0,
        pctChange: 0,
      },
    };
    return mockResultado;
  }
}

/**
 * Função simplificada utilizada por 'conversao.tsx'. 
 * Resolve taxas cruzadas através do BRL se o par direto falhar ou não existir, 
 * retornando um número válido de forma estrita.
 */
export async function converter(de: string, para: string): Promise<number> {
  const deUpper = de.toUpperCase();
  const paraUpper = para.toUpperCase();

  if (deUpper === paraUpper) return 1.0;

  // 1. Tenta conversão direta pelo par nativo da API
  try {
    const chaveEsperada = `${deUpper}${paraUpper}`;
    const dados = await converterApi(deUpper, paraUpper);
    if (dados && dados[chaveEsperada]) {
      return dados[chaveEsperada].bid;
    }
  } catch {
    // Falha na rota direta, avança para o cálculo de arbitragem mercantil por BRL
  }

  // 2. Cálculo mercantil cruzado: converter 'DE' para BRL e depois de BRL para 'PARA'
  try {
    let taxaDeParaBrl = 1.0;
    if (deUpper !== 'BRL') {
      const parDeBrl = `${deUpper}BRL`;
      const resDe = await converterApi(deUpper, 'BRL');
      taxaDeParaBrl = resDe[parDeBrl]?.bid || TAXAS_BASE_BRL[deUpper] || 1.0;
    }

    let taxaBrlParaDestino = 1.0;
    if (paraUpper !== 'BRL') {
      const parParaBrl = `${paraUpper}BRL`;
      const resPara = await converterApi(paraUpper, 'BRL');
      const taxaParaParaBrl = resPara[parParaBrl]?.bid || TAXAS_BASE_BRL[paraUpper] || 1.0;
      taxaBrlParaDestino = 1 / taxaParaParaBrl;
    }

    return taxaDeParaBrl * taxaBrlParaDestino;
  } catch (err) {
    console.error('Falha crítica no cálculo de taxas cruzadas:', err);
    // Última linha de defesa: Backup estático absoluto
    const backupDe = TAXAS_BASE_BRL[deUpper] || 1.0;
    const backupPara = TAXAS_BASE_BRL[paraUpper] || 1.0;
    return backupDe / backupPara;
  }
}