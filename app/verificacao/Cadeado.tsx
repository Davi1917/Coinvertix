// app/verificacao/Cadeado.tsx
// Este componente é responsável por verificar o estado de autenticação do usuário usando o Firebase Authentication. Ele utiliza o hook useEffect para monitorar mudanças no estado de autenticação e redireciona o usuário para a tela apropriada com base em sua autenticação.
// Se o usuário estiver autenticado, ele é redirecionado para a tela principal do aplicativo (/abas/home). Caso contrário, ele é redirecionado para a tela de login (/verificacao/login). O componente retorna null, pois não há necessidade de renderizar nada na interface do usuário durante essa verificação.
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function Cadeado(): null {
  const router = useRouter();

  useEffect(() => {
    // Usa o Firebase como fonte de verdade, não o AsyncStorage
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/abas/home');
      } else {
        router.replace('/verificacao/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return null;
}