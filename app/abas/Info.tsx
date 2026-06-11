// app/abas/info.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  Alert,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { converter } from '../api';

// Configurações de Armazenamento
const STORAGE_SALDO = '@coinvertix_saldo';

// Definição dos Tipos e Interfaces
interface Moeda {
  codigo: string;
  nome: string;
  bandeira: string;
  destino: string;
}

interface Convertidos {
  [codigo: string]: number;
}

// Design System (Paleta de Cores)
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
} as const;

// Lista Estática de Moedas Suportadas
const MOEDAS: Moeda[] = [
  { codigo: 'EUR', nome: 'Euro',           bandeira: '🇪🇺', destino: 'EUR' },
  { codigo: 'JPY', nome: 'Iene Japonês',   bandeira: '🇯🇵', destino: 'JPY' },
  { codigo: 'RUB', nome: 'Rublo',          bandeira: '🇷🇺', destino: 'RUB' },
  { codigo: 'CNH', nome: 'Yuan Chinês',    bandeira: '🇨🇳', destino: 'CNH' },
  { codigo: 'GBP', nome: 'Libra Esterlina',bandeira: '🇬🇧', destino: 'GBP' },
  { codigo: 'USD', nome: 'Dólar Americano',bandeira: '🇺🇸', destino: 'USD' },
  { codigo: 'ARS', nome: 'Peso Argentino', bandeira: '🇦🇷', destino: 'ARS' },
  { codigo: 'BTC', nome: 'Bitcoin',        bandeira: '₿',  destino: 'BTC' },
  { codigo: 'ETH', nome: 'Ethereum',       bandeira: 'Ξ',  destino: 'ETH' },
];

// Mapeamento Estrito de Símbolos Monetários
const SIMBOLOS: Record<string, string> = {
  EUR: '€', JPY: '¥', RUB: '₽', CNH: '¥', GBP: '£', USD: '$', ARS: '$', BTC: '₿', ETH: 'Ξ'
};

