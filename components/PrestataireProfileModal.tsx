import { Colors } from '@/constants/Colors';
import { auth, db, storage } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const MAX_DESCRIPTION = 800;
const MAX_SERVICES = 10;

export function PrestataireProfileModal({ visible, onClose }: Props) {
  const router = useRouter();
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [serviceInput, setServiceInput] = useState('');
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const [uploadingGalleryPhoto, setUploadingGalleryPhoto] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('Veuillez vous reconnecter pour modifier votre profil.');
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
        setError('Profil introuvable.');
        setDocumentId(null);
        setDescription('');
        setServices([]);
        setPhotos([]);
        setPriceMin('');
        setPriceMax('');
        return;
      }

      const docSnap = snapshot.docs[0];
      setDocumentId(docSnap.id);
      const data = docSnap.data();
      setDescription(typeof data.description === 'string' ? data.description : '');
      setServices(
        Array.isArray(data.services)
          ? data.services.filter((item): item is string => typeof item === 'string')
          : [],
      );
      setPhotos(
        Array.isArray(data.gallery)
          ? data.gallery.filter((item): item is string => typeof item === 'string')
          : [],
      );
      setProfilePhoto(typeof data.profilePhoto === 'string' ? data.profilePhoto : '');
      const pricing = data.pricing ?? {};
      setPriceMin(pricing.min ? String(pricing.min) : '');
      setPriceMax(pricing.max ? String(pricing.max) : '');
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger votre profil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchProfile();
    }
  }, [visible, fetchProfile]);

  const remainingChars = useMemo(
    () => `${description.length}/${MAX_DESCRIPTION} caractères`,
    [description.length],
  );

  const handleAddService = () => {
    if (!serviceInput.trim()) return;
    if (serviceInput.length > 50) {
      setError('Un service ne peut pas dépasser 50 caractères.');
      return;
    }
    if (services.length >= MAX_SERVICES) {
      setError('Vous avez atteint la limite de services.');
      return;
    }
    setServices((prev) => [...prev, serviceInput.trim()]);
    setServiceInput('');
    setError(null);
  };

  const handleRemoveService = (index: number) => {
    setServices((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const pickImageFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Autorisez l’accès à la galerie pour ajouter des photos.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) {
      return null;
    }
    return result.assets[0].uri;
  };

  const uploadImageAsync = async (uri: string, pathSuffix: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const imageRef = ref(storage, pathSuffix);
    await uploadBytes(imageRef, blob);
    return getDownloadURL(imageRef);
  };

  const handlePickProfilePhoto = async () => {
    const uri = await pickImageFromLibrary();
    if (!uri) return;
    setUploadingProfilePhoto(true);
    try {
      const uid = auth.currentUser?.uid ?? 'anonymous';
      const downloadURL = await uploadImageAsync(uri, `profiles/${uid}/profile_${Date.now()}.jpg`);
      setProfilePhoto(downloadURL);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter la photo de profil.");
    } finally {
      setUploadingProfilePhoto(false);
    }
  };

  const handlePickGalleryPhoto = async () => {
    const uri = await pickImageFromLibrary();
    if (!uri) return;
    setUploadingGalleryPhoto(true);
    try {
      const uid = auth.currentUser?.uid ?? 'anonymous';
      const downloadURL = await uploadImageAsync(uri, `profiles/${uid}/gallery_${Date.now()}.jpg`);
      setPhotos((prev) => [...prev, downloadURL]);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter cette photo.");
    } finally {
      setUploadingGalleryPhoto(false);
    }
  };

  const handleRemoveProfilePhoto = () => {
    setProfilePhoto('');
  };

  const handleSave = async () => {
    if (!documentId) {
      setError('Impossible de sauvegarder pour le moment.');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'contacts', documentId), {
        description,
        services,
        gallery: photos,
        profilePhoto,
        pricing: {
          min: priceMin ? Number(priceMin) : null,
          max: priceMax ? Number(priceMax) : null,
        },
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      onClose();
      router.replace('..');
    } catch (err) {
      console.error(err);
      setError('Impossible de vous déconnecter pour le moment.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <LinearGradient
          colors={[Colors.light.lila, Colors.light.lightBlue]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Profil & Services</Text>
            <Pressable onPress={onClose} style={styles.headerClose}>
              <Ionicons name="close" size={20} color="#1F1F33" />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color={Colors.light.purple} />
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Description</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Décrivez votre activité..."
                  placeholderTextColor="#C1C2C9"
                  value={description}
                  onChangeText={(text) => {
                    if (text.length <= MAX_DESCRIPTION) setDescription(text);
                  }}
                  multiline
                />
                <Text style={styles.helperText}>{remainingChars}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Photo de profil</Text>
                <View style={styles.profileRow}>
                  {profilePhoto ? (
                    <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profilePlaceholder}>
                      <Ionicons name="person-outline" size={28} color="#A0A1AF" />
                    </View>
                  )}
                  <View style={styles.profileActions}>
                    <TouchableOpacity
                      style={styles.profileAddButton}
                      onPress={handlePickProfilePhoto}
                      disabled={uploadingProfilePhoto}
                    >
                      <LinearGradient
                        colors={[Colors.light.pink, Colors.light.purple]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.profileAddGradient}
                      >
                        {uploadingProfilePhoto ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.profileAddLabel}>
                              {profilePhoto ? 'Remplacer' : 'Ajouter'}
                            </Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                    {profilePhoto ? (
                      <Pressable style={styles.profileRemoveButton} onPress={handleRemoveProfilePhoto}>
                        <Ionicons name="trash-outline" size={16} color="#D6455F" />
                        <Text style={styles.profileRemoveLabel}>Supprimer</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
                  {photos.map((uri, index) => (
                    <View key={`${uri}-${index}`} style={styles.photoWrapper}>
                      <Image source={{ uri }} style={styles.photo} />
                      <Pressable style={styles.photoRemove} onPress={() => handleRemovePhoto(index)}>
                        <Ionicons name="close" size={16} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ))}
                  <View style={styles.photoAdder}>
                    <Ionicons name="cloud-upload-outline" size={22} color="#7A7C8C" />
                    <Text style={styles.photoAdderLabel}>URL photo</Text>
                  </View>
                </ScrollView>
                <TouchableOpacity
                  style={styles.photoAddButton}
                  onPress={handlePickGalleryPhoto}
                  disabled={uploadingGalleryPhoto}
                >
                  <LinearGradient
                    colors={[Colors.light.pink, Colors.light.purple]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.photoAddGradient}
                  >
                    {uploadingGalleryPhoto ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                        <Text style={styles.photoAddLabel}>Ajouter depuis la galerie</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Services proposés</Text>
                <View style={styles.servicesList}>
                  {services.map((service, index) => (
                    <View key={`${service}-${index}`} style={styles.serviceItem}>
                      <Text style={styles.serviceLabel}>{service}</Text>
                      <Pressable onPress={() => handleRemoveService(index)} hitSlop={8}>
                        <Ionicons name="close" size={16} color="#D6455F" />
                      </Pressable>
                    </View>
                  ))}
                </View>
                <View style={styles.serviceInputRow}>
                  <TextInput
                    placeholder="Nouveau service (max 50 car.)"
                    placeholderTextColor="#A0A1AF"
                    value={serviceInput}
                    onChangeText={setServiceInput}
                    maxLength={50}
                    style={styles.serviceInput}
                  />
                  <TouchableOpacity style={styles.serviceAddButton} onPress={handleAddService}>
                    <LinearGradient
                      colors={[Colors.light.pink, Colors.light.purple]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.serviceAddGradient}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>{serviceInput.length}/50 caractères</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Tarifs</Text>
                <View style={styles.pricingRow}>
                  <View style={styles.priceField}>
                    <Text style={styles.priceLabel}>Prix minimum</Text>
                    <View style={styles.priceInputWrapper}>
                      <TextInput
                        keyboardType="numeric"
                        value={priceMin}
                        onChangeText={setPriceMin}
                        placeholder="0"
                        style={styles.priceInput}
                      />
                      <Text style={styles.priceCurrency}>€</Text>
                    </View>
                  </View>
                  <View style={styles.priceField}>
                    <Text style={styles.priceLabel}>Prix maximum</Text>
                    <View style={styles.priceInputWrapper}>
                      <TextInput
                        keyboardType="numeric"
                        value={priceMax}
                        onChangeText={setPriceMax}
                        placeholder="0"
                        style={styles.priceInput}
                      />
                      <Text style={styles.priceCurrency}>€</Text>
                    </View>
                  </View>
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                <LinearGradient
                  colors={[Colors.light.pink, Colors.light.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveGradient}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={styles.saveContent}>
                      <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.saveLabel}>Enregistrer</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                <Text style={styles.logoutLabel}>Se déconnecter</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
      </KeyboardAvoidingView>
    </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F1F33',
  },
  headerClose: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  card: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F33',
  },
  descriptionInput: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: '#F7F8FC',
    padding: 16,
    minHeight: 140,
    textAlignVertical: 'top',
    color: '#1F1F33',
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: '#8B8C99',
    textAlign: 'right',
  },
  photoWrapper: {
    width: 90,
    height: 90,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdder: {
    width: 90,
    height: 90,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E2EC',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#F7F8FC',
  },
  photoAdderLabel: {
    marginTop: 6,
    fontSize: 10,
    color: '#8B8C99',
  },
  photoAddButton: {
    marginTop: 10,
  },
  photoAddGradient: {
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoAddLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  servicesList: {
    marginTop: 12,
    gap: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: '#F7F8FC',
  },
  profilePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: '#F7F8FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileActions: {
    flex: 1,
    gap: 10,
  },
  profileAddButton: {},
  profileAddGradient: {
    borderRadius: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  profileAddLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  profileRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileRemoveLabel: {
    color: '#D6455F',
    fontWeight: '600',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#F7F8FC',
  },
  serviceLabel: {
    color: '#1F1F33',
    fontWeight: '600',
  },
  serviceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 12,
  },
  serviceInput: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E2EC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#1F1F33',
  },
  serviceAddButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
  },
  serviceAddGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  priceField: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 13,
    color: '#6D6E7F',
  },
  priceInputWrapper: {
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E2EC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F7F8FC',
  },
  priceInput: {
    flex: 1,
    color: '#1F1F33',
    fontWeight: '600',
  },
  priceCurrency: {
    fontWeight: '700',
    color: '#1F1F33',
  },
  errorText: {
    color: Colors.light.pink,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: 8,
  },
  saveGradient: {
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  saveContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saveLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E2EC',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoutLabel: {
    color: '#B62323',
    fontWeight: '600',
  },
});
