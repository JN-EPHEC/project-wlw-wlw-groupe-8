import { auth, db } from '@/fireBaseConfig';
import { collection, getDocs, limit, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function usePendingRequests() {
  const [providerId, setProviderId] = useState<string | null>(null);
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setProviderId(null);
      return;
    }
    let cancelled = false;
    const fetchProvider = async () => {
      try {
        const snapshot = await getDocs(
          query(
            collection(db, 'contacts'),
            where('userId', '==', user.uid),
            where('type', '==', 'prestataire'),
            limit(1),
          ),
        );
        if (!cancelled) {
          setProviderId(snapshot.empty ? null : snapshot.docs[0].id);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setProviderId(null);
        }
      }
    };
    fetchProvider();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!providerId) {
      setHasPending(false);
      return;
    }
    const unsubscribe = onSnapshot(
      query(collection(db, 'bookingRequests'), where('providerId', '==', providerId)),
      (snapshot) => {
        let pending = false;
        snapshot.forEach((docSnap) => {
          const status = typeof docSnap.data().status === 'string' ? docSnap.data().status.toLowerCase() : 'pending';
          if (status === 'pending') {
            pending = true;
          }
        });
        setHasPending(pending);
      },
      (err) => {
        console.error(err);
        setHasPending(false);
      },
    );
    return () => unsubscribe();
  }, [providerId]);

  return hasPending;
}
