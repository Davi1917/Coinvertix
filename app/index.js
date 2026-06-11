import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [destino, setDestino] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('@coinvertix_usuario')
      .then((usuario) => {
        setDestino(usuario ? '/abas/home' : '/verificacao/login');
      })
      .catch(() => setDestino('/verificacao/login'));
  }, []);

  if (!destino) return null;

  return <Redirect href={destino} />;
}