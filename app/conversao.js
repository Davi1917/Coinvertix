
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
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { buscarMoedas, converter } from './api';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

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
};

const MOEDAS_PADRAO = [
  { codigo: 'BRL', nome: 'Real Brasileiro',  bandeira: '🇧🇷' },
  { codigo: 'USD', nome: 'Dólar Americano',  bandeira: '🇺🇸' },
  { codigo: 'EUR', nome: 'Euro',             bandeira: '🇪🇺' },
  { codigo: 'JPY', nome: 'Iene Japonês',     bandeira: '🇯🇵' },
  { codigo: 'GBP', nome: 'Libra Esterlina',  bandeira: '🇬🇧' },
  { codigo: 'BTC', nome: 'Bitcoin',          bandeira: '₿'   },
  { codigo: 'ARS', nome: 'Peso Argentino',   bandeira: '🇦🇷' },
  { codigo: 'CNH', nome: 'Yuan Chinês',      bandeira: '🇨🇳' },
  { codigo: 'RUB', nome: 'Rublo',            bandeira: '🇷🇺' },
];

function getBandeira(codigo) {
  const m = MOEDAS_PADRAO.find(m => m.codigo === codigo);
  return m ? m.bandeira : '🌐';
}

function getNome(codigo, moedas) {
  if (moedas[codigo]) return moedas[codigo];
  const m = MOEDAS_PADRAO.find(m => m.codigo === codigo);
  return m ? m.nome : codigo;
}

