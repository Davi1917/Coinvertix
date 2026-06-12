import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { auth } from '../../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Estrela {
  id:      number;
  top:     number;
  left:    number;
  size:    number;
  opacity: number;
}

interface PerfilLocal {
  uid:             string;
  nome:            string;
  email:           string;
  dataCriacao:     string;
  totalConversoes: number;
}

// ── Constantes ───────────────────────────────────────────────────────────────

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
  erro:       '#f87171',
  infoFundo:  '#1d6fff18',
} as const;

const ESTRELAS: Estrela[] = Array.from({ length: 35 }, (_, i) => ({
  id:      i,
  top:     Math.random() * 100,
  left:    Math.random() * 100,
  size:    Math.random() * 2 + 1,
  opacity: Math.random() * 0.4 + 0.15,
}));

const FIREBASE_ERROS: Record<string, string> = {
  'auth/user-not-found':        'Usuário não encontrado.',
  'auth/wrong-password':        'Senha incorreta.',
  'auth/invalid-email':         'E-mail inválido.',
  'auth/email-already-in-use':  'Este e-mail já está cadastrado.',
  'auth/weak-password':         'A senha deve ter pelo menos 6 caracteres.',
  'auth/too-many-requests':     'Muitas tentativas. Tente novamente mais tarde.',
  'auth/network-request-failed':'Sem conexão. Verifique sua internet.',
  'auth/invalid-credential':    'E-mail ou senha incorretos.',
};

