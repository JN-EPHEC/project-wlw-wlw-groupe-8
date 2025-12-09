import ProviderChatModal from '@/components/ProviderChatModal';
import ProviderProfileModal from '@/components/ProviderProfileModal';
import { Provider } from '@/constants/providers';
import { useFavorites } from '@/context/FavoritesContext';
import { db } from '@/fireBaseConfig';
import {
  formatPrice,
  getInitials,
  mapContactToProvider,
  PLACEHOLDER_AVATAR_URI,
} from '@/utils/providerMapper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageStyle,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const jobOptions = ['Photographe', 'DJ', 'Traiteur', 'Fleuriste', 'Décorateur', 'Animateur'];
const priceOptions = ['Tous', '0€ - 250€', '250€ - 500€', '500€ - 1000€', '1000€ +'];
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
const weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const buildCalendarMatrix = (cursor: Date) => {
  const startCursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const firstDay = (startCursor.getDay() + 6) % 7;
  startCursor.setDate(startCursor.getDate() - firstDay);
  const weeks: Date[][] = [];
  for (let week = 0; week < 6; week += 1) {
    const days: Date[] = [];
    for (let day = 0; day < 7; day += 1) {
      days.push(new Date(startCursor));
      startCursor.setDate(startCursor.getDate() + 1);
    }
    weeks.push(days);
  }
  return weeks;
};

type ProviderAvatarProps = {
  name: string;
  image?: string;
  style: ImageStyle;
};

type DayKey =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

type DayScheduleMeta = {
  active: boolean;
  slots: { start: string; end: string }[];
};

type ProviderAvailabilityMeta = {
  weekly: Record<DayKey, DayScheduleMeta>;
  blockedDates: Set<string>;
  blockedRanges: { start: string; end: string }[];
};

type ProviderWithMeta = Provider & {
  _minPriceValue: number | null;
  _cityValues: string[];
  _availabilityMeta: ProviderAvailabilityMeta | null;
};

const dayKeyMap: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const formatISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const parsePriceLabel = (label: string | null | undefined) => {
  if (!label || typeof label !== 'string') {
    return null;
  }
  const cleaned = label.replace(/[^\d.,-]/g, '').replace(',', '.');
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
};

const computeMinServicePrice = (provider: Provider) => {
  const prices = provider.services
    .map((service) => (typeof service.priceFrom === 'number' ? service.priceFrom : null))
    .filter((value): value is number => value !== null);
  if (prices.length > 0) {
    return Math.min(...prices);
  }
  return parsePriceLabel(provider.price);
};

const normalizeCities = (provider: Provider, rawData: Record<string, any>) => {
  const rawCities: string[] = Array.isArray(rawData?.cities)
    ? rawData.cities.filter((city): city is string => typeof city === 'string' && city.trim().length > 0)
    : [];
  const fromLabel = provider.city
    .split(',')
    .map((city) => city.trim())
    .filter(Boolean);
  const merged = [...rawCities, ...fromLabel];
  const unique = Array.from(new Set(merged.map((city) => city.trim())));
  return unique;
};

const normalizeAvailabilityMeta = (value: any): ProviderAvailabilityMeta | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const weeklyRaw = value.weekly ?? {};
  const weekly: Record<DayKey, DayScheduleMeta> = {
    sunday: { active: false, slots: [] },
    monday: { active: false, slots: [] },
    tuesday: { active: false, slots: [] },
    wednesday: { active: false, slots: [] },
    thursday: { active: false, slots: [] },
    friday: { active: false, slots: [] },
    saturday: { active: false, slots: [] },
  };
  dayKeyMap.forEach((key) => {
    const entry = weeklyRaw?.[key];
    if (entry && typeof entry === 'object') {
      const slots = Array.isArray(entry.slots)
        ? entry.slots
            .map((slot: any) =>
              slot &&
              typeof slot.start === 'string' &&
              typeof slot.end === 'string'
                ? { start: slot.start, end: slot.end }
                : null,
            )
            .filter((slot: any): slot is { start: string; end: string } => Boolean(slot))
        : [];
      weekly[key] = {
        active: Boolean(entry.active) && slots.length > 0,
        slots,
      };
    }
  });

  const blockedDates = Array.isArray(value.blockedDates)
    ? value.blockedDates.filter((date: unknown): date is string => typeof date === 'string')
    : [];
  const blockedRanges = Array.isArray(value.blockedRanges)
    ? value.blockedRanges
        .map((range: any) =>
          range &&
          typeof range.start === 'string' &&
          typeof range.end === 'string'
            ? { start: range.start, end: range.end }
            : null,
        )
        .filter((item: any): item is { start: string; end: string } => Boolean(item))
    : [];

  return {
    weekly,
    blockedDates: new Set(blockedDates),
    blockedRanges,
  };
};

