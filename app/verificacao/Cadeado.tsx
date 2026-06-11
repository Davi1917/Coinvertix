// app/verificacao/Cadeado.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Cadeado(): null {
  const router = useRouter();

  useEffect(() => {
    const verificar = async (): Promise<void> => {
      try {
        const usuarioStr = await AsyncStorage.getItem('@coinvertix_usuario');

        if (usuarioStr) {
          router.replace('/abas/home'); // já logado → vai pra home
        } else {
          router.replace('/verificacao/login'); // não logado → vai pro login
        }
      } catch (error) {
        console.error('Erro ao verificar sessão no Cadeado:', error);
        router.replace('/verificacao/login');
      }
    };

    verificar();
  }, [router]);

  return null; // não renderiza nada, só redireciona
}