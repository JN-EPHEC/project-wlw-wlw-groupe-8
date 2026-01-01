import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type PrivacyModalProps = {
  visible: boolean;
  onClose: () => void;
};

const sections = [
  {
    title: 'Données collectées',
    content:
      "Nous collectons les informations que vous renseignez lors de la création du compte (nom, e-mail, éventuelles informations d’événement) afin de vous fournir nos services.",
  },
  {
    title: 'Utilisation des données',
    content:
      "Vos données sont utilisées pour gérer votre compte, faciliter les interactions avec les prestataires ou clients, assurer la sécurité et améliorer l’expérience sur l’application.",
  },
  {
    title: 'Partage des données',
    content:
      "Nous ne partageons pas vos données personnelles avec des tiers sans votre consentement, excepté si la loi l’exige ou pour répondre à des obligations légales.",
  },
  {
    title: 'Durée de conservation',
    content:
      "Vos informations sont conservées aussi longtemps que nécessaire pour fournir nos services, puis supprimées ou anonymisées conformément aux réglementations en vigueur.",
  },
  {
    title: 'Vos droits',
    content:
      "Vous pouvez demander l’accès, la correction ou la suppression de vos données à tout moment via le centre d’aide ou l’adresse support dédiée.",
  },
];

export default function PrivacyModal({ visible, onClose }: PrivacyModalProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

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
      }).start(() => callback?.());
    },
    [slideAnim],
  );

  useEffect(() => {
    if (visible) {
      animateIn();
    }
  }, [animateIn, visible]);

  const handleClose = useCallback(() => {
    animateOut(onClose);
  }, [animateOut, onClose]);

  return (
    <Modal visible={visible} animationType='none' presentationStyle='fullScreen' onRequestClose={handleClose}>
      <View style={styles.root}>
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
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <Ionicons name='chevron-back' size={22} color='#1F1F33' />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Politique de confidentialité</Text>
            <View style={{ width: 44 }} />
          </View>
          <View style={styles.card}>
            <ScrollView contentContainerStyle={styles.sections}>
              {sections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionContent}>{section.content}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  panel: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  card: {
    flex: 1,
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  sections: {
    paddingBottom: 40,
    gap: 16,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F33',
  },
  sectionContent: {
    color: '#4B5563',
    lineHeight: 20,
  },
});
