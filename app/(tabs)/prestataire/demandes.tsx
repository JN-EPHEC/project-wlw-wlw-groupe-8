import { Colors } from '@/constants/Colors';
import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type BookingRequest = {
  id: string;
  clientName: string;
  clientContactId?: string | null;
  date: string;
  slot: { start: string; end: string };
  service?: { name?: string | null; durationHours?: number | null };
  status?: string;
  location?: string;
  budget?: number | string | null;
  address?: string;
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
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerProfile, setProviderProfile] = useState<Record<string, any> | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<BookingRequest | null>(null);

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
        const docSnap = profileSnapshot.docs[0];
        const docId = docSnap.id;
        setProviderId(docId);
        setProviderProfile(docSnap.data());
        const demandesQuery = query(collection(db, 'bookingRequests'), where('providerId', '==', docId));
        unsubscribe = onSnapshot(demandesQuery, (snapshot) => {
          const next = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              clientContactId: data.clientContactId ?? null,
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
              address:
                typeof data.address === 'string' && data.address.trim().length > 0
                  ? data.address.trim()
                  : null,
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

  const ensureConversationWithClient = useCallback(
    async (clientContactId: string | null, clientName: string) => {
      if (!clientContactId || !providerId) return null;
      const existing = await getDocs(
        query(
          collection(db, 'conversations'),
          where('clientContactId', '==', clientContactId),
          where('providerId', '==', providerId),
          limit(1),
        ),
      );
      if (!existing.empty) {
        return existing.docs[0].id;
      }
      const profile = providerProfile ?? {};
      const payload: Record<string, any> = {
        clientContactId,
        clientName,
        clientDeleted: false,
        providerId,
        providerName:
          profile.displayName ||
          profile.businessName ||
          profile.name ||
          profile.companyName ||
          'Prestataire SpeedEvent',
        providerCompanyName: profile.companyName || null,
        providerCategory: profile.category || profile.specialty || 'Prestataire',
        providerCity: profile.city || profile.location || 'Belgique',
        providerPrice: profile.price || 'Tarif sur demande',
        providerImage: profile.profilePhoto || null,
        providerResponseTime: profile.responseTime || 'Répond généralement sous 24h',
        providerDescription: profile.description || '',
        providerServices: Array.isArray(profile.services) ? profile.services : [],
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageAt: null,
        unreadByClient: false,
        unreadByProvider: false,
      };
      const docRef = await addDoc(collection(db, 'conversations'), payload);
      return docRef.id;
    },
    [providerId, providerProfile],
  );

  const sendConversationMessage = useCallback(
    async (request: BookingRequest, text: string) => {
      if (!providerId || !request.clientContactId) return;
      try {
        const conversationId = await ensureConversationWithClient(
          request.clientContactId,
          request.clientName,
        );
        if (!conversationId) return;
        await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
          text,
          senderType: 'provider',
          senderId: providerId,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'conversations', conversationId), {
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
          lastMessageSenderType: 'provider',
          unreadByClient: true,
          unreadByProvider: false,
        });
      } catch (messageError) {
        console.error('Impossible denvoyer le message automatique', messageError);
      }
    },
    [ensureConversationWithClient, providerId],
  );

  const handleUpdateStatus = useCallback(
    async (request: BookingRequest, nextStatus: 'accepted' | 'rejected') => {
      if (!providerId) return;
      try {
        if (nextStatus === 'accepted') {
          const activeAccepted = requests.filter(
            (existing) =>
              existing.status === 'accepted' ||
              existing.status === 'confirmed',
          ).length;
          if (
            providerProfile?.subscriptionPlan === 'free' &&
            activeAccepted >= 3
          ) {
            Alert.alert(
              'Limite atteinte',
              'Votre compte gratuit est limité à 3 rendez-vous acceptés. Passez au plan Premium pour en accepter davantage.',
            );
            return;
          }
          await updateDoc(doc(db, 'bookingRequests', request.id), {
            status: nextStatus,
            updatedAt: new Date(),
          });
          const dateLabel = new Date(request.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          });
          const slotLabel = `${request.slot.start} - ${request.slot.end}`;
          const message = `Le prestataire a accepté votre demande pour le ${dateLabel} (${slotLabel}).`;
          await sendConversationMessage(request, message);
          Alert.alert('Demande acceptée', 'Le créneau est confirmé et devient indisponible.');
        } else {
          setRejectTarget(request);
          setRejectReason('');
          setRejectModalVisible(true);
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Erreur', "Impossible de mettre à jour la demande. Réessayez plus tard.");
      }
    },
    [providerId, providerProfile?.subscriptionPlan, requests, sendConversationMessage],
  );

  const handleConfirmRejection = useCallback(async () => {
    if (!rejectTarget || !providerId) {
      setRejectModalVisible(false);
      return;
    }
    const reason = rejectReason.trim();
    const fallback =
      reason.length > 0
        ? reason
        : "Le prestataire a refusé votre demande pour ce créneau.";
    try {
      await updateDoc(doc(db, 'bookingRequests', rejectTarget.id), {
        status: 'rejected',
        rejectionReason: reason || null,
        updatedAt: new Date(),
      });
      const dateLabel = new Date(rejectTarget.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      const slotLabel = `${rejectTarget.slot.start} - ${rejectTarget.slot.end}`;
      const message = `Le prestataire a refusé votre demande du ${dateLabel} (${slotLabel}). Motif : ${fallback}`;
      await sendConversationMessage(rejectTarget, message);
      Alert.alert('Demande refusée', 'Le client sera notifié du refus.');
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', "Impossible de refuser la demande. Réessayez plus tard.");
    } finally {
      setRejectModalVisible(false);
      setRejectTarget(null);
      setRejectReason('');
    }
  }, [providerId, rejectReason, rejectTarget, sendConversationMessage]);

  const handleCancelRejection = useCallback(() => {
    setRejectModalVisible(false);
    setRejectTarget(null);
    setRejectReason('');
  }, []);

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
      const statusKey = (item.status as StatusKey) ?? 'pending';
      const palette = statusStyles[statusKey] ?? statusStyles.pending;
      const showActions = statusKey !== 'accepted' && statusKey !== 'confirmed' && statusKey !== 'rejected';
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
            <View style={[styles.statusBadge, { backgroundColor: palette.bg }]}>
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
            <Text style={styles.infoText}>{item.address || 'Lieu à définir'}</Text>
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
          {showActions ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleUpdateStatus(item, 'rejected')}
              >
                <Text style={styles.rejectLabel}>Refuser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={() => handleUpdateStatus(item, 'accepted')}>
                <LinearGradient
                  colors={[Colors.light.pink, Colors.light.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.acceptGradient}
                >
                  <Text style={styles.acceptLabel}>Accepter</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      );
    },
    [handleUpdateStatus],
  );

  const header = (
    <View style={styles.headerWrapper}>
      <LinearGradient
        colors={[Colors.light.pink, Colors.light.purple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 24 }]}
      >
        <Text style={styles.headerTitle}>Demandes clients</Text>
        <Text style={styles.headerSubtitle}>Gérez vos demandes en attente ou confirmées.</Text>
      </LinearGradient>
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
      <SafeAreaView style={styles.loaderScreen} edges={['left', 'right', 'bottom']}>
        <ActivityIndicator color={Colors.light.purple} />
        <Text style={styles.loadingText}>Chargement des demandes…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loaderScreen} edges={['left', 'right', 'bottom']}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      {header}
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucune demande pour le moment</Text>
            <Text style={styles.emptySubtitle}>Les nouvelles demandes apparaîtront ici.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </SafeAreaView>

      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelRejection}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rejectModalCard}>
            <Text style={styles.rejectModalTitle}>Raison du refus</Text>
            <Text style={styles.rejectModalDescription}>
              Expliquez brièvement pourquoi vous ne pouvez pas accepter cette demande.
            </Text>
            <TextInput
              style={styles.rejectInput}
              placeholder="Ex: Déjà réservé à cette date"
              placeholderTextColor="#9CA3AF"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            <View style={styles.rejectActions}>
              <TouchableOpacity style={styles.rejectCancel} onPress={handleCancelRejection}>
                <Text style={styles.rejectCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectConfirm} onPress={handleConfirmRejection}>
                <Text style={styles.rejectConfirmText}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    paddingBottom: 20,
  },
  headerGradient: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 28,
    marginBottom: 18,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 8,
    color: '#F8FAFC',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
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
    justifyContent: 'center',
    paddingHorizontal: 16,
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
  list: {
    flex: 1,
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  acceptGradient: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  rejectModalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  rejectModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F33',
  },
  rejectModalDescription: {
    fontSize: 14,
    color: '#6B6B7B',
  },
  rejectInput: {
    minHeight: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E4F0',
    padding: 12,
    textAlignVertical: 'top',
    color: '#1F1F33',
  },
  rejectActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  rejectCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  rejectCancelText: {
    color: '#6B6B7B',
    fontWeight: '600',
  },
  rejectConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: Colors.light.purple,
  },
  rejectConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
