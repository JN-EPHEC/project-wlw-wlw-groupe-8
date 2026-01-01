import PrestataireSubscription from '@/components/prestataireSubscription';
import { Colors } from '@/constants/Colors';
import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SubscriptionPlanId = 'free' | 'premium';

type PrestataireSubscriptionModalProps = {
  visible: boolean;
  onClose: () => void;
};

const PrestataireSubscriptionModal = ({ visible, onClose }: PrestataireSubscriptionModalProps) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileDocId, setProfileDocId] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'contacts'),
          where('userId', '==', user.uid),
          where('type', '==', 'prestataire'),
          limit(1),
        ),
      );
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setProfileDocId(docSnap.id);
        const data = docSnap.data();
        setSelectedPlan(
          data.subscriptionPlan === 'premium' || data.subscriptionPlan === 'free'
            ? data.subscriptionPlan
            : 'premium',
        );
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(1);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
      loadProfile();
    }
  }, [loadProfile, slideAnim, visible]);

  const closeModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [slideAnim, onClose]);

  const handleSave = useCallback(async () => {
    if (!profileDocId) return;
    setLoading(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'contacts', profileDocId), { subscriptionPlan: selectedPlan });
      closeModal();
    } catch (err) {
      console.error(err);
      setError("Impossible de mettre à jour l'abonnement.");
    } finally {
      setLoading(false);
    }
  }, [closeModal, profileDocId, selectedPlan]);

  return (
    <Modal visible={visible} animationType='none' presentationStyle='fullScreen' onRequestClose={closeModal}>
      <View style={styles.modalRoot}>
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
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={closeModal} style={styles.backButton}>
                  <Ionicons name='chevron-back' size={22} color='#1F1F33' />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mon abonnement</Text>
                <View style={{ width: 44 }} />
              </View>
              <PrestataireSubscription
                selectedPlan={selectedPlan}
                onSelectPlan={setSelectedPlan}
                signUp={handleSave}
                loading={loading}
                errorMessage={error}
              />
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  panel: {
    flex: 1,
    padding: 24,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
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
});

export default PrestataireSubscriptionModal;
