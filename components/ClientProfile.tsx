import { Colors } from '@/constants/Colors';
import { auth, db, storage } from '@/fireBaseConfig';
import { PLACEHOLDER_AVATAR_URI } from '@/utils/providerMapper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
  useWindowDimensions,
} from 'react-native';
import { collection, doc, getDocs, limit, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

type ClientProfileProps = {
  visible: boolean;
  onClose: () => void;
};

const DELETED_USER_LABEL = 'Utilisateur introuvable';

export default function ClientProfile({ visible, onClose }: ClientProfileProps) {
  const user = auth.currentUser;
  const router = useRouter();
  const { width } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(width)).current;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setError('Veuillez vous reconnecter.');
      setLoading(false);
      return;
    }
    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'contacts'),
          where('userId', '==', user.uid),
          where('type', '==', 'client'),
          limit(1),
        ),
      );
      if (snapshot.empty) {
        setError('Impossible de charger votre profil.');
        setLoading(false);
        return;
      }
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      setDocumentId(docSnap.id);
      const fetchedFirstName =
        typeof data.firstname === 'string' && data.firstname.trim()
          ? data.firstname.trim()
          : '';
      const fetchedLastName =
        typeof data.lastname === 'string' && data.lastname.trim() ? data.lastname.trim() : '';
      if (fetchedFirstName || fetchedLastName) {
        setFirstName(fetchedFirstName);
        setLastName(fetchedLastName);
      } else {
        const fallback = (data.displayName as string | undefined)?.trim() ?? '';
        if (fallback.includes(' ')) {
          const [first, ...rest] = fallback.split(' ');
          setFirstName(first);
          setLastName(rest.join(' '));
        } else {
          setFirstName(fallback);
          setLastName('');
        }
      }
      setEmail(data.email ?? user.email ?? '');
      setAvatar(data.profilePhoto ?? null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger votre profil.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(width);
      fetchProfile();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [fetchProfile, slideAnim, visible, width]);

  const animateClose = useCallback(
    (callback?: () => void) => {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 240,
        useNativeDriver: true,
      }).start(() => {
        callback?.();
      });
    },
    [slideAnim, width],
  );

  const handleCloseModal = useCallback(() => {
    animateClose(onClose);
  }, [animateClose, onClose]);

  const uploadImageAsync = useCallback(
    async (uri: string) => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const uid = user?.uid ?? 'anonymous';
      const imageRef = ref(storage, `clients/${uid}/profile_${Date.now()}.jpg`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    },
    [user?.uid],
  );

  const handlePickAvatar = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Autorisez l’accès à votre galerie pour ajouter une photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    try {
      setSaving(true);
      const downloadURL = await uploadImageAsync(result.assets[0].uri);
      setAvatar(downloadURL);
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter la photo de profil.");
    } finally {
      setSaving(false);
    }
  }, [uploadImageAsync]);

  const handleSave = useCallback(async () => {
    if (!documentId) return;
    setSaving(true);
    try {
      const displayName = [firstName, lastName].filter(Boolean).join(' ').trim();
      await updateDoc(doc(db, 'contacts', documentId), {
        firstname: firstName,
        lastname: lastName,
        displayName,
        email,
        profilePhoto: avatar,
      });
      animateClose(onClose);
    } catch (err) {
      console.error(err);
      setError('Impossible de sauvegarder votre profil pour le moment.');
    } finally {
      setSaving(false);
    }
  }, [animateClose, avatar, documentId, email, firstName, lastName, onClose]);

  const executeAccountDeletion = useCallback(
    async (currentPassword: string) => {
      if (!documentId) {
        setError('Impossible de supprimer votre compte pour le moment.');
        return;
      }
      if (!currentPassword.trim()) {
        setDeletePasswordError('Veuillez entrer votre mot de passe.');
        return;
      }
      setDeleting(true);
      try {
        const scrubbedData = {
          firstname: '',
          lastname: '',
          displayName: DELETED_USER_LABEL,
        email: '',
        profilePhoto: null,
        phone: '',
        description: '',
        cities: [],
        services: [],
        accountDeleted: true,
        deletedAt: new Date(),
      };
      await updateDoc(doc(db, 'contacts', documentId), scrubbedData);
      const conversationsSnapshot = await getDocs(
        query(collection(db, 'conversations'), where('clientContactId', '==', documentId)),
      );
      if (!conversationsSnapshot.empty) {
        const batch = writeBatch(db);
        conversationsSnapshot.forEach((conversationDoc) => {
          batch.update(conversationDoc.ref, {
            clientName: DELETED_USER_LABEL,
            clientAvatar: null,
            clientDeleted: true,
          });
        });
        await batch.commit();
      }
      setFirstName('');
      setLastName('');
      setEmail('');
      setAvatar(null);
      setDeletePassword('');
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('Session invalide. Veuillez vous reconnecter.');
      }
      try {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword.trim());
        await reauthenticateWithCredential(currentUser, credential);
      } catch (reauthError) {
        console.error(reauthError);
        setDeletePasswordError('Mot de passe incorrect. Veuillez réessayer.');
        setDeleting(false);
        return;
      }
      try {
        await deleteUser(auth.currentUser!);
      } catch (deleteAuthError) {
        console.error(deleteAuthError);
        setError('Impossible de supprimer votre compte utilisateur pour le moment.');
        setDeleting(false);
        return;
      }
      await auth.signOut();
      setDeleteModalVisible(false);
      Alert.alert('Compte supprimé', 'Vos informations personnelles ont été supprimées.');
      router.replace('/auth/login');
    } catch (err) {
      console.error(err);
      setError('Impossible de supprimer votre compte pour le moment.');
    } finally {
      setDeleting(false);
    }
  },
  [documentId, router]);

  const handleDeleteAccount = useCallback(() => {
    if (!documentId || deleting || saving) {
      if (!documentId) {
        setError('Impossible de supprimer votre compte pour le moment.');
      }
      return;
    }
    setDeletePassword('');
    setDeletePasswordError(null);
    setDeleteModalVisible(true);
  }, [deleting, documentId, saving]);

  const confirmDeleteAccount = useCallback(() => {
    if (deleting) return;
    if (!deletePassword.trim()) {
      setDeletePasswordError('Veuillez entrer votre mot de passe.');
      return;
    }
    setDeletePasswordError(null);
    executeAccountDeletion(deletePassword.trim());
  }, [deleting, deletePassword, executeAccountDeletion]);

  return (
    <>
      <Modal
        visible={visible}
        animationType="none"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseModal}
        transparent={false}
      >
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.animatedPanel, { transform: [{ translateX: slideAnim }] }]}>
            <SafeAreaView style={styles.screen}>
              {loading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator color={Colors.light.purple} />
                </View>
              ) : (
                <KeyboardAvoidingView
                  style={{ flex: 1 }}
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                  <View style={styles.headerRow}>
                    <TouchableOpacity onPress={handleCloseModal} style={styles.backButton}>
                      <Ionicons name="chevron-back" size={22} color="#1F1F33" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profil</Text>
                    <View style={{ width: 44 }} />
                  </View>

                  <View style={styles.formCard}>
                    <View style={styles.profileHeader}>
                      <View style={styles.cardAvatarWrapper}>
                        <Image source={{ uri: avatar || PLACEHOLDER_AVATAR_URI }} style={styles.avatar} />
                        <TouchableOpacity style={styles.avatarButton} onPress={handlePickAvatar}>
                          <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>
                          {[firstName, lastName].filter(Boolean).join(' ') || 'Client SpeedEvent'}
                        </Text>
                        <Text style={styles.profileEmail}>{email || 'Email non renseigné'}</Text>
                      </View>
                    </View>

              <Text style={[styles.label, styles.formSpacing]}>Prénom</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Votre prénom"
              />
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Votre nom"
              />
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="email@example.com"
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving || deleting}>
                    <LinearGradient colors={[Colors.light.pink, Colors.light.purple]} style={styles.saveButtonGradient}>
                      {saving ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.saveButtonText}>Enregistrer</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteButton, (saving || deleting) && styles.deleteButtonDisabled]}
                    onPress={handleDeleteAccount}
                    disabled={saving || deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator color={Colors.light.pink} />
                    ) : (
                      <Text style={styles.deleteButtonText}>Supprimer le compte</Text>
                    )}
                  </TouchableOpacity>
                </KeyboardAvoidingView>
              )}
            </SafeAreaView>
          </Animated.View>
        </View>
        {deleteModalVisible && (
          <View style={styles.deleteModalBackdrop}>
            <View style={styles.deleteModalCard}>
              <Text style={styles.deleteModalTitle}>Confirmer la suppression</Text>
              <Text style={styles.deleteModalSubtitle}>
                Pour supprimer votre compte, veuillez entrer votre mot de passe.
              </Text>
              <TextInput
                style={styles.deleteModalInput}
                secureTextEntry
                placeholder="Mot de passe"
                value={deletePassword}
                onChangeText={(value) => {
                  setDeletePassword(value);
                  if (deletePasswordError) {
                    setDeletePasswordError(null);
                  }
                }}
                editable={!deleting}
              />
              {deletePasswordError ? <Text style={styles.deleteModalError}>{deletePasswordError}</Text> : null}
              <View style={styles.deleteModalActions}>
                <TouchableOpacity
                  style={[styles.deleteModalButton, styles.cancelDeleteButton]}
                  onPress={() => {
                    if (!deleting) {
                      setDeleteModalVisible(false);
                    }
                  }}
                  disabled={deleting}
                >
                  <Text style={styles.cancelDeleteLabel}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.deleteModalButton,
                    styles.confirmDeleteButton,
                    deleting && styles.deleteButtonDisabled,
                  ]}
                  onPress={confirmDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmDeleteLabel}>Supprimer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#F6F3FF',
  },
  animatedPanel: {
    ...StyleSheet.absoluteFillObject,
  },
  screen: {
    flex: 1,
    backgroundColor: '#F6F3FF',
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F1F33',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F33',
  },
  profileEmail: {
    color: '#6B6B7B',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  cardAvatarWrapper: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  label: {
    fontWeight: '600',
    color: '#1F1F33',
  },
  input: {
    marginTop: 6,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#F5F6FB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  formSpacing: {
    marginTop: 18,
  },
  errorText: {
    color: Colors.light.pink,
    textAlign: 'center',
    marginBottom: 16,
  },
  saveButton: {
    marginBottom: 24,
    marginHorizontal: 32,
  },
  saveButtonGradient: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deleteButton: {
    marginHorizontal: 32,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F87171',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  deleteModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 360,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F33',
  },
  deleteModalSubtitle: {
    marginTop: 8,
    color: '#4B5563',
  },
  deleteModalInput: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#F5F6FB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deleteModalError: {
    color: Colors.light.pink,
    marginTop: 8,
  },
  deleteModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  deleteModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  cancelDeleteButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  confirmDeleteButton: {
    backgroundColor: '#DC2626',
  },
  cancelDeleteLabel: {
    color: '#374151',
    fontWeight: '600',
  },
  confirmDeleteLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