const isDateBlocked = (meta: ProviderAvailabilityMeta, iso: string) => {
  if (meta.blockedDates.has(iso)) {
    return true;
  }
  return meta.blockedRanges.some((range) => iso >= range.start && iso <= range.end);
};

const providerMatchesAvailability = (
  meta: ProviderAvailabilityMeta | null,
  start: { day: number; month: number; year: number } | null,
  end: { day: number; month: number; year: number } | null,
) => {
  if (!start) {
    return true;
  }
  if (!meta) {
    return false;
  }
  const endDate = end ?? start;
  const startDateObj = new Date(start.year, start.month, start.day);
  const endDateObj = new Date(endDate.year, endDate.month, endDate.day);

  for (
    let cursor = new Date(startDateObj);
    cursor.getTime() <= endDateObj.getTime();
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const iso = formatISODate(cursor);
    if (isDateBlocked(meta, iso)) {
      continue;
    }
    const dayKey = dayKeyMap[cursor.getDay()];
    const schedule = meta.weekly?.[dayKey];
    if (schedule?.active && schedule.slots.length > 0) {
      return true;
    }
  }
  return false;
};

const parsePriceRange = (value: string | null) => {
  if (!value || value === 'Tous') {
    return null;
  }
  if (value === '1000€ +') {
    return { min: 1000, max: null };
  }
  const [minLabel, maxLabel] = value.split('-').map((part) => part.trim());
  const min = parsePriceLabel(minLabel);
  const max = parsePriceLabel(maxLabel);
  return {
    min: typeof min === 'number' ? min : null,
    max: typeof max === 'number' ? max : null,
  };
};

const ProviderAvatar = ({ name, image, style }: ProviderAvatarProps) => {
  if (image && image !== PLACEHOLDER_AVATAR_URI) {
    return <Image source={{ uri: image }} style={style} />;
  }
  return (
    <View style={[style, styles.avatarPlaceholder]}>
      <Text style={styles.avatarPlaceholderText}>{getInitials(name)}</Text>
    </View>
  );
};

type ProviderCardProps = {
  provider: Provider;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  onViewProfile: () => void;
};

