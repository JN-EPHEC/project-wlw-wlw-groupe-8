import { Colors } from '@/constants/Colors';
import { auth, db } from '@/fireBaseConfig';
import { generateBookableSlots, type TimeSlot } from '@/utils/availability';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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

type DaySchedule = {
  active: boolean;
  slots: TimeSlot[];
};
type WeeklySchedule = Record<DayKey, DaySchedule>;
type DayAvailability = { iso: string; date: Date; slots: TimeSlot[] };

const jsDayToKey: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const monthNames = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const toISODateString = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const formatISODateFromDate = (date: Date) =>
  toISODateString(date.getFullYear(), date.getMonth(), date.getDate());

const formatDisplayDate = (iso?: string | null) => {
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map((value) => Number(value));
  if (!year || !month || !day) return iso;
  const parsed = new Date(year, month - 1, day);
  return parsed.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatServicePrice = (value?: number | null) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return `${value.toFixed(2).replace('.', ',')} €`;
  }
  return 'Sur devis';
};

const formatServiceDuration = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return null;
  }
  return `${value} h`;
};

const ProviderProfileModal = ({ provider, onClose, onContact }: ProviderProfileModalProps) => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['key']>('about');
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availableSlotsByDate, setAvailableSlotsByDate] = useState<Record<string, TimeSlot[]>>({});
  const [slotPickerVisible, setSlotPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [clientDocId, setClientDocId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<number | null>(null);
  const [bookedSlotsByDate, setBookedSlotsByDate] = useState<Record<string, TimeSlot[]>>({});
  const [pendingSlotsByDate, setPendingSlotsByDate] = useState<Record<string, TimeSlot[]>>({});

  const statsCards = useMemo(
    () => [
      { label: 'Avis', value: provider.stats.reviews, icon: 'star' as const },
      { label: "Années d'expérience", value: provider.stats.experienceYears, icon: 'briefcase' as const },
      { label: 'Événements', value: provider.stats.events, icon: 'calendar' as const },
    ],
    [provider.stats],
  );

  useEffect(() => {
    const fetchClientProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        return;
      }
      try {
        const contactsRef = collection(db, 'contacts');
        const clientSnapshot = await getDocs(
          query(contactsRef, where('userId', '==', user.uid), where('type', '==', 'client')),
        );
        if (clientSnapshot.empty) {
          return;
        }
        const clientDoc = clientSnapshot.docs[0];
        const clientData = clientDoc.data();
        setClientDocId(clientDoc.id);
        const fallbackName = (
          clientData.displayName ??
          [clientData.firstName, clientData.lastName].filter(Boolean).join(' ')
        ).trim();
        setClientName(fallbackName);
      } catch (error) {
        console.error(error);
      }
    };

    fetchClientProfile();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoadingAvailability(true);
      try {
        const docRef = doc(db, 'contacts', provider.id);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) {
          setAvailableSlotsByDate({});
          setBookedSlotsByDate({});
          return;
        }
        const data = snapshot.data();
        const availabilityData = data.availability ?? {};
        const weeklyRaw = availabilityData.weekly ?? {};
        const weeklyData = jsDayToKey.reduce((acc, key) => {
          const persisted = weeklyRaw[key] ?? {};
          const persistedSlots = Array.isArray(persisted.slots)
            ? persisted.slots
                .map((slot: any) =>
                  slot &&
                  typeof slot.start === 'string' &&
                  slot.start &&
                  typeof slot.end === 'string' &&
                  slot.end
                    ? { start: slot.start, end: slot.end }
                    : null,
                )
                .filter((slot: any): slot is TimeSlot => Boolean(slot))
            : [];
          if (persistedSlots.length === 0) {
            const legacyStart =
              typeof persisted.start === 'string' && persisted.start ? persisted.start : null;
            const legacyEnd = typeof persisted.end === 'string' && persisted.end ? persisted.end : null;
            if (legacyStart && legacyEnd) {
              persistedSlots.push({ start: legacyStart, end: legacyEnd });
            }
          }
          const hasSlots = persistedSlots.length > 0;
          const isActive =
            typeof persisted.active === 'boolean' ? persisted.active : hasSlots;
          acc[key] = {
            active: isActive,
            slots:
              persistedSlots.length > 0
                ? persistedSlots
                : isActive
                ? [{ start: '09:00', end: '18:00' }]
                : [],
          };
          return acc;
        }, {} as WeeklySchedule);

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

        const currentUserId = auth.currentUser?.uid ?? null;
        const bookingsSnapshot = await getDocs(
          query(collection(db, 'bookingRequests'), where('providerId', '==', provider.id)),
        );
        const blockingStatuses = ['confirmed', 'accepted', 'approved', 'validated'];
        const reservedByDate: Record<string, TimeSlot[]> = {};
        const pendingByUser: Record<string, TimeSlot[]> = {};
        bookingsSnapshot.docs.forEach((docSnap) => {
          const booking = docSnap.data();
          if (!booking || typeof booking.date !== 'string') {
            return;
          }
          const status = typeof booking.status === 'string' ? booking.status.toLowerCase() : 'pending';
          if (['cancelled', 'rejected'].includes(status)) {
            return;
          }
          const slot = booking.slot;
          if (
            !slot ||
            typeof slot.start !== 'string' ||
            !slot.start ||
            typeof slot.end !== 'string' ||
            !slot.end
          ) {
            return;
          }
          if (blockingStatuses.includes(status)) {
            if (!reservedByDate[booking.date]) {
              reservedByDate[booking.date] = [];
            }
            reservedByDate[booking.date].push({ start: slot.start, end: slot.end });
          } else if (status === 'pending' && booking.clientUserId === currentUserId) {
            if (!pendingByUser[booking.date]) {
              pendingByUser[booking.date] = [];
            }
            pendingByUser[booking.date].push({ start: slot.start, end: slot.end });
          }
        });

        const availabilityMap: Record<string, TimeSlot[]> = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let offset = 0; offset < 365; offset += 1) {
          const date = new Date(today);
          date.setDate(today.getDate() + offset);
          const iso = formatISODateFromDate(date);
          const isBlocked = blockedRanges.some((range: any) => iso >= range.start && iso <= range.end);
          const dayKey = jsDayToKey[date.getDay()];
          const schedule = weeklyData[dayKey];
          if (!schedule?.active || schedule.slots.length === 0 || isBlocked) {
            continue;
          }
          availabilityMap[iso] = schedule.slots.map((slot) => ({ ...slot }));
        }
        setAvailableSlotsByDate(availabilityMap);
        setBookedSlotsByDate(reservedByDate);
        setPendingSlotsByDate(pendingByUser);
        const firstKey = Object.keys(availabilityMap).sort()[0];
        if (firstKey) {
          const [year, month, day] = firstKey.split('-').map((value) => Number(value));
          if (year && month && day) {
            setCurrentMonth(month - 1);
            setCurrentYear(year);
          }
        }
      } catch (error) {
        console.error(error);
        setAvailableSlotsByDate({});
        setBookedSlotsByDate({});
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [provider.id]);

  const calendarStart = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return start;
  }, []);

  const calendarEnd = useMemo(() => {
    const end = new Date(calendarStart);
    end.setMonth(end.getMonth() + 11);
    return end;
  }, [calendarStart]);

  const availableDaysForMonth = useMemo<DayAvailability[]>(() => {
    return Object.entries(availableSlotsByDate)
      .map(([iso, slots]) => {
        const [year, month, day] = iso.split('-').map((value) => Number(value));
        const date = new Date(year, (month ?? 1) - 1, day ?? 1);
        date.setHours(0, 0, 0, 0);
        return { iso, date, slots };
      })
      .filter(
        (entry) => entry.date.getFullYear() === currentYear && entry.date.getMonth() === currentMonth,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [availableSlotsByDate, currentMonth, currentYear]);

  const selectedDateSlots = useMemo(
    () => (selectedDate ? availableSlotsByDate[selectedDate] ?? [] : []),
    [selectedDate, availableSlotsByDate],
  );

  const primaryService = useMemo(() => {
    if (!provider.services.length) {
      return undefined;
    }
    const pricedServices = provider.services.filter(
      (service) => typeof service.priceFrom === 'number' && !Number.isNaN(service.priceFrom),
    );
    if (pricedServices.length === 0) {
      return provider.services[0];
    }
    return pricedServices.reduce((best, current) => {
      if (
        typeof best.priceFrom === 'number' &&
        typeof current.priceFrom === 'number' &&
        current.priceFrom < best.priceFrom
      ) {
        return current;
      }
      if (typeof best.priceFrom !== 'number') {
        return current;
      }
      return best;
    }, pricedServices[0]);
  }, [provider.services]);

  const servicePriceSummary = useMemo(() => {
    if (!provider.services.length) {
      return 'Tarifs sur devis';
    }
    if (!primaryService || typeof primaryService.priceFrom !== 'number') {
      return 'Tarifs variables selon le service';
    }
    const priceLabel = formatServicePrice(primaryService.priceFrom);
    const durationLabel = formatServiceDuration(primaryService.durationHours);
    return durationLabel ? `${priceLabel} • ${durationLabel}` : priceLabel;
  }, [primaryService, provider.services]);

  const selectedService = useMemo(
    () => (selectedServiceIndex !== null ? provider.services[selectedServiceIndex] : null),
    [provider.services, selectedServiceIndex],
  );

  const isSlotPendingForUser = useCallback(
    (date: string | null, slot: TimeSlot) => {
      if (!date) return false;
      return (pendingSlotsByDate[date] ?? []).some(
        (pending) => pending.start === slot.start && pending.end === slot.end,
      );
    },
    [pendingSlotsByDate],
  );

  const eligibleSlots = useMemo(() => {
    if (!selectedService?.durationHours || selectedService.durationHours <= 0) {
      return [];
    }
    const reservations = selectedDate ? bookedSlotsByDate[selectedDate] ?? [] : [];
    const durationMinutes = selectedService.durationHours * 60;
    return generateBookableSlots(selectedDateSlots, durationMinutes, reservations);
  }, [bookedSlotsByDate, selectedDate, selectedDateSlots, selectedService]);

  const openSlotPicker = (iso: string) => {
    setSelectedDate(iso);
    setBookingError(null);
    setBookingSuccess(null);
    setSelectedServiceIndex(null);
    setSlotPickerVisible(true);
  };

  const closeSlotPicker = () => {
    setSlotPickerVisible(false);
    setSelectedDate(null);
    setBookingError(null);
    setBookingSuccess(null);
    setSelectedServiceIndex(null);
  };

  const handleSlotBooking = async (slot: TimeSlot) => {
    const user = auth.currentUser;
    if (!selectedDate) {
      setBookingError('Sélectionnez une date valide.');
      return;
    }
    const dateToBook = selectedDate;
    if (!selectedService) {
      setBookingError('Sélectionnez un service pour continuer.');
      return;
    }
    if (isSlotPendingForUser(dateToBook, slot)) {
      setBookingError('Vous avez déjà une demande en attente pour ce créneau.');
      return;
    }
    if (!user) {
      setBookingError('Connectez-vous pour envoyer une demande.');
      return;
    }
    if (!clientDocId) {
      setBookingError('Complétez votre profil client avant de réserver.');
      return;
    }
    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);
    try {
      await addDoc(collection(db, 'bookingRequests'), {
        providerId: provider.id,
        providerName: provider.name,
        clientContactId: clientDocId,
        clientUserId: user.uid,
        clientName: clientName || user.email,
        date: dateToBook,
        slot,
        service: {
          name: selectedService.name,
          durationHours: selectedService.durationHours ?? null,
          priceFrom: selectedService.priceFrom ?? null,
        },
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setBookingSuccess(
        'Votre demande a bien été envoyée au prestataire et est en attente de validation par celui-ci.',
      );
      setPendingSlotsByDate((prev) => {
        const current = prev[dateToBook] ?? [];
        return {
          ...prev,
          [dateToBook]: [...current, slot],
        };
      });
      Alert.alert(
        'Demande envoyée',
        'Votre demande a bien été envoyée au prestataire et est en attente de validation par celui-ci.',
      );
      closeSlotPicker();
    } catch (error) {
      console.error(error);
      setBookingError("Impossible d'envoyer la demande. Veuillez réessayer.");
    } finally {
      setBookingLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    if (
      prevYear < calendarStart.getFullYear() ||
      (prevYear === calendarStart.getFullYear() && prevMonth < calendarStart.getMonth())
    ) {
      return;
    }
    setCurrentMonth(prevMonth);
    setCurrentYear(prevYear);
  };

  const goToNextMonth = () => {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    if (
      nextYear > calendarEnd.getFullYear() ||
      (nextYear === calendarEnd.getFullYear() && nextMonth > calendarEnd.getMonth())
    ) {
      return;
    }
    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'availability':
        return (
          <LinearGradient
            colors={[Colors.light.lightBlue, Colors.light.lila]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.availabilityCard}
          >
            <Text style={styles.sectionTitle}>Disponibilités sur 12 mois</Text>
            {loadingAvailability ? (
              <View style={styles.availabilityLoader}>
                <ActivityIndicator color={Colors.light.purple} />
              </View>
            ) : Object.keys(availableSlotsByDate).length === 0 ? (
              <Text style={styles.emptyAvailabilityText}>
                Ce prestataire n&apos;a pas encore publié de créneaux disponibles.
              </Text>
            ) : (
              <>
                <View style={styles.monthNavRow}>
                  <TouchableOpacity
                    style={[
                      styles.monthNavButton,
                      currentYear === calendarStart.getFullYear() &&
                        currentMonth === calendarStart.getMonth() &&
                        styles.monthNavButtonDisabled,
                    ]}
                    onPress={goToPreviousMonth}
                    disabled={
                      currentYear === calendarStart.getFullYear() &&
                      currentMonth === calendarStart.getMonth()
                    }
                  >
                    <Ionicons name="chevron-back" size={18} color="#1F1F33" />
                  </TouchableOpacity>
                  <Text style={styles.availabilityMonth}>
                    {monthNames[currentMonth]} {currentYear}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.monthNavButton,
                      currentYear === calendarEnd.getFullYear() &&
                        currentMonth === calendarEnd.getMonth() &&
                        styles.monthNavButtonDisabled,
                    ]}
                    onPress={goToNextMonth}
                    disabled={
                      currentYear === calendarEnd.getFullYear() &&
                      currentMonth === calendarEnd.getMonth()
                    }
                  >
                    <Ionicons name="chevron-forward" size={18} color="#1F1F33" />
                  </TouchableOpacity>
                </View>

                {availableDaysForMonth.length === 0 ? (
                  <Text style={styles.emptyAvailabilityText}>
                    Aucun créneau disponible ce mois-ci.
                  </Text>
                ) : (
                  <View style={styles.daysListContainer}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                      {availableDaysForMonth.map((day) => (
                        <TouchableOpacity
                          key={day.iso}
                          style={styles.dayCard}
                          onPress={() => openSlotPicker(day.iso)}
                        >
                          <View style={styles.dayCardHeader}>
                            <Ionicons name="calendar-outline" size={16} color="#1D9A5F" />
                            <Text style={styles.dayCardWeekday}>
                              {day.date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                            </Text>
                          </View>
                          <Text style={styles.dayCardDate}>
                            {day.date.toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                            })}
                          </Text>
                          <Text style={styles.dayCardSlots}>
                            {day.slots.length} créneau{day.slots.length > 1 ? 'x' : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                <Text style={styles.availabilityHint}>
                  Touchez une date pour réserver un créneau précis.
                </Text>
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
              {provider.services.length === 0 ? (
                <Text style={styles.emptyServiceText}>
                  Ce prestataire ajoute ses services bientôt.
                </Text>
              ) : (
                <View style={styles.serviceList}>
                  {provider.services.map((service, index) => {
                    const durationLabel = formatServiceDuration(service.durationHours);
                    return (
                      <View key={`${provider.id}-service-${index}`} style={styles.serviceCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.serviceName}>{service.name}</Text>
                          {durationLabel ? <Text style={styles.serviceDuration}>{durationLabel}</Text> : null}
                        </View>
                        <Text style={styles.servicePrice}>{formatServicePrice(service.priceFrom)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
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
            <Text style={styles.infoText}>{servicePriceSummary}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#6B6B7B" />
            <Text style={styles.infoText}>{provider.responseTime}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.contactButton} onPress={() => onContact(provider)}>
          <LinearGradient
            colors={[Colors.light.pink, Colors.light.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.contactButtonGradient}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Contacter le prestataire</Text>
          </LinearGradient>
        </TouchableOpacity>

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
      </ScrollView>

      <Modal
        visible={slotPickerVisible}
        animationType="fade"
        transparent
        onRequestClose={closeSlotPicker}
      >
        <View style={styles.slotModalOverlay}>
          <View style={styles.slotModalContent}>
            <View style={styles.slotModalHeader}>
              <Text style={styles.slotModalTitle}>Sélectionnez un créneau</Text>
              <Pressable onPress={closeSlotPicker} style={styles.modalCloseButton}>
                <Ionicons name="close" size={20} color="#1F1F33" />
              </Pressable>
            </View>
            <Text style={styles.slotModalDate}>{formatDisplayDate(selectedDate)}</Text>
            {bookingError ? <Text style={styles.slotModalError}>{bookingError}</Text> : null}
            {bookingSuccess ? <Text style={styles.slotModalSuccess}>{bookingSuccess}</Text> : null}
            <ScrollView
              style={styles.slotList}
              contentContainerStyle={styles.slotListContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.slotModalSection}>
                <Text style={styles.slotModalLabel}>1. Choisissez un service</Text>
                {provider.services.length === 0 ? (
                  <Text style={styles.slotModalEmpty}>Ce prestataire n&apos;a pas encore défini ses services.</Text>
                ) : (
                  <View style={styles.slotServiceList}>
                    {provider.services.map((service, index) => {
                      const durationLabel = formatServiceDuration(service.durationHours);
                      const details = [durationLabel, formatServicePrice(service.priceFrom)]
                        .filter(Boolean)
                        .join(' • ');
                      const isSelected = selectedServiceIndex === index;
                      return (
                        <TouchableOpacity
                          key={`${service.name}-${index}`}
                          style={[styles.serviceOption, isSelected && styles.serviceOptionSelected]}
                          onPress={() => setSelectedServiceIndex(index)}
                          disabled={bookingLoading}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.serviceOptionName}>{service.name}</Text>
                            <Text style={styles.serviceOptionMeta}>
                              {details || 'Tarif communiqué après contact'}
                            </Text>
                          </View>
                          {isSelected ? (
                            <Ionicons name="checkmark-circle" size={20} color={Colors.light.purple} />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={styles.slotModalSection}>
                <Text style={styles.slotModalLabel}>2. Choisissez un horaire</Text>
                {!selectedService ? (
                  <Text style={styles.slotModalInfo}>
                    Sélectionnez un service pour afficher les heures disponibles.
                  </Text>
                ) : eligibleSlots.length === 0 ? (
                  <Text style={styles.slotModalEmpty}>
                    Aucun créneau suffisant pour ce service sur cette date.
                  </Text>
                ) : null}

                {selectedService
                  ? eligibleSlots.map((slot) => {
                      const pending = isSlotPendingForUser(selectedDate, slot);
                      return (
                        <TouchableOpacity
                          key={`${slot.start}-${slot.end}`}
                          style={[styles.slotButton, pending && styles.pendingSlotButton]}
                          onPress={() => handleSlotBooking(slot)}
                          disabled={bookingLoading || pending}
                        >
                          <Ionicons
                            name={pending ? 'time' : 'time-outline'}
                            size={18}
                            color={pending ? '#6B7280' : '#FFFFFF'}
                          />
                          <Text
                            style={[styles.slotButtonLabel, pending && styles.pendingSlotLabel]}
                          >
                            {slot.start} - {slot.end}
                          </Text>
                          {pending ? (
                            <View style={styles.pendingBadge}>
                              <Ionicons name="timer-outline" size={12} color="#6B7280" />
                              <Text style={styles.pendingBadgeText}>En attente</Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })
                  : null}
              </View>
            </ScrollView>
            <Text style={styles.slotModalHint}>Les horaires sont affichés en heure locale.</Text>
          </View>
        </View>
      </Modal>
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
  contactButton: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  contactButtonGradient: {
    borderRadius: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  availabilityMonth: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F1F33',
    marginBottom: 6,
  },
  daysListContainer: {
    marginTop: 8,
    maxHeight: 10 * 90,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayCardWeekday: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F1F33',
    textTransform: 'capitalize',
  },
  dayCardDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4C1D95',
    marginTop: 6,
    textTransform: 'capitalize',
  },
  dayCardSlots: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 13,
  },
  availabilityHint: {
    fontSize: 12,
    color: '#374151',
    opacity: 0.9,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  serviceList: {
    marginTop: 12,
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#F1F0FF',
  },
  serviceName: {
    fontWeight: '600',
    color: '#1F1F33',
  },
  serviceDuration: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  servicePrice: {
    fontWeight: '700',
    color: '#4C1D95',
    marginLeft: 12,
  },
  emptyServiceText: {
    color: '#6B7280',
    fontStyle: 'italic',
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
  slotModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  slotModalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    gap: 12,
  },
  slotModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F33',
  },
  modalCloseButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F1F5',
  },
  slotModalDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4C1D95',
    textTransform: 'capitalize',
  },
  slotModalError: {
    color: '#DC2626',
    fontSize: 13,
  },
  slotModalSuccess: {
    color: '#0F7A3D',
    fontSize: 13,
  },
  slotList: {
    maxHeight: 260,
  },
  slotListContent: {
    gap: 10,
  },
  slotModalSection: {
    gap: 8,
  },
  slotModalLabel: {
    fontWeight: '700',
    color: '#1F1F33',
  },
  slotServiceList: {
    gap: 10,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E2EC',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  serviceOptionSelected: {
    borderColor: Colors.light.purple,
    backgroundColor: '#F3EDFF',
  },
  serviceOptionName: {
    fontWeight: '600',
    color: '#1F1F33',
  },
  serviceOptionMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  slotModalInfo: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  slotModalEmpty: {
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  slotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
  },
  slotButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pendingSlotButton: {
    backgroundColor: '#E5E7EB',
  },
  pendingSlotLabel: {
    color: '#6B7280',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  pendingBadgeText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  slotModalHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
  },
});

export default ProviderProfileModal;
