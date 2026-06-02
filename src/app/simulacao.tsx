import React from 'react'
import { StyleSheet, Text, View } from "react-native";

export default function Page() {
  return (
    <View>
      <Text style={styles.title}>SIMULAÇÃO</Text>
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