import React from 'react'
import { StyleSheet, Text, View, TextInput, Image } from "react-native";
import { Button } from 'react-native-paper';
import { useRouter } from "expo-router"
const TextInputExample = () => {
  
}

const router = useRouter()

export default function Page() {
  const [text1, onChangeText1] = React.useState('Usuário')
  const [text2, onChangeText2] = React.useState('Senha')
  

  return (

    <View style={styles.container}>
      <View style={styles.main}>
      <Image
      style={styles.logo}
      source={require('../../assets/logo-principal.png')
        
      }
      />
        <Text style={styles.title}>COINVERTIX</Text>
        <TextInput 
        style={styles.input}
        onChangeText={onChangeText1}
        value={text1}
        />
        <TextInput 
        style={styles.input}
        onChangeText={onChangeText2}
        value={text2}
        />

<Button 
  style={styles.button}
  mode="contained" 
  buttonColor="yellow" 
  textColor="black"
  onPress={() => router.navigate("/menu")}
>
  Fazer login
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

  },
  title: {
    fontSize: 54,
    fontWeight: "bold",
    color: "#F59E0B",
  },

  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    backgroundColor: "#9A9A9A",

  },

  logo: {
    width: 200,
    height: 176 ,
    alignSelf: "center",
    borderRadius: 50
    
  },

  button: {
    width: 200,
    height: 40,
    alignSelf: "center"
  }
});

