// app/index.tsx
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

type Destino = '/abas/home' | '/verificacao/login' | null;

export default function Index(): React.JSX.Element {
  const [destino, setDestino] = useState<Destino>(null);

  useEffect(() => {
    // Escuta o estado do Firebase Auth — fonte de verdade principal
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        // Usuário autenticado no Firebase → garante que o perfil local existe
        const perfilStr = await AsyncStorage.getItem('@coinvertix_usuario');
        if (!perfilStr) {
          // Reconstrói o perfil local caso tenha sido apagado
          const perfil = {
            uid:             user.uid,
            nome:            user.displayName ?? user.email?.split('@')[0] ?? 'Usuário',
            email:           user.email ?? '',
            dataCriacao:     new Date().toISOString(),
            totalConversoes: 0,
          };
          await AsyncStorage.setItem('@coinvertix_usuario', JSON.stringify(perfil));
        }
        setDestino('/abas/home');
      } else {
        // Nenhum usuário autenticado → vai para login
        setDestino('/verificacao/login');
      }
    });

    return () => unsubscribe();
  }, []);

  // Enquanto verifica, exibe um spinner no centro
  if (!destino) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e1a' }}>
        <ActivityIndicator size="large" color="#1d6fff" />
      </View>
    );
  }

  return <Redirect href={destino} />;
}