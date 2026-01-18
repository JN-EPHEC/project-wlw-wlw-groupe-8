import { Colors } from '@/constants/Colors';
import { Provider } from '@/constants/providers';
import { auth, db, storage } from '@/fireBaseConfig';
import { PLACEHOLDER_AVATAR_URI } from '@/utils/providerMapper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

type Mode = 'client' | 'provider';

type ProviderChatModalProps = {
  provider: Provider;
  onClose: () => void;
  conversationId?: string | null;
  headerTitle?: string;
  mode?: Mode;
};

type ChatMessage = {
  id: string;
  text: string;
  imageUrl?: string | null;
  senderType: Mode;
  createdAt: Date | null;
};

type ClientProfile = {
  contactId: string;
  displayName: string;
  avatar?: string | null;
};

type ConversationMeta = {
  id: string;
  clientName?: string;
  clientAvatar?: string | null;
  clientContactId?: string;
  providerId?: string;
  clientDeleted?: boolean;
};

type BookingSummary = {
  id: string;
  date?: string;
  slot?: { start?: string; end?: string } | null;
  status?: string;
  serviceName?: string | null;
};

const DELETED_USER_LABEL = 'Utilisateur introuvable';

const ProviderChatModal = ({
  provider,
  onClose,
  conversationId,
  headerTitle,
  mode = 'client',
}: ProviderChatModalProps) => {
  const providerDisplayName = provider.companyName || provider.name;
  const [input, setInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(mode === 'client');
  const [conversationLookupLoading, setConversationLookupLoading] = useState(
    mode === 'client' && !conversationId,
  );
  const [resolvedConversationId, setResolvedConversationId] = useState<string | null>(
    conversationId ?? null,
  );
  const [conversationMeta, setConversationMeta] = useState<ConversationMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharedRequests, setSharedRequests] = useState<BookingSummary[]>([]);
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (mode !== 'client') {
      setProfileLoading(false);
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      setError('Veuillez vous reconnecter pour discuter.');
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        const snapshot = await getDocs(
          query(
            collection(db, 'contacts'),
            where('userId', '==', user.uid),
            where('type', '==', 'client'),
            limit(1),
          ),
        );
        if (cancelled) return;
        if (snapshot.empty) {
          setError('Complétez votre profil client pour discuter.');
        } else {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          const displayName =
            data.displayName ||
            [data.firstname, data.lastname].filter(Boolean).join(' ').trim() ||
            user.email ||
            'Client SpeedEvent';
          setClientProfile({
            contactId: docSnap.id,
            displayName,
            avatar: data.profilePhoto ?? null,
          });
          setError(null);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError('Impossible de récupérer votre profil client.');
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    if (conversationId) {
      setResolvedConversationId(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    if (mode !== 'client') {
      return;
    }
    if (conversationId || !clientProfile?.contactId) {
      setConversationLookupLoading(false);
      return;
    }
    let cancelled = false;
    const lookupConversation = async () => {
      setConversationLookupLoading(true);
      try {
        const existing = await getDocs(
          query(
            collection(db, 'conversations'),
            where('clientContactId', '==', clientProfile.contactId),
            where('providerId', '==', provider.id),
            limit(1),
          ),
        );
        if (!cancelled && !existing.empty) {
          setResolvedConversationId(existing.docs[0].id);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError('Impossible de récupérer votre conversation.');
        }
      } finally {
        if (!cancelled) {
          setConversationLookupLoading(false);
        }
      }
    };
    lookupConversation();
    return () => {
      cancelled = true;
    };
  }, [mode, conversationId, clientProfile?.contactId, provider.id]);

  useEffect(() => {
    if (!resolvedConversationId) {
      setConversationMeta(null);
      setMessages([]);
      setMessagesLoading(false);
      return;
    }
    const metaUnsubscribe = onSnapshot(
      doc(db, 'conversations', resolvedConversationId),
      (docSnap) => {
        if (docSnap.exists()) {
          setConversationMeta({ id: docSnap.id, ...(docSnap.data() as ConversationMeta) });
        }
      },
      (err) => {
        console.error(err);
        setError('Impossible de charger cette conversation.');
      },
    );
    setMessagesLoading(true);
    const messagesUnsubscribe = onSnapshot(
      query(
        collection(db, 'conversations', resolvedConversationId, 'messages'),
        orderBy('createdAt', 'asc'),
      ),
      (snapshot) => {
        const nextMessages = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const textValue = typeof data.text === 'string' ? data.text : '';
          const imageUrlValue =
            typeof data.imageUrl === 'string' && data.imageUrl.trim().length > 0
              ? data.imageUrl
              : null;
          return {
            id: docSnap.id,
            text: textValue,
            imageUrl: imageUrlValue,
            senderType: data.senderType === 'provider' ? 'provider' : 'client',
            createdAt: data.createdAt?.toDate?.() ?? null,
          } as ChatMessage;
        });
        setMessages(nextMessages);
        setMessagesLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Impossible de charger les messages.');
        setMessagesLoading(false);
      },
    );
    return () => {
      metaUnsubscribe();
      messagesUnsubscribe();
    };
  }, [resolvedConversationId]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const markConversationAsRead = useCallback(
    async (conversationKey?: string | null) => {
      if (!conversationKey) return;
      try {
        await updateDoc(doc(db, 'conversations', conversationKey), {
          [mode === 'client' ? 'unreadByClient' : 'unreadByProvider']: false,
        });
      } catch (err) {
        console.error(err);
      }
    },
    [mode],
  );

  useEffect(() => {
    if (!resolvedConversationId) return;
    markConversationAsRead(resolvedConversationId);
  }, [resolvedConversationId, markConversationAsRead]);

  const getOrCreateConversationId = useCallback(async (): Promise<string | null> => {
    if (resolvedConversationId) {
      return resolvedConversationId;
    }
    if (mode !== 'client') {
      return null;
    }
    if (!clientProfile?.contactId) {
      setError('Complétez votre profil client pour discuter.');
      return null;
    }
    try {
      const existing = await getDocs(
        query(
          collection(db, 'conversations'),
          where('clientContactId', '==', clientProfile.contactId),
          where('providerId', '==', provider.id),
          limit(1),
        ),
      );
      if (!existing.empty) {
        const nextId = existing.docs[0].id;
        setResolvedConversationId(nextId);
        return nextId;
      }
    } catch (err) {
      console.error(err);
    }
    const user = auth.currentUser;
    if (!user) {
      setError('Veuillez vous reconnecter pour discuter.');
      return null;
    }
    try {
      const docRef = await addDoc(collection(db, 'conversations'), {
        clientContactId: clientProfile.contactId,
        clientName: clientProfile.displayName,
        clientAvatar: clientProfile.avatar ?? null,
        clientDeleted: false,
        clientUserId: user.uid,
        providerId: provider.id,
        providerName: providerDisplayName,
        providerCompanyName: provider.companyName ?? null,
        providerCategory: provider.category,
        providerCity: provider.city,
        providerPrice: provider.price,
        providerImage: provider.image,
        providerPhone: provider.phone,
        providerLocation: provider.location,
        providerResponseTime: provider.responseTime,
        providerDescription: provider.description,
        providerServices: provider.services ?? [],
        providerAvailability: provider.availability ?? '',
        providerGallery: provider.gallery ?? [],
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageAt: null,
        unreadByClient: false,
        unreadByProvider: false,
      });
      setResolvedConversationId(docRef.id);
      return docRef.id;
    } catch (err) {
      console.error(err);
      setError('Impossible de démarrer la conversation.');
      return null;
    }
  }, [resolvedConversationId, mode, clientProfile, provider, providerDisplayName]);

  const sendChatMessage = useCallback(
    async ({ text, imageUrl }: { text?: string; imageUrl?: string }) => {
      const trimmed = text?.trim() ?? '';
      if (!trimmed && !imageUrl) {
        return;
      }
      if (sendingMessage) {
        return;
      }
      setSendingMessage(true);
      try {
        const conversationKey = await getOrCreateConversationId();
        if (!conversationKey) {
          return;
        }
        const senderId =
          mode === 'client'
            ? clientProfile?.contactId
            : conversationMeta?.providerId ?? provider.id;
        if (!senderId) {
          setError('Impossible de déterminer votre profil.');
          return;
        }
        const payload: Record<string, any> = {
          senderType: mode,
          senderId,
          createdAt: serverTimestamp(),
        };
        if (trimmed) {
          payload.text = trimmed;
        }
        if (imageUrl) {
          payload.imageUrl = imageUrl;
        }
        await addDoc(collection(db, 'conversations', conversationKey, 'messages'), payload);
        const fallbackClientName =
          mode === 'client'
            ? clientProfile?.displayName ?? conversationMeta?.clientName ?? 'Client SpeedEvent'
            : conversationMeta?.clientName ?? headerTitle ?? 'Client SpeedEvent';
        const effectiveClientName = conversationMeta?.clientDeleted ? DELETED_USER_LABEL : fallbackClientName;
        const preview =
          trimmed && imageUrl
            ? `${trimmed} 📷`
            : trimmed || (imageUrl ? '📷 Photo' : '');
        const updates: Record<string, any> = {
          lastMessage: preview,
          lastMessageAt: serverTimestamp(),
          lastMessageSenderType: mode,
          clientName: effectiveClientName,
          clientAvatar:
            mode === 'client'
              ? clientProfile?.avatar ?? null
              : conversationMeta?.clientAvatar ?? null,
          providerName: providerDisplayName,
          providerCompanyName: provider.companyName ?? null,
          providerCategory: provider.category,
          providerCity: provider.city,
          providerPrice: provider.price,
          providerImage: provider.image,
          providerPhone: provider.phone,
          providerLocation: provider.location,
          providerResponseTime: provider.responseTime,
          providerDescription: provider.description,
          providerServices: provider.services ?? [],
        };

        if (mode === 'client') {
          updates.unreadByProvider = true;
          updates.unreadByClient = false;
        } else {
          updates.unreadByClient = true;
          updates.unreadByProvider = false;
        }

        await updateDoc(doc(db, 'conversations', conversationKey), updates);
        if (trimmed) {
          setInput('');
        }
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Impossible d'envoyer votre message.");
      } finally {
        setSendingMessage(false);
      }
    },
    [
      clientProfile,
      conversationMeta,
      getOrCreateConversationId,
      headerTitle,
      mode,
      provider,
      providerDisplayName,
      sendingMessage,
    ],
  );

  const handleSend = useCallback(() => {
    sendChatMessage({ text: input });
  }, [input, sendChatMessage]);

  const chatPartnerName = useMemo(() => {
    if (mode === 'provider') {
      if (conversationMeta?.clientDeleted) {
        return DELETED_USER_LABEL;
      }
      return conversationMeta?.clientName || headerTitle || 'Client SpeedEvent';
    }
    return headerTitle || providerDisplayName;
  }, [mode, conversationMeta?.clientDeleted, conversationMeta?.clientName, headerTitle, providerDisplayName]);

  const chatPartnerSubtitle = useMemo(() => {
    if (mode === 'provider') {
      return 'Client SpeedEvent';
    }
    return `${provider.category} · ${provider.city}`;
  }, [mode, provider.category, provider.city]);

  const avatarUri =
    mode === 'provider'
      ? conversationMeta?.clientAvatar || PLACEHOLDER_AVATAR_URI
      : provider.image || PLACEHOLDER_AVATAR_URI;

  const placeholder =
    mode === 'provider'
      ? `Répondre à ${conversationMeta?.clientDeleted ? DELETED_USER_LABEL : conversationMeta?.clientName || headerTitle || 'ce client'}`
      : `Votre message pour ${providerDisplayName}`;

  const canSend =
    Boolean(input.trim()) &&
    !sendingMessage &&
    (mode === 'client' ? Boolean(clientProfile?.contactId) : Boolean(resolvedConversationId));

  const showLoader = profileLoading || conversationLookupLoading;
  const bookingClientContactId =
    mode === 'client'
      ? clientProfile?.contactId ?? null
      : conversationMeta?.clientDeleted
      ? null
      : conversationMeta?.clientContactId ?? null;

  useEffect(() => {
    if (!bookingClientContactId || !provider.id) {
      setSharedRequests([]);
      return;
    }
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'bookingRequests'),
        where('providerId', '==', provider.id),
        where('clientContactId', '==', bookingClientContactId),
      ),
      (snapshot) => {
        const next = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            date: data.date,
            slot: data.slot ?? null,
            status: typeof data.status === 'string' ? data.status.toLowerCase() : 'pending',
            serviceName: data.service?.name ?? null,
          } as BookingSummary;
        });
        setSharedRequests(next);
      },
      (err) => {
        console.error(err);
        setSharedRequests([]);
      },
    );
    return () => unsubscribe();
  }, [bookingClientContactId, provider.id]);

  const sortedRequests = useMemo(() => {
    return [...sharedRequests].sort((a, b) => {
      const aDate = a.date ?? '';
      const bDate = b.date ?? '';
      if (aDate === bDate) {
        const aStart = a.slot?.start ?? '';
        const bStart = b.slot?.start ?? '';
        return aStart.localeCompare(bStart);
      }
      return (bDate || '').localeCompare(aDate || '');
    });
  }, [sharedRequests]);

  const handlePickImage = useCallback(async () => {
    if (uploadingImage) {
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Autorisez l'accès à vos photos pour envoyer des images.");
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (pickerResult.canceled || !pickerResult.assets?.length) {
        return;
      }
      const asset = pickerResult.assets[0];
      if (!asset?.uri) {
        return;
      }
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('Veuillez vous reconnecter pour envoyer une image.');
        return;
      }
      const conversationKey = await getOrCreateConversationId();
      if (!conversationKey) {
        return;
      }
      setUploadingImage(true);
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const extensionSource =
        asset.fileName?.split('.').pop() ||
        asset.uri.split('.').pop() ||
        'jpg';
      const extension = extensionSource
        ?.replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const ownerUid = currentUser.uid;
      const imageRef = ref(
        storage,
        `profiles/${ownerUid}/chats/${conversationKey}/${fileName}`,
      );
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      await sendChatMessage({ imageUrl: downloadURL });
    } catch (err) {
      console.error(err);
      setError("Impossible d'envoyer la photo.");
    } finally {
      setUploadingImage(false);
    }
  }, [getOrCreateConversationId, sendChatMessage, uploadingImage]);

  const hasSharedRequests = sortedRequests.length > 0;
  useEffect(() => {
    if (!hasSharedRequests && requestsModalVisible) {
      setRequestsModalVisible(false);
    }
  }, [hasSharedRequests, requestsModalVisible]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={onClose}>
          <Ionicons name="chevron-back" size={22} color="#1F1F33" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <View>
            <Text style={styles.headerTitle}>{chatPartnerName}</Text>
            <Text style={styles.headerSubtitle}>{chatPartnerSubtitle}</Text>
          </View>
        </View>
        <View style={styles.placeholderBox} />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {showLoader ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={Colors.light.purple} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.chatArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={20}
        >
          <View
            style={[
              styles.chatBody,
              hasSharedRequests ? styles.chatBodyWithRequests : null,
            ]}
          >
            {hasSharedRequests ? (
              <TouchableOpacity
                style={styles.requestsButton}
                onPress={() => setRequestsModalVisible(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="document-text-outline" size={16} color="#7B4CFF" />
                <Text style={styles.requestsButtonText}>
                  Voir les demandes ({sortedRequests.length})
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#7B4CFF" />
              </TouchableOpacity>
            ) : null}
            <FlatList
              style={styles.messagesListContainer}
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.messagesList,
                messages.length === 0 && !messagesLoading && styles.messagesListEmpty,
              ]}
              renderItem={({ item }) => {
                const isOwn = item.senderType === mode;
                const hasText = Boolean(item.text);
                const hasImage = Boolean(item.imageUrl);
                const bubbleStyle = [
                  styles.messageBubble,
                isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
                hasImage && !hasText ? styles.messageBubbleImageOnly : null,
              ];
              return (
                <View style={bubbleStyle}>
                  {hasImage ? (
                    <Image source={{ uri: (item.imageUrl as string) || '' }} style={styles.messageImage} />
                  ) : null}
                  {hasText ? (
                    <Text
                      style={[
                        styles.messageText,
                        isOwn ? styles.messageTextOwn : styles.messageTextOther,
                      ]}
                    >
                      {item.text}
                    </Text>
                  ) : null}
                  {item.createdAt ? (
                    <Text
                      style={[
                        styles.messageDate,
                        isOwn ? styles.messageDateOwn : styles.messageDateOther,
                      ]}
                    >
                      {item.createdAt.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  ) : null}
                </View>
              );
            }}
              ListEmptyComponent={
                messagesLoading ? (
                  <ActivityIndicator color={Colors.light.purple} />
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={32} color="#CBD5F5" />
                    <Text style={styles.emptyTitle}>Démarrez la conversation</Text>
                    <Text style={styles.emptySubtitle}>
                      Envoyez un premier message pour discuter.
                    </Text>
                  </View>
                )
              }
            />
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[styles.attachButton, uploadingImage && styles.attachButtonDisabled]}
                onPress={handlePickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator color={Colors.light.purple} />
                ) : (
                  <Ionicons name="image-outline" size={20} color={Colors.light.purple} />
                )}
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!canSend}
              >
                {sendingMessage ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      <Modal
        visible={requestsModalVisible && hasSharedRequests}
        animationType="slide"
        onRequestClose={() => setRequestsModalVisible(false)}
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.requestsModal}>
          <LinearGradient
            colors={[Colors.light.lila, Colors.light.lightBlue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.requestsModalHeader}>
            <TouchableOpacity
              style={styles.requestsModalBack}
              onPress={() => setRequestsModalVisible(false)}
            >
              <Ionicons name="chevron-back" size={22} color="#1F1F33" />
            </TouchableOpacity>
            <Text style={styles.requestsModalTitle}>Demandes</Text>
            <View style={{ width: 44 }} />
          </View>
          <FlatList
            data={sortedRequests}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.requestsList}
            renderItem={({ item }) => {
              const status = typeof item.status === 'string' ? item.status : 'pending';
              const statusPalette =
                status === 'accepted' || status === 'confirmed'
                  ? { label: 'Confirmée', color: '#15803D', bg: '#DCFCE7' }
                  : status === 'rejected'
                  ? { label: 'Refusée', color: '#B91C1C', bg: '#FEE2E2' }
                  : { label: 'En attente', color: '#B45309', bg: '#FFEED3' };
              const dateLabel = item.date
                ? new Date(item.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : 'Date à définir';
              const slotLabel =
                item.slot?.start && item.slot?.end
                  ? `${item.slot.start} - ${item.slot.end}`
                  : 'Heure à définir';
              return (
                <View style={styles.requestCard}>
                  <View style={styles.requestCardRow}>
                    <Text style={styles.requestDate}>{dateLabel}</Text>
                    <View style={[styles.requestBadge, { backgroundColor: statusPalette.bg }]}>
                      <Text style={[styles.requestBadgeText, { color: statusPalette.color }]}>
                        {statusPalette.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.requestSlot}>{slotLabel}</Text>
                  <Text style={styles.requestService}>
                    {item.serviceName ?? 'Service à confirmer'}
                  </Text>
                </View>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default ProviderChatModal;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#F5F3FF',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  placeholderBox: {
    width: 44,
    height: 44,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DDD6FE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F33',
  },
  headerSubtitle: {
    color: '#6B6B7B',
  },
  errorText: {
    marginHorizontal: 20,
    color: Colors.light.pink,
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  chatBody: {
    flex: 1,
    position: 'relative',
  },
  chatBodyWithRequests: {
    paddingTop: 64,
  },
  requestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 6,
  },
  requestsButtonText: {
    flex: 1,
    marginHorizontal: 10,
    fontWeight: '600',
    color: '#1F1F33',
  },
  messagesListContainer: {
    flex: 1,
  },
  messagesList: {
    flexGrow: 1,
    gap: 12,
  },
  messagesListEmpty: {
    justifyContent: 'center',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  messageBubbleImageOnly: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  messageBubbleOwn: {
    backgroundColor: Colors.light.purple,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
  },
  messageTextOwn: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: '#1F1F33',
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 18,
    marginBottom: 8,
    backgroundColor: '#E5E7EB',
  },
  messageDate: {
    marginTop: 6,
    fontSize: 11,
    textAlign: 'right',
  },
  messageDateOwn: {
    color: '#E0E7FF',
  },
  messageDateOther: {
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontWeight: '700',
    color: '#1F1F33',
  },
  emptySubtitle: {
    color: '#6B6B7B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  attachButtonDisabled: {
    opacity: 0.5,
  },
  textInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    color: '#1F1F33',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  requestsModal: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  requestsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 16,
  },
  requestsModalBack: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  requestsModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F1F33',
  },
  requestsList: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 12,
  },
  requestCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  requestDate: {
    fontWeight: '700',
    color: '#1F1F33',
    textTransform: 'capitalize',
  },
  requestBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  requestBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  requestSlot: {
    fontWeight: '600',
    color: '#4B5563',
  },
  requestService: {
    marginTop: 4,
    color: '#6B6E7F',
  },
});
