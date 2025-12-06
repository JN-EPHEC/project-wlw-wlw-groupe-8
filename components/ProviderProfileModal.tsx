import { Colors } from '@/constants/Colors';
import { db } from '@/fireBaseConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

type DayKey =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

type WeeklySchedule = Record<
  DayKey,
  {
    start?: string;
    end?: string;
    active?: boolean;
  }
>;

const jsDayToKey: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const defaultWeeklySchedule: WeeklySchedule = {
  sunday: { active: false },
  monday: { start: '09:00', end: '18:00', active: true },
  tuesday: { start: '09:00', end: '18:00', active: true },
  wednesday: { start: '09:00', end: '18:00', active: true },
  thursday: { start: '09:00', end: '18:00', active: true },
  friday: { start: '09:00', end: '18:00', active: true },
  saturday: { active: false },
};

type AvailabilitySlot = { date: Date; status: 'available' | 'reserved' };
type AvailabilitySection = { label: string; slots: AvailabilitySlot[] };

const ProviderProfileModal = ({ provider, onClose, onContact }: ProviderProfileModalProps) => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['key']>('about');
  const [availabilitySections, setAvailabilitySections] = useState<AvailabilitySection[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  const statsCards = useMemo(
    () => [
      { label: 'Avis', value: provider.stats.reviews, icon: 'star' as const },
      { label: "Années d'expérience", value: provider.stats.experienceYears, icon: 'briefcase' as const },
      { label: 'Événements', value: provider.stats.events, icon: 'calendar' as const },
    ],
    [provider.stats],
  );

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoadingAvailability(true);
      try {
        const docRef = doc(db, 'contacts', provider.id);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) {
          setAvailabilitySections([]);
          return;
        }
        const data = snapshot.data();
        const availabilityData = data.availability ?? {};
        const weeklyData: WeeklySchedule = {
          ...defaultWeeklySchedule,
          ...(availabilityData.weekly ?? {}),
        };

        const blockedRangesRaw = Array.isArray(availabilityData.blockedRanges)
          ? availabilityData.blockedRanges
          : [];
        const blockedRanges =
          blockedRangesRaw.length > 0
            ? blockedRangesRaw
                .map((range: any) =>
                  range && typeof range.start === 'string' && typeof range.end === 'string'
                    ? {
                        start: range.start,
                        end: range.end,
                      }
                    : null,
                )
                .filter((item: any): item is { start: string; end: string } => Boolean(item))
            : Array.isArray(availabilityData.blockedDates)
            ? availabilityData.blockedDates
                .filter((date: unknown): date is string => typeof date === 'string')
                .map((date: any) => ({ start: date, end: date }))
            : [];

        const sectionsMap = new Map<string, AvailabilitySection>();
        const today = new Date();
        for (let offset = 0; offset < 365; offset += 1) {
          const date = new Date(today);
          date.setHours(0, 0, 0, 0);
          date.setDate(today.getDate() + offset);
          const iso = date.toISOString().split('T')[0];
          const isBlocked = blockedRanges.some((range: any) => iso >= range.start && iso <= range.end);
          const dayKey = jsDayToKey[date.getDay()];
          const schedule = weeklyData[dayKey];
          const isActive = schedule?.active && schedule.start && schedule.end;
          if (isBlocked || !isActive) {
            continue;
          }
          const monthLabel = date.toLocaleDateString('fr-FR', {
            month: 'long',
            year: 'numeric',
          });
          if (!sectionsMap.has(monthLabel)) {
            sectionsMap.set(monthLabel, { label: monthLabel, slots: [] });
          }
          sectionsMap.get(monthLabel)?.slots.push({
            date,
            status: 'available',
          });
        }
        const sections = Array.from(sectionsMap.values()).filter((section) => section.slots.length > 0);
        setAvailabilitySections(sections);
        setCurrentMonthIndex(0);
      } catch (error) {
        console.error(error);
        setAvailabilitySections([]);
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [provider.id]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'availability':
        const currentSection = availabilitySections[currentMonthIndex];
        return (
          <LinearGradient
            colors={[Colors.light.lightBlue, Colors.light.lila]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.availabilityCard}
          >
            <Text style={styles.sectionTitle}>Disponibilités à venir</Text>
            {loadingAvailability ? (
              <View style={styles.availabilityLoader}>
                <ActivityIndicator color={Colors.light.purple} />
              </View>
            ) : availabilitySections.length === 0 ? (
              <Text style={styles.emptyAvailabilityText}>
                Ce prestataire n&apos;a pas encore publié de disponibilités.
              </Text>
            ) : (
              <>
                <View style={styles.monthNavRow}>
                  <TouchableOpacity
                    style={[
                      styles.monthNavButton,
                      currentMonthIndex === 0 && styles.monthNavButtonDisabled,
                    ]}
                    onPress={() => setCurrentMonthIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentMonthIndex === 0}
                  >
                    <Ionicons name="chevron-back" size={18} color="#1F1F33" />
                  </TouchableOpacity>
                  <Text style={styles.availabilityMonth}>
                    {currentSection?.label ?? availabilitySections[0].label}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.monthNavButton,
                      currentMonthIndex === availabilitySections.length - 1 && styles.monthNavButtonDisabled,
                    ]}
                    onPress={() =>
                      setCurrentMonthIndex((prev) => Math.min(availabilitySections.length - 1, prev + 1))
                    }
                    disabled={currentMonthIndex === availabilitySections.length - 1}
                  >
                    <Ionicons name="chevron-forward" size={18} color="#1F1F33" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.availabilityList}
                  contentContainerStyle={styles.availabilityContent}
                  showsVerticalScrollIndicator={false}
                >
                  {(currentSection?.slots ?? []).map((slot) => (
                    <View key={slot.date.toISOString()} style={styles.availabilityItem}>
                      <View style={styles.availabilityDate}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color={slot.status === 'available' ? '#1D9A5F' : '#D6455F'}
                        />
                        <Text style={styles.availabilityLabel}>
                          {slot.date.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          slot.status === 'available' ? styles.statusAvailable : styles.statusReserved,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            slot.status === 'available'
                              ? styles.statusAvailableText
                              : styles.statusReservedText,
                          ]}
                        >
                          {slot.status === 'available' ? 'Disponible' : 'Réservé'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </LinearGradient>
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
              {provider.gallery.length === 0 ? (
                <Text style={styles.emptyGalleryText}>
                  Ce prestataire n&apos;a pas encore ajouté de photos.
                </Text>
              ) : (
                <View style={styles.galleryRow}>
                  {provider.gallery.map((uri, index) => (
                    <Image key={`${provider.id}-gallery-${index}`} source={{ uri }} style={styles.galleryImage} />
                  ))}
                </View>
              )}
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
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
          <Text style={styles.ctaText}>Demander un rendez-vous</Text>
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
  availabilityCard: {
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNavButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavButtonDisabled: {
    opacity: 0.4,
  },
  availabilityLoader: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyAvailabilityText: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  availabilitySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  availabilityMonth: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F1F33',
    marginBottom: 6,
  },
  availabilityList: {
    marginTop: 10,
    maxHeight: 10 * 64,
  },
  availabilityContent: {
    gap: 10,
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  availabilityDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityLabel: {
    fontWeight: '600',
    color: '#1F1F33',
    textTransform: 'capitalize',
  },
  statusPill: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  statusPillText: {
    fontWeight: '600',
  },
  statusAvailable: {
    backgroundColor: '#D8FCE3',
  },
  statusAvailableText: {
    color: '#1D9A5F',
  },
  statusReserved: {
    backgroundColor: '#FFD9D9',
  },
  statusReservedText: {
    color: '#D6455F',
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
    marginTop: 12,
  },
  galleryImage: {
    flex: 1,
    height: 110,
    borderRadius: 16,
  },
  emptyGalleryText: {
    color: '#6B7280',
    fontStyle: 'italic',
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
