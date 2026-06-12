import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Estrela {
  id:      number;
  top:     number;
  left:    number;
  size:    number;
  opacity: number;
}

interface UsuarioLocal {
  uid:             string;
  nome:            string;
  email:           string;
  dataCriacao:     string;
  totalConversoes: number;
}

// ── Constantes ───────────────────────────────────────────────────────────────

const { width, height } = Dimensions.get('window');

const CORES = {
  fundo:      '#0a0e1a',
  papel:      '#0d1120',
  azul:       '#1d6fff',
  azulClaro:  '#7eb3ff',
  tinta:      '#e8f0ff',
  tintaSuave: '#4a6fa5',
  borda:      '#1e2540',
  amarelo:    '#f5c542',
} as const;

// Geradas fora do componente para evitar re-render
const ESTRELAS: Estrela[] = Array.from({ length: 40 }, (_, i) => ({
  id:      i,
  top:     Math.random() * 100,
  left:    Math.random() * 100,
  size:    Math.random() * 2.5 + 1,
  opacity: Math.random() * 0.5 + 0.2,
}));

// ── Componente ───────────────────────────────────────────────────────────────

export default function Home(): React.JSX.Element {
  const router = useRouter();

  const fadeAnim  = useRef<Animated.Value>(new Animated.Value(0)).current;
  const slideAnim = useRef<Animated.Value>(new Animated.Value(40)).current;
  const pulseAnim = useRef<Animated.Value>(new Animated.Value(1)).current;

  const [usuario, setUsuario] = useState<UsuarioLocal | null>(null);

  useEffect(() => {
    // Carrega usuário do AsyncStorage
    AsyncStorage.getItem('@coinvertix_usuario').then((raw: string | null) => {
      if (raw) setUsuario(JSON.parse(raw) as UsuarioLocal);
    });

    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    // Pulso contínuo no globo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.00, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* Estrelas de fundo */}
      {ESTRELAS.map((e: Estrela) => (
        <View
          key={e.id}
          style={[
            styles.estrela,
            { top: `${e.top}%`, left: `${e.left}%`, width: e.size, height: e.size, opacity: e.opacity },
          ]}
        />
      ))}

      {/* Brilho difuso central */}
      <View style={styles.brilhoCentral} />

      {/* Conteúdo animado */}
      <Animated.View
        style={[
          styles.conteudo,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Globo com pulso */}
        <Animated.View style={[styles.globoWrap, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.globo}>
            <View style={styles.globoAnel} />
            <Image
              source={require('../../assets/asdeouros.png')}
              style={styles.globoImagem}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Título de boas-vindas */}
        <Text style={styles.titulo}>
          BEM{'\n'}VINDO(A),{'\n'}
          <Text style={styles.tituloNome}>
            {usuario?.nome?.toUpperCase() ?? 'FULANO(A)'}!
          </Text>
        </Text>

        <Text style={styles.subtitulo}>
          Escolha uma opção abaixo para começar{'\n'}a converter moedas
        </Text>

        {/* Botões de navegação */}
        <View style={styles.botoesWrap}>
          <TouchableOpacity
            style={styles.botao}
            onPress={() => router.push('/simulacao')}
            activeOpacity={0.75}
          >
            <Text style={styles.botaoTexto}>SIMULAÇÃO DE SALDO</Text>
            <Text style={styles.botaoSeta}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botao}
            onPress={() => router.push('/conversao')}
            activeOpacity={0.75}
          >
            <Text style={styles.botaoTexto}>CONVERSÃO DIRETA</Text>
            <Text style={styles.botaoSeta}>›</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  estrela: {
    position: 'absolute',
    borderRadius: 99,
    backgroundColor: '#ffffff',
  },

  brilhoCentral: {
    position: 'absolute',
    width:        width * 1.2,
    height:       width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: '#1d6fff',
    opacity: 0.05,
    top: height * 0.1,
    alignSelf: 'center',
  },

  conteudo: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },

  globoWrap: { marginBottom: 28 },
  globo: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#1d6fff18',
    borderWidth: 1.5, borderColor: '#1d6fff66',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  globoAnel: {
    position: 'absolute',
    width: 190, height: 190, borderRadius: 95,
    borderWidth: 1, borderColor: '#1d6fff22',
  },
  globoImagem: {
    width: 90, height: 90, borderRadius: 45,
  },

  titulo: {
    fontSize: 36, fontWeight: '800', color: CORES.tinta,
    textAlign: 'center', lineHeight: 44,
    letterSpacing: 1, marginBottom: 16,
  },
  tituloNome: { color: CORES.amarelo },

  subtitulo: {
    fontSize: 14, color: CORES.tintaSuave,
    textAlign: 'center', lineHeight: 22,
    marginBottom: 48, fontStyle: 'italic',
  },

  botoesWrap: { width: '100%', gap: 14 },
  botao: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: CORES.azul,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botaoTexto: {
    color: CORES.tinta, fontWeight: '700',
    fontSize: 14, letterSpacing: 1.5,
  },
  botaoSeta: {
    color: CORES.azulClaro, fontSize: 22,
    fontWeight: '300', lineHeight: 24,
  },
});