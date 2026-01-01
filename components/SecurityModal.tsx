import { Colors } from '@/constants/Colors';
import { auth } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SecurityModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function SecurityModal({ visible, onClose }: SecurityModalProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(1);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [slideAnim, visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Information', 'Merci de compléter tous les champs.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Information', 'Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert('Erreur', 'Impossible de vérifier votre session. Veuillez vous reconnecter.');
      return;
    }
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert('Mot de passe modifié', 'Votre mot de passe a bien été mis à jour.');
      handleClose();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de modifier le mot de passe. Vérifiez vos informations.');
    } finally {
      setSaving(false);
    }
  };

  const secureEntry = !showPasswords;

  return (
    <Modal
      visible={visible}
      animationType='none'
      presentationStyle='fullScreen'
      onRequestClose={handleClose}
    >
      <LinearGradient
        colors={[Colors.light.lila, Colors.light.lightBlue]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View
        style={[
          styles.panel,
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
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <Ionicons name='chevron-back' size={22} color='#1F1F33' />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sécurité</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Mot de passe actuel</Text>
            <TextInput
              style={styles.input}
              secureTextEntry={secureEntry}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <Text style={styles.label}>Nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              secureTextEntry={secureEntry}
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              secureTextEntry={secureEntry}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Pressable style={styles.togglePassword} onPress={() => setShowPasswords((prev) => !prev)}>
              <Ionicons name='eye-outline' size={18} color={Colors.light.purple} />
              <Text style={styles.togglePasswordText}>
                {showPasswords ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
              </Text>
            </Pressable>

            <TouchableOpacity
              style={[styles.submitButton, saving && styles.submitButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient
                colors={[Colors.light.pink, Colors.light.purple, Colors.light.blue]}
                style={styles.submitGradient}
              >
                <Text style={styles.submitLabel}>
                  {saving ? 'Mise à jour...' : 'Modifier le mot de passe'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-start',
  },
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flex: 1,
  },
  label: {
    fontWeight: '600',
    color: '#1F1F33',
    marginBottom: 6,
  },
  input: {
    borderRadius: 20,
    backgroundColor: '#F2F2F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  togglePassword: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  togglePasswordText: {
    marginLeft: 6,
    color: Colors.light.purple,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 20,
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
