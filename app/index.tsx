// app/index.tsx
// Este arquivo é a porta de entrada do aplicativo. Ele verifica o estado de autenticação do usuário usando o Firebase Authentication e redireciona para a tela apropriada com base nesse estado. Se o usuário estiver autenticado, ele é redirecionado para a tela principal (/abas/home); caso contrário, ele é redirecionado para a tela de login (/verificacao/login). Durante a verificação, um spinner de carregamento é exibido no centro da tela.
// O componente utiliza o hook useEffect para monitorar mudanças no estado de autenticação e o hook useState para gerenciar o destino do redirecionamento. O AsyncStorage é usado para armazenar localmente as informações do usuário, garantindo que o perfil local seja reconstruído caso tenha sido apagado.
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