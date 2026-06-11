import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  ImageBackground,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

const STORAGE_USUARIO = "@coinvertix_usuario";
const STORAGE_SALDO = "@coinvertix_saldo";

// Mesmas cores usadas em Login e Home
const CORES = {
  fundo:      "#0a0e1a",
  papel:      "#0d1120",
  papelAlto:  "#111827",
  azul:       "#1d6fff",
  azulClaro:  "#7eb3ff",
  tinta:      "#e8f0ff",
  tintaSuave: "#4a6fa5",
  borda:      "#1e2540",
  amarelo:    "#f5c542",   // dourado
  erro:       "#f87171",
  erroFundo:  "#f871711a",
  infoFundo:  "#1d6fff18",
  infoBorda:  "#1d6fff44",
};

const VALORES_RAPIDOS = [
  { label: "R$ 10,00",   valor: 10 },
  { label: "R$ 100,00",  valor: 100 },
  { label: "R$ 1000,00", valor: 1000 },
];

export default function Perfil() {
  const router = useRouter();

  const [perfil, setPerfil]       = useState(null);
  const [modalNome, setModalNome] = useState(false);
  const [modalSaldo, setModalSaldo] = useState(false);
  const [novoNome, setNovoNome]   = useState("");
  const [saldoTexto, setSaldoTexto] = useState("");

  useEffect(() => {
    carregarPerfil();
    carregarSaldo();
  }, []);

  async function carregarPerfil() {
    const dados = await AsyncStorage.getItem(STORAGE_USUARIO);
    if (dados) setPerfil(JSON.parse(dados));
  }

  async function carregarSaldo() {
    const valor = await AsyncStorage.getItem(STORAGE_SALDO);
    if (valor !== null) {
      const num = parseFloat(valor);
      setSaldoTexto(num.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
    } else {
      setSaldoTexto("5,00");
    }
  }

  async function salvarPerfil(novoPerfil) {
    setPerfil(novoPerfil);
    await AsyncStorage.setItem(STORAGE_USUARIO, JSON.stringify(novoPerfil));
  }

  async function salvarSaldo() {
    const limpo = saldoTexto.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(limpo);
    if (isNaN(parsed) || parsed < 0) {
      Alert.alert("Valor inválido", "Digite um valor numérico válido.");
      return;
    }
    await AsyncStorage.setItem(STORAGE_SALDO, String(parsed));
    setModalSaldo(false);
    Alert.alert("Saldo atualizado", `Seu saldo agora é R$ ${saldoTexto}`);
  }

  async function trocarFoto() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Permissão necessária", "Precisamos acessar sua galeria.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!resultado.canceled) {
      salvarPerfil({ ...perfil, foto: resultado.assets[0].uri });
    }
  }

  async function alterarNome() {
    if (!novoNome.trim()) return;
    await salvarPerfil({ ...perfil, nome: novoNome.trim() });
    setModalNome(false);
    setNovoNome("");
  }

  function limparHistorico() {
    Alert.alert(
      "Limpar histórico",
      "Deseja apagar todo o histórico de conversões?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: async () => {
            await salvarPerfil({
              ...perfil,
              totalConversoes: 0,
              ultimaConversao: null,
            });
          },
        },
      ]
    );
  }

  function logout() {
    Alert.alert("Sair", "Deseja encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_USUARIO);
          router.replace("/verificacao/login");
        },
      },
    ]);
  }

  if (!perfil) {
    return (
      <View style={styles.center}>
        <Text style={styles.carregando}>Carregando perfil...</Text>
      </View>
    );
  }

  const inicial = perfil.nome?.[0]?.toUpperCase();

  return (

    <>
      <ImageBackground source={require('../../assets/fundo.png')} style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header escuro com estrelas e brilho */}
        <View style={styles.header}>
          <View style={styles.brilho} />
          {/* Estrelas decorativas */}
          {[...Array(8)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.estrela,
                { top: 20 + i * 10, left: 15 + (i % 3) * 30, opacity: 0.3 + Math.random() * 0.3 },
              ]}
            />
          ))}

          <TouchableOpacity onPress={trocarFoto} style={styles.avatarWrap}>
            {perfil.foto ? (
              <Image source={{ uri: perfil.foto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetra}>{inicial}</Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeIcone}>📷</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.nome}>{perfil.nome}</Text>
          <Text style={styles.subtitulo}>Seu conversor global de moedas</Text>

          {/* Card de saldo */}
          <View style={styles.saldoCard}>
            <Text style={styles.saldoLabel}>Saldo disponível</Text>
            <Text style={styles.saldoValor}>R$ {saldoTexto}</Text>
            <TouchableOpacity style={styles.saldoBotao} onPress={() => setModalSaldo(true)}>
              <Text style={styles.saldoBotaoTexto}>Alterar saldo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estatísticas */}
        <Text style={styles.secaoTitulo}>✦ Estatísticas</Text>
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardIcone}>🔄</Text>
            <Text style={styles.cardNumero}>{perfil.totalConversoes || 0}</Text>
            <Text style={styles.cardLabel}>Conversões</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardIcone}>📅</Text>
            <Text style={[styles.cardNumero, { fontSize: 14 }]}>
              {perfil.dataCriacao
                ? new Date(perfil.dataCriacao).toLocaleDateString("pt-BR")
                : "—"}
            </Text>
            <Text style={styles.cardLabel}>Membro desde</Text>
          </View>
        </View>

        {/* Última conversão */}
        {perfil.ultimaConversao && (
          <>
            <Text style={styles.secaoTitulo}>✦ Última Conversão</Text>
            <View style={styles.ultimaCard}>
              <Text style={styles.ultimaDe}>
                {perfil.ultimaConversao.valor} {perfil.ultimaConversao.origem}
              </Text>
              <Text style={styles.ultimaSeta}>↓</Text>
              <Text style={styles.ultimaPara}>
                {Number(perfil.ultimaConversao.resultado).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })} {perfil.ultimaConversao.destino}
              </Text>
            </View>
          </>
        )}

        {/* Preferências */}
        <Text style={styles.secaoTitulo}>✦ Preferências</Text>
        <View style={styles.lista}>
          <TouchableOpacity style={styles.item} onPress={() => { setNovoNome(perfil?.nome || ""); setModalNome(true); }}>
            <Text style={styles.itemIcone}>👤</Text>
            <Text style={styles.itemTexto}>Alterar nome</Text>
            <Text style={styles.itemSeta}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={trocarFoto}>
            <Text style={styles.itemIcone}>📷</Text>
            <Text style={styles.itemTexto}>Trocar foto</Text>
            <Text style={styles.itemSeta}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.item, styles.itemBorderNone]} onPress={limparHistorico}>
            <Text style={styles.itemIcone}>🗑</Text>
            <Text style={styles.itemTexto}>Limpar histórico</Text>
            <Text style={styles.itemSeta}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutTexto}>Sair</Text>
        </TouchableOpacity>

        <View style={styles.rodape}>
          <View style={styles.divisor} />
          <Text style={styles.rodapeTexto}>
            Assim como o{" "}
            <Text style={styles.destaque}>Ás de Ouros</Text>
            {" "}revela riquezas ocultas,{"\n"}cada conversão abre novos caminhos.
          </Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Alterar Nome */}
      <Modal transparent animationType="slide" visible={modalNome}>
        <View style={styles.modalFundo}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Alterar nome</Text>
            <Text style={styles.modalLabel}>Nome do consulente</Text>
            <TextInput
              style={styles.modalInput}
              value={novoNome}
              onChangeText={setNovoNome}
              placeholder="Seu nome"
              placeholderTextColor={CORES.tintaSuave}
              autoFocus
            />
            <TouchableOpacity style={styles.botaoModal} onPress={alterarNome}>
              <Text style={styles.botaoModalTexto}>SALVAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelar} onPress={() => setModalNome(false)}>
              <Text style={styles.modalCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Alterar Saldo (estilo simulacao) */}
      <Modal transparent animationType="slide" visible={modalSaldo}>
        <View style={styles.modalFundo}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Alterar saldo</Text>

            <View style={styles.modalInputCard}>
              <TextInput
                style={styles.modalInputGrande}
                value={`R$ ${saldoTexto}`}
                onChangeText={(t) => {
                  const limpo = t.replace(/[^0-9,]/g, "");
                  setSaldoTexto(limpo);
                }}
                keyboardType="numeric"
                placeholder="R$ 0,00"
                placeholderTextColor={CORES.tintaSuave}
                selectTextOnFocus
              />
              <Text style={styles.modalInputHint}>Digite um valor em reais</Text>
            </View>

            <Text style={styles.rapidosTitulo}>Valores rápidos</Text>
            <View style={styles.rapidosContainer}>
              {VALORES_RAPIDOS.map((r) => (
                <TouchableOpacity
                  key={r.label}
                  style={styles.rapidoBtn}
                  onPress={() =>
                    setSaldoTexto(r.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }))
                  }
                >
                  <Text style={styles.rapidoTexto}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.botaoModal} onPress={salvarSaldo}>
              <Text style={styles.botaoModalTexto}>SALVAR SALDO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelar} onPress={() => setModalSaldo(false)}>
              <Text style={styles.modalCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CORES.fundo,
  },
  carregando: {
    color: CORES.tintaSuave,
    fontStyle: "italic",
  },

  // Header com estrelas e brilho
  header: {
    backgroundColor: CORES.papel,
    alignItems: "center",
    paddingTop: 70,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 28,
    overflow: "hidden",
    borderBottomWidth: 1,
    borderColor: CORES.borda,
  },
  brilho: {
    position: "absolute",
    width: "150%",
    height: "200%",
    borderRadius: 200,
    backgroundColor: CORES.azul,
    opacity: 0.03,
    top: -50,
    alignSelf: "center",
  },
  estrela: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#ffffff",
  },

  avatarWrap: { position: "relative", marginBottom: 16 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: CORES.amarelo,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: CORES.amarelo,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetra: {
    color: CORES.papel,
    fontSize: 42,
    fontWeight: "800",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: CORES.amarelo,
    borderWidth: 2,
    borderColor: CORES.papel,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarBadgeIcone: { fontSize: 13 },

  nome: {
    color: CORES.amarelo,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitulo: {
    color: CORES.tintaSuave,
    marginTop: 4,
    fontSize: 13,
    fontStyle: "italic",
  },

  // Card de saldo
  saldoCard: {
    marginTop: 20,
    backgroundColor: CORES.papelAlto,
    borderWidth: 1,
    borderColor: CORES.amarelo,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    width: "80%",
  },
  saldoLabel: {
    color: CORES.tintaSuave,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  saldoValor: {
    color: CORES.amarelo,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  saldoBotao: {
    backgroundColor: CORES.amarelo,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
  },
  saldoBotaoTexto: {
    color: CORES.papel,
    fontWeight: "700",
    fontSize: 12,
  },

  secaoTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: CORES.azulClaro,
    letterSpacing: 2,
    marginHorizontal: 20,
    marginBottom: 14,
  },

  grid: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  card: {
    flex: 1,
    backgroundColor: CORES.papel,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
  },
  cardIcone: { fontSize: 22, marginBottom: 8 },
  cardNumero: {
    fontSize: 26,
    fontWeight: "800",
    color: CORES.tinta,
  },
  cardLabel: {
    color: CORES.tintaSuave,
    fontSize: 12,
    marginTop: 4,
  },

  ultimaCard: {
    backgroundColor: CORES.papel,
    marginHorizontal: 20,
    marginBottom: 28,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: CORES.amarelo,
    padding: 22,
    alignItems: "center",
  },
  ultimaDe: {
    fontSize: 16,
    fontWeight: "600",
    color: CORES.tintaSuave,
  },
  ultimaSeta: {
    fontSize: 22,
    color: CORES.amarelo,
    marginVertical: 6,
  },
  ultimaPara: {
    fontSize: 26,
    fontWeight: "800",
    color: CORES.tinta,
  },

  lista: {
    backgroundColor: CORES.papel,
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.borda,
    marginBottom: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
    gap: 12,
  },
  itemBorderNone: { borderBottomWidth: 0 },
  itemIcone: { fontSize: 18, width: 28 },
  itemTexto: {
    flex: 1,
    fontSize: 16,
    color: CORES.tinta,
    fontWeight: "500",
  },
  itemSeta: {
    fontSize: 20,
    color: CORES.tintaSuave,
    fontWeight: "300",
  },

  logout: {
    marginHorizontal: 20,
    marginBottom: 28,
    backgroundColor: CORES.erroFundo,
    borderWidth: 1,
    borderColor: "#f8717144",
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
  },
  logoutTexto: {
    color: CORES.erro,
    fontWeight: "700",
    letterSpacing: 1,
  },

  rodape: {
    alignItems: "center",
    gap: 16,
    marginHorizontal: 20,
  },
  divisor: {
    width: "70%",
    height: 1,
    backgroundColor: CORES.azul,
    opacity: 0.3,
  },
  rodapeTexto: {
    textAlign: "center",
    color: CORES.tintaSuave,
    lineHeight: 22,
    fontStyle: "italic",
    fontSize: 13,
  },
  destaque: {
    color: CORES.amarelo,
    fontWeight: "700",
  },

  // Modal genérico
  modalFundo: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: CORES.papel,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    borderTopWidth: 2,
    borderColor: CORES.amarelo,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: CORES.tinta,
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: CORES.tintaSuave,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: CORES.papelAlto,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: CORES.tinta,
  },
  botaoModal: {
    backgroundColor: CORES.amarelo,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  botaoModalTexto: {
    color: CORES.papel,
    fontWeight: "800",
    letterSpacing: 2,
  },
  modalCancelar: {
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelarTexto: {
    color: CORES.tintaSuave,
    fontSize: 14,
  },

  // Estilos do modal de saldo (igual ao simulacao)
  modalInputCard: {
    backgroundColor: CORES.papelAlto,
    borderWidth: 1.5,
    borderColor: CORES.amarelo,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  modalInputGrande: {
    fontSize: 32,
    fontWeight: "800",
    color: CORES.tinta,
    textAlign: "center",
    width: "100%",
  },
  modalInputHint: {
    marginTop: 8,
    fontSize: 12,
    color: CORES.tintaSuave,
    fontStyle: "italic",
  },
  rapidosTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: CORES.amarelo,
    letterSpacing: 1,
    marginBottom: 14,
    textAlign: "center",
  },
  rapidosContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  rapidoBtn: {
    flex: 1,
    backgroundColor: CORES.papelAlto,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  rapidoTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: CORES.amarelo,
  },
});