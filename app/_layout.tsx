// app/_layout.tsx
//Este arquivo é responsável por definir a estrutura de navegação do aplicativo usando o Stack Navigator do Expo Router. Ele importa os componentes necessários e define as telas que estarão disponíveis na pilha de navegação, desativando o cabeçalho padrão para todas as telas.
import React from 'react';
import { Stack } from 'expo-router';

export default function Layout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="abas" />
      <Stack.Screen name="verificacao/login" />
      <Stack.Screen name="verificacao/Cadeado" />
      <Stack.Screen name="simulacao" />
      <Stack.Screen name="conversao" />
    </Stack>
  );
}