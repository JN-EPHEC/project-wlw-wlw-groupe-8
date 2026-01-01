import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/UseThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SupportModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function SupportModal({ visible, onClose }: SupportModalProps) {
  const colors = useThemeColors();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [subject, setSubject] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const canSubmit = useMemo(() => subject.trim().length > 0 && message.trim().length > 0, [
    subject,
    message,
  ]);

  const resetForm = useCallback(() => {
    setSubject('');
    setEmail('');
    setMessage('');
    setSending(false);
  }, []);

  const animateIn = useCallback(() => {
    slideAnim.setValue(1);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const animateOut = useCallback(
    (callback?: () => void) => {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        callback?.();
        resetForm();
      });
    },
    [resetForm, slideAnim],
  );

  const handleSubmit = useCallback(() => {
    if (!canSubmit || sending) {
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      animateOut(onClose);
    }, 800);
  }, [animateOut, canSubmit, onClose, sending]);

  const handleClose = useCallback(() => {
    animateOut(onClose);
  }, [animateOut, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="fullScreen"
      onShow={animateIn}
      onRequestClose={handleClose}
    >
      <View style={styles.modalRoot}>
        <Animated.View
          style={[
            styles.animatedPanel,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 400],
                  }),
                },
              ],
            },
          ]}
        >
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          >
            <LinearGradient
              colors={[Colors.light.lila, Colors.light.lightBlue]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                  <Ionicons name='chevron-back' size={22} color='#1F1F33' />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Support client</Text>
                <View style={{ width: 44 }} />
              </View>
              <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Besoin d’aide ?</Text>
                  <Text style={styles.cardSubtitle}>
                    Décrivez votre problème et notre équipe technique vous contactera.
                  </Text>
                  <Text style={styles.label}>Sujet</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Problème de connexion"
                    placeholderTextColor="#A0A1AF"
                    value={subject}
                    onChangeText={setSubject}
                  />
                  <Text style={styles.label}>E-mail (facultatif)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="email@example.com"
                    placeholderTextColor="#A0A1AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                  <Text style={styles.label}>Message</Text>
                  <TextInput
                    style={[styles.input, styles.messageInput]}
                    placeholder="Expliquez votre demande..."
                    placeholderTextColor="#A0A1AF"
                    value={message}
                    onChangeText={setMessage}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.submitButton, (!canSubmit || sending) && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={!canSubmit || sending}
                  >
                    <LinearGradient
                      colors={[colors.pink, colors.purple]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.submitGradient}
                    >
                      {sending ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.submitLabel}>Envoyer la demande</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  animatedPanel: {
    ...StyleSheet.absoluteFillObject,
  },
  flex: {
    flex: 1,
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1F33',
  },
  safeArea: {
    flex: 1,
    paddingTop: 12,
  },
  content: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    marginTop: 10,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F33',
  },
  cardSubtitle: {
    marginTop: 8,
    color: '#6B7280',
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    color: '#1F1F33',
    marginTop: 12,
  },
  input: {
    marginTop: 6,
    borderRadius: 16,
    backgroundColor: '#F5F6FB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#1F1F33',
  },
  messageInput: {
    minHeight: 130,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 18,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
