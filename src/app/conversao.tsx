import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const BASE_URL = 'https://economia.awesomeapi.com.br/json';

type Cotacao = {
  bid: number;
  ask: number;
  high: number;
  low: number;
  varBid: number;
  pctChange: number;
};

type ResultadoConversao = {
  [key: string]: Cotacao;
};

type CacheItem = {
  timestamp: number;
  dados: ResultadoConversao;
};

const MOEDAS: Record<string, string> = {
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
  BRL: 'Real Brasileiro',
};

const cache = new Map<string, CacheItem>();

const TTL = 90000;

async function converter(
  origem: string,
  destino: string
): Promise<ResultadoConversao> {
  const chaveCache = `${origem}-${destino}`;

  const cached = cache.get(chaveCache);

  if (cached && Date.now() - cached.timestamp < TTL) {
    return cached.dados;
  }

  const resposta = await fetch(
    `${BASE_URL}/last/${origem}-${destino}`
  );

  if (!resposta.ok) {
    throw new Error('Erro ao consultar API');
  }

  const dados = await resposta.json();

  const resultado: ResultadoConversao = {};

  Object.keys(dados).forEach((chave) => {
    resultado[chave] = {
      bid: Number(dados[chave].bid),
      ask: Number(dados[chave].ask),
      high: Number(dados[chave].high),
      low: Number(dados[chave].low),
      varBid: Number(dados[chave].varBid),
      pctChange: Number(dados[chave].pctChange),
    };
  });

  cache.set(chaveCache, {
    timestamp: Date.now(),
    dados: resultado,
  });

  return resultado;
}

export default function Conversao() {
  const [valor, setValor] = useState('1');

  const [origem, setOrigem] = useState('USD');
  const [destino, setDestino] = useState('BRL');

  const [resultado, setResultado] = useState('');
  const [taxa, setTaxa] = useState('');

  const [loading, setLoading] = useState(false);

  async function realizarConversao() {
    try {
      setLoading(true);

      const dados = await converter(origem, destino);

      const chave = `${origem}${destino}`;

      const cotacao = dados[chave];

      if (!cotacao) {
        throw new Error('Par de moedas não encontrado');
      }

      const valorNumerico =
        Number(valor.replace(',', '.')) || 0;

      const convertido = valorNumerico * cotacao.bid;

      setResultado(
        `${valorNumerico.toFixed(2)} ${origem} = ${convertido.toFixed(
          2
        )} ${destino}`
      );

      setTaxa(
        `1 ${origem} = ${cotacao.bid.toFixed(4)} ${destino}`
      );
    } catch (erro) {
      Alert.alert(
        'Erro',
        'Não foi possível realizar a conversão.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    realizarConversao();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>
        Conversão de Moedas
      </Text>

      <Text style={styles.label}>Valor</Text>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={valor}
        onChangeText={setValor}
        placeholder="Digite um valor"
      />

      <Text style={styles.label}>
        Moeda de Origem
      </Text>

      <Picker
        selectedValue={origem}
        onValueChange={(itemValue) =>
          setOrigem(itemValue)
        }
      >
        {Object.entries(MOEDAS).map(([sigla, nome]) => (
          <Picker.Item
            key={sigla}
            label={`${sigla} - ${nome}`}
            value={sigla}
          />
        ))}
      </Picker>

      <Text style={styles.label}>
        Moeda de Destino
      </Text>

      <Picker
        selectedValue={destino}
        onValueChange={(itemValue) =>
          setDestino(itemValue)
        }
      >
        {Object.entries(MOEDAS).map(([sigla, nome]) => (
          <Picker.Item
            key={sigla}
            label={`${sigla} - ${nome}`}
            value={sigla}
          />
        ))}
      </Picker>

      <TouchableOpacity
        style={styles.botao}
        onPress={realizarConversao}
      >
        <Text style={styles.botaoTexto}>
          Converter
        </Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator
          size="large"
          style={{ marginTop: 20 }}
        />
      )}

      {!loading && resultado !== '' && (
        <>
          <Text style={styles.resultado}>
            {resultado}
          </Text>

          <Text style={styles.taxa}>
            {taxa}
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },

  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    backgroundColor: '#FFF',
  },

  botao: {
    backgroundColor: '#007AFF',
    marginTop: 25,
    padding: 15,
    borderRadius: 10,
  },

  botaoTexto: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },

  resultado: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 24,
    fontWeight: 'bold',
  },

  taxa: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});