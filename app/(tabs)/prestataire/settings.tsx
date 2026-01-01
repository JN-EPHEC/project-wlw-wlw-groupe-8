import { PrestataireProfileModal } from '@/components/PrestataireProfileModal';
import NotificationsModal from '@/components/NotificationsModal';
import PrivacyModal from '@/components/PrivacyModal';
import SecurityModal from '@/components/SecurityModal';
import PrestataireSubscriptionModal from '@/components/PrestataireSubscriptionModal';
import SupportModal from '@/components/Support';
import { Colors } from '@/constants/Colors';
import { auth } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type SettingItem = {
  icon: string;
  label: string;
  action?: () => void;
};

export default function PrestataireSettingsScreen() {
  const router = useRouter();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      router.replace('/');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de vous déconnecter pour le moment.');
    }
  }, [router]);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <LinearGradient
        colors={[Colors.light.pink, Colors.light.purple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, { paddingTop: insets.top + 24 }]}
      >
        <Text style={styles.heroTitle}>Paramètres</Text>
        <Text style={styles.heroSubtitle}>Gérez votre profil et vos préférences.</Text>
      </LinearGradient>

      <View style={styles.card}>
        {[
          { icon: 'person-outline', label: 'Profil', action: () => setProfileModalVisible(true) },
          { icon: 'notifications-outline', label: 'Notifications', action: () => setNotificationsModalVisible(true) },
          { icon: 'shield-checkmark-outline', label: 'Confidentialité', action: () => setPrivacyModalVisible(true) },
          { icon: 'lock-closed-outline', label: 'Sécurité', action: () => setSecurityModalVisible(true) },
          { icon: 'card-outline', label: 'Abonnement', action: () => setSubscriptionModalVisible(true) },
          { icon: 'help-circle-outline', label: "Centre d'aide", action: () => setSupportModalVisible(true) },
        ].map((item: SettingItem, index, arr) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.itemRow, index === arr.length - 1 && styles.itemRowLast]}
            activeOpacity={0.8}
            onPress={item.action}
          >
            <LinearGradient colors={[Colors.light.pink, Colors.light.purple]} style={styles.itemIcon}>
              <Ionicons name={item.icon as any} size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5F5" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <PrestataireProfileModal visible={profileModalVisible} onClose={() => setProfileModalVisible(false)} />
      <NotificationsModal
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
      />
      <PrivacyModal visible={privacyModalVisible} onClose={() => setPrivacyModalVisible(false)} />
      <SecurityModal visible={securityModalVisible} onClose={() => setSecurityModalVisible(false)} />
      <PrestataireSubscriptionModal
        visible={subscriptionModalVisible}
        onClose={() => setSubscriptionModalVisible(false)}
      />
      <SupportModal visible={supportModalVisible} onClose={() => setSupportModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#E5E9FF',
    paddingBottom: 24,
  },
  heroCard: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 24,
    paddingBottom: 28,
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 8,
    color: '#F8FAFC',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4F0',
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1F33',
  },
  logoutButton: {
    marginTop: 24,
    marginHorizontal: 40,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '700',
  },
});
