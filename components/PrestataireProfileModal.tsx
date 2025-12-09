import { Colors } from '@/constants/Colors';
import { auth, db, storage } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  collection,
  deleteField,
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

type EditableService = {
  name: string;
  price: string;
  duration: string;
};

const extractNumericFragment = (value: unknown) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return String(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const match = value.trim().match(/[\d.,]+/);
    if (match) {
      return match[0];
    }
  }
  return '';
};

const toDurationInputString = (value: unknown) => {
  const fragment = extractNumericFragment(value);
  return fragment ? fragment.replace(',', '.') : '';
};

const toEditableServices = (value: unknown): EditableService[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item): EditableService | null => {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (!trimmed) return null;
        return { name: trimmed, price: '', duration: '' };
      }
      if (item && typeof item === 'object') {
        const name =
          typeof (item as any).name === 'string' && (item as any).name.trim()
            ? (item as any).name.trim()
            : typeof (item as any).title === 'string' && (item as any).title.trim()
            ? (item as any).title.trim()
            : '';
        if (!name) return null;
        const duration = toDurationInputString(
          (item as any).durationHours ?? (item as any).duration ?? (item as any).hours,
        );
        const priceValue =
          typeof (item as any).priceFrom === 'number'
            ? String((item as any).priceFrom)
            : typeof (item as any).priceFrom === 'string'
            ? (item as any).priceFrom
            : typeof (item as any).price === 'number'
            ? String((item as any).price)
            : typeof (item as any).price === 'string'
            ? (item as any).price
            : typeof (item as any).priceMin === 'number'
            ? String((item as any).priceMin)
            : typeof (item as any).priceMin === 'string'
            ? (item as any).priceMin
            : '';
        return {
          name,
          duration,
          price: priceValue,
        };
      }
      return null;
    })
    .filter((service): service is EditableService => Boolean(service));
};

const toNumericPrice = (value: string) => {
  const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
};

const toDurationHours = (value: string) => {
  const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

export function PrestataireProfileModal({ visible, onClose }: Props) {
  const router = useRouter();
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [services, setServices] = useState<EditableService[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const [uploadingGalleryPhoto, setUploadingGalleryPhoto] = useState(false);
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
      const parsedServices = toEditableServices(data.services);
      setServices(parsedServices);
      setPhotos(
        Array.isArray(data.gallery)
          ? data.gallery.filter((item): item is string => typeof item === 'string')
          : [],
      );
      setProfilePhoto(typeof data.profilePhoto === 'string' ? data.profilePhoto : '');
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
    if (services.length >= MAX_SERVICES) {
      setError('Vous avez atteint la limite de services.');
      return;
    }
    setServices((prev) => [...prev, { name: '', price: '', duration: '' }]);
    setError(null);
  };

  const handleRemoveService = (index: number) => {
    setServices((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleServiceFieldChange = (index: number, key: keyof EditableService, value: string) => {
    setServices((prev) =>
      prev.map((service, idx) => (idx === index ? { ...service, [key]: value } : service)),
    );
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
      const normalizedServices = services
        .map((service) => ({
          name: service.name.trim(),
          durationHours: toDurationHours(service.duration),
          priceFrom: toNumericPrice(service.price),
        }))
        .filter((service) => Boolean(service.name));
      const hasInvalidService =
        normalizedServices.length === 0 ||
        normalizedServices.some(
          (service) => service.priceFrom === null || service.durationHours === null,
        );
      if (hasInvalidService) {
        setError('Chaque service doit avoir un nom, un prix minimum et une durée en heures.');
        setSaving(false);
        return;
      }
      await updateDoc(doc(db, 'contacts', documentId), {
        description,
        services: normalizedServices.map((service) => ({
          name: service.name,
          durationHours: service.durationHours,
          priceFrom: service.priceFrom,
        })),
        gallery: photos,
        profilePhoto,
        pricing: deleteField(),
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
                <Text style={styles.serviceHelperText}>
                  Indiquez un prix minimum et une durée pour chaque service.
                </Text>
                <View style={styles.serviceEditors}>
                  {services.length === 0 ? (
                    <Text style={styles.emptyServiceText}>Ajoutez votre premier service.</Text>
                  ) : null}
                  {services.map((service, index) => (
                    <View key={`service-${index}`} style={styles.serviceEditor}>
                      <View style={styles.serviceEditorHeader}>
                        <Text style={styles.serviceEditorTitle}>Service {index + 1}</Text>
                        <Pressable onPress={() => handleRemoveService(index)} hitSlop={8}>
                          <Ionicons name="close" size={16} color="#D6455F" />
                        </Pressable>
                      </View>
                      <TextInput
                        placeholder="Nom du service"
                        placeholderTextColor="#A0A1AF"
                        value={service.name}
                        onChangeText={(value) => handleServiceFieldChange(index, 'name', value)}
                        style={styles.serviceNameInput}
                      />
                      <View style={styles.serviceFieldsRow}>
                        <View style={styles.serviceField}>
                          <Text style={styles.serviceFieldLabel}>Prix minimum</Text>
                          <View style={styles.servicePriceInputWrapper}>
                            <TextInput
                              keyboardType="numeric"
                              value={service.price}
                              onChangeText={(value) => handleServiceFieldChange(index, 'price', value)}
                              placeholder="0"
                              style={styles.servicePriceInput}
                            />
                            <Text style={styles.serviceCurrency}>€</Text>
                          </View>
                        </View>
                        <View style={styles.serviceField}>
                          <Text style={styles.serviceFieldLabel}>Durée (heures)</Text>
                          <TextInput
                            placeholder="ex: 2"
                            placeholderTextColor="#A0A1AF"
                            value={service.duration}
                            onChangeText={(value) => handleServiceFieldChange(index, 'duration', value)}
                            style={styles.serviceDurationInput}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.addServiceButton} onPress={handleAddService}>
                  <LinearGradient
                    colors={[Colors.light.pink, Colors.light.purple]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addServiceGradient}
                  >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.addServiceLabel}>Ajouter un service</Text>
                  </LinearGradient>
                </TouchableOpacity>
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
  serviceHelperText: {
    marginTop: 6,
    fontSize: 12,
    color: '#8B8C99',
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
  serviceEditors: {
    marginTop: 16,
    gap: 16,
  },
  emptyServiceText: {
    color: '#8B8C99',
    fontStyle: 'italic',
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
  serviceEditor: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E0E2EC',
    padding: 16,
    backgroundColor: '#F9F9FE',
    gap: 12,
  },
  serviceEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceEditorTitle: {
    fontWeight: '700',
    color: '#1F1F33',
  },
  serviceNameInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E2EC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#1F1F33',
  },
  serviceFieldsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceField: {
    flex: 1,
    gap: 6,
  },
  serviceFieldLabel: {
    fontSize: 13,
    color: '#6D6E7F',
    fontWeight: '600',
  },
  servicePriceInputWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E2EC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  servicePriceInput: {
    flex: 1,
    color: '#1F1F33',
    fontWeight: '600',
  },
  serviceCurrency: {
    fontWeight: '700',
    color: '#6D6E7F',
  },
  serviceDurationInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E2EC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1F1F33',
  },
  addServiceButton: {
    marginTop: 16,
  },
  addServiceGradient: {
    borderRadius: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addServiceLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
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
