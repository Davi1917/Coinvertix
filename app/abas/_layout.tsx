import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";

// Definição estrita das cores para o TypeScript
const CORES = {
  fundo:      "#0a0e1a",
  ouro:       "#f5c542",
  ouroClaro:  "#f5d54e",
  tinta:      "#e8f0ff",
  tintaSuave: "#4a6fa5",
  borda:      "#1e2540",
  pill:       "#f5c54220",
  pillBorda:  "#f5c54260",
} as const;

// Interface para as propriedades do componente TabIcon
interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
}

// Componente que representa o ícone e rótulo de cada aba na barra de navegação inferior. Ele ajusta o estilo com base no estado de foco da aba, alterando a cor do ícone e do rótulo para indicar qual aba está ativa.

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <FontAwesome5
        name={icon as any} // 'as any' ou caminhos estritos de glifos do FontAwesome5 se necessário
        size={20}
        color={focused ? CORES.ouro : CORES.tintaSuave}
        solid={focused}
      />
      <Text style={[styles.label, focused && styles.labelActive]}>
        {label}
      </Text>
    </View>
  );
}

// Componente principal que define a estrutura de abas do aplicativo, utilizando o Tabs do Expo Router. Cada aba é configurada com um ícone e rótulo, e o estilo da barra de abas é personalizado para se alinhar com o tema do aplicativo.
export default function AbasLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="exchange-alt" label="Câmbio" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="Info"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="chart-line" label="Análise" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="Perfil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="user-circle" label="Perfil" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
// Estilos utilizados na interface do usuário, garantindo consistência visual e responsividade em diferentes dispositivos. O StyleSheet é utilizado para criar um conjunto de estilos reutilizáveis para os componentes da tela de abas.
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: CORES.fundo,
    borderTopWidth: 1.5,
    borderTopColor: CORES.borda,
    height: 80,
    paddingBottom: 10,
    paddingTop: 10,
    elevation: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 5,
    minWidth: 80,
  },
  iconWrapActive: {
    backgroundColor: CORES.pill,
    borderWidth: 1.5,
    borderColor: CORES.pillBorda,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: CORES.tintaSuave,
  },
  labelActive: {
    color: CORES.ouro,
    fontWeight: "700",
  },
});