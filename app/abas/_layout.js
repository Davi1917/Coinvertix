import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

const CORES = {
  fundo:      "#0a0e1a",
  ouro:       "#f5c542",
  ouroClaro:  "#f5d54e",
  tinta:      "#e8f0ff",
  tintaSuave: "#4a6fa5",
  borda:      "#1e2540",
  pill:       "#f5c54220",
  pillBorda:  "#f5c54260",
};

function TabIcon({ icon, label, focused }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <FontAwesome5
        name={icon}
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