import { PrestataireProfileModal } from '@/components/PrestataireProfileModal';
import { Colors } from '@/constants/Colors';
import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

type WeeklySchedule = Record<
  DayKey,
  {
    start: string;
    end: string;
    active: boolean;
  }
>;

type CalendarStatus = 'available' | 'unavailable';

const dayConfig = [
  { key: 'monday', label: 'Lundi', short: 'L' },
  { key: 'tuesday', label: 'Mardi', short: 'M' },
  { key: 'wednesday', label: 'Mercredi', short: 'M' },
  { key: 'thursday', label: 'Jeudi', short: 'J' },
  { key: 'friday', label: 'Vendredi', short: 'V' },
  { key: 'saturday', label: 'Samedi', short: 'S' },
  { key: 'sunday', label: 'Dimanche', short: 'D' },
] as const;

const jsDayToKey: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const defaultWeeklySchedule: WeeklySchedule = dayConfig.reduce((acc, day) => {
  acc[day.key] = { start: '09:00', end: '18:00', active: true };
  return acc;
}, {} as WeeklySchedule);

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

const formatISODate = (year: number, month: number, day: number) => {
  return toISODateString(year, month, day);
};

const formatDisplayDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map((value) => Number(value));
  if (!year || !month || !day) {
    return iso;
  }
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const parseDateInput = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return toISODateString(year, month, day);
};

const statusStyles: Record<
  CalendarStatus,
  { backgroundColor: string; textColor: string; borderColor: string }
> = {
  available: {
    backgroundColor: '#D8FCE3',
    borderColor: 'transparent',
    textColor: '#0F7A3D',
  },
  unavailable: {
    backgroundColor: '#FFD9D9',
    borderColor: 'transparent',
    textColor: '#B62323',
  },
};

