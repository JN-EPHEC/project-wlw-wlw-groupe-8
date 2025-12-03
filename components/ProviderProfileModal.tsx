import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Provider } from '@/constants/providers';

type ProviderProfileModalProps = {
  provider: Provider;
  onClose: () => void;
  onContact: (provider: Provider) => void;
};

const tabs = [
  { key: 'about', label: 'À propos' },
  { key: 'availability', label: 'Disponibilités' },
  { key: 'reviews', label: 'Avis' },
] as const;

const ProviderProfileModal = ({ provider, onClose, onContact }: ProviderProfileModalProps) => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['key']>('about');

  const statsCards = useMemo(
    () => [
      { label: 'Avis', value: provider.stats.reviews, icon: 'star' as const },
      { label: "Années d'expérience", value: provider.stats.experienceYears, icon: 'briefcase' as const },
      { label: 'Événements', value: provider.stats.events, icon: 'calendar' as const },
    ],
    [provider.stats],
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'availability':
        return (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Disponibilités</Text>
            <Text style={styles.descriptionText}>{provider.availability}</Text>
          </View>
        );
      case 'reviews':
        return (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Avis ({provider.reviews.length})</Text>
            <View style={{ gap: 12 }}>
              {provider.reviews.map((review, index) => (
                <View key={`${provider.id}-review-${index}`} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{review.author}</Text>
                    <View style={styles.reviewScore}>
                      <Ionicons name="star" size={14} color="#FDBA74" />
                      <Text style={styles.reviewRating}>{review.rating.toFixed(1)}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      case 'about':
      default:
        return (
          <View style={{ gap: 16 }}>
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{provider.description}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Services proposés</Text>
              <View style={styles.pillList}>
                {provider.services.map((service, index) => (
                  <View key={`${provider.id}-service-${index}`} style={styles.servicePill}>
                    <Text style={styles.serviceText}>{service}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Galerie</Text>
              <View style={styles.galleryRow}>
                {provider.gallery.map((uri, index) => (
                  <Image key={`${provider.id}-gallery-${index}`} source={{ uri }} style={styles.galleryImage} />
                ))}
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={{ uri: provider.image }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Fermer">
              <Ionicons name="close" size={20} color="#1F1F33" />
            </TouchableOpacity>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroCategory}>{provider.category}</Text>
              <Text style={styles.heroName}>{provider.name}</Text>
              <View style={styles.heroMetaRow}>
                <Ionicons name="location-outline" size={14} color="#FFFFFF" />
                <Text style={styles.heroMetaText}>{provider.location}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          {statsCards.map((card) => (
            <View key={card.label} style={styles.statCard}>
              <Ionicons name={card.icon} size={18} color="#7C3AED" />
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#6B6B7B" />
            <Text style={styles.infoText}>{provider.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={18} color="#6B6B7B" />
            <Text style={styles.infoText}>{provider.priceRange}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#6B6B7B" />
            <Text style={styles.infoText}>{provider.responseTime}</Text>
          </View>
        </View>

        <View style={styles.tabsRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {renderTabContent()}

        <Pressable style={styles.ctaButton} onPress={() => onContact(provider)}>
          <Text style={styles.ctaText}>Contacter le prestataire</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7FB',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  hero: {
    height: 260,
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  heroTextBlock: {
    gap: 6,
  },
  heroCategory: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    gap: 4,
    shadowColor: '#141414',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18181B',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 18,
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#3F3F46',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#EAEAF5',
    borderRadius: 18,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  tabButtonTextActive: {
    color: '#4C1D95',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F33',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  pillList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  servicePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4338CA',
  },
  galleryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  galleryImage: {
    flex: 1,
    height: 110,
    borderRadius: 16,
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  reviewScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EA580C',
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewComment: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  ctaButton: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#4B6BFF',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4B6BFF',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProviderProfileModal;
