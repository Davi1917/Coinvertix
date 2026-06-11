// app/verificacao/login.tsx
import React, { useState } from "react";
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
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";

const { width } = Dimensions.get("window");

const CORES = {
  fundo:      "#0a0e1a",
  papel:      "#0d1120",
  papelAlto:  "#111827",
  azul:       "#1d6fff",
  azulClaro:  "#7eb3ff",
  tinta:      "#e8f0ff",
  tintaSuave: "#4a6fa5",
  borda:      "#1e2540",
  amarelo:    "#f5c542",
  erro:       "#f87171",
  infoFundo:  "#1d6fff18",
  infoBorda:  "#1d6fff44",
} as const;

export default function Login() {
  const router = useRouter();

  // Estados principais de Login
  const [email, setEmail] = useState<string>("");
  const [senha, setSenha] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Estados para Modal de Registro
  const [modalRegistro, setModalRegistro] = useState<boolean>(false);
  const [regNome, setRegNome] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regSenha, setRegSenha] = useState<string>("");

  // Tradutor de códigos de erro tratando a estrutura padrão do Firebase Auth
  function obterMensagemErro(error: any): string {
    const codigo = error?.code || "";
    switch (codigo) {
      case "auth/invalid-email":
        return "O endereço de e-mail não é válido.";
      case "auth/user-disabled":
        return "Este usuário foi desativado.";
      case "auth/user-not-found":
      case "auth/invalid-credential":
        return "E-mail ou senha incorretos.";
      case "auth/wrong-senha":
        return "Senha incorreta.";
      case "auth/email-already-in-use":
        return "Este e-mail já está em uso por outra conta.";
      case "auth/weak-senha":
        return "A senha deve ter pelo menos 6 caracteres.";
      case "auth/missing-password":
        return "Por favor, insira a senha.";
      default:
        return error?.message || "Ocorreu um erro inesperado.";
    }
  }

  // Ação de Login
  async function handleLogin(): Promise<void> {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Campos vazios", "Preencha o e-mail e a senha para acessar.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), senha);
      const user = userCredential.user;

      const dadosUsuario = {
        uid: user.uid,
        nome: user.displayName || "Consulente",
        email: user.email,
        foto: user.photoURL || null,
        totalConversoes: 0,
        dataCriacao: new Date().toISOString(),
        ultimaConversao: null,
      };

      await AsyncStorage.setItem("@coinvertix_usuario", JSON.stringify(dadosUsuario));
      router.replace("/abas/home");
    } catch (error: any) {
      Alert.alert("Erro no Login", obterMensagemErro(error));
    } finally {
      setLoading(false);
    }
  }

  // Ação de Criar Conta Nova
  async function handleRegistrar(): Promise<void> {
    if (!regNome.trim() || !regEmail.trim() || !regSenha.trim()) {
      Alert.alert("Campos obrigatórios", "Todos os campos do registro devem ser preenchidos.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail.trim(), regSenha);
      
      await updateProfile(userCredential.user, {
        displayName: regNome.trim(),
      });

      const user = userCredential.user;
      const dadosUsuario = {
        uid: user.uid,
        nome: regNome.trim(),
        email: user.email,
        foto: null,
        totalConversoes: 0,
        dataCriacao: new Date().toISOString(),
        ultimaConversao: null,
      };

      await AsyncStorage.setItem("@coinvertix_usuario", JSON.stringify(dadosUsuario));
      setModalRegistro(false);
      
      setRegNome("");
      setRegEmail("");
      setRegSenha("");

      router.replace("/abas/home");
    } catch (error: any) {
      Alert.alert("Erro no Cadastro", obterMensagemErro(error));
    } finally {
      setLoading(false);
    }
  }

  // Recuperação de Senha
  function handleRecuperarSenha(): void {
    if (!email.trim()) {
      Alert.alert("E-mail necessário", "Digite seu e-mail no campo principal para recuperar a senha.");
      return;
    }

    Alert.alert(
      "Recuperar senha",
      `Deseja enviar um e-mail de redefinição para: ${email.trim()}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar",
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, email.trim());
              Alert.alert("E-mail Enviado", "Verifique sua caixa de entrada para redefinir a senha.");
            } catch (error: any) {
              Alert.alert("Erro", obterMensagemErro(error));
            }
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* LOGO E APRESENTAÇÃO */}
        <View style={styles.header}>
          <View style={styles.globoWrap}>
            <View style={styles.globo}>
              <View style={styles.globoAnel} />
              <Image
                source={require("../../assets/asdeouros.png")}
                style={styles.globoImagem}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.titulo}>COINVERTIX</Text>
          <Text style={styles.subtitulo}>A sintonização exata do seu capital mercantil</Text>
        </View>

        {/* CARD DE ENTRADA */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>E-mail de acesso</Text>
          <TextInput
            style={styles.input}
            placeholder="exemplo@dominio.com"
            placeholderTextColor={CORES.tintaSuave}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.inputLabel}>Senha secreta</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={CORES.tintaSuave}
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          <TouchableOpacity style={styles.esqueciBtn} onPress={handleRecuperarSenha}>
            <Text style={styles.esqueciTexto}>Esqueceu a chave de acesso?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botao} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botaoTexto}>ENTRAR NO SISTEMA</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.criarBtn} onPress={() => setModalRegistro(true)}>
            <Text style={styles.criarTexto}>
              Não possui registro? <Text style={{ color: CORES.azulClaro }}>Criar Nova Conta</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* NOTA DE RODAPÉ FILOSÓFICA */}
        <View style={styles.rodape}>
          <View style={styles.divisor} />
          <Text style={styles.rodapeTexto}>
            Regido pela sabedoria do <Text style={styles.destaque}>Ás de Ouros</Text>,{"\n"}
            transformamos valores para expandir sua estabilidade material.
          </Text>
        </View>
      </ScrollView>

      {/* MODAL DE CRIAÇÃO DE CONTA */}
      <Modal transparent animationType="slide" visible={modalRegistro} onRequestClose={() => setModalRegistro(false)}>
        <View style={styles.modalFundo}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Criar Nova Conta</Text>
              <TouchableOpacity onPress={() => setModalRegistro(false)}>
                <Text style={{ color: CORES.erro, fontSize: 16, fontWeight: "bold" }}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nome completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Como prefere ser chamado(a)?"
              placeholderTextColor={CORES.tintaSuave}
              value={regNome}
              onChangeText={setRegNome}
            />

            <Text style={styles.inputLabel}>Endereço de E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor={CORES.tintaSuave}
              keyboardType="email-address"
              autoCapitalize="none"
              value={regEmail}
              onChangeText={setRegEmail}
            />

            <Text style={styles.inputLabel}>Definir Senha (mín. 6 dígitos)</Text>
            <TextInput
              style={styles.input}
              placeholder="Crie uma senha forte"
              placeholderTextColor={CORES.tintaSuave}
              secureTextEntry
              value={regSenha}
              onChangeText={setRegSenha}
            />

            <TouchableOpacity style={[styles.botao, { marginTop: 14 }]} onPress={handleRegistrar} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botaoTexto}>CONFIRMAR REGISTRO</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  scroll: { paddingBottom: 40, paddingTop: 60 },

  header: { alignItems: "center", marginBottom: 32, paddingHorizontal: 24 },
  globoWrap: { marginBottom: 16 },
  globo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1d6fff12",
    borderWidth: 1.5,
    borderColor: "#1d6fff44",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  globoAnel: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: "#1d6fff15",
  },
  globoImagem: { width: 70, height: 70, borderRadius: 35 },

  titulo: {
    fontSize: 28,
    fontWeight: "900",
    color: CORES.tinta,
    letterSpacing: 4,
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 12,
    color: CORES.tintaSuave,
    textAlign: "center",
    fontStyle: "italic",
    letterSpacing: 0.3,
  },

  card: {
    backgroundColor: CORES.papel,
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: CORES.borda,
    marginBottom: 36,
  },
  inputLabel: {
    fontSize: 12,
    color: CORES.tintaSuave,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: CORES.papelAlto,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: CORES.tinta,
    marginBottom: 18,
  },
  esqueciBtn: { alignSelf: "flex-end", marginBottom: 24 },
  esqueciTexto: { color: CORES.tintaSuave, fontSize: 13 },

  botao: {
    backgroundColor: CORES.azul,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoTexto: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 2,
  },
  criarBtn: { alignItems: "center", marginTop: 20 },
  criarTexto: { color: CORES.tintaSuave, fontSize: 13 },

  rodape: { alignItems: "center", gap: 14 },
  divisor: { width: "70%", height: 1, backgroundColor: CORES.azul, opacity: 0.3 },
  rodapeTexto: {
    textAlign: "center",
    color: CORES.tintaSuave,
    lineHeight: 22,
    fontStyle: "italic",
    fontSize: 13,
  },
  destaque: { color: CORES.amarelo, fontWeight: "700" },

  modalFundo: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  modal: {
    backgroundColor: CORES.papel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderColor: CORES.azul,
    padding: 28,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitulo: { fontSize: 20, fontWeight: "800", color: CORES.tinta },
});