const ProviderCard = ({ provider, onToggleFavorite, isFavorite, onViewProfile }: ProviderCardProps) => {
  const minServicePrice = useMemo(() => {
    if (!provider.services?.length) return null;
    const prices = provider.services
      .map((service) => (typeof service.priceFrom === 'number' ? service.priceFrom : null))
      .filter((value): value is number => value !== null);
    if (!prices.length) return null;
    return Math.min(...prices);
  }, [provider.services]);

  const priceLabel = minServicePrice !== null ? formatPrice(minServicePrice) : provider.price;

  return (
    <View style={styles.card}>
      <ProviderAvatar name={provider.name} image={provider.image} style={styles.cardImage} />

      <View style={styles.cardBody}>
        <View style={styles.textGroup}>
          <Text style={styles.cardName}>{provider.name}</Text>
          <Text style={styles.cardCategory}>{provider.category}</Text>
          <Text style={styles.cardCitiesLabel}>Disponible à :</Text>
          <Text style={styles.cardCityList}>{provider.city}</Text>
        </View>

        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeLabel}>À partir de</Text>
          <Text style={styles.priceBadgeValue}>{priceLabel}</Text>
        </View>
      </View>

      <View style={styles.actionColumn}>
        <TouchableOpacity style={styles.heartButton} activeOpacity={0.7} onPress={onToggleFavorite}>
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? '#FF5C8D' : '#C0C0C8'} />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} style={styles.profileButton} onPress={onViewProfile}>
          <LinearGradient
            colors={['#4B6BFF', '#A24BFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.profileButtonText}>Voir profil</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

type HomeHeaderProps = {
  onAvailabilityPress: () => void;
  onLocationPress: () => void;
  onJobPress: () => void;
  onPricePress: () => void;
  availabilityLabel: string;
  locationLabel: string;
  jobLabel: string;
  priceLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
};

const HomeHeader = ({
  onAvailabilityPress,
  onLocationPress,
  onJobPress,
  onPricePress,
  availabilityLabel,
  locationLabel,
  jobLabel,
  priceLabel,
  searchValue,
  onSearchChange,
}: HomeHeaderProps) => {
  const leftFilters = [
    { key: 'availability', label: availabilityLabel, icon: 'calendar-outline' as const, onPress: onAvailabilityPress },
    { key: 'category', label: jobLabel, icon: 'briefcase-outline' as const, onPress: onJobPress },
  ];

  const rightFilters = [
    { key: 'location', label: locationLabel, icon: 'location-outline' as const, onPress: onLocationPress },
    { key: 'price', label: priceLabel, icon: 'cash-outline' as const, onPress: onPricePress },
  ];

  return (
    <View style={styles.headerContainer}>
      <View style={styles.appBar}>
        <Text style={styles.logoText}>SpeedEvent</Text>

        <View style={styles.appBarActions}>
          <View style={styles.notificationIcon}>
            <Ionicons name="notifications-outline" size={20} color="#1F1F33" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>1</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.heroTexts}>
        <Text style={styles.heroTitle}>Trouvez vos prestataires.</Text>
        <Text style={styles.heroSubtitle}>
          Des milliers de professionnels pour{'\n'}vos événements.
        </Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#ABADB8" style={styles.searchIcon} />
        <TextInput
          placeholder="Rechercher un prestataire..."
          placeholderTextColor="#A0A1AF"
          style={styles.searchInput}
          value={searchValue}
          onChangeText={onSearchChange}
          returnKeyType="search"
          blurOnSubmit={false}
        />
      </View>

      <View style={styles.filtersGrid}>
        <View style={styles.filterColumn}>
          {leftFilters.map((filter, index) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, index > 0 && styles.filterChipSpacing]}
              activeOpacity={0.85}
              onPress={filter.onPress}
            >
              <Ionicons name={filter.icon} size={16} color="#6D6E7F" style={styles.filterIcon} />
              <Text style={styles.filterText}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.filterColumn}>
          {rightFilters.map((filter, index) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, index > 0 && styles.filterChipSpacing]}
              activeOpacity={0.85}
              onPress={filter.onPress}
            >
              <Ionicons name={filter.icon} size={16} color="#6D6E7F" style={styles.filterIcon} />
              <Text style={styles.filterText}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Prestataires</Text>
    </View>
  );
};

