// app/simulacao.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';

const STORAGE_SALDO = '@coinvertix_saldo';

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

interface RapidoOpcao {
  label: string;
  valor: number;
}

const RAPIDOS: RapidoOpcao[] = [
  { label: 'R$ 10,00',   valor: 10   },
  { label: 'R$ 100,00',  valor: 100  },
  { label: 'R$ 1.000,00', valor: 1000 },
];

export default function Simulacao() {
  const router = useRouter();
  const [saldo, setSaldo] = useState<string>('0');

  // Carrega o capital material guardado localmente sempre que a tela focar
  const carregarSaldo = useCallback(async () => {
    try {
      const saldoSalvo = await AsyncStorage.getItem(STORAGE_SALDO);
      if (saldoSalvo !== null) {
        setSaldo(saldoSalvo);
      }
    } catch (e) {
      console.error('Falha ao sincronizar o erário local:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarSaldo();
    }, [carregarSaldo])
  );

  // Consolida e persiste o novo valor no erário do dispositivo
  async function handleGravar(): Promise<void> {
    const valorNumerico = parseFloat(saldo.replace(',', '.'));
    
    if (isNaN(valorNumerico) || valorNumerico < 0) {
      Alert.alert('Valor Inválido', 'Por favor, defina um montante mercantil válido.');
      return;
    }

    try {
      await AsyncStorage.setItem(STORAGE_SALDO, valorNumerico.toString());
      Alert.alert('Sintonizado', 'Seu capital fictício foi estabelecido com sucesso.', [
        { text: 'Retornar', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível registrar o novo saldo.');
    }
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
          <Text style={styles.tituloPagina}>Simulação de Fundos</Text>
        </View>

        <View style={styles.conteudo}>
          <Text style={styles.descricao}>
            Defina abaixo o montante em <Text style={{ color: CORES.amarelo }}>Reais (BRL)</Text> que 
            deseja simular na sua carteira para as análises de conversão material.
          </Text>

          {/* CARD DO INPUT DO ERÁRIO */}
          <View style={styles.inputCard}>
            <TextInput
              style={styles.inputGrande}
              keyboardType="numeric"
              value={saldo}
              onChangeText={setSaldo}
              placeholder="0.00"
              placeholderTextColor={CORES.tintaSuave}
            />
            <Text style={styles.inputHint}>Toque para editar o erário simulado</Text>
          </View>

          {/* VALORES RÁPIDOS */}
          <Text style={styles.rapTitulo}>Inserção Rápida de Capital</Text>
          <View style={styles.rapidos}>
            {RAPIDOS.map((opcao, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.rapidoBtn}
                onPress={() => setSaldo(opcao.valor.toString())}
              >
                <Text style={styles.rapidoTexto}>{opcao.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* BOTÃO DE CONFIRMAÇÃO */}
          <TouchableOpacity style={styles.botaoSalvar} onPress={handleGravar}>
            <Text style={styles.botaoSalvarTexto}>CONSOLIDAR CAPITAL</Text>
          </TouchableOpacity>
        </View>
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
  descricao: {
    fontSize: 13,
    color: CORES.tintaSuave,
    fontStyle: 'italic',
    marginBottom: 28,
    lineHeight: 20,
  },

  inputCard: {
    backgroundColor: CORES.papel,
    borderWidth: 1.5,
    borderColor: CORES.azul,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 32,
  },
  inputGrande: {
    fontSize: 36,
    fontWeight: '800',
    color: CORES.tinta,
    letterSpacing: 1,
    textAlign: 'center',
    width: '100%',
  },
  inputHint: { marginTop: 8, fontSize: 12, color: CORES.tintaSuave, fontStyle: 'italic' },

  rapTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: CORES.tintaSuave,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  rapidos: { flexDirection: 'row', gap: 10, marginBottom: 36 },
  rapidoBtn: {
    flex: 1,
    backgroundColor: CORES.papelAlto,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rapidoTexto: { color: CORES.tinta, fontSize: 13, fontWeight: '700' },

  botaoSalvar: {
    backgroundColor: CORES.azul,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSalvarTexto: { color: '#ffffff', fontWeight: '800', fontSize: 14, letterSpacing: 2 },
});