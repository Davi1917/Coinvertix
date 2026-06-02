import React from 'react'
import { StyleSheet, Text, View } from "react-native";

// ALTERAÇÃO:
// O <Text> foi colocado DENTRO de um componente funcional.
// Em React Native, JSX não pode ficar solto no arquivo.

export default function Page() {
  return (
    <View>
      <Text style={styles.title}>HISTÓRICO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 54,
    fontWeight: "bold",
    color: "#F59E0B",
    alignSelf: "center"
  },
});