const ClientScreen = () => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [prestataires, setPrestataires] = useState<ProviderWithMeta[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [providerModalVisible, setProviderModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatProvider, setChatProvider] = useState<Provider | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>(priceOptions[0]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const today = useMemo(() => new Date(), []);
  const [calendarCursor, setCalendarCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  useEffect(() => {
    let isMounted = true;
    const fetchPrestataires = async () => {
      try {
        const contactsRef = collection(db, 'contacts');
        const prestatairesQuery = query(contactsRef, where('type', '==', 'prestataire'));
        const snapshot = await getDocs(prestatairesQuery);
        if (!isMounted) {
          return;
        }
        const parsed = snapshot.docs.map((doc) => {
          const data = doc.data();
          const provider = mapContactToProvider(doc.id, data);
          return {
            ...provider,
            _minPriceValue: computeMinServicePrice(provider),
            _cityValues: normalizeCities(provider, data),
            _availabilityMeta: normalizeAvailabilityMeta(data.availability),
          };
        });
        setPrestataires(parsed);
      } catch (error) {
        console.error('Erreur lors du chargement des prestataires :', error);
      } finally {
        if (isMounted) {
          setLoadingProviders(false);
        }
      }
    };

    fetchPrestataires();

    return () => {
      isMounted = false;
    };
  }, []);

  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    prestataires.forEach((provider) => {
      provider._cityValues.forEach((city) => {
        if (city) {
          citySet.add(city);
        }
      });
    });
    return Array.from(citySet).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [prestataires]);

  const calendarMatrix = useMemo(() => buildCalendarMatrix(calendarCursor), [calendarCursor]);

  const filteredProviders = useMemo(() => {
    const priceRange = parsePriceRange(selectedPriceRange);
    const startParts = selectedStartDate
      ? {
          day: selectedStartDate.getDate(),
          month: selectedStartDate.getMonth(),
          year: selectedStartDate.getFullYear(),
        }
      : null;
    const endParts = selectedEndDate
      ? {
          day: selectedEndDate.getDate(),
          month: selectedEndDate.getMonth(),
          year: selectedEndDate.getFullYear(),
        }
      : null;
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return prestataires.filter((provider) => {
      if (normalizedSearch.length) {
        const nameMatch =
          provider.name.toLowerCase().includes(normalizedSearch) ||
          provider.category.toLowerCase().includes(normalizedSearch);
        if (!nameMatch) {
          return false;
        }
      }
      if (selectedJob && provider.category !== selectedJob) {
        return false;
      }
      if (selectedCities.length) {
        const hasCity = provider._cityValues.some((city) =>
          selectedCities.includes(city),
        );
        if (!hasCity) {
          return false;
        }
      }
      if (priceRange) {
        const priceValue =
          provider._minPriceValue ?? parsePriceLabel(provider.price);
        if (priceValue === null) {
          return false;
        }
        if (priceRange.min !== null && priceValue < priceRange.min) {
          return false;
        }
        if (priceRange.max !== null && priceValue > priceRange.max) {
          return false;
        }
      }
      if (
        selectedStartDate &&
        !providerMatchesAvailability(
          provider._availabilityMeta,
          startParts,
          endParts,
        )
      ) {
        return false;
      }
      return true;
    });
  }, [prestataires, selectedJob, selectedCities, selectedPriceRange, selectedStartDate, selectedEndDate, searchQuery]);

  const isSameDay = useCallback((dateA: Date | null, dateB: Date | null) => {
    if (!dateA || !dateB) return false;
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  }, []);

  const formatDateLabel = useCallback((date: Date | null) => {
    if (!date) return '';
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }, []);

  const selectedRangeLabel = useMemo(() => {
    if (selectedStartDate && selectedEndDate) {
      return `${formatDateLabel(selectedStartDate)} → ${formatDateLabel(selectedEndDate)}`;
    }
    if (selectedStartDate) {
      return `Du ${formatDateLabel(selectedStartDate)}`;
    }
    return 'Sélectionnez vos dates';
  }, [formatDateLabel, selectedEndDate, selectedStartDate]);

  const shortDateLabel = useCallback((date: Date | null) => {
    if (!date) return '';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const availabilityFilterLabel = useMemo(() => {
    if (selectedStartDate && selectedEndDate) {
      return `${shortDateLabel(selectedStartDate)} - ${shortDateLabel(selectedEndDate)}`;
    }
    if (selectedStartDate) {
      return shortDateLabel(selectedStartDate);
    }
    return 'Disponibilité';
  }, [selectedEndDate, selectedStartDate, shortDateLabel]);

  const jobFilterLabel = selectedJob ?? 'Métier';
  const locationFilterLabel =
    selectedCities.length === 0
      ? 'Localisation'
      : `${selectedCities.length} ville${selectedCities.length > 1 ? 's' : ''}`;
  const priceFilterLabel = selectedPriceRange !== 'Tous' ? selectedPriceRange : 'Prix';

  const handleAvailabilityPress = useCallback(() => {
    setAvailabilityModalVisible(true);
  }, []);

  const handleLocationPress = useCallback(() => {
    setLocationModalVisible(true);
  }, []);

  const handleJobPress = useCallback(() => {
    setJobModalVisible(true);
  }, []);

  const handlePricePress = useCallback(() => {
    setPriceModalVisible(true);
  }, []);

  const handleToggleCity = useCallback((city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((value) => value !== city) : [...prev, city],
    );
  }, []);

  const handleClearCities = useCallback(() => {
    setSelectedCities([]);
  }, []);

  const handleSelectJob = useCallback((job: string) => {
    setSelectedJob((prev) => (prev === job ? null : job));
  }, []);

  const handleOpenProviderProfile = useCallback((provider: Provider) => {
    setSelectedProvider(provider);
    setProviderModalVisible(true);
  }, []);

  const handleCloseProviderProfile = useCallback(() => {
    setProviderModalVisible(false);
    setSelectedProvider(null);
  }, []);

  const handleContactProvider = useCallback((provider: Provider) => {
    setProviderModalVisible(false);
    setSelectedProvider(provider);
    setChatProvider(provider);
    setChatModalVisible(true);
  }, []);

  const handleCloseChat = useCallback(() => {
    setChatModalVisible(false);
    setChatProvider(null);
  }, []);

  const closeAllModals = useCallback(() => {
    setLocationModalVisible(false);
    setPriceModalVisible(false);
    setAvailabilityModalVisible(false);
    setJobModalVisible(false);
    setProviderModalVisible(false);
    setSelectedProvider(null);
    setChatModalVisible(false);
    setChatProvider(null);
  }, []);

  const handlePrevMonth = useCallback(() => {
    setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleSelectCalendarDay = useCallback(
    (dayDate: Date) => {
      const normalized = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
      if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        setSelectedStartDate(normalized);
        setSelectedEndDate(null);
        return;
      }
      if (normalized.getTime() < selectedStartDate.getTime()) {
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(normalized);
        return;
      }
      if (normalized.getTime() === selectedStartDate.getTime()) {
        setSelectedEndDate(null);
        return;
      }
      setSelectedEndDate(normalized);
    },
    [selectedEndDate, selectedStartDate],
  );

  const renderProvider = useCallback(
    ({ item }: { item: Provider }) => {
      return (
        <ProviderCard
          provider={item}
          onToggleFavorite={() => toggleFavorite(item)}
          isFavorite={isFavorite(item.id)}
          onViewProfile={() => handleOpenProviderProfile(item)}
        />
      );
    },
    [toggleFavorite, isFavorite, handleOpenProviderProfile],
  );

  const headerComponent = useMemo(
    () => (
      <HomeHeader
        onAvailabilityPress={handleAvailabilityPress}
        onLocationPress={handleLocationPress}
        onJobPress={handleJobPress}
        onPricePress={handlePricePress}
        availabilityLabel={availabilityFilterLabel}
        jobLabel={jobFilterLabel}
        locationLabel={locationFilterLabel}
        priceLabel={priceFilterLabel}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />
    ),
    [
      handleAvailabilityPress,
      handleLocationPress,
      handleJobPress,
      handlePricePress,
      availabilityFilterLabel,
      jobFilterLabel,
      locationFilterLabel,
      priceFilterLabel,
      searchQuery,
    ],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={filteredProviders}
        keyExtractor={(item) => item.id}
        renderItem={renderProvider}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loadingProviders ? (
              <>
                <ActivityIndicator color="#A24BFF" />
                <Text style={styles.emptyStateText}>Chargement des prestataires...</Text>
              </>
            ) : (
              <Text style={styles.emptyStateText}>
                {prestataires.length === 0
                  ? 'Aucun prestataire disponible pour le moment.'
                  : 'Aucun prestataire ne correspond à vos filtres.'}
              </Text>
            )}
          </View>
        }
      />

      <Modal visible={locationModalVisible} transparent animationType="fade" onRequestClose={closeAllModals}>
        <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalTitleRow}>
            <Text style={styles.modalTitle}>Choisir une localisation</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setLocationModalVisible(false)}>
              <Ionicons name="close" size={18} color="#4C4D63" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalDescription}>Sélectionnez les villes où vous cherchez un prestataire.</Text>
          {availableCities.length > 0 && (
            <>
              <Text style={styles.modalSectionLabel}>Villes disponibles</Text>
              <View style={styles.modalListContainer}>
                {availableCities.map((city, index) => {
                  const isActive = selectedCities.includes(city);
                  return (
                    <TouchableOpacity
                      key={city}
                      style={[
                        styles.modalOptionRow,
                        index === availableCities.length - 1 && styles.modalOptionRowLast,
                        isActive && styles.modalOptionRowActive,
                      ]}
                      onPress={() => handleToggleCity(city)}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          isActive && styles.modalOptionTextActive,
                        ]}
                      >
                        {city}
                      </Text>
                      <Ionicons
                        name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={isActive ? '#6B36C9' : '#C4C6D7'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedCities.length > 0 && (
                <TouchableOpacity style={styles.modalClearButton} onPress={handleClearCities}>
                  <Text style={styles.modalClearText}>Réinitialiser</Text>
                </TouchableOpacity>
              )}
            </>
          )}
            <TouchableOpacity style={styles.modalPrimaryButton} onPress={closeAllModals}>
              <Text style={styles.modalPrimaryButtonText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={priceModalVisible} transparent animationType="fade" onRequestClose={closeAllModals}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Fourchette de prix</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setPriceModalVisible(false)}>
                <Ionicons name="close" size={18} color="#4C4D63" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>Sélectionnez une plage budgétaire.</Text>
            <View style={styles.modalChipList}>
              {priceOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.modalChip,
                    selectedPriceRange === option && styles.modalChipSelected,
                  ]}
                  onPress={() => setSelectedPriceRange(option)}
                >
                  <Text
                    style={[
                      styles.modalChipText,
                      selectedPriceRange === option && styles.modalChipTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalPrimaryButton} onPress={closeAllModals}>
              <Text style={styles.modalPrimaryButtonText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={availabilityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeAllModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Disponibilité</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setAvailabilityModalVisible(false)}>
                <Ionicons name="close" size={18} color="#4C4D63" />
              </TouchableOpacity>
            </View>
            <Text style={styles.selectedRangeLabel}>{selectedRangeLabel}</Text>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavButton}>
                <Ionicons name="chevron-back" size={18} color="#4C4D63" />
              </TouchableOpacity>
              <Text style={styles.calendarHeaderTitle}>
                {monthNames[calendarCursor.getMonth()]} {calendarCursor.getFullYear()}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavButton}>
                <Ionicons name="chevron-forward" size={18} color="#4C4D63" />
              </TouchableOpacity>
            </View>
            <View style={styles.weekdayRow}>
              {weekdays.map((day) => (
                <Text key={day} style={styles.weekdayText}>
                  {day}
                </Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarMatrix.map((week, weekIndex) => (
                <View key={`week-${weekIndex}`} style={styles.calendarWeekRow}>
                  {week.map((date, dayIndex) => {
                    const isCurrentMonth = date.getMonth() === calendarCursor.getMonth();
                    const isStart = isSameDay(selectedStartDate, date);
                    const isEnd = isSameDay(selectedEndDate, date);
                    let isBetween = false;
                    if (selectedStartDate && selectedEndDate) {
                      const startTime = selectedStartDate.getTime();
                      const endTime = selectedEndDate.getTime();
                      const currentTime = date.getTime();
                      isBetween = currentTime > startTime && currentTime < endTime;
                    }
                    return (
                      <TouchableOpacity
                        key={`day-${weekIndex}-${dayIndex}-${date.getTime()}`}
                        style={styles.calendarDayWrapper}
                        onPress={() => handleSelectCalendarDay(date)}
                      >
                        <View
                          style={[
                            styles.calendarDay,
                            isBetween && styles.calendarDayInRange,
                            (isStart || isEnd) && styles.calendarDaySelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.calendarDayText,
                              !isCurrentMonth && styles.calendarDayTextMuted,
                              (isStart || isEnd) && styles.calendarDayTextSelected,
                            ]}
                          >
                            {date.getDate()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.modalPrimaryButton} onPress={closeAllModals}>
              <Text style={styles.modalPrimaryButtonText}>Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSecondaryButton} onPress={() => {
              setSelectedStartDate(null);
              setSelectedEndDate(null);
              setAvailabilityModalVisible(false);
            }}>
              <Text style={styles.modalSecondaryText}>Réinitialiser les dates</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={jobModalVisible} transparent animationType="fade" onRequestClose={closeAllModals}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Choisir un métier</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setJobModalVisible(false)}>
                <Ionicons name="close" size={18} color="#4C4D63" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalListContainer}>
              {jobOptions.map((job, index) => {
                const isActive = selectedJob === job;
                return (
                  <TouchableOpacity
                    key={job}
                    style={[
                      styles.modalOptionRow,
                      index === jobOptions.length - 1 && styles.modalOptionRowLast,
                      isActive && styles.modalOptionRowActive,
                    ]}
                    onPress={() => handleSelectJob(job)}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isActive && styles.modalOptionTextActive,
                      ]}
                    >
                      {job}
                    </Text>
                    <Ionicons
                      name={isActive ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isActive ? '#6B36C9' : '#C4C6D7'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.modalPrimaryButton} onPress={closeAllModals}>
              <Text style={styles.modalPrimaryButtonText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={providerModalVisible && Boolean(selectedProvider)}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseProviderProfile}
      >
        {selectedProvider && (
          <ProviderProfileModal
            provider={selectedProvider}
            onClose={handleCloseProviderProfile}
            onContact={handleContactProvider}
          />
        )}
      </Modal>
      <Modal
        visible={chatModalVisible && Boolean(chatProvider)}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseChat}
      >
        {chatProvider && <ProviderChatModal provider={chatProvider} onClose={handleCloseChat} />}
      </Modal>
    </SafeAreaView>
  );
};

export default ClientScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F1E7FF',
    paddingHorizontal: 0,
    paddingTop: 12,
  },
  listContent: {
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  headerContainer: {
    paddingBottom: 16,
    gap: 20,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FF69B4',
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#B5A8FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  heroTexts: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1F1F33',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#7D7F8E',
    lineHeight: 22,
  },
  searchBar: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -9,
  },
  searchInput: {
    borderRadius: 18,
    backgroundColor: '#F7F7FB',
    paddingHorizontal: 46,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F1F33',
  },
  filtersGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  filterColumn: {
    flex: 1,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F7F7FB',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  filterChipSpacing: {
    marginTop: 12,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6D6E7F',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F2F42',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#7E65B4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  cardImage: {
    width: 96,
    height: 96,
    borderRadius: 14,
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    backgroundColor: '#E7E3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: '#6D5BFF',
    fontWeight: '700',
    fontSize: 20,
  },
  cardBody: {
    flex: 1,
  },
  textGroup: {
    paddingRight: 36,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1644',
  },
  cardCategory: {
    fontSize: 13,
    color: '#7A7A7A',
    marginTop: 2,
  },
  cardCitiesLabel: {
    fontSize: 12,
    color: '#7A7A7A',
    marginTop: 6,
    fontWeight: '600',
  },
  cardCityList: {
    fontSize: 12,
    color: '#A1A1A1',
    marginTop: 2,
  },
  actionColumn: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
  },
  heartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  priceBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  priceBadgeLabel: {
    fontSize: 11,
    color: '#8A8BA0',
  },
  priceBadgeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A24BFF',
  },
  gradientButton: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  profileButton: {
    marginTop: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalContentLarge: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F33',
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E4E6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B6B7B',
  },
  modalSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4C4D63',
  },
  modalPrimaryButton: {
    backgroundColor: '#4B6BFF',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  modalSecondaryButton: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  modalSecondaryText: {
    color: '#6B36C9',
    fontWeight: '600',
  },
  modalChipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E4E6F1',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modalChipSelected: {
    backgroundColor: '#EAE3FF',
    borderColor: '#A24BFF',
  },
  modalChipText: {
    color: '#4C4D63',
    fontWeight: '600',
  },
  modalChipTextSelected: {
    color: '#6B36C9',
  },
  modalListContainer: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4E6F1',
    marginTop: 8,
    overflow: 'hidden',
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E6F1',
    backgroundColor: '#FFFFFF',
  },
  modalOptionRowLast: {
    borderBottomWidth: 0,
  },
  modalOptionRowActive: {
    backgroundColor: '#F5F0FF',
  },
  modalOptionText: {
    color: '#4C4D63',
    fontSize: 15,
    flex: 1,
  },
  modalOptionTextActive: {
    color: '#5D32B5',
    fontWeight: '600',
  },
  modalClearButton: {
    alignSelf: 'flex-start',
  },
  modalClearText: {
    color: '#A24BFF',
    fontWeight: '600',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F33',
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4E6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6B7B',
  },
  calendarGrid: {
    marginTop: 12,
    gap: 8,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  calendarDayWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  calendarDay: {
    width: 36,
    height: 42,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0D7FF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  calendarDayInRange: {
    backgroundColor: '#ECE7FF',
    borderColor: '#D1C3FF',
  },
  calendarDaySelected: {
    backgroundColor: '#EAE3FF',
    borderColor: '#A24BFF',
  },
  calendarDayText: {
    color: '#4C4D63',
  },
  calendarDayTextMuted: {
    color: '#C5C6D9',
  },
  calendarDayTextSelected: {
    color: '#6B36C9',
    fontWeight: '700',
  },
  selectedRangeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#433969',
    marginBottom: 8,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyStateText: {
    color: '#7D7F8E',
    textAlign: 'center',
  },
});
