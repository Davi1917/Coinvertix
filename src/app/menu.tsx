import React from 'react'
import { StyleSheet, Text, View, TextInput, Image } from "react-native";
import { Button } from 'react-native-paper';
import { useRouter } from "expo-router"
const TextInputExample = () => {
  
}



export default function Page() {
  const [text1, onChangeText1] = React.useState('Usuário')
  const [text2, onChangeText2] = React.useState('Senha')
  

  const router = useRouter()
  //Mas por que aqui? Por que dentro da função page?

  return (

    <View style={styles.container}>
      <View style={styles.main}>

      <Text style={styles.title}>Bem-Vindo!</Text>
      
    <Button 
  style={styles.button}
  mode="contained" 
  buttonColor="blue" 
  textColor="black"
  onPress={() => router.navigate("/simulacao")}
    >
        SIMULAÇÃO DE SALDO
    </Button>

    <Button 
  style={styles.button}
  mode="contained" 
  buttonColor="blue" 
  textColor="black"
  onPress={() => router.navigate("/conversao")}
    >
        CONVERSÃO DIRETA
    </Button>

    <Button 
  style={styles.button}
  mode="contained" 
  buttonColor="blue" 
  textColor="black"
  onPress={() => router.navigate("/history")}
    >
        HISTÓRICO DE CONVERSÕES
    </Button>


        


      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0F172A",
  },
  main: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 960,
    marginHorizontal: "auto",
    gap: 50

  },

  button: {
    width: 300,
    height: 40,
    gap: 1000,
    alignSelf: "center"
  },

  title: {
    fontSize: 54,
    fontWeight: "bold",
    color: "#F59E0B",
  }
});

