import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Provider } from '@/constants/providers';

type Message = {
  id: string;
  fromUser: boolean;
  text?: string;
  imageUri?: string;
  voiceUri?: string;
  voiceDuration?: number;
  time: string;
};

type ProviderChatModalProps = {
  provider: Provider;
  onClose: () => void;
};

const formatTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

const ProviderChatModal = ({ provider, onClose }: ProviderChatModalProps) => {
  const initialMessages = useMemo<Message[]>(
    () => [
      {
        id: '1',
        fromUser: false,
        text: `Bonjour ! Merci d'avoir contacté ${provider.name}. Comment puis-je vous aider ?`,
        time: '09:42',
      },
      {
        id: '2',
        fromUser: true,
        text: "Bonjour, je prépare un événement en juin et j'aimerais connaître vos disponibilités.",
        time: '09:44',
      },
    ],
    [provider.name],
  );

  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  useEffect(() => {
    const prepare = async () => {
      await Audio.requestPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    };
    prepare();

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const appendMessage = useCallback((message: Omit<Message, 'id' | 'time'>) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, time: formatTime(), ...message },
    ]);
  }, []);

  const handleSend = useCallback(() => {
    if (!draft.trim() || isBlocked) {
      return;
    }
    appendMessage({ fromUser: true, text: draft.trim() });
    setDraft('');
  }, [appendMessage, draft, isBlocked]);

  const handlePickImage = useCallback(async () => {
    if (isBlocked) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      appendMessage({ fromUser: true, imageUri: result.assets[0].uri });
    }
  }, [appendMessage, isBlocked]);

  const handleCall = useCallback(async () => {
    if (!provider.phone) {
      Alert.alert('Appel', 'Numéro indisponible pour ce prestataire.');
      return;
    }
    const url = `tel:${provider.phone.replace(/\s+/g, '')}`;
    if (await Linking.canOpenURL(url)) {
      Linking.openURL(url);
    } else {
      Alert.alert('Appel', 'Impossible d’initier un appel depuis cet appareil.');
    }
  }, [provider.phone]);

  const handleReport = useCallback(() => {
    Alert.alert(
      'Signaler le prestataire',
      'Souhaitez-vous signaler ce prestataire à notre équipe ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Signaler',
          style: 'destructive',
          onPress: () => Alert.alert('Signalement envoyé', 'Notre équipe examinera la conversation.'),
        },
      ],
    );
  }, []);

  const handleToggleBlock = useCallback(() => {
    if (!isBlocked) {
      Alert.alert(
        'Bloquer le prestataire',
        'Vous ne recevrez plus de messages tant que vous ne débloquerez pas ce prestataire.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Bloquer',
            style: 'destructive',
            onPress: () => setIsBlocked(true),
          },
        ],
      );
    } else {
      Alert.alert('Débloquer le prestataire', 'Voulez-vous le débloquer ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Débloquer', onPress: () => setIsBlocked(false) },
      ]);
    }
  }, [isBlocked]);

  const startRecording = useCallback(async () => {
    if (isBlocked || isRecording) {
      return;
    }
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Micro', 'Permission micro refusée.');
        return;
      }
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
    } catch {
      Alert.alert('Enregistrement', "Impossible de démarrer l'enregistrement.");
    }
  }, [isBlocked, isRecording]);

  const stopRecording = useCallback(async () => {
    if (!recording) {
      return;
    }
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      if (uri) {
        appendMessage({
          fromUser: true,
          voiceUri: uri,
          voiceDuration: status.durationMillis ?? undefined,
        });
      }
    } catch {
      Alert.alert('Enregistrement', "Une erreur est survenue lors de l'arrêt.");
    } finally {
      setRecording(null);
      setIsRecording(false);
    }
  }, [appendMessage, recording]);

  const handlePlayVoice = useCallback(
    async (message: Message) => {
      if (!message.voiceUri) {
        return;
      }
      try {
        if (playingMessageId === message.id) {
          await soundRef.current?.stopAsync();
          setPlayingMessageId(null);
          return;
        }
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        const { sound } = await Audio.Sound.createAsync({ uri: message.voiceUri });
        soundRef.current = sound;
        setPlayingMessageId(message.id);
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!status.isLoaded) {
            return;
          }
          if (status.didJustFinish) {
            setPlayingMessageId(null);
          }
        });
      } catch {
        Alert.alert('Lecture audio', 'Impossible de lire ce message vocal.');
      }
    },
    [playingMessageId],
  );

  const renderBubbleContent = (item: Message) => {
    if (item.imageUri) {
      return <Image source={{ uri: item.imageUri }} style={styles.imageMessage} />;
    }
    if (item.voiceUri) {
      const seconds = item.voiceDuration ? Math.round(item.voiceDuration / 1000) : null;
      return (
        <TouchableOpacity style={styles.voiceMessage} onPress={() => handlePlayVoice(item)}>
          <Ionicons
            name={playingMessageId === item.id ? 'pause-circle' : 'play-circle'}
            size={26}
            color="#F97316"
          />
          <Text
            style={[
              styles.voiceMessageText,
              item.fromUser ? styles.userMessageText : styles.providerMessageText,
            ]}
          >
            {playingMessageId === item.id ? 'Lecture...' : 'Message vocal'}
            {seconds ? ` • ${seconds}s` : ''}
          </Text>
        </TouchableOpacity>
      );
    }
    return (
      <Text
        style={[
          styles.messageText,
          item.fromUser ? styles.userMessageText : styles.providerMessageText,
        ]}
      >
        {item.text}
      </Text>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.fromUser;
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowProvider]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.providerBubble]}>
          {renderBubbleContent(item)}
          <Text
            style={[
              styles.messageTime,
              isUser ? styles.userBubbleTime : styles.providerBubbleTime,
            ]}
          >
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Image source={{ uri: provider.image }} style={styles.avatar} />
            <View>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Text style={styles.providerMeta}>
                {provider.category} • {provider.city}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleCall}>
              <Ionicons name="call" size={18} color="#1F1F33" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleReport}>
              <Ionicons name="alert-circle-outline" size={18} color="#D97706" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleToggleBlock}>
              <Ionicons name={isBlocked ? 'lock-open-outline' : 'hand-right-outline'} size={18} color="#DC2626" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={onClose}>
              <Ionicons name="close" size={18} color="#1F1F33" />
            </TouchableOpacity>
          </View>
        </View>

        {isBlocked && (
          <View style={styles.blockedBanner}>
            <Ionicons name="lock-closed-outline" size={18} color="#DC2626" />
            <Text style={styles.blockedText}>Vous avez bloqué ce prestataire.</Text>
            <TouchableOpacity onPress={handleToggleBlock}>
              <Text style={styles.unblockText}>Débloquer</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.inputActionButton} onPress={handlePickImage} disabled={isBlocked}>
            <Ionicons name="image-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.inputActionButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isBlocked}
          >
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={18} color={isRecording ? '#FFFFFF' : '#DC2626'} />
          </TouchableOpacity>
          <View style={styles.textInputWrapper}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={isBlocked ? 'Vous avez bloqué ce prestataire' : 'Écrivez un message...'}
              placeholderTextColor="#9CA3AF"
              editable={!isBlocked}
              multiline
              style={styles.textInput}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, (!draft.trim() || isBlocked) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!draft.trim() || isBlocked}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5FA',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4EE',
    backgroundColor: '#FFFFFF',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F33',
  },
  providerMeta: {
    fontSize: 12,
    color: '#6B6B7B',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FEE2E2',
  },
  blockedText: {
    flex: 1,
    marginLeft: 10,
    color: '#991B1B',
    fontSize: 13,
  },
  unblockText: {
    fontWeight: '600',
    color: '#B91C1C',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowProvider: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 6,
  },
  userBubble: {
    backgroundColor: '#4B6BFF',
    borderBottomRightRadius: 4,
  },
  providerBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 14,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  providerMessageText: {
    color: '#1F1F33',
  },
  imageMessage: {
    width: 180,
    height: 160,
    borderRadius: 14,
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voiceMessageText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  userBubbleTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  providerBubbleTime: {
    color: '#6B7280',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  inputActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingButton: {
    backgroundColor: '#DC2626',
  },
  textInputWrapper: {
    flex: 1,
    maxHeight: 120,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textInput: {
    fontSize: 14,
    color: '#111827',
    minHeight: 24,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4B6BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
});

export default ProviderChatModal;