export default function Conversao() {
  const router     = useRouter();
  const fadeAnim   = useRef(new Animated.Value(0)).current;

  const [moedas, setMoedas]             = useState({});
  const [entrada, setEntrada]           = useState('BRL');
  const [saida, setSaida]               = useState('JPY');
  const [valor, setValor]               = useState('5,00');
  const [resultado, setResultado]       = useState(null);
  const [taxa, setTaxa]                 = useState(null);
  const [convertendo, setConvertendo]   = useState(false);
  const [selecionando, setSelecionando] = useState(null);
  const [busca, setBusca]               = useState('');

  useEffect(() => {
    buscarMoedas().then(m => setMoedas(m));
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => executarConversao(), 400);
    return () => clearTimeout(timer);
  }, [entrada, saida, valor]);

  async function executarConversao() {
    const limpo  = valor.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(limpo);
    if (isNaN(parsed) || parsed <= 0) { setResultado(null); return; }

    setConvertendo(true);
    try {
      const res   = await converter(entrada, saida);
      const chave = `${entrada}${saida}`;
      const dados = res?.[chave];
      if (!dados) throw new Error('Par inválido');
      const t     = Number(dados.bid);
      const total = parsed * t;
      setTaxa(t);
      setResultado(total);

      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.6, duration: 100, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1,   duration: 300, useNativeDriver: true }),
      ]).start();
    } catch (e) {
      setResultado(null);
    } finally {
      setConvertendo(false);
    }
  }

  const moedasFiltradas = [
    ...MOEDAS_PADRAO,
    ...Object.entries(moedas)
      .filter(([c]) => !MOEDAS_PADRAO.find(m => m.codigo === c))
      .map(([codigo, nome]) => ({ codigo, nome, bandeira: '🌐' })),
  ].filter(m =>
    m.codigo.toLowerCase().includes(busca.toLowerCase()) ||
    m.nome.toLowerCase().includes(busca.toLowerCase())
  ).slice(0, 50);

  // ── Seletor de moeda ──────────────────────────────────────────────────
  if (selecionando) {
    return (
      <View style={styles.seletorContainer}>
        <View style={styles.seletorHeader}>
          <TouchableOpacity onPress={() => { setSelecionando(null); setBusca(''); }} style={styles.voltarBtn}>
            <Text style={styles.voltarIcone}>←</Text>
          </TouchableOpacity>
          <Text style={styles.seletorTitulo}>
            {selecionando === 'entrada' ? 'Moeda de entrada' : 'Moeda de saída'}
          </Text>
        </View>

        <TextInput
          style={styles.seletorBusca}
          placeholder="Buscar moeda..."
          placeholderTextColor={CORES.tintaSuave}
          value={busca}
          onChangeText={setBusca}
          autoFocus
        />

        <ScrollView>
          {moedasFiltradas.map(m => (
            <TouchableOpacity
              key={m.codigo}
              style={styles.seletorItem}
              onPress={() => {
                if (selecionando === 'entrada') setEntrada(m.codigo);
                else setSaida(m.codigo);
                setSelecionando(null);
                setBusca('');
                setResultado(null);
              }}
            >
              <Text style={styles.seletorBandeira}>{m.bandeira}</Text>
              <Text style={styles.seletorCodigo}>{m.codigo}</Text>
              <Text style={styles.seletorNome} numberOfLines={1}>{m.nome}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── Tela principal ────────────────────────────────────────────────────
  return (
      <ImageBackground source={require('../assets/fundo.png')} style={{ flex: 1 }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.voltarBtn}>
            <Text style={styles.voltarIcone}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>Conversão direta</Text>
        </View>

        {/* INFO */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcone}>ℹ</Text>
          <View style={styles.infoTextos}>
            <Text style={styles.infoTitulo}>Como funciona?</Text>
            <Text style={styles.infoDesc}>
              Informe o valor e selecione as moedas.
            </Text>
          </View>
        </View>

        {/* INPUT DE VALOR */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.inputGrande}
            value={`R$ ${valor}`}
            onChangeText={t => {
              const limpo = t.replace(/[^0-9,]/g, '');
              setValor(limpo);
            }}
            keyboardType="numeric"
            placeholder="R$ 0,00"
            placeholderTextColor={CORES.tintaSuave}
            selectTextOnFocus
          />
          <Text style={styles.inputHint}>
            Digite um valor que deseja converter
          </Text>
        </View>

        {/* MOEDA DE ENTRADA */}
        <TouchableOpacity
          style={styles.moedaSelector}
          onPress={() => setSelecionando('entrada')}
          activeOpacity={0.8}
        >
          <Text style={styles.moedaBandeira}>{getBandeira(entrada)}</Text>
          <View style={styles.moedaTextos}>
            <Text style={styles.moedaLabel}>MOEDA DE ENTRADA</Text>
            <Text style={styles.moedaNomeSel}>{getNome(entrada, moedas)}</Text>
          </View>
          <Text style={styles.seletorSeta}>⌄</Text>
        </TouchableOpacity>

        {/* MOEDA DE SAÍDA */}
        <TouchableOpacity
          style={[styles.moedaSelector, { marginBottom: 28 }]}
          onPress={() => setSelecionando('saida')}
          activeOpacity={0.8}
        >
          <Text style={styles.moedaBandeira}>{getBandeira(saida)}</Text>
          <View style={styles.moedaTextos}>
            <Text style={styles.moedaLabel}>MOEDA DE SAÍDA</Text>
            <Text style={styles.moedaNomeSel}>{getNome(saida, moedas)}</Text>
          </View>
          <Text style={styles.seletorSeta}>⌄</Text>
        </TouchableOpacity>

        {/* RESULTADO */}
        <Animated.View style={[styles.resultadoCard, { opacity: fadeAnim }]}>
          {convertendo ? (
            <ActivityIndicator color={CORES.azul} />
          ) : resultado !== null ? (
            <>
              <Text style={styles.resultadoValor}>
                {resultado.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text style={styles.resultadoMoeda}>
                {saida === 'JPY' ? '¥' : saida === 'EUR' ? '€' :
                 saida === 'GBP' ? '£' : saida === 'USD' ? '$' : ''}{' '}
                {resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.resultadoTaxa}>
                {valor.replace(/[^0-9,]/g, '')} {entrada} ={' '}
                {resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {saida}
              </Text>
            </>
          ) : (
            <Text style={styles.resultadoVazio}>
              Insira um valor para ver o resultado
            </Text>
          )}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  scroll:    { paddingTop: 60, paddingHorizontal: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  voltarBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: CORES.papel,
    borderWidth: 1,
    borderColor: CORES.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voltarIcone:  { fontSize: 18, color: CORES.tinta },
  headerTitulo: { fontSize: 20, fontWeight: '700', color: CORES.tinta },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: CORES.infoFundo,
    borderWidth: 1,
    borderColor: CORES.infoBorda,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 22,
    alignItems: 'flex-start',
  },
  infoIcone:  { fontSize: 16, color: CORES.azulClaro, marginTop: 1 },
  infoTextos: { flex: 1 },
  infoTitulo: { fontSize: 13, fontWeight: '700', color: CORES.azulClaro, marginBottom: 3 },
  infoDesc:   { fontSize: 12, color: CORES.tintaSuave, lineHeight: 18 },

  inputCard: {
    backgroundColor: CORES.papel,
    borderWidth: 1.5,
    borderColor: CORES.azul,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  inputGrande: {
    fontSize: 36,
    fontWeight: '800',
    color: CORES.tinta,
    letterSpacing: 1,
    textAlign: 'center',
    width: '100%',
  },
  inputHint: {
    marginTop: 8,
    fontSize: 12,
    color: CORES.tintaSuave,
    fontStyle: 'italic',
  },

  moedaSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.papel,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    gap: 14,
  },
  moedaBandeira: { fontSize: 28 },
  moedaTextos:   { flex: 1 },
  moedaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: CORES.tintaSuave,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  moedaNomeSel: {
    fontSize: 16,
    fontWeight: '700',
    color: CORES.tinta,
  },
  seletorSeta: {
    fontSize: 20,
    color: CORES.tintaSuave,
  },

  resultadoCard: {
    backgroundColor: CORES.papel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.borda,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'center',
  },
  resultadoValor: {
    fontSize: 38,
    fontWeight: '800',
    color: CORES.tinta,
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultadoMoeda: {
    fontSize: 16,
    color: CORES.azulClaro,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultadoTaxa: {
    fontSize: 12,
    color: CORES.tintaSuave,
    fontStyle: 'italic',
  },
  resultadoVazio: {
    fontSize: 14,
    color: CORES.tintaSuave,
    fontStyle: 'italic',
  },

  seletorContainer: {
    flex: 1,
    backgroundColor: CORES.fundo,
    paddingTop: 60,
  },
  seletorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  seletorTitulo: {
    fontSize: 20,
    fontWeight: '700',
    color: CORES.tinta,
  },
  seletorBusca: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: CORES.papel,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: CORES.tinta,
  },
  seletorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
    gap: 12,
  },
  seletorBandeira: { fontSize: 22, width: 32 },
  seletorCodigo: {
    fontSize: 15,
    fontWeight: '800',
    color: CORES.tinta,
    width: 50,
    letterSpacing: 1,
  },
  seletorNome: {
    fontSize: 14,
    color: CORES.tintaSuave,
    flex: 1,
  },
});