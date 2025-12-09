import { auth, db } from '@/fireBaseConfig';
import { collection, getDocs, limit, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

type Role = 'client' | 'prestataire';

export function useUnreadMessages(role: Role) {
  const [contactId, setContactId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setContactId(null);
      return;
    }
    let cancelled = false;
    const fetchContact = async () => {
      try {
        const snapshot = await getDocs(
          query(
            collection(db, 'contacts'),
            where('userId', '==', user.uid),
            where('type', '==', role === 'client' ? 'client' : 'prestataire'),
            limit(1),
          ),
        );
        if (!cancelled) {
          setContactId(snapshot.empty ? null : snapshot.docs[0].id);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setContactId(null);
        }
      }
    };
    fetchContact();
    return () => {
      cancelled = true;
    };
  }, [role]);

  useEffect(() => {
    if (!contactId) {
      setHasUnread(false);
      return;
    }
    const field = role === 'client' ? 'clientContactId' : 'providerId';
    const unreadField = role === 'client' ? 'unreadByClient' : 'unreadByProvider';
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'conversations'),
        where(field, '==', contactId),
        where(unreadField, '==', true),
      ),
      (snapshot) => {
        setHasUnread(!snapshot.empty);
      },
      (err) => {
        console.error(err);
        setHasUnread(false);
      },
    );
    return () => unsubscribe();
  }, [contactId, role]);

  return hasUnread;
}
