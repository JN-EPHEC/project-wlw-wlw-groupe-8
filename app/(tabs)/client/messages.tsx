import { Colors } from '@/constants/Colors';
import { Provider } from '@/constants/providers';
import { auth, db } from '@/fireBaseConfig';
import { PLACEHOLDER_AVATAR_URI } from '@/utils/providerMapper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ProviderChatScreen from '@/components/ProviderChatModal';

 type ConversationSummary = {
  id: string;
  provider: Provider;
  lastMessage: string;
  lastMessageAt: Date | null;
  unread: boolean;
};

const formatTimestamp = (value: Date | null) => {
  if (!value) return '';
  const now = new Date();
  const isToday =
    now.getFullYear() === value.getFullYear() &&
    now.getMonth() === value.getMonth() &&
    now.getDate() === value.getDate();
  return isToday
    ? value.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : value.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const toProvider = (data: Record<string, any>): Provider => ({
  id: data.providerId ?? 'unknown',
  name: data.providerName ?? 'Prestataire SpeedEvent',
  category: data.providerCategory ?? 'Prestataire',
  city: data.providerCity ?? 'Belgique',
  rating: '5.0',
  price: data.providerPrice ?? 'Tarif sur demande',
  image: data.providerImage ?? PLACEHOLDER_AVATAR_URI,
  phone: data.providerPhone ?? '',
  stats: { reviews: 0, experienceYears: 0, events: 0 },
  location: data.providerLocation ?? data.providerCity ?? 'Belgique',
  responseTime: data.providerResponseTime ?? 'Répond généralement sous 24h',
  description: data.providerDescription ?? "Ce prestataire n'a pas encore ajouté de description.",
  services: Array.isArray(data.providerServices) ? data.providerServices : [],
  gallery: [],
  availability: '',
  reviews: [],
});

export default function ClientMessagesScreen() {
  const [contactId, setContactId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeChat, setActiveChat] = useState<{ provider: Provider; conversationId?: string | null } | null>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setError('Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }
      try {
        const profileSnapshot = await getDocs(
          query(
            collection(db, 'contacts'),
            where('userId', '==', user.uid),
            where('type', '==', 'client'),
            limit(1),
          ),
        );
        if (profileSnapshot.empty) {
          setError('Impossible de récupérer votre profil client.');
          setLoading(false);
          return;
        }
        setContactId(profileSnapshot.docs[0].id);
      } catch (err) {
        console.error(err);
        setError('Impossible de récupérer votre profil client.');
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!contactId) return;
    const conversationsRef = collection(db, 'conversations');
    const unsubscribe = onSnapshot(
      query(conversationsRef, where('clientContactId', '==', contactId), orderBy('lastMessageAt', 'desc')),
      (snapshot) => {
        const next = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            provider: toProvider(data),
            lastMessage: data.lastMessage ?? 'Nouvelle conversation',
            lastMessageAt: data.lastMessageAt?.toDate?.() ?? null,
            unread: Boolean(data.unreadByClient),
          } as ConversationSummary;
        });
        setConversations(next);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Impossible de charger vos conversations.');
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [contactId]);

  const markConversationAsRead = useCallback(async (conversationId?: string | null) => {
    if (!conversationId) return;
    try {
      await updateDoc(doc(db, 'conversations', conversationId), { unreadByClient: false });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleOpenChat = useCallback(
    (provider: Provider, conversationId?: string | null) => {
      if (conversationId) {
        markConversationAsRead(conversationId);
      }
      setActiveChat({ provider, conversationId });
      setChatVisible(true);
    },
    [markConversationAsRead],
  );

  const handleCloseChat = useCallback(() => {
    setChatVisible(false);
    setActiveChat(null);
  }, []);

  const renderConversation = useCallback(({ item }: { item: ConversationSummary }) => {
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleOpenChat(item.provider, item.id)}>
        <Image source={{ uri: item.provider.image || PLACEHOLDER_AVATAR_URI }} style={styles.avatar} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.providerName}>{item.provider.name}</Text>
            <Text style={styles.timestamp}>{formatTimestamp(item.lastMessageAt)}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 'Démarrez la conversation'}
          </Text>
        </View>
        {item.unread ? <View style={styles.unreadDot} /> : <Ionicons name="chevron-forward" size={18} color="#CBD5F5" />}
      </TouchableOpacity>
    );
  }, [handleOpenChat]);

  const header = useMemo(() => (
    <LinearGradient colors={[Colors.light.pink, Colors.light.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
      <Text style={styles.headerTitle}>Messages</Text>
      <Text style={styles.headerSubtitle}>Continuez vos échanges avec vos prestataires favoris.</Text>
    </LinearGradient>
  ), []);

  const renderGradientWrapper = (children: React.ReactNode) => (
    <LinearGradient
      colors={[Colors.light.lila, Colors.light.lightBlue]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.screenGradient}
    >
      <SafeAreaView style={styles.screen}>{children}</SafeAreaView>
    </LinearGradient>
  );

  if (loading) {
    return renderGradientWrapper(
      <View style={styles.loaderScreen}>
        <ActivityIndicator color={Colors.light.purple} />
        <Text style={styles.loaderText}>Chargement de vos conversations…</Text>
      </View>,
    );
  }

  if (error) {
    return renderGradientWrapper(
      <View style={styles.loaderScreen}>
        <Text style={styles.errorText}>{error}</Text>
      </View>,
    );
  }

  return renderGradientWrapper(
    <>
      {header}
      {conversations.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="chatbubbles-outline" size={32} color="#CBD5F5" />
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptySubtitle}>Contactez un prestataire pour commencer un échange.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={chatVisible && Boolean(activeChat)} animationType="slide" onRequestClose={handleCloseChat}>
        {activeChat && (
          <ProviderChatScreen
            provider={activeChat.provider}
            onClose={handleCloseChat}
            conversationId={activeChat.conversationId}
          />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screenGradient: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  loaderScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
  },
  loaderText: {
    marginTop: 12,
    color: '#6B6B7B',
  },
  errorText: {
    color: Colors.light.pink,
    textAlign: 'center',
  },
  headerGradient: {
    margin: 20,
    borderRadius: 24,
    padding: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#F1F5F9',
    marginTop: 6,
  },
  emptyCard: {
    marginHorizontal: 20,
    marginTop: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F33',
  },
  emptySubtitle: {
    color: '#6B6B7B',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerName: {
    fontWeight: '700',
    color: '#1F1F33',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  lastMessage: {
    marginTop: 4,
    color: '#4B5563',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4E6B',
    marginLeft: 8,
  },
});
