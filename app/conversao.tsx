// app/conversao.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { buscarMoedas, converter } from '../lib/api';

const { width } = Dimensions.get('window');

const CORES = {
  fundo:      '#0a0e1a',
  papel:      '#0d1120',
  papelAlto:  '#111827',
  azul:       '#1d6fff',
  azulClaro:  '#7eb3ff',
  tinta:      '#e8f0ff',
  tintaSuave: '#4a6fa5',
  borda:      '#1e2540',
  amarelo:    '#f5c542',
  infoFundo:  '#1d6fff18',
  infoBorda:  '#1d6fff44',
  verde:      '#22c55e',
} as const;

interface Moeda {
  codigo: string;
  nome: string;
  bandeira: string;
}

interface ResultadoConversao {
  valorOriginal: string;
  valorConvertido: number;
  taxa: number;
}

const MOEDAS_PADRAO: Moeda[] = [
  { codigo: 'BRL', nome: 'Real Brasileiro',  bandeira: '🇧🇷' },
  { codigo: 'USD', nome: 'Dólar Americano', bandeira: '🇺🇸' },
  { codigo: 'EUR', nome: 'Euro',             bandeira: '🇪🇺' },
  { codigo: 'JPY', nome: 'Iene Japonês',    bandeira: '🇯🇵' },
  { codigo: 'GBP', nome: 'Libra Esterlina',  bandeira: '🇬🇧' },
  { codigo: 'ARS', nome: 'Peso Argentino',   bandeira: '🇦🇷' },
];

