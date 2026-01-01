import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type NotificationToggle = {
  id: string;
  title: string;
  subtitle: string;
  enabled: boolean;
};

type NotificationsModalProps = {
  visible: boolean;
  onClose: () => void;
};

const initialToggles: NotificationToggle[] = [
  {
    id: 'messages',
    title: 'Notifications des messages',
    subtitle: 'Recevoir les nouveaux messages',
    enabled: true,
  },
  {
    id: 'availability',
    title: "Notifications lorsqu'un prestataire est disponible",
    subtitle: 'Être alerté des disponibilités',
    enabled: true,
  },
  {
    id: 'confirmation',
    title: 'Rappel de confirmation',
    subtitle: 'Confirmer vos réservations',
    enabled: false,
  },
  {
    id: 'event',
    title: "Rappel d’événement",
    subtitle: 'Être rappelé avant vos événements',
    enabled: false,
  },
];

export default function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [toggles, setToggles] = useState<NotificationToggle[]>(initialToggles);

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

  const toggleSwitch = (id: string) => {
    setToggles((prev) =>
      prev.map((toggle) =>
        toggle.id === id ? { ...toggle, enabled: !toggle.enabled } : toggle,
      ),
    );
  };

  return (
    <Modal
      visible={visible}
      animationType='none'
      presentationStyle='fullScreen'
      onRequestClose={handleClose}
    >
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
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <Ionicons name='chevron-back' size={22} color='#1F1F33' />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={{ width: 44 }} />
          </View>

          {toggles.map((toggle) => (
            <View key={toggle.id} style={styles.toggleCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>{toggle.title}</Text>
                <Text style={styles.toggleSubtitle}>{toggle.subtitle}</Text>
              </View>
              <Switch
                value={toggle.enabled}
                onValueChange={() => toggleSwitch(toggle.id)}
                trackColor={{ false: '#D1D5DB', true: Colors.light.purple }}
                thumbColor={toggle.enabled ? Colors.light.white : '#FFFFFF'}
              />
            </View>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  panel: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
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
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  toggleTitle: {
    fontWeight: '700',
    color: '#1F1F33',
    fontSize: 15,
  },
  toggleSubtitle: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 13,
  },
});
