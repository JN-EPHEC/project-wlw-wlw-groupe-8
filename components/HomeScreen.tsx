import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useFavorites } from '@/context/FavoritesContext';
import ProfilePanel from '@/components/ProfilePanel';
import ProviderProfileModal from '@/components/ProviderProfileModal';
import ProviderChatModal from '@/components/ProviderChatModal';
import { Provider, providers } from '@/constants/providers';

const suggestionChips = ['Mariage élégant', 'Anniversaire surprise', "Soirée d'entreprise"];
const jobOptions = ['Photographe', 'DJ', 'Traiteur', 'Fleuriste', 'Décorateur', 'Animateur'];
const priceOptions = ['0€ - 250€', '250€ - 500€', '500€ - 1000€', '1000€ +'];
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
const belgiumMapUri =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Belgium_location_map.svg/1024px-Belgium_location_map.svg.png';

type ProviderCardProps = {
  provider: Provider;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  onViewProfile: () => void;
};

const ProviderCard = ({ provider, onToggleFavorite, isFavorite, onViewProfile }: ProviderCardProps) => (
  <View style={styles.card}>
    <Image source={{ uri: provider.image }} style={styles.cardImage} />

    <View style={styles.cardBody}>
      <View style={styles.textGroup}>
        <Text style={styles.cardName}>{provider.name}</Text>
        <Text style={styles.cardCategory}>{provider.category}</Text>
        <Text style={styles.cardCity}>• {provider.city}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFC107" />
          <Text style={styles.ratingText}>{provider.rating}</Text>
        </View>

        <Text style={styles.priceText}>{provider.price}</Text>
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

type HomeHeaderProps = {
  lastMinuteProvider?: Provider;
  onToggleFavorite: (provider: Provider) => void;
  isFavorite: (id: string) => boolean;
  onAvailabilityPress: () => void;
  onLocationPress: () => void;
  onJobPress: () => void;
  onPricePress: () => void;
  onProfilePress: () => void;
  onOpenProfile: (provider: Provider) => void;
};

const HomeHeader = ({
  lastMinuteProvider,
  onToggleFavorite,
  isFavorite,
  onAvailabilityPress,
  onLocationPress,
  onJobPress,
  onPricePress,
  onProfilePress,
  onOpenProfile,
}: HomeHeaderProps) => {
  const lastMinuteFavorite = lastMinuteProvider ? isFavorite(lastMinuteProvider.id) : false;

  const leftFilters = [
    { key: 'availability', label: 'Disponibilité', icon: 'calendar-outline' as const, onPress: onAvailabilityPress },
    { key: 'category', label: 'Métier', icon: 'briefcase-outline' as const, onPress: onJobPress },
  ];

  const rightFilters = [
    { key: 'location', label: 'Localisation', icon: 'location-outline' as const, onPress: onLocationPress },
    { key: 'price', label: 'Prix', icon: 'cash-outline' as const, onPress: onPricePress },
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
          <TouchableOpacity activeOpacity={0.85} onPress={onProfilePress} style={styles.profileIconWrapper}>
            <LinearGradient
              colors={['#FF83C5', '#A24BFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileIcon}
            >
              <Ionicons name="person-outline" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
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

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles-outline" size={16} color="#7D5BFF" />
          <Text style={styles.sectionHeaderText}>Suggestions IA</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {suggestionChips.map((chip, index) => (
            <LinearGradient
              key={`${chip}-${index}`}
              colors={['#5ED8FF', '#7F74FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.suggestionChip}
            >
              <Text style={styles.suggestionChipText}>{chip}</Text>
            </LinearGradient>
          ))}
        </ScrollView>
      </View>

      {lastMinuteProvider && (
        <View style={styles.sectionBlock}>
          <View style={styles.lastMinuteHeader}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={16} color="#F5A500" />
              <Text style={styles.sectionHeaderText}>Last Minute</Text>
            </View>
            <Text style={styles.lastMinuteSubtitle}>Disponibles sous 14 jours</Text>
          </View>
          <View style={styles.lastMinuteCard}>
            <Image source={{ uri: lastMinuteProvider.image }} style={styles.lastMinuteImage} />
            <View style={styles.lastMinuteBody}>
              <Text style={styles.lastMinuteName}>{lastMinuteProvider.name}</Text>
              <Text style={styles.lastMinuteMeta}>
                {lastMinuteProvider.category} • {lastMinuteProvider.city}
              </Text>
              <View style={styles.lastMinuteFooter}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFC107" />
                  <Text style={styles.ratingText}>{lastMinuteProvider.rating}</Text>
                </View>
                <Text style={styles.lastMinutePrice}>{lastMinuteProvider.price}</Text>
              </View>
            </View>
            <View style={styles.lastMinuteActions}>
              <TouchableOpacity
                style={styles.lastMinuteHeart}
                onPress={() => onToggleFavorite(lastMinuteProvider)}
              >
                <Ionicons
                  name={lastMinuteFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={lastMinuteFavorite ? '#FF5C8D' : '#C0C0C8'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onOpenProfile(lastMinuteProvider)}>
                <LinearGradient
                  colors={['#4B6BFF', '#A24BFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.lastMinuteButton}
                >
                  <Text style={styles.lastMinuteButtonText}>Voir profil</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Prestataires</Text>
    </View>
  );
};

const HomeScreen = () => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const lastMinuteProvider = providers[0];
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [providerModalVisible, setProviderModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatProvider, setChatProvider] = useState<Provider | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState(priceOptions[0]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<{
    day: number;
    month: number;
    year: number;
  } | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<{
    day: number;
    month: number;
    year: number;
  } | null>(null);
  const today = useMemo(() => new Date(), []);
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday-first week
    const blanks = Array.from({ length: offset }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
    return [...blanks, ...days];
  }, [calendarMonth, calendarYear]);

  const dateToValue = useCallback((date: { day: number; month: number; year: number }) => {
    return new Date(date.year, date.month, date.day).getTime();
  }, []);

  const isSameDate = useCallback(
    (
      dateA: { day: number; month: number; year: number } | null,
      dateB: { day: number; month: number; year: number } | null,
    ) => {
      if (!dateA || !dateB) {
        return false;
      }
      return dateA.day === dateB.day && dateA.month === dateB.month && dateA.year === dateB.year;
    },
    [],
  );

  const formatDateLabel = useCallback(
    (date: { day: number; month: number; year: number } | null) => {
      if (!date) {
        return '';
      }
      return `${date.day} ${monthNames[date.month]} ${date.year}`;
    },
    [],
  );

  const selectedRangeLabel = useMemo(() => {
    if (selectedStartDate && selectedEndDate) {
      return `${formatDateLabel(selectedStartDate)} → ${formatDateLabel(selectedEndDate)}`;
    }
    if (selectedStartDate) {
      return `Du ${formatDateLabel(selectedStartDate)}`;
    }
    return 'Sélectionnez vos dates';
  }, [formatDateLabel, selectedEndDate, selectedStartDate]);

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
    setProfileModalVisible(false);
    setProviderModalVisible(false);
    setSelectedProvider(null);
    setChatModalVisible(false);
    setChatProvider(null);
  }, []);

  const handlePrevMonth = useCallback(() => {
    setCalendarMonth((prev) => {
      if (prev === 0) {
        setCalendarYear((year) => year - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCalendarMonth((prev) => {
      if (prev === 11) {
        setCalendarYear((year) => year + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const handleSelectCalendarDay = useCallback(
    (day: number) => {
      const selectedDate = { day, month: calendarMonth, year: calendarYear };
      if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        setSelectedStartDate(selectedDate);
        setSelectedEndDate(null);
        return;
      }

      const startValue = dateToValue(selectedStartDate);
      const newValue = dateToValue(selectedDate);

      if (newValue < startValue) {
        setSelectedStartDate(selectedDate);
        setSelectedEndDate(null);
      } else if (newValue === startValue) {
        setSelectedEndDate(null);
      } else {
        setSelectedEndDate(selectedDate);
      }
    },
    [calendarMonth, calendarYear, dateToValue, selectedEndDate, selectedStartDate],
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

  const renderHeader = useCallback(() => {
    return (
      <HomeHeader
        lastMinuteProvider={lastMinuteProvider}
        onToggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
        onAvailabilityPress={handleAvailabilityPress}
        onLocationPress={handleLocationPress}
        onJobPress={handleJobPress}
        onPricePress={handlePricePress}
        onProfilePress={() => setProfileModalVisible(true)}
        onOpenProfile={handleOpenProviderProfile}
      />
    );
  }, [
    lastMinuteProvider,
    toggleFavorite,
    isFavorite,
    handleAvailabilityPress,
    handleLocationPress,
    handleJobPress,
    handlePricePress,
    handleOpenProviderProfile,
  ]);

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        renderItem={renderProvider}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
      />

      <Modal visible={locationModalVisible} transparent animationType="fade" onRequestClose={closeAllModals}>
        <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choisir une localisation</Text>
          <Image
            source={{
              uri: belgiumMapUri,
            }}
            style={styles.mapPreview}
          />
          <Text style={styles.modalDescription}>Zoomez et sélectionnez une zone sur la carte.</Text>
            <TouchableOpacity style={styles.modalPrimaryButton} onPress={closeAllModals}>
              <Text style={styles.modalPrimaryButtonText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={priceModalVisible} transparent animationType="fade" onRequestClose={closeAllModals}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Fourchette de prix</Text>
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
            <Text style={styles.modalTitle}>Disponibilité</Text>
            <Text style={styles.selectedRangeLabel}>{selectedRangeLabel}</Text>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavButton}>
                <Ionicons name="chevron-back" size={18} color="#4C4D63" />
              </TouchableOpacity>
              <Text style={styles.calendarHeaderTitle}>
                {monthNames[calendarMonth]} {calendarYear}
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
              {calendarCells.map((cell, index) => {
                if (cell === null) {
                  return <View key={`blank-${calendarYear}-${calendarMonth}-blank-${index}`} style={styles.calendarDayBlank} />;
                }

                const cellDate = { day: cell, month: calendarMonth, year: calendarYear };
                const isStart = isSameDate(selectedStartDate, cellDate);
                const isEnd = isSameDate(selectedEndDate, cellDate);

                let isBetween = false;
                if (selectedStartDate && selectedEndDate) {
                  const startValue = dateToValue(selectedStartDate);
                  const endValue = dateToValue(selectedEndDate);
                  const currentValue = dateToValue(cellDate);
                  isBetween = currentValue > startValue && currentValue < endValue;
                }

                return (
                  <TouchableOpacity
                    key={`${calendarYear}-${calendarMonth}-${cell}`}
                    style={styles.calendarDayWrapper}
                    onPress={() => handleSelectCalendarDay(cell)}
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
                          (isStart || isEnd) && styles.calendarDayTextSelected,
                        ]}
                      >
                        {cell}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.modalPrimaryButton} onPress={closeAllModals}>
              <Text style={styles.modalPrimaryButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={jobModalVisible} transparent animationType="fade" onRequestClose={closeAllModals}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir un métier</Text>
            <View style={styles.modalChipList}>
              {jobOptions.map((job) => (
                <TouchableOpacity
                  key={job}
                  style={[styles.modalChip, selectedJob === job && styles.modalChipSelected]}
                  onPress={() => setSelectedJob(job)}
                >
                  <Text
                    style={[
                      styles.modalChipText,
                      selectedJob === job && styles.modalChipTextSelected,
                    ]}
                  >
                    {job}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalPrimaryButton} onPress={closeAllModals}>
              <Text style={styles.modalPrimaryButtonText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={profileModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeAllModals}
      >
        <ProfilePanel onClose={closeAllModals} />
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

export default HomeScreen;

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
  profileIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconWrapper: {
    borderRadius: 21,
    overflow: 'hidden',
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
  sectionBlock: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F2F42',
  },
  suggestionChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    marginRight: 12,
  },
  suggestionChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  lastMinuteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMinuteSubtitle: {
    fontSize: 13,
    color: '#8A8B99',
  },
  lastMinuteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E8',
    borderRadius: 20,
    padding: 12,
    marginTop: 12,
    gap: 12,
  },
  lastMinuteImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  lastMinuteBody: {
    flex: 1,
  },
  lastMinuteName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F33',
  },
  lastMinuteMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#6D6E7F',
  },
  lastMinuteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  lastMinutePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#C97E00',
  },
  lastMinuteActions: {
    alignItems: 'center',
    gap: 8,
  },
  lastMinuteHeart: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastMinuteButton: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  lastMinuteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
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
  cardCity: {
    fontSize: 12,
    color: '#A1A1A1',
    marginTop: 6,
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
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#645582',
    marginLeft: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#A24BFF',
    marginRight: 12,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F33',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B6B7B',
  },
  mapPreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
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
  },
  weekdayText: {
    width: '13%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6B7B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  calendarDayWrapper: {
    width: '13%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayBlank: {
    width: '13%',
    aspectRatio: 1,
  },
  calendarDay: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DED8FF',
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
});
