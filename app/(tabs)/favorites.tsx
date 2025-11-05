import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ProviderCategory = "traiteur" | "dj" | "photographe" | "lieu";

type Provider = {
  id: number;
  name: string;
  category: ProviderCategory;
  rating: number;
  reviews: number;
  price: string;
  location: string;
  icon: string;
  badge: string;
  description: string;
};

type CategoryKey = "all" | ProviderCategory;

const initialProviders: Provider[] = [
  {
    id: 1,
    name: "Délices & Saveurs",
    category: "traiteur",
    rating: 4.8,
    reviews: 127,
    price: "€€€",
    location: "Bruxelles -centre",
    icon: "🍽️",
    badge: "Premium",
    description: "Traiteur gastronomique pour événements d'exception",
  },
  {
    id: 2,
    name: "DJ MixMaster",
    category: "dj",
    rating: 4.9,
    reviews: 89,
    price: "€€",
    location: "Ixelles",
    icon: "🎧",
    badge: "Top Rated",
    description: "Animation musicale pour tous vos événements",
  },
  {
    id: 3,
    name: "Château de Malmaison",
    category: "lieu",
    rating: 4.7,
    reviews: 203,
    price: "€€€€",
    location: "Evere",
    icon: "🏰",
    badge: "Historique",
    description: "Lieu d'exception dans un cadre historique",
  },
  {
    id: 4,
    name: "Photo Émotion",
    category: "photographe",
    rating: 4.9,
    reviews: 156,
    price: "€€€",
    location: "Louise",
    icon: "📸",
    badge: "Artiste",
    description: "Photographie créative et émotionnelle",
  },
  {
    id: 5,
    name: "Saveurs du Monde",
    category: "traiteur",
    rating: 4.6,
    reviews: 94,
    price: "€€",
    location: "Etterbeek",
    icon: "🌍",
    badge: "Bio",
    description: "Cuisine internationale et biologique",
  },
  {
    id: 6,
    name: "Studio Lumière",
    category: "photographe",
    rating: 4.8,
    reviews: 78,
    price: "€€",
    location: "Schuman",
    icon: "💡",
    badge: "Moderne",
    description: "Photographie moderne et lifestyle",
  },
  {
    id: 7,
    name: "DJ Electro Vibes",
    category: "dj",
    rating: 4.7,
    reviews: 112,
    price: "€€€",
    location: "Saint-Pierre",
    icon: "⚡",
    badge: "Électro",
    description: "Spécialiste musique électronique",
  },
  {
    id: 8,
    name: "Les Petits Plats",
    category: "traiteur",
    rating: 4.5,
    reviews: 67,
    price: "€",
    location: "Evere",
    icon: "🥘",
    badge: "Familial",
    description: "Cuisine traditionnelle française",
  },
];

const categories: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "traiteur", label: "Traiteurs" },
  { key: "dj", label: "DJ" },
  { key: "photographe", label: "Photos" },
  { key: "lieu", label: "Lieux" },
];

const categoryLabels: Record<ProviderCategory, string> = {
  traiteur: "Traiteur",
  dj: "DJ",
  photographe: "Photographe",
  lieu: "Lieu",
};

const categoryStyles: Record<
  ProviderCategory,
  { backgroundColor: string; textColor: string }
> = {
  traiteur: { backgroundColor: "rgba(239,68,68,0.12)", textColor: "#b91c1c" },
  dj: { backgroundColor: "rgba(168,85,247,0.12)", textColor: "#7c3aed" },
  photographe: { backgroundColor: "rgba(34,197,94,0.12)", textColor: "#15803d" },
  lieu: { backgroundColor: "rgba(249,115,22,0.12)", textColor: "#c2410c" },
};

