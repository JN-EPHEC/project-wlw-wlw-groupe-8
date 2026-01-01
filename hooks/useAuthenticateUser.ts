import { auth, db } from '@/fireBaseConfig';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';

export function useAuthenticateUser() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        return;
      }
      try {
        const snapshot = await getDocs(
          query(
            collection(db, 'contacts'),
            where('userId', '==', user.uid),
            limit(1),
          ),
        );
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          if (data.type === 'prestataire') {
            router.replace('/(tabs)/prestataire');
          } else if (data.type === 'client') {
            router.replace('/(tabs)/client');
          }
        }
      } catch (err) {
        console.error(err);
      }
    });
    return () => unsubscribe();
  }, [router]);
}
