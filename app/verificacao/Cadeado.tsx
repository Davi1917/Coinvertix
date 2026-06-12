// app/verificacao/Cadeado.tsx
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