const FavoritesScreen = () => {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [activeFilter, setActiveFilter] = useState<CategoryKey>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const counts = useMemo(() => {
    const base: Record<CategoryKey, number> = {
      all: providers.length,
      traiteur: 0,
      dj: 0,
      photographe: 0,
      lieu: 0,
    };

    providers.forEach((provider) => {
      base[provider.category] += 1;
    });

    return base;
  }, [providers]);

  const filteredProviders = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return providers.filter((provider) => {
      const matchesFilter =
        activeFilter === "all" || provider.category === activeFilter;

      const matchesSearch =
        normalizedQuery.length === 0 ||
        provider.name.toLowerCase().includes(normalizedQuery) ||
        provider.description.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });
  }, [providers, activeFilter, searchTerm]);

  const favouriteCountLabel = useMemo(() => {
    const count = providers.length;
    return `${count} favori${count > 1 ? "s" : ""}`;
  }, [providers.length]);

  const handleToggleFavorite = (id: number) => {
    setProviders((prev) => prev.filter((provider) => provider.id !== id));
  };

  return (
    <LinearGradient
      colors={["#FFD3E6", "#FFC0DA", "#FFABD0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerCard}>
              <View style={styles.headerTopRow}>
                <Text style={styles.headerTitle}>Mes Favoris</Text>
                <View style={styles.favCountPill}>
                  <Text style={styles.favCountText}>{favouriteCountLabel}</Text>
                </View>
              </View>

              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={18}
                  color="#a1a1aa"
                  style={styles.searchIcon}
                />
                <TextInput
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholder="Rechercher dans vos favoris..."
                  placeholderTextColor="#71717a"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.searchInput}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersRow}
              >
                {categories.map((category) => (
                  <Pressable
                    key={category.key}
                    onPress={() => setActiveFilter(category.key)}
                    style={({ pressed }) => [
                      styles.filterButton,
                      activeFilter === category.key && styles.filterButtonActive,
                      pressed && styles.filterButtonPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        activeFilter === category.key && styles.filterButtonTextActive,
                      ]}
                    >
                      {category.label}{" "}
                      <Text
                        style={[
                          styles.filterButtonCount,
                          activeFilter === category.key
                            ? styles.filterButtonCountActive
                            : styles.filterButtonCountInactive,
                        ]}
                      >
                        ({counts[category.key] ?? 0})
                      </Text>
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.listContainer}>
              {filteredProviders.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>💔</Text>
                  <Text style={styles.emptyTitle}>Aucun favori trouvé</Text>
                  <Text style={styles.emptySubtitle}>
                    Explorez nos prestataires et ajoutez vos préférés ici !
                  </Text>
                  <Pressable style={styles.discoverButton} onPress={() => {}}>
                    <LinearGradient
                      colors={["#f472b6", "#ec4899"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.discoverButtonGradient}
                    >
                      <Text style={styles.discoverButtonText}>
                        Découvrir les prestataires
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              ) : (
                filteredProviders.map((provider) => {
                  const categoryTheme = categoryStyles[provider.category];

                  return (
                    <View key={provider.id} style={styles.providerCard}>
                      <View style={styles.providerHeader}>
                        <View style={styles.providerHeaderLeft}>
                          <View
                            style={[
                              styles.categoryIcon,
                              { backgroundColor: categoryTheme.backgroundColor },
                            ]}
                          >
                            <Text style={styles.categoryIconText}>{provider.icon}</Text>
                          </View>
                          <View style={styles.providerHeaderText}>
                            <Text style={styles.providerName}>{provider.name}</Text>
                            <Text
                              style={[
                                styles.categoryText,
                                { color: categoryTheme.textColor },
                              ]}
                            >
                              {categoryLabels[provider.category]}
                            </Text>
                            <View style={styles.badgeRow}>
                              <LinearGradient
                                colors={["#12DFD8", "#0891b2"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.badge}
                              >
                                <Text style={styles.badgeText}>{provider.badge}</Text>
                              </LinearGradient>
                              <Text style={styles.priceText}>{provider.price}</Text>
                            </View>
                          </View>
                        </View>

                        <Pressable
                          hitSlop={12}
                          style={styles.heartButton}
                          onPress={() => handleToggleFavorite(provider.id)}
                        >
                          <Ionicons name="heart" size={22} color="#ef4444" />
                        </Pressable>
                      </View>

                      <Text style={styles.providerDescription}>
                        {provider.description}
                      </Text>

                      <View style={styles.providerMetaRow}>
                        <View style={styles.ratingRow}>
                          <RatingStars rating={provider.rating} />
                          <Text style={styles.ratingValue}>
                            {provider.rating.toFixed(1)}
                          </Text>
                          <Text style={styles.ratingReviews}>
                            ({provider.reviews})
                          </Text>
                        </View>
                        <View style={styles.locationRow}>
                          <Ionicons name="location-outline" size={14} color="#6b7280" />
                          <Text style={styles.locationText}>{provider.location}</Text>
                        </View>
                      </View>

                      <View style={styles.actionsRow}>
                        <Pressable style={styles.primaryAction} onPress={() => {}}>
                          <LinearGradient
                            colors={["#f472b6", "#ec4899"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.primaryActionGradient}
                          >
                            <Text style={styles.primaryActionText}>Contacter</Text>
                          </LinearGradient>
                        </Pressable>
                        <Pressable style={styles.secondaryAction} onPress={() => {}}>
                          <Text style={styles.secondaryActionText}>Voir plus</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

type RatingStarsProps = {
  rating: number;
};

const RatingStars = ({ rating }: RatingStarsProps) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const totalStars = 5;

  return (
    <View style={styles.starsRow}>
      {Array.from({ length: totalStars }).map((_, index) => {
        if (index < fullStars) {
          return <Ionicons key={index} name="star" size={14} color="#fbbf24" />;
        }

        if (index === fullStars && hasHalfStar) {
          return <Ionicons key={index} name="star-half" size={14} color="#fbbf24" />;
        }

        return <Ionicons key={index} name="star-outline" size={14} color="#fbbf24" />;
      })}
    </View>
  );
};

export default FavoritesScreen;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
  },
  headerCard: {
    backgroundColor: "rgba(255,255,255,0.28)",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1f2937",
  },
  favCountPill: {
    backgroundColor: "rgba(255,255,255,0.4)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  favCountText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  searchContainer: {
    position: "relative",
    marginBottom: 14,
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    top: "50%",
    marginTop: -9,
  },
  searchInput: {
    borderRadius: 20,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    paddingLeft: 40,
    paddingRight: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.82)",
    color: "#1f2937",
    fontSize: 15,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 4,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  filterButtonActive: {
    backgroundColor: "#12DFD8",
    borderColor: "rgba(18,223,216,0.2)",
    shadowColor: "#12DFD8",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  filterButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  filterButtonTextActive: {
    color: "#ffffff",
  },
  filterButtonCount: {
    fontSize: 11,
    fontWeight: "600",
  },
  filterButtonCountActive: {
    color: "rgba(255,255,255,0.85)",
  },
  filterButtonCountInactive: {
    color: "rgba(55,65,81,0.7)",
  },
  listContainer: {
    gap: 16,
  },
  providerCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    gap: 12,
  },
  providerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  providerHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    height: 42,
    width: 42,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIconText: {
    fontSize: 18,
  },
  providerHeaderText: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "#ffffff",
  },
  priceText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
  },
  heartButton: {
    padding: 8,
  },
  providerDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4b5563",
  },
  providerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  ratingReviews: {
    fontSize: 11,
    color: "#6b7280",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#6b7280",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  primaryAction: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  primaryActionGradient: {
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: "center",
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  secondaryAction: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    marginBottom: 20,
  },
  discoverButton: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
  },
  discoverButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  discoverButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
});
