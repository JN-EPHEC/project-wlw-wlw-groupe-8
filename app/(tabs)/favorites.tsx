import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useFavorites } from '@/context/FavoritesContext';
import { Provider } from '@/constants/providers';

const FavoriteCard = ({
  provider,
  onRemove,
}: {
  provider: Provider;
  onRemove: () => void;
}) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: provider.image }} style={styles.cardImage} />

      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{provider.name}</Text>
        <Text style={styles.cardMeta}>
          {provider.category} • {provider.city}
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFC107" />
            <Text style={styles.ratingText}>{provider.rating}</Text>
          </View>
          <Text style={styles.cardPrice}>{provider.price}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Ionicons name="heart" size={22} color="#FF5C8D" />
      </TouchableOpacity>
    </View>
  );
};

const FavoritesScreen = () => {
  const { favorites, toggleFavorite } = useFavorites();

  const renderFavorite = useCallback(
    ({ item }: { item: Provider }) => (
      <FavoriteCard provider={item} onRemove={() => toggleFavorite(item)} />
    ),
    [toggleFavorite],
  );

  return (
    <LinearGradient
      colors={['#F1E7FF', '#E0F7FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes favoris</Text>
          <Text style={styles.headerSubtitle}>
            {favorites.length === 0
              ? "Ajoutez des prestataires depuis l'onglet Accueil"
              : `${favorites.length} prestataire${favorites.length > 1 ? 's' : ''}`}
          </Text>
        </View>

        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={40} color="#C0C0C8" />
            <Text style={styles.emptyTitle}>Vos favoris sont vides</Text>
            <Text style={styles.emptySubtitle}>
              Appuyez sur le coeur d&apos;un prestataire pour le retrouver ici.
            </Text>
          </View>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.id}
            renderItem={renderFavorite}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default FavoritesScreen;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#33244D',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B6B7B',
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#7E65B4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1644',
  },
  cardMeta: {
    fontSize: 13,
    color: '#7A7A8A',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#645582',
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#A24BFF',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCE6EE',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#2F1F44',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B6B7B',
    textAlign: 'center',
  },
});