export default function PrestataireScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(defaultWeeklySchedule);
  const [blockedRanges, setBlockedRanges] = useState<{ start: string; end: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [rangeStartInput, setRangeStartInput] = useState('');
  const [rangeEndInput, setRangeEndInput] = useState('');
  const [dateInputError, setDateInputError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('Veuillez vous reconnecter pour gérer vos disponibilités.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const contactsRef = collection(db, 'contacts');
      const prestataireQuery = query(
        contactsRef,
        where('userId', '==', user.uid),
        where('type', '==', 'prestataire'),
      );
      const snapshot = await getDocs(prestataireQuery);
      if (snapshot.empty) {
        setError('Impossible de trouver votre fiche prestataire.');
        setDocumentId(null);
        setWeeklySchedule(defaultWeeklySchedule);
        setBlockedRanges([]);
        return;
      }

      const docSnap = snapshot.docs[0];
      setDocumentId(docSnap.id);
      const availability = docSnap.data().availability ?? {};
      const weekly = availability.weekly ?? {};
      const blockedRangesData = Array.isArray(availability.blockedRanges)
        ? availability.blockedRanges.filter(
            (range: any): range is { start: string; end: string } =>
              range &&
              typeof range.start === 'string' &&
              range.start &&
              typeof range.end === 'string' &&
              range.end,
          )
        : [];
      const blockedDatesFallback = Array.isArray(availability.blockedDates)
        ? availability.blockedDates
            .filter((date: unknown): date is string => typeof date === 'string')
            .map((date: any) => ({ start: date, end: date }))
        : [];
      const mergedBlocked = blockedRangesData.length ? blockedRangesData : blockedDatesFallback;

      const normalizedWeekly = dayConfig.reduce((acc, day) => {
        const persisted = weekly[day.key] ?? {};
        const isActive =
          typeof persisted.active === 'boolean'
            ? persisted.active
            : Boolean(persisted.start && persisted.end);
        acc[day.key] = {
          start: persisted.start ?? (isActive ? '09:00' : ''),
          end: persisted.end ?? (isActive ? '18:00' : ''),
          active: isActive,
        };
        return acc;
      }, {} as WeeklySchedule);

      setWeeklySchedule(normalizedWeekly);
      setBlockedRanges(mergedBlocked);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des disponibilités.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((year) => year - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((year) => year + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const getDayStatus = (day: number): CalendarStatus => {
    const iso = formatISODate(currentYear, currentMonth, day);
    if (blockedRanges.some((range) => iso >= range.start && iso <= range.end)) {
      return 'unavailable';
    }
    const jsDay = new Date(currentYear, currentMonth, day).getDay();
    const key = jsDayToKey[jsDay];
    const schedule = weeklySchedule[key];
    if (schedule?.active) {
      return 'available';
    }
    return 'unavailable';
  };

  const calendarRows = useMemo(() => {
    const firstWeekDay = new Date(currentYear, currentMonth, 1).getDay();
    const leadingEmpty = (firstWeekDay + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const rows: (number | null)[][] = [];
    let currentDay = 1;
    let rowIndex = 0;

    while (currentDay <= daysInMonth) {
      const row: (number | null)[] = [];
      for (let col = 0; col < 7; col += 1) {
        if (rowIndex === 0 && col < leadingEmpty) {
          row.push(null);
        } else if (currentDay > daysInMonth) {
          row.push(null);
        } else {
          row.push(currentDay);
          currentDay += 1;
        }
      }
      rows.push(row);
      rowIndex += 1;
    }

    return rows;
  }, [currentMonth, currentYear]);

  const toggleAvailabilityModal = () => {
    setDateInputError(null);
    setAvailabilityModalVisible((prev) => !prev);
  };

  const handleTimeChange = (day: DayKey, key: 'start' | 'end', value: string) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        active: true,
        [key]: value,
      },
    }));
  };

  const handleToggleDayActive = (day: DayKey) => {
    setWeeklySchedule((prev) => {
      const nextActive = !prev[day].active;
      return {
        ...prev,
        [day]: {
          start: nextActive ? prev[day].start || '09:00' : '',
          end: nextActive ? prev[day].end || '18:00' : '',
          active: nextActive,
        },
      };
    });
  };

  const handleAddBlockedRange = () => {
    const startIso = parseDateInput(rangeStartInput);
    const endIso = parseDateInput(rangeEndInput);
    if (!startIso || !endIso) {
      setDateInputError('Format attendu : jj/mm/aaaa');
      return;
    }
    if (endIso < startIso) {
      setDateInputError('La date de fin doit être après la date de début.');
      return;
    }
    if (blockedRanges.some((range) => range.start === startIso && range.end === endIso)) {
      setDateInputError('Cette période existe déjà.');
      return;
    }
    setBlockedRanges((prev) => [...prev, { start: startIso, end: endIso }]);
    setRangeStartInput('');
    setRangeEndInput('');
    setDateInputError(null);
  };

  const handleRemoveBlockedRange = (index: number) => {
    setBlockedRanges((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveAvailability = async () => {
    if (!documentId) {
      setError('Impossible de sauvegarder les disponibilités pour le moment.');
      return;
    }
    setSaving(true);
    try {
      const legacyBlockedDates = blockedRanges
        .filter((range) => range.start === range.end)
        .map((range) => range.start);
      await updateDoc(doc(db, 'contacts', documentId), {
        availability: {
          weekly: weeklySchedule,
          blockedRanges,
          blockedDates: legacyBlockedDates,
        },
      });
      setAvailabilityModalVisible(false);
    } catch (err) {
      console.error(err);
      setError("Échec de la sauvegarde des disponibilités.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={[Colors.light.lila, Colors.light.lightBlue]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.heroHeader}>
        <Text style={styles.brand}>SpeedEvent</Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.heroIconBubble}>
            <Ionicons name="notifications-outline" size={20} color="#1F1F33" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroIconBubble} onPress={() => setProfileModalVisible(true)}>
            <LinearGradient
              colors={[Colors.light.pink, Colors.light.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileBubble}
            >
              <Ionicons name="person-outline" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.container}>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={Colors.light.purple} />
            <Text style={styles.loaderText}>Chargement du calendrier...</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Calendrier</Text>
              <View style={styles.monthSwitcher}>
                <Pressable onPress={goToPreviousMonth} style={styles.arrowButton}>
                  <Ionicons name="chevron-back" size={18} color="#1F1F33" />
                </Pressable>
                <Text style={styles.monthLabel}>
                  {monthNames[currentMonth]} {currentYear}
                </Text>
                <Pressable onPress={goToNextMonth} style={styles.arrowButton}>
                  <Ionicons name="chevron-forward" size={18} color="#1F1F33" />
                </Pressable>
              </View>
            </View>

            <View style={styles.weekdayRow}>
              {dayConfig.map((day) => (
                <Text key={day.key} style={styles.weekdayLabel}>
                  {day.short}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarRows.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.calendarRow}>
                  {row.map((value, colIndex) => {
                    if (value === null) {
                      return <View key={`blank-${rowIndex}-${colIndex}`} style={styles.calendarBlank} />;
                    }
                    const status = getDayStatus(value);
                    const palette = statusStyles[status];
                    return (
                      <View
                        key={`day-${value}`}
                        style={[
                          styles.calendarDay,
                          { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor },
                        ]}
                      >
                        <Text style={[styles.calendarDayText, { color: palette.textColor }]}>{value}</Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: statusStyles.available.backgroundColor }]} />
                <Text style={styles.legendLabel}>Disponible</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: statusStyles.unavailable.backgroundColor }]} />
                <Text style={styles.legendLabel}>Indisponible</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={toggleAvailabilityModal}>
              <LinearGradient
                colors={[Colors.light.pink, Colors.light.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButtonGradient}
              >
                <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonLabel}>Gérer mes disponibilités</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <Modal
        animationType="slide"
        visible={availabilityModalVisible}
        onRequestClose={toggleAvailabilityModal}
        presentationStyle="formSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Gérer mes disponibilités</Text>
            <Pressable onPress={toggleAvailabilityModal} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#1F1F33" />
            </Pressable>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          >
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={18} color={Colors.light.purple} />
              <Text style={styles.sectionTitle}>Horaires hebdomadaires</Text>
            </View>
            <View style={styles.scheduleList}>
              {dayConfig.map((day) => {
                const schedule = weeklySchedule[day.key];
                const disabled = !schedule.active;
                return (
                  <View key={day.key} style={styles.scheduleRow}>
                    <View style={styles.scheduleRowHeader}>
                      <Text style={styles.scheduleLabel}>{day.label}</Text>
                      <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>
                          {disabled ? 'Jour off' : 'Disponible'}
                        </Text>
                        <Switch
                          value={schedule.active}
                          onValueChange={() => handleToggleDayActive(day.key)}
                          thumbColor={schedule.active ? Colors.light.purple : '#FFFFFF'}
                          trackColor={{ true: '#E8D8FF', false: '#D9DBE8' }}
                        />
                      </View>
                    </View>
                  <View style={styles.timeInputs}>
                    <View style={styles.timeField}>
                      <Ionicons name="time-outline" size={16} color="#7A7C8C" />
                      <TextInput
                        value={schedule.start}
                        editable={!disabled}
                        onChangeText={(value) => handleTimeChange(day.key, 'start', value)}
                        placeholder="09:00"
                        keyboardType="numbers-and-punctuation"
                        style={[styles.timeInput, disabled && styles.disabledInput]}
                      />
                    </View>
                    <Text style={styles.separator}>-</Text>
                    <View style={styles.timeField}>
                      <Ionicons name="time-outline" size={16} color="#7A7C8C" />
                      <TextInput
                        value={schedule.end}
                        editable={!disabled}
                        onChangeText={(value) => handleTimeChange(day.key, 'end', value)}
                        placeholder="18:00"
                        keyboardType="numbers-and-punctuation"
                        style={[styles.timeInput, disabled && styles.disabledInput]}
                      />
                    </View>
                  </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={18} color={Colors.light.pink} />
              <Text style={styles.sectionTitle}>Dates d&apos;indisponibilité</Text>
            </View>
            <View style={styles.blockedInputs}>
              <TextInput
                value={rangeStartInput}
                onChangeText={(value) => {
                  setRangeStartInput(value);
                  setDateInputError(null);
                }}
                placeholder="Début (jj/mm/aaaa)"
                keyboardType="numbers-and-punctuation"
                style={styles.blockedDateInput}
              />
              <TextInput
                value={rangeEndInput}
                onChangeText={(value) => {
                  setRangeEndInput(value);
                  setDateInputError(null);
                }}
                placeholder="Fin (jj/mm/aaaa)"
                keyboardType="numbers-and-punctuation"
                style={styles.blockedDateInput}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddBlockedRange}>
                <LinearGradient
                  colors={[Colors.light.purple, Colors.light.blue]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addButtonGradient}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.addButtonLabel}>Ajouter</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            {dateInputError ? <Text style={styles.errorText}>{dateInputError}</Text> : null}

            <View style={styles.blockedList}>
              {blockedRanges.length === 0 ? (
                <Text style={styles.emptyBlockedText}>Aucune date d&apos;indisponibilité</Text>
              ) : (
                blockedRanges
                  .sort((a, b) => a.start.localeCompare(b.start))
                  .map((range, index) => (
                    <View key={`${range.start}-${range.end}`} style={styles.blockedItem}>
                      <Text style={styles.blockedItemLabel}>
                        {range.start === range.end
                          ? formatDisplayDate(range.start)
                          : `${formatDisplayDate(range.start)} au ${formatDisplayDate(range.end)}`}
                      </Text>
                      <Pressable onPress={() => handleRemoveBlockedRange(index)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color="#D6455F" />
                      </Pressable>
                    </View>
                  ))
              )}
            </View>

              <TouchableOpacity
                style={[styles.primaryButton, styles.saveButton]}
                onPress={handleSaveAvailability}
                disabled={saving}
              >
                <LinearGradient
                  colors={[Colors.light.pink, Colors.light.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonGradient}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.primaryButtonLabel}>Enregistrer</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      <PrestataireProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  heroHeader: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.light.pink,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBubble: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F1F33',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#6D6E7F',
    marginBottom: 24,
  },
  loaderContainer: {
    padding: 32,
    borderRadius: 28,
    backgroundColor: '#FFFFFFAA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#6D6E7F',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1F33',
  },
  monthSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontWeight: '600',
    color: '#1F1F33',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  weekdayLabel: {
    width: 36,
    textAlign: 'center',
    fontWeight: '600',
    color: '#A0A1AF',
  },
  calendarGrid: {
    marginTop: 8,
    gap: 8,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarBlank: {
    width: 40,
    height: 40,
  },
  calendarDay: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  calendarDayText: {
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendLabel: {
    fontSize: 14,
    color: '#6D6E7F',
  },
  primaryButton: {
    marginTop: 24,
  },
  primaryButtonGradient: {
    borderRadius: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    color: Colors.light.pink,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E2EC',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1F33',
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 24,
    gap: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F33',
  },
  scheduleList: {
    gap: 16,
  },
  scheduleRow: {
    backgroundColor: '#F5F6FB',
    borderRadius: 20,
    padding: 16,
  },
  scheduleRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scheduleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B4D63',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 13,
    color: '#6D6E7F',
    fontWeight: '600',
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E2EC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  timeInput: {
    flex: 1,
    fontWeight: '600',
    color: '#1F1F33',
  },
  disabledInput: {
    color: '#B0B2C3',
  },
  separator: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6D6E7F',
  },
  blockedInputs: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    flexWrap: 'wrap',
  },
  blockedDateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E2EC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  addButton: {
    flexBasis: 110,
  },
  addButtonGradient: {
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  addButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  blockedList: {
    gap: 10,
  },
  blockedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFE9EC',
  },
  blockedItemLabel: {
    fontWeight: '600',
    color: '#B62323',
  },
  emptyBlockedText: {
    color: '#6D6E7F',
    fontStyle: 'italic',
  },
  saveButton: {
    marginBottom: 32,
  },
});