// Função de Formatação com Tipagem Estrita
function formatarValor(valor: number | undefined, codigo: string): string {
  const simbolo = SIMBOLOS[codigo] || '';
  if (valor === undefined || isNaN(valor)) return `${simbolo} —`;

  // Mantido o padrão de 2 casas decimais configurado originalmente
  return `${simbolo} ${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function Info() {
  const [saldo, setSaldo]             = useState<number>(5.0);
  const [convertidos, setConvertidos] = useState<Convertidos>({});
  const [loading, setLoading]         = useState<boolean>(true);
  const [refreshing, setRefreshing]   = useState<boolean>(false);
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [novoSaldo, setNovoSaldo]     = useState<string>('');

  // Busca assíncrona das taxas na API externa
  const buscarConversoes = useCallback(async () => {
    setLoading(true);
    try {
      const resultados: Convertidos = {};
      for (const moeda of MOEDAS) {
        try {
          const res = await converter('BRL', moeda.destino);
          const chave = `BRL${moeda.destino}`;
          const taxa = res?.[chave]?.bid;
          
          if (taxa) {
            resultados[moeda.codigo] = saldo * Number(taxa);
          }
        } catch (e: any) {
          console.log(`Erro ao converter ${moeda.codigo}:`, e.message);
        }
        // Delay para evitar rate-limiting das requisições
        await new Promise(r => setTimeout(r, 250));
      }
      setConvertidos(resultados);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [saldo]);

  // Recarrega o saldo salvo localmente sempre que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(STORAGE_SALDO)
        .then(val => {
          if (val !== null) {
            const parsed = parseFloat(val);
            if (!isNaN(parsed)) setSaldo(parsed);
          }
        })
        .catch(err => console.error('Erro ao ler do AsyncStorage:', err));
    }, [])
  );

  // Dispara a busca atualizada sempre que o saldo base sofre alterações
  useEffect(() => {
    buscarConversoes();
  }, [buscarConversoes]);

  // Salva o novo saldo digitado pelo usuário
  const salvarSaldo = async () => {
    const limpo = novoSaldo.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(limpo);
    
    if (isNaN(parsed) || parsed < 0) {
      Alert.alert('Valor inválido', 'Digite um valor válido para o saldo.');
      return;
    }
    
    try {
      await AsyncStorage.setItem(STORAGE_SALDO, String(parsed));
      setSaldo(parsed);
      setModalAberto(false);
      setNovoSaldo('');
    } catch (err) {
      console.error('Erro ao salvar no AsyncStorage:', err);
      Alert.alert('Erro', 'Não foi possível salvar o novo saldo.');
    }
  };

  // Prepara e exibe o modal de edição de valores
  const abrirModal = () => {
    setNovoSaldo(saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setModalAberto(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    buscarConversoes();
  };

  return (
    <ImageBackground source={require('../../assets/fundo.png')} style={styles.backgroundImage} resizeMode="cover">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={CORES.azul}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>Simulação de saldo</Text>
        </View>

        {/* SALDO */}
        <View style={styles.saldoSection}>
          <Text style={styles.saldoLabel}>Seu saldo</Text>

          <View style={styles.saldoRow}>
            <Text style={styles.saldoValor}>
              R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
            <TouchableOpacity style={styles.alterarBtn} onPress={abrirModal} activeOpacity={0.75}>
              <Text style={styles.alterarTexto}>ALTERAR</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.setaBaixo}>↓</Text>
          <Text style={styles.emOutras}>Em outras moedas:</Text>
        </View>

        {/* LISTA DE MOEDAS */}
        <View style={styles.lista}>
          {loading ? (
            <ActivityIndicator color={CORES.azul} style={styles.loadingIndicator} />
          ) : (
            MOEDAS.map((moeda, index) => (
              <View
                key={moeda.codigo}
                style={[
                  styles.moedaRow,
                  index === MOEDAS.length - 1 && styles.semBordaInferior,
                ]}
              >
                {/* Bandeira */}
                <View style={styles.bandeiraCont}>
                  <Text style={styles.bandeira}>{moeda.bandeira}</Text>
                </View>

                {/* Info Moeda */}
                <View style={styles.moedaInfo}>
                  <Text style={styles.moedaCodigo}>{moeda.codigo}</Text>
                  <Text style={styles.moedaNome}>{moeda.nome}</Text>
                </View>

                {/* Valor Convertido */}
                <Text style={styles.moedaValor}>
                  {formatarValor(convertidos[moeda.codigo], moeda.codigo)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* MODAL ALTERAR SALDO */}
      <Modal transparent animationType="slide" visible={modalAberto} onRequestClose={() => setModalAberto(false)}>
        <View style={styles.modalFundo}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Alterar Saldo</Text>
            <Text style={styles.modalInfo}>Este valor será usado para calcular as conversões.</Text>

            <Text style={styles.inputLabel}>Saldo em R$</Text>
            <TextInput
              style={styles.input}
              value={novoSaldo}
              onChangeText={setNovoSaldo}
              placeholder="0,00"
              placeholderTextColor={CORES.tintaSuave}
              keyboardType="numeric"
              autoFocus
            />

            {/* Atalhos de Valores Rápidos */}
            <Text style={styles.rapLabel}>Valores rápidos</Text>
            <View style={styles.rapidos}>
              {['10,00', '50,00', '100,00'].map(v => (
                <TouchableOpacity
                  key={v}
                  style={styles.rapidoBtn}
                  onPress={() => setNovoSaldo(v)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.rapidoTexto}>R$ {v}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.salvar} onPress={salvarSaldo} activeOpacity={0.8}>
              <Text style={styles.salvarTexto}>SALVAR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelar} onPress={() => setModalAberto(false)}>
              <Text style={styles.cancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: { 
    flex: 1,
  },
  scroll: { 
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 10,
  },
  headerTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: CORES.tinta,
    letterSpacing: 0.3,
  },
  saldoSection: {
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  saldoLabel: {
    fontSize: 14,
    color: CORES.tintaSuave,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  saldoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  saldoValor: {
    fontSize: 28,
    fontWeight: '800',
    color: CORES.tinta,
    letterSpacing: 0.5,
  },
  alterarBtn: {
    backgroundColor: CORES.amarelo,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  alterarTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1a1000',
    letterSpacing: 1,
  },
  setaBaixo: {
    fontSize: 26,
    color: CORES.azulClaro,
    marginBottom: 16,
    opacity: 0.8,
  },
  emOutras: {
    fontSize: 15,
    fontWeight: '600',
    color: CORES.tinta,
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  lista: {
    marginHorizontal: 20,
    backgroundColor: CORES.papel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.borda,
    overflow: 'hidden',
  },
  moedaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
    gap: 12,
  },
  semBordaInferior: {
    borderBottomWidth: 0,
  },
  loadingIndicator: {
    marginVertical: 32,
  },
  bandeiraCont: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: CORES.papelAlto,
    borderWidth: 1,
    borderColor: CORES.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bandeira: { 
    fontSize: 20,
  },
  moedaInfo: { 
    flex: 1,
  },
  moedaCodigo: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: CORES.tinta, 
    letterSpacing: 0.5,
  },
  moedaNome: { 
    fontSize: 11, 
    color: CORES.tintaSuave, 
    marginTop: 2,
  },
  moedaValor: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: CORES.azulClaro, 
    letterSpacing: 0.3,
  },
  spacer: {
    height: 40,
  },
  modalFundo: {
    flex: 1,
    backgroundColor: '#00000077',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: CORES.papel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    borderTopWidth: 1.5,
    borderColor: CORES.azul,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: '700',
    color: CORES.tinta,
    marginBottom: 8,
  },
  modalInfo: {
    fontSize: 13,
    color: CORES.tintaSuave,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  inputLabel: {
    fontSize: 13,
    color: CORES.tintaSuave,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: CORES.papelAlto,
    borderWidth: 1.5,
    borderColor: CORES.azul,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '700',
    color: CORES.tinta,
    textAlign: 'center',
    marginBottom: 20,
  },
  rapLabel: {
    fontSize: 12,
    color: CORES.tintaSuave,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 10,
  },
  rapidos: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  rapidoBtn: {
    flex: 1,
    backgroundColor: CORES.papelAlto,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rapidoTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: CORES.azulClaro,
  },
  salvar: {
    backgroundColor: CORES.azul,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  salvarTexto: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 2,
    fontSize: 15,
  },
  cancelar: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelarTexto: {
    color: CORES.tintaSuave,
    fontSize: 14,
  },
});