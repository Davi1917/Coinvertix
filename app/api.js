const BASE_URL = 'https://economia.awesomeapi.com.br/json';

export const MOEDAS_ESTATICAS = {
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
  CNH: 'Yuan Chinês (offshore)',
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

// Taxas de referência em relação ao BRL
// Usadas como fallback mock quando a API falha
const TAXAS_BASE_BRL = {
  USD: 5.12,
  EUR: 5.48,
  GBP: 6.35,
  BTC: 350000,
  ETH: 18000,
  ARS: 0.011,
  JPY: 0.035,
  CAD: 3.75,
  AUD: 3.30,
  CHF: 5.70,
  CNY: 0.71,
  CNH: 0.71,
  MXN: 0.30,
  CLP: 0.0056,
  COP: 0.0013,
  PEN: 1.38,
  UYU: 0.13,
  NOK: 0.48,
  SEK: 0.49,
  DKK: 0.74,
  NZD: 3.10,
  SGD: 3.80,
  HKD: 0.66,
  KRW: 0.0039,
  INR: 0.062,
  ZAR: 0.28,
  TRY: 0.16,
  RUB: 0.057,
};

// Cache em memória: chave → { timestamp, dados }
const cache = new Map();
const TTL = 90000;          // 90s — tempo de vida de cada entrada
let ultimaRequisicao = 0;
const MIN_INTERVALO  = 1500; // 1.5s entre requisições individuais

// ─── Helpers internos ────────────────────────────────────────────────────────

function gerarMock(origem, destino) {
  let taxa = 1.0;

  if (destino === 'BRL' && TAXAS_BASE_BRL[origem]) {
    taxa = TAXAS_BASE_BRL[origem];
  } else if (origem === 'BRL' && TAXAS_BASE_BRL[destino]) {
    taxa = 1 / TAXAS_BASE_BRL[destino];
  } else if (TAXAS_BASE_BRL[origem] && TAXAS_BASE_BRL[destino]) {
    taxa = TAXAS_BASE_BRL[destino] / TAXAS_BASE_BRL[origem];
  }

  return {
    bid:       taxa,
    ask:       taxa * 1.01,
    high:      taxa * 1.02,
    low:       taxa * 0.98,
    varBid:    0,
    pctChange: 0,
  };
}

function normalizarCotacao(cotacao) {
  return {
    ...cotacao,
    bid:       Number(cotacao.bid)       || 0,
    ask:       Number(cotacao.ask)       || 0,
    high:      Number(cotacao.high)      || 0,
    low:       Number(cotacao.low)       || 0,
    varBid:    Number(cotacao.varBid)    || 0,
    pctChange: Number(cotacao.pctChange) || 0,
  };
}

async function aguardarIntervalo() {
  const decorrido = Date.now() - ultimaRequisicao;
  if (decorrido < MIN_INTERVALO) {
    await new Promise(r => setTimeout(r, MIN_INTERVALO - decorrido));
  }
  ultimaRequisicao = Date.now();
}

async function fetchComRetry(url, tentativa = 1) {
  const MAX = 2;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429 && tentativa < MAX) {
        await new Promise(r => setTimeout(r, tentativa * 2000));
        return fetchComRetry(url, tentativa + 1);
      }
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (tentativa < MAX) {
      await new Promise(r => setTimeout(r, tentativa * 2000));
      return fetchComRetry(url, tentativa + 1);
    }
    throw err;
  }
}

// ─── Exports públicos ─────────────────────────────────────────────────────────

export async function buscarMoedas() {
  return MOEDAS_ESTATICAS;
}

/**
 * Converte um único par (ex: converter('USD', 'BRL'))
 * Retorna { USDBRL: { bid, ask, high, low, varBid, pctChange } }
 */
export async function converter(origem, destino) {
  const de   = origem.trim().toUpperCase();
  const para  = destino.trim().toUpperCase();
  const chave = `${de}${para}`;
  const cacheKey = `${de}-${para}`;

  // Cache válido?
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < TTL) {
    return cached.dados;
  }

  await aguardarIntervalo();

  try {
    const dados = await fetchComRetry(`${BASE_URL}/last/${de}-${para}`);

    // A API pode retornar a chave com capitalização diferente
    const chaveReal =
      dados[chave] ? chave :
      Object.keys(dados).find(k => k.toUpperCase() === chave) ||
      chave;

    if (!dados[chaveReal]) throw new Error(`Chave ${chave} não encontrada`);

    const resultado = { [chave]: normalizarCotacao(dados[chaveReal]) };
    cache.set(cacheKey, { timestamp: Date.now(), dados: resultado });
    return resultado;

  } catch (err) {
    console.warn(`⚠️  Mock ativado para ${de}→${para}: ${err.message}`);
    const mock = { [chave]: gerarMock(de, para) };
    cache.set(cacheKey, { timestamp: Date.now(), dados: mock });
    return mock;
  }
}

/**
 * Converte múltiplos pares em UMA só requisição à API.
 * 
 * Uso:
 *   const resultado = await converterMultiplos([
 *     ['BRL', 'USD'],
 *     ['BRL', 'EUR'],
 *     ['BRL', 'JPY'],
 *   ]);
 *   // resultado['BRLUSD'].bid  → taxa BRL→USD
 * 
 * Pares já em cache são excluídos da requisição.
 * Se a API falhar, todos recebem mock.
 */
export async function converterMultiplos(pares) {
  const agora = Date.now();
  const resultado = {};
  const paraFetch = [];

  // Separa o que já está em cache do que precisa buscar
  for (const [origem, destino] of pares) {
    const de       = origem.trim().toUpperCase();
    const para     = destino.trim().toUpperCase();
    const chave    = `${de}${para}`;
    const cacheKey = `${de}-${para}`;
    const cached   = cache.get(cacheKey);

    if (cached && (agora - cached.timestamp) < TTL) {
      resultado[chave] = cached.dados[chave];
    } else {
      paraFetch.push({ de, para, chave, cacheKey });
    }
  }

  if (paraFetch.length === 0) return resultado;

  await aguardarIntervalo();

  const query = paraFetch.map(p => `${p.de}-${p.para}`).join(',');

  try {
    const dados = await fetchComRetry(`${BASE_URL}/last/${query}`);

    for (const { de, para, chave, cacheKey } of paraFetch) {
      const chaveReal =
        dados[chave] ? chave :
        Object.keys(dados).find(k => k.toUpperCase() === chave) ||
        chave;

      if (dados[chaveReal]) {
        const normalizada = normalizarCotacao(dados[chaveReal]);
        resultado[chave] = normalizada;
        cache.set(cacheKey, { timestamp: Date.now(), dados: { [chave]: normalizada } });
      } else {
        // Par não veio na resposta — usa mock
        const mock = gerarMock(de, para);
        resultado[chave] = mock;
        cache.set(cacheKey, { timestamp: Date.now(), dados: { [chave]: mock } });
      }
    }
  } catch (err) {
    console.warn(`⚠️  Mock em lote (${query}): ${err.message}`);
    for (const { de, para, chave, cacheKey } of paraFetch) {
      const mock = gerarMock(de, para);
      resultado[chave] = mock;
      cache.set(cacheKey, { timestamp: Date.now(), dados: { [chave]: mock } });
    }
  }}