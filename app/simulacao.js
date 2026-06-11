// app/simulacao.js  ← FORA da pasta abas/
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ScrollView, KeyboardAvoidingView, Platform, ImageBackground
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

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
};

const RAPIDOS = [
  { label: 'R$ 10,00',   valor: 10   },
  { label: 'R$ 100,00',  valor: 100  },
  { label: 'R$ 1000,00', valor: 1000 },
];

export default function Simulacao() {
  const router = useRouter();
  const [saldo, setSaldo] = useState('5,00');

  // Carrega saldo salvo do AsyncStorage
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(STORAGE_SALDO).then(val => {
        if (val !== null) {
          const num = parseFloat(val);
          setSaldo(num.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
        }
      });
    }, [])
  );

  async function salvar() {
    const limpo  = saldo.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(limpo);
    if (isNaN(parsed) || parsed < 0) {
      Alert.alert('Valor inválido', 'Digite um valor válido para simular.');
      return;
    }
    await AsyncStorage.setItem(STORAGE_SALDO, String(parsed));
    router.back();
  }

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
        {/* HEADER — apenas seta + título, sem círculo */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.voltarBtn} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
            <Text style={styles.voltarIcone}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>Alterar Saldo</Text>
        </View>

        {/* TEXTO DE INFORMAÇÃO simples, sem caixa */}
        <Text style={styles.infoTexto}>
          Esse valor será usado para calcular as conversões.
        </Text>

        {/* INPUT GRANDE */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.inputGrande}
            value={`R$ ${saldo}`}
            onChangeText={t => {
              const limpo = t.replace(/[^0-9,]/g, '');
              setSaldo(limpo);
            }}
            keyboardType="numeric"
            placeholder="R$ 0,00"
            placeholderTextColor={CORES.tintaSuave}
            selectTextOnFocus
          />
          <Text style={styles.inputHint}>
            Digite um valor em saldo para simular
          </Text>
        </View>

        {/* VALORES RÁPIDOS */}
        <Text style={styles.rapTitulo}>Valores rápidos</Text>
        <View style={styles.rapidos}>
          {RAPIDOS.map(r => (
            <TouchableOpacity
              key={r.label}
              style={styles.rapidoBtn}
              onPress={() => setSaldo(r.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))}
            >
              <Text style={styles.rapidoTexto}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* BOTÃO SALVAR — amarelo/dourado conforme Figma */}
        <TouchableOpacity style={styles.salvar} onPress={salvar}>
          <Text style={styles.salvarTexto}>SALVAR</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll:    { paddingTop: 60, paddingHorizontal: 20 },

  // Header sem círculo ao redor da seta
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  voltarBtn: {
    padding: 4,
  },
  voltarIcone:  { fontSize: 22, color: CORES.tinta },
  headerTitulo: { fontSize: 20, fontWeight: '700', color: CORES.tinta },

  // Informação simples sem caixa/borda
  infoTexto: {
    fontSize: 13,
    color: CORES.tintaSuave,
    fontStyle: 'italic',
    marginBottom: 28,
    lineHeight: 20,
  },

  // Input card com borda azul
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
  inputHint: {
    marginTop: 8,
    fontSize: 12,
    color: CORES.tintaSuave,
    fontStyle: 'italic',
  },

  // Valores rápidos
  rapTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: CORES.tintaSuave,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  rapidos: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 36,
  },
  rapidoBtn: {
    flex: 1,
    backgroundColor: CORES.papel,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rapidoTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: CORES.azulClaro,
  },

  // SALVAR — amarelo/dourado (Figma)
  salvar: {
    backgroundColor: CORES.amarelo,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  salvarTexto: {
    color: '#1a1000',
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 15,
  },
});