function mensagemFirebase(code: string): string {
  return FIREBASE_ERROS[code] ?? 'Ocorreu um erro. Tente novamente.';
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function Login(): React.JSX.Element {
  const router = useRouter();

  // Estado do login
  const [email,     setEmail]     = useState<string>('');
  const [senha,     setSenha]     = useState<string>('');
  const [loading,   setLoading]   = useState<boolean>(false);
  const [erroLogin, setErroLogin] = useState<string>('');

  // Estado do modal de cadastro
  const [modalAberto,     setModalAberto]     = useState<boolean>(false);
  const [novoNome,        setNovoNome]        = useState<string>('');
  const [novoEmail,       setNovoEmail]       = useState<string>('');
  const [novaSenha,       setNovaSenha]       = useState<string>('');
  const [confirmarSenha,  setConfirmarSenha]  = useState<string>('');
  const [loadingCadastro, setLoadingCadastro] = useState<boolean>(false);
  const [erroCadastro,    setErroCadastro]    = useState<string>('');

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function fazerLogin(): Promise<void> {
    if (!email.trim() || !senha) {
      setErroLogin('Preencha e-mail e senha.');
      return;
    }
    setErroLogin('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), senha);
      await salvarUsuarioLocal(cred.user);
      router.replace('/abas/home');
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      setErroLogin(mensagemFirebase(code));
    } finally {
      setLoading(false);
    }
  }

  async function criarConta(): Promise<void> {
    if (!novoNome.trim())          { setErroCadastro('Digite seu nome.');                              return; }
    if (!novoEmail.trim())         { setErroCadastro('Digite seu e-mail.');                            return; }
    if (novaSenha.length < 6)      { setErroCadastro('A senha deve ter pelo menos 6 caracteres.');     return; }
    if (novaSenha !== confirmarSenha) { setErroCadastro('As senhas não coincidem.');                   return; }

    setErroCadastro('');
    setLoadingCadastro(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, novoEmail.trim(), novaSenha);
      await updateProfile(cred.user, { displayName: novoNome.trim() });
      await salvarUsuarioLocal(cred.user, novoNome.trim());
      setModalAberto(false);
      router.replace('/abas/home');
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      setErroCadastro(mensagemFirebase(code));
    } finally {
      setLoadingCadastro(false);
    }
  }

  async function esqueceuSenha(): Promise<void> {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Digite seu e-mail no campo acima primeiro.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('E-mail enviado', 'Verifique sua caixa de entrada para redefinir a senha.');
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      Alert.alert('Erro', mensagemFirebase(code));
    }
  }

  async function salvarUsuarioLocal(user: User, nomeOverride?: string): Promise<void> {
    const nome: string = nomeOverride ?? user.displayName ?? user.email?.split('@')[0] ?? 'Usuário';
    const perfil: PerfilLocal = {
      uid:             user.uid,
      nome,
      email:           user.email ?? '',
      dataCriacao:     new Date().toISOString(),
      totalConversoes: 0,
    };
    await AsyncStorage.setItem('@coinvertix_usuario', JSON.stringify(perfil));
  }

  function abrirCadastro(): void {
    setErroCadastro('');
    setNovoNome('');
    setNovoEmail('');
    setNovaSenha('');
    setConfirmarSenha('');
    setModalAberto(true);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

          <View style={styles.brilho} />

          {/* Link de cadastro */}
          <TouchableOpacity style={styles.cadastroLink} onPress={abrirCadastro}>
            <Text style={styles.cadastroLinkTexto}>Não possui conta?</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.globo}>
              <View style={styles.globoAnel} />
              <Image
                source={require('../../assets/asdeouros.png')}
                style={styles.globoImagem}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoTexto}>COINVERTIX</Text>
          </View>

          {/* Card de login */}
          <View style={styles.card}>
            <Text style={styles.label}>Usuário</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor={CORES.tintaSuave}
              value={email}
              onChangeText={(t: string) => { setEmail(t); setErroLogin(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.esqueceuLink} onPress={esqueceuSenha}>
              <Text style={styles.esqueceuTexto}>Esqueceu o usuário?</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••••"
              placeholderTextColor={CORES.tintaSuave}
              value={senha}
              onChangeText={(t: string) => { setSenha(t); setErroLogin(''); }}
              secureTextEntry
            />
            <TouchableOpacity style={styles.esqueceuLink} onPress={esqueceuSenha}>
              <Text style={styles.esqueceuTexto}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            {!!erroLogin && <Text style={styles.erro}>{erroLogin}</Text>}

            <TouchableOpacity
              style={[styles.botao, loading && styles.botaoDisabled]}
              onPress={fazerLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#1a1000" />
                : <Text style={styles.botaoTexto}>FAZER LOGIN</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Rodapé */}
          <View style={styles.rodape}>
            <View style={styles.divisor} />
            <Text style={styles.rodapeTexto}>
              Assim como o{' '}
              <Text style={styles.destaque}>Ás de Ouros</Text>
              {' '}representa novas oportunidades,{'\n'}sua jornada financeira começa aqui.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal — Criar conta */}
      <Modal
        transparent
        animationType="slide"
        visible={modalAberto}
        onRequestClose={() => setModalAberto(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalFundo}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>Criar conta</Text>
                <TouchableOpacity onPress={() => setModalAberto(false)}>
                  <Text style={styles.modalFechar}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalLabel}>Nome</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Seu nome completo"
                  placeholderTextColor={CORES.tintaSuave}
                  value={novoNome}
                  onChangeText={(t: string) => { setNovoNome(t); setErroCadastro(''); }}
                  autoCapitalize="words"
                />

                <Text style={styles.modalLabel}>E-mail</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="seu@email.com"
                  placeholderTextColor={CORES.tintaSuave}
                  value={novoEmail}
                  onChangeText={(t: string) => { setNovoEmail(t); setErroCadastro(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.modalLabel}>Senha</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={CORES.tintaSuave}
                  value={novaSenha}
                  onChangeText={(t: string) => { setNovaSenha(t); setErroCadastro(''); }}
                  secureTextEntry
                />

                <Text style={styles.modalLabel}>Confirmar senha</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Repita a senha"
                  placeholderTextColor={CORES.tintaSuave}
                  value={confirmarSenha}
                  onChangeText={(t: string) => { setConfirmarSenha(t); setErroCadastro(''); }}
                  secureTextEntry
                />

                {!!erroCadastro && (
                  <View style={styles.erroBox}>
                    <Text style={styles.erro}>{erroCadastro}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.botao, loadingCadastro && styles.botaoDisabled, { marginTop: 8 }]}
                  onPress={criarConta}
                  disabled={loadingCadastro}
                >
                  {loadingCadastro
                    ? <ActivityIndicator color="#1a1000" />
                    : <Text style={styles.botaoTexto}>CRIAR CONTA</Text>
                  }
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: CORES.fundo,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  estrela: {
    position: 'absolute',
    borderRadius: 99,
    backgroundColor: '#ffffff',
  },
  brilho: {
    position: 'absolute',
    width:        width * 1.4,
    height:       width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: '#1d6fff',
    opacity: 0.05,
    top: -width * 0.3,
    alignSelf: 'center',
  },

  // Topo
  cadastroLink:      { alignSelf: 'flex-end', marginBottom: 32 },
  cadastroLinkTexto: { color: CORES.azulClaro, fontSize: 13, fontWeight: '600' },

  // Logo
  logoContainer: { alignItems: 'center', marginBottom: 36 },
  globo: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#1d6fff18',
    borderWidth: 1.5, borderColor: '#1d6fff66',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', marginBottom: 16,
  },
  globoAnel: {
    position: 'absolute',
    width: 150, height: 150, borderRadius: 75,
    borderWidth: 1, borderColor: '#1d6fff22',
  },
  globoImagem: { width: 100, height: 100, borderRadius: 50 },
  logoTexto: {
    fontSize: 32, fontWeight: '700',
    letterSpacing: 5, color: CORES.amarelo,
  },

  // Card login
  card: {
    backgroundColor: CORES.papel,
    borderWidth: 1, borderColor: CORES.borda,
    borderRadius: 24, padding: 24, marginBottom: 28,
  },
  label: {
    fontSize: 13, fontWeight: '600',
    color: CORES.tintaSuave, letterSpacing: 0.5, marginBottom: 8,
  },
  input: {
    backgroundColor: CORES.papelAlto,
    borderWidth: 1, borderColor: CORES.borda,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: CORES.tinta, marginBottom: 6,
  },
  esqueceuLink:  { alignSelf: 'flex-end', marginBottom: 18 },
  esqueceuTexto: { fontSize: 12, color: CORES.azulClaro, fontWeight: '600' },

  erro: { color: CORES.erro, fontSize: 13, textAlign: 'center', marginBottom: 10 },
  erroBox: {
    backgroundColor: '#f871711a',
    borderWidth: 1, borderColor: '#f8717144',
    borderRadius: 10, padding: 10, marginBottom: 12,
  },

  botao: {
    backgroundColor: CORES.amarelo,
    borderRadius: 16, paddingVertical: 17,
    alignItems: 'center', marginTop: 6,
  },
  botaoDisabled: { opacity: 0.5 },
  botaoTexto: {
    color: '#1a1000', fontWeight: '800',
    letterSpacing: 2, fontSize: 15,
  },

  // Rodapé
  rodape:      { alignItems: 'center', gap: 14 },
  divisor:     { width: '70%', height: 1, backgroundColor: CORES.azul, opacity: 0.3 },
  rodapeTexto: {
    textAlign: 'center', color: CORES.tintaSuave,
    lineHeight: 22, fontStyle: 'italic', fontSize: 13,
  },
  destaque: { color: CORES.azulClaro, fontWeight: '700' },

  // Modal
  modalFundo: {
    flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: CORES.papel,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1.5, borderColor: CORES.azul,
    padding: 28, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: CORES.tinta },
  modalFechar: { fontSize: 18, color: CORES.tintaSuave, fontWeight: '700', padding: 4 },
  modalLabel: {
    fontSize: 13, fontWeight: '600',
    color: CORES.tintaSuave, letterSpacing: 0.5, marginBottom: 8,
  },
  modalInput: {
    backgroundColor: CORES.papelAlto,
    borderWidth: 1, borderColor: CORES.borda,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: CORES.tinta, marginBottom: 16,
  },
});