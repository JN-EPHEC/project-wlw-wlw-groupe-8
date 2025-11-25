import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { Provider } from '@/constants/providers';

type FavoritesContextValue = {
  favorites: Provider[];
  toggleFavorite: (provider: Provider) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

type FavoritesProviderProps = {
  children: ReactNode;
};

export const FavoritesProvider = ({ children }: FavoritesProviderProps) => {
  const [favoritesMap, setFavoritesMap] = useState<Record<string, Provider>>({});

  const toggleFavorite = useCallback((provider: Provider) => {
    setFavoritesMap((prev) => {
      if (prev[provider.id]) {
        const next = { ...prev };
        delete next[provider.id];
        return next;
      }

      return { ...prev, [provider.id]: provider };
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavoritesMap((prev) => {
      if (!prev[id]) {
        return prev;
      }
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const favorites = useMemo(() => Object.values(favoritesMap), [favoritesMap]);

  const isFavorite = useCallback((id: string) => Boolean(favoritesMap[id]), [favoritesMap]);

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
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }

  return context;
};
