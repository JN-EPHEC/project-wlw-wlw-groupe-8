import { Provider } from '@/constants/providers';
import { auth, db } from '@/fireBaseConfig';
import { mapContactToProvider } from '@/utils/providerMapper';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type FavoritesContextValue = {
  favorites: Provider[];
  toggleFavorite: (provider: Provider) => Promise<void> | void;
  removeFavorite: (id: string) => Promise<void> | void;
  isFavorite: (id: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

type FavoritesProviderProps = {
  children: ReactNode;
};

export const FavoritesProvider = ({ children }: FavoritesProviderProps) => {
  const [favoritesMap, setFavoritesMap] = useState<Record<string, Provider>>({});
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [clientDocId, setClientDocId] = useState<string | null>(null);

  const loadFavorites = useCallback(async (uid: string) => {
    try {
      const contactsCollection = collection(db, 'contacts');
      const clientQuery = query(
        contactsCollection,
        where('userId', '==', uid),
        where('type', '==', 'client'),
      );
      const snapshot = await getDocs(clientQuery);
      if (snapshot.empty) {
        setFavoritesMap({});
        setFavoriteIds([]);
        setClientDocId(null);
        return;
      }

      const docSnap = snapshot.docs[0];
      setClientDocId(docSnap.id);
      const favoritesField = docSnap.data().favorites;
      const ids = Array.isArray(favoritesField)
        ? favoritesField.filter((value): value is string => typeof value === 'string')
        : [];
      setFavoriteIds(ids);

      if (!ids.length) {
        setFavoritesMap({});
        return;
      }

      const providers = await Promise.all(
        ids.map(async (providerId) => {
          try {
            const providerDoc = await getDoc(doc(db, 'contacts', providerId));
            if (!providerDoc.exists()) {
              return null;
            }
            return mapContactToProvider(providerDoc.id, providerDoc.data());
          } catch (error) {
            console.error('Impossible de charger le favori :', error);
            return null;
          }
        }),
      );

      const map: Record<string, Provider> = {};
      providers.forEach((provider) => {
        if (provider) {
          map[provider.id] = provider;
        }
      });
      setFavoritesMap(map);
    } catch (error) {
      console.error('Impossible de récupérer les favoris :', error);
      setFavoritesMap({});
      setFavoriteIds([]);
      setClientDocId(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        loadFavorites(firebaseUser.uid);
      } else {
        setFavoritesMap({});
        setFavoriteIds([]);
        setClientDocId(null);
      }
    });
    return unsubscribe;
  }, [loadFavorites]);

  const persistFavorites = useCallback(
    async (nextIds: string[]) => {
      if (!clientDocId) {
        return;
      }
      try {
        await updateDoc(doc(db, 'contacts', clientDocId), { favorites: nextIds });
      } catch (error) {
        console.error("Impossible d'enregistrer les favoris :", error);
      }
    },
    [clientDocId],
  );

  const toggleFavorite = useCallback(
    async (provider: Provider) => {
      if (!clientDocId) {
        return;
      }
      const alreadyFavorite = favoriteIds.includes(provider.id);
      const nextIds = alreadyFavorite
        ? favoriteIds.filter((id) => id !== provider.id)
        : [...favoriteIds, provider.id];
      setFavoriteIds(nextIds);
      setFavoritesMap((prev) => {
        const next = { ...prev };
        if (alreadyFavorite) {
          delete next[provider.id];
        } else {
          next[provider.id] = provider;
        }
        return next;
      });
      await persistFavorites(nextIds);
    },
    [clientDocId, favoriteIds, persistFavorites],
  );

  const removeFavorite = useCallback(
    async (id: string) => {
      if (!favoriteIds.includes(id)) {
        return;
      }
      const nextIds = favoriteIds.filter((favoriteId) => favoriteId !== id);
      setFavoriteIds(nextIds);
      setFavoritesMap((prev) => {
        if (!prev[id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await persistFavorites(nextIds);
    },
    [favoriteIds, persistFavorites],
  );

  const favorites = useMemo(() => Object.values(favoritesMap), [favoritesMap]);

  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);

  const value = useMemo(
    () => ({
      favorites,
      toggleFavorite,
      removeFavorite,
      isFavorite,
    }),
    [favorites, toggleFavorite, removeFavorite, isFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);

  if (!context) {
    return {
      favorites: [],
      toggleFavorite: async () => {},
      removeFavorite: async () => {},
      isFavorite: () => false,
    };
  }

  return context;
};