export default function Conversao() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Estados da Conversão
  const [quantia, setQuantia] = useState<string>('100');
  const [moedaOrigem, setMoedaOrigem] = useState<Moeda>(MOEDAS_PADRAO[1]); // USD
  const [moedaDestino, setMoedaDestino] = useState<Moeda>(MOEDAS_PADRAO[0]); // BRL
  const [resultado, setResultado] = useState<ResultadoConversao | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Estados do Seletor Modal Customizado
  const [listaMoedas, setListaMoedas] = useState<Moeda[]>(MOEDAS_PADRAO);
  const [seletorAberto, setSeletorAberto] = useState<boolean>(false);
  const [tipoSelecao, setTipoSelecao] = useState<'origem' | 'destino'>('origem');
  const [termoBusca, setTermoBusca] = useState<string>('');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Carrega lista dinâmica da API para complementar
    buscarMoedas().then((dados) => {
      if (dados && dados.length > 0) {
        setListaMoedas(dados);
      }
    }).catch(() => {
      // Mantém MOEDAS_PADRAO em caso de falha de rede
    });
  }, [fadeAnim]);

  // Executa o cálculo da conversão monetária
  async function handleCalcular(): Promise<void> {
    if (!quantia || isNaN(Number(quantia)) || Number(quantia) <= 0) {
      return;
    }

    setLoading(true);
    try {
      const taxa = await converter(moedaOrigem.codigo, moedaDestino.codigo);
      if (taxa) {
        setResultado({
          valorOriginal: quantia,
          valorConvertido: Number(quantia) * taxa,
          taxa,
        });
      }
    } catch (err) {
      console.error('Erro na conversão direta:', err);
    } finally {
      setLoading(false);
    }
  }

  // Inverte as moedas de origem e destino reciprocamente
  function inverterMoedas(): void {
    const temp = moedaOrigem;
    setMoedaOrigem(moedaDestino);
    setMoedaDestino(temp);
    setResultado(null);
  }

  // Abre o painel seletor para a moeda correspondente
  function abrirSeletor(tipo: 'origem' | 'destino'): void {
    setTipoSelecao(tipo);
    setTermoBusca('');
    setSeletorAberto(true);
  }

  // Define a moeda escolhida no seletor
  function selecionarMoeda(moeda: Moeda): void {
    if (tipoSelecao === 'origem') {
      setMoedaOrigem(moeda);
    } else {
      setMoedaDestino(moeda);
    }
    setSeletorAberto(false);
    setResultado(null);
  }

  // Filtra moedas com base no termo digitado
  const moedasFiltradas = listaMoedas.filter(
    (m) =>
      m.codigo.toLowerCase().includes(termoBusca.toLowerCase()) ||
      m.nome.toLowerCase().includes(termoBusca.toLowerCase())
  );

  // Interface do Seletor Modal Integrado (Substitui o Modal nativo para melhor performance)
  if (seletorAberto) {
    return (
      <View style={styles.seletorContainer}>
        <View style={styles.seletorHeader}>
          <TouchableOpacity onPress={() => setSeletorAberto(false)} style={styles.voltarBtn}>
            <Text style={styles.voltarBtnTexto}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.seletorTitulo}>
            Selecionar Moeda de {tipoSelecao === 'origem' ? 'Origem' : 'Destino'}
          </Text>
        </View>

        <TextInput
          style={styles.seletorBusca}
          placeholder="Buscar por código ou nome..."
          placeholderTextColor={CORES.tintaSuave}
          value={termoBusca}
          onChangeText={setTermoBusca}
          autoCapitalize="characters"
        />

        <ScrollView contentContainerStyle={styles.seletorLista} showsVerticalScrollIndicator={false}>
          {moedasFiltradas.map((m) => (
            <TouchableOpacity
              key={m.codigo}
              style={styles.seletorItem}
              onPress={() => selecionarMoeda(m)}
            >
              <Text style={styles.seletorBandeira}>{m.bandeira}</Text>
              <View>
                <Text style={styles.seletorCodigo}>{m.codigo}</Text>
                <Text style={styles.seletorNome}>{m.nome}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* CABEÇALHO */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.voltarBtn}>
            <Text style={styles.voltarBtnTexto}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.tituloPagina}>Conversão Direta</Text>
        </View>

        <Animated.View style={[styles.conteudo, { opacity: fadeAnim }]}>
          {/* PAINEL DE SELEÇÃO DE MOEDAS */}
          <View style={styles.painelMoedas}>
            <TouchableOpacity style={styles.blocoMoeda} onPress={() => abrirSeletor('origem')}>
              <Text style={styles.labelBloco}>Origem</Text>
              <Text style={styles.bandeiraGrande}>{moedaOrigem.bandeira}</Text>
              <Text style={styles.codigoMoeda}>{moedaOrigem.codigo}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botaoInverter} onPress={inverterMoedas}>
              <Text style={styles.setasInverter}>⇄</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.blocoMoeda} onPress={() => abrirSeletor('destino')}>
              <Text style={styles.labelBloco}>Destino</Text>
              <Text style={styles.bandeiraGrande}>{moedaDestino.bandeira}</Text>
              <Text style={styles.codigoMoeda}>{moedaDestino.codigo}</Text>
            </TouchableOpacity>
          </View>

          {/* CAMPO DE VALOR */}
          <View style={styles.cardInput}>
            <Text style={styles.inputLabel}>Quantia Comercial</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.simboloMoeda}>{moedaOrigem.codigo} $</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={quantia}
                onChangeText={(t) => {
                  setQuantia(t);
                  setResultado(null);
                }}
                placeholder="0.00"
                placeholderTextColor={CORES.tintaSuave}
              />
            </View>
          </View>

          {/* BOTÃO DE CÁLCULO */}
          <TouchableOpacity
            style={[styles.botaoCalcular, loading && styles.botaoDesabilitado]}
            onPress={handleCalcular}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botaoCalcularTexto}>SINTONIZAR VALORES</Text>
            )}
          </TouchableOpacity>

          {/* CARD DE RESULTADOS */}
          <View style={styles.cardResultado}>
            {resultado ? (
              <View>
                <Text style={styles.resultadoLabel}>Resultado Sintonizado</Text>
                <Text style={styles.resultadoGrande}>
                  {moedaDestino.bandeira}{' '}
                  {resultado.valorConvertido.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: moedaDestino.codigo,
                  })}
                </Text>
                <Text style={styles.resultadoTaxa}>
                  Taxa de câmbio atual: 1 {moedaOrigem.codigo} = {resultado.taxa.toFixed(4)}{' '}
                  {moedaDestino.codigo}
                </Text>
              </View>
            ) : (
              <Text style={styles.resultadoVazio}>
                Insira o valor e toque em "Sintonizar Valores" para realizar a consulta mercantil.
              </Text>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  scroll: { paddingBottom: 40, paddingTop: 50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 28,
    gap: 16,
  },
  voltarBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: CORES.papel,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CORES.borda,
  },
  voltarBtnTexto: { color: CORES.azulClaro, fontSize: 28, fontWeight: '300', lineHeight: 32 },
  tituloPagina: { fontSize: 22, fontWeight: '800', color: CORES.tinta, letterSpacing: 0.5 },
  conteudo: { paddingHorizontal: 24 },

  painelMoedas: {
    flexDirection: 'row',
    backgroundColor: CORES.papel,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: CORES.borda,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  blocoMoeda: { alignItems: 'center', flex: 1, paddingVertical: 10 },
  labelBloco: { fontSize: 11, color: CORES.tintaSuave, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  bandeiraGrande: { fontSize: 40, marginBottom: 6 },
  codigoMoeda: { fontSize: 18, fontWeight: '800', color: CORES.tinta },
  botaoInverter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: CORES.infoFundo,
    borderWidth: 1.5,
    borderColor: CORES.infoBorda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setasInverter: { color: CORES.amarelo, fontSize: 20, fontWeight: '600' },

  cardInput: {
    backgroundColor: CORES.papel,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: CORES.borda,
    marginBottom: 20,
  },
  inputLabel: { fontSize: 12, color: CORES.tintaSuave, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.papelAlto,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    paddingHorizontal: 16,
  },
  simboloMoeda: { color: CORES.amarelo, fontWeight: '700', fontSize: 16, marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 20, fontWeight: '700', color: CORES.tinta },

  botaoCalcular: {
    backgroundColor: CORES.azul,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  botaoDesabilitado: { opacity: 0.6 },
  botaoCalcularTexto: { color: '#ffffff', fontWeight: '800', fontSize: 14, letterSpacing: 2 },

  cardResultado: {
    backgroundColor: CORES.papel,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: CORES.infoBorda,
    minHeight: 120,
    justifyContent: 'center',
  },
  resultadoLabel: { fontSize: 12, color: CORES.tintaSuave, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  resultadoGrande: { fontSize: 26, fontWeight: '900', color: CORES.verde, letterSpacing: 0.5, marginBottom: 8 },
  resultadoTaxa: { fontSize: 12, color: CORES.tintaSuave, fontStyle: 'italic' },
  resultadoVazio: { fontSize: 13, color: CORES.tintaSuave, textAlign: 'center', fontStyle: 'italic', lineHeight: 20 },

  seletorContainer: { flex: 1, backgroundColor: CORES.fundo, paddingTop: 60 },
  seletorHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20, gap: 14 },
  seletorTitulo: { fontSize: 16, fontWeight: '800', color: CORES.tinta, flex: 1 },
  seletorBusca: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: CORES.papel,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: CORES.tinta,
  },
  seletorLista: { paddingHorizontal: 24, paddingBottom: 40 },
  seletorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
    gap: 16,
  },
  seletorBandeira: { fontSize: 28 },
  seletorCodigo: { fontSize: 16, fontWeight: '800', color: CORES.tinta },
  seletorNome: { fontSize: 12, color: CORES.tintaSuave, marginTop: 2 },
});