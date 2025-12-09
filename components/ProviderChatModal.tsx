import { Colors } from '@/constants/Colors';
import { Provider } from '@/constants/providers';
import { auth, db } from '@/fireBaseConfig';
import { PLACEHOLDER_AVATAR_URI } from '@/utils/providerMapper';
import { Ionicons } from '@expo/vector-icons';
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
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
};

const ProviderChatModal = ({
  provider,
  onClose,
  conversationId,
  headerTitle,
  mode = 'client',
}: ProviderChatModalProps) => {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
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
          return {
            id: docSnap.id,
            text: data.text ?? '',
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
        clientUserId: user.uid,
        providerId: provider.id,
        providerName: provider.name,
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
      });
      setResolvedConversationId(docRef.id);
      return docRef.id;
    } catch (err) {
      console.error(err);
      setError('Impossible de démarrer la conversation.');
      return null;
    }
  }, [resolvedConversationId, mode, clientProfile, provider]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) {
      return;
    }
    try {
      setSending(true);
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
      await addDoc(collection(db, 'conversations', conversationKey, 'messages'), {
        text: trimmed,
        senderType: mode,
        senderId,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'conversations', conversationKey), {
        lastMessage: trimmed,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderType: mode,
        clientName:
          mode === 'client'
            ? clientProfile?.displayName ?? conversationMeta?.clientName ?? 'Client SpeedEvent'
            : conversationMeta?.clientName ?? headerTitle ?? 'Client SpeedEvent',
        clientAvatar:
          mode === 'client'
            ? clientProfile?.avatar ?? null
            : conversationMeta?.clientAvatar ?? null,
        providerName: provider.name,
        providerCategory: provider.category,
        providerCity: provider.city,
        providerPrice: provider.price,
        providerImage: provider.image,
        providerPhone: provider.phone,
        providerLocation: provider.location,
        providerResponseTime: provider.responseTime,
        providerDescription: provider.description,
        providerServices: provider.services ?? [],
      });
      setInput('');
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Impossible d'envoyer votre message.");
    } finally {
      setSending(false);
    }
  }, [
    clientProfile,
    conversationMeta,
    getOrCreateConversationId,
    headerTitle,
    input,
    mode,
    provider,
    sending,
  ]);

  const chatPartnerName = useMemo(() => {
    if (mode === 'provider') {
      return conversationMeta?.clientName || headerTitle || 'Client SpeedEvent';
    }
    return headerTitle || provider.name;
  }, [mode, conversationMeta?.clientName, headerTitle, provider.name]);

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
      ? `Répondre à ${conversationMeta?.clientName || headerTitle || 'ce client'}`
      : `Votre message pour ${provider.name}`;

  const canSend =
    Boolean(input.trim()) &&
    !sending &&
    (mode === 'client' ? Boolean(clientProfile?.contactId) : Boolean(resolvedConversationId));

  const showLoader = profileLoading || conversationLookupLoading;

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
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && !messagesLoading && styles.messagesListEmpty,
            ]}
            renderItem={({ item }) => {
              const isOwn = item.senderType === mode;
              return (
                <View
                  style={[
                    styles.messageBubble,
                    isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isOwn ? styles.messageTextOwn : styles.messageTextOther,
                    ]}
                  >
                    {item.text}
                  </Text>
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
              {sending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
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
});
