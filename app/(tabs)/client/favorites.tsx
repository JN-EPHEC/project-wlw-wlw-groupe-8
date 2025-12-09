import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useFavorites } from '@/context/FavoritesContext';
import { Provider } from '@/constants/providers';
import { useThemeColors } from '@/hooks/UseThemeColors';

const FavoriteCard = ({
  provider,
  onRemove,
}: {
  provider: Provider;
  onRemove: () => void;
}) => {
  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={['#FFFFFF', '#F9F6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarShadow}>
              <Image source={{ uri: provider.image }} style={styles.cardImage} />
            </View>
            <View>
              <Text style={styles.cardName}>{provider.name}</Text>
              <Text style={styles.cardMeta}>{provider.category}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
            <Ionicons name="heart" size={20} color="#FF5C8D" />
          </TouchableOpacity>
        </View>
        <View style={styles.chipRow}>
          <View style={styles.infoChip}>
            <Ionicons name="pricetag-outline" size={14} color="#9F6BFF" />
            <Text style={styles.infoChipText}>{provider.price}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="star" size={14} color="#FFC107" />
            <Text style={styles.infoChipText}>{provider.rating}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="location-outline" size={16} color="#73738C" />
            <Text style={styles.footerText}>{provider.city}</Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerItem}>
            <Ionicons name="time-outline" size={16} color="#73738C" />
            <Text style={styles.footerText}>{provider.responseTime}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const FavoritesScreen = () => {
  const { favorites, toggleFavorite } = useFavorites();
  const colors = useThemeColors();

  const renderFavorite = useCallback(
    ({ item }: { item: Provider }) => (
      <FavoriteCard provider={item} onRemove={() => toggleFavorite(item)} />
    ),
    [toggleFavorite],
  );

  return (
    <LinearGradient
      colors={[colors.lila, colors.lightBlue]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
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
            <Ionicons name="heart-outline" size={46} color="#D5C5FF" />
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
    marginTop: 36,
    marginBottom: 18,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F1F33',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B6B7B',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 40,
    paddingTop: 4,
    paddingHorizontal: 16,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    shadowColor: '#7E65B4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarShadow: {
    width: 70,
    height: 70,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#C5B8FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1538',
  },
  cardMeta: {
    fontSize: 14,
    color: '#7A7A8A',
    marginTop: 2,
  },
  removeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFEAF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F0FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  infoChipText: {
    fontSize: 13,
    color: '#6B5AA5',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6DFFF',
    gap: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  footerDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E1DCFF',
  },
  footerText: {
    color: '#5D5E77',
    fontSize: 13,
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
