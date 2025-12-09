import { Colors } from '@/constants/Colors';
import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type BookingRequest = {
  id: string;
  clientName: string;
  date: string;
  slot: { start: string; end: string };
  service?: { name?: string | null; durationHours?: number | null };
  status?: string;
  location?: string;
  budget?: number | string | null;
};

const statusStyles = {
  pending: { label: 'En attente', bg: '#FFEED3', text: '#B45309' },
  accepted: { label: 'Confirmée', bg: '#DCFCE7', text: '#15803D' },
  confirmed: { label: 'Confirmée', bg: '#DCFCE7', text: '#15803D' },
  rejected: { label: 'Refusée', bg: '#FEE2E2', text: '#B91C1C' },
} as const;

type StatusKey = keyof typeof statusStyles;

const filterOptions: { key: 'all' | 'pending' | 'accepted' | 'rejected'; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'accepted', label: 'Confirmées' },
  { key: 'rejected', label: 'Refusées' },
];

export default function PrestataireDemandesScreen() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    const init = async () => {
      const user = auth.currentUser;
      if (!user) {
        setError('Veuillez vous reconnecter pour consulter vos demandes.');
        setLoading(false);
        return;
      }
      try {
        const profileSnapshot = await getDocs(
          query(
            collection(db, 'contacts'),
            where('userId', '==', user.uid),
            where('type', '==', 'prestataire'),
            limit(1),
          ),
        );
        if (profileSnapshot.empty) {
          setError('Impossible de charger votre profil prestataire.');
          setLoading(false);
          return;
        }
        const docId = profileSnapshot.docs[0].id;
        setProviderId(docId);
        const demandesQuery = query(collection(db, 'bookingRequests'), where('providerId', '==', docId));
        unsubscribe = onSnapshot(demandesQuery, (snapshot) => {
          const next = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              clientName:
                data.clientName ||
                data.clientEmail ||
                data.clientId ||
                'Client SpeedEvent',
              date: data.date,
              slot: data.slot,
              service: data.service,
              status: typeof data.status === 'string' ? data.status.toLowerCase() : 'pending',
              location: data.location ?? data.city ?? 'Lieu à définir',
              budget: data.budget ?? data.price ?? null,
            } as BookingRequest;
          });
          setRequests(next);
          setLoading(false);
        });
      } catch (err) {
        console.error(err);
        setError('Impossible de charger vos demandes pour le moment.');
        setLoading(false);
      }
    };
    init();
    return () => unsubscribe?.();
  }, []);

  const handleUpdateStatus = useCallback(
    async (request: BookingRequest, nextStatus: 'accepted' | 'rejected') => {
      if (!providerId) return;
      try {
        await updateDoc(doc(db, 'bookingRequests', request.id), {
          status: nextStatus,
          updatedAt: new Date(),
        });
        if (nextStatus === 'accepted') {
          Alert.alert('Demande acceptée', 'Le créneau est confirmé et devient indisponible.');
        } else {
          Alert.alert('Demande refusée', 'Le client sera notifié du refus.');
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Erreur', "Impossible de mettre à jour la demande. Réessayez plus tard.");
      }
    },
    [providerId],
  );

  const counts = useMemo(
    () =>
      requests.reduce(
        (acc, request) => {
          const status = (request.status as StatusKey) ?? 'pending';
          if (status === 'accepted' || status === 'confirmed') acc.accepted += 1;
          else if (status === 'rejected') acc.rejected += 1;
          else acc.pending += 1;
          return acc;
        },
        { pending: 0, accepted: 0, rejected: 0 },
      ),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter((request) => {
      const status = (request.status as StatusKey) ?? 'pending';
      if (filter === 'accepted') {
        return status === 'accepted' || status === 'confirmed';
      }
      return status === filter;
    });
  }, [filter, requests]);

  const renderRequest = useCallback(
    ({ item }: { item: BookingRequest }) => {
      const serviceDetails = [item.service?.name, item.service?.durationHours ? `${item.service.durationHours} h` : null]
        .filter(Boolean)
        .join(' • ');
      const palette = statusStyles[(item.status as StatusKey) ?? 'pending'] ?? statusStyles.pending;
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.clientName}>{item.clientName}</Text>
              <Text style={styles.dateLabel}>
                {new Date(item.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: palette.bg }]}> {/**/}
              <Text style={[styles.statusBadgeText, { color: palette.text }]}>{palette.label}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#6B6B7B" />
            <Text style={styles.infoText}>
              {item.slot.start} - {item.slot.end}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#6B6B7B" />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
          {item.budget ? (
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={16} color="#6B6B7B" />
              <Text style={styles.infoText}>
                Budget&nbsp;:
                {typeof item.budget === 'number' ? `${item.budget} €` : item.budget}
              </Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={16} color="#6B6B7B" />
            <Text style={styles.infoText}>{serviceDetails || 'Service à confirmer'}</Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleUpdateStatus(item, 'rejected')}
            >
              <Text style={styles.rejectLabel}>Refuser</Text>
            </TouchableOpacity>
            <LinearGradient
              colors={[Colors.light.pink, Colors.light.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.actionButton, styles.acceptButton]}
            >
              <TouchableOpacity style={styles.acceptTouchable} onPress={() => handleUpdateStatus(item, 'accepted')}>
                <Text style={styles.acceptLabel}>Accepter</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      );
    },
    [handleUpdateStatus],
  );

  const header = (
    <View style={styles.headerWrapper}>
      <LinearGradient colors={[Colors.light.pink, Colors.light.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Demandes clients</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color="#F97316" />
            <Text style={styles.statValue}>{counts.pending}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={styles.statValue}>{counts.accepted}</Text>
            <Text style={styles.statLabel}>Confirmées</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="close-circle" size={20} color="#F87171" />
            <Text style={styles.statValue}>{counts.rejected}</Text>
            <Text style={styles.statLabel}>Refusées</Text>
          </View>
        </View>
      </LinearGradient>
      <View style={styles.filtersRow}>
        {filterOptions.map((chip) => {
          const isActive = filter === chip.key;
          const label =
            chip.key === 'pending'
              ? `En attente (${counts.pending})`
              : chip.key === 'accepted'
              ? `Confirmées (${counts.accepted})`
              : chip.key === 'rejected'
              ? `Refusées (${counts.rejected})`
              : 'Toutes';
          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setFilter(chip.key)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderScreen}>
        <ActivityIndicator color={Colors.light.purple} />
        <Text style={styles.loadingText}>Chargement des demandes…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loaderScreen}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucune demande pour le moment</Text>
            <Text style={styles.emptySubtitle}>Les nouvelles demandes apparaîtront ici.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#E5E9FF',
  },
  loaderScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7FB',
  },
  headerWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerGradient: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1F33',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B6B7B',
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E4E4F7',
  },
  filterChipActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  filterChipText: {
    color: '#6B6B7B',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.light.purple,
  },
  listContent: {
    paddingBottom: 24,
    gap: 16,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F33',
  },
  dateLabel: {
    fontSize: 13,
    color: '#6B6B7B',
    textTransform: 'capitalize',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontWeight: '600',
    color: '#4B5563',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  slotText: {
    fontWeight: '600',
    color: '#1F1F33',
  },
  serviceText: {
    marginTop: 6,
    color: '#6B6B7B',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFFFFF',
  },
  rejectLabel: {
    color: '#B91C1C',
    fontWeight: '600',
  },
  acceptButton: {
    padding: 0,
  },
  acceptTouchable: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  acceptLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontWeight: '700',
    fontSize: 12,
  },
  emptyCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F33',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B6B7B',
  },
  errorText: {
    color: Colors.light.pink,
    textAlign: 'center',
  },
});
