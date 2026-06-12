// app/_layout.tsx
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