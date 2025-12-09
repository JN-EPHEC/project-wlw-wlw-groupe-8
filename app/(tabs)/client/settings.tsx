import ClientProfile from '@/components/ClientProfile';
import { Colors } from '@/constants/Colors';
import { auth } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type SettingItem = {
  icon: string;
  label: string;
  action?: () => void;
};

export default function ClientSettingsScreen() {
  const router = useRouter();
  const [profileModalVisible, setProfileModalVisible] = useState(false);

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
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={[Colors.light.lila, Colors.light.lightBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </View>

      <View style={styles.card}>
        {[
          { icon: 'person-outline', label: 'Profil', action: () => setProfileModalVisible(true) },
          { icon: 'notifications-outline', label: 'Notifications' },
          { icon: 'shield-checkmark-outline', label: 'Confidentialité' },
          { icon: 'globe-outline', label: 'Accessibilité' },
          { icon: 'lock-closed-outline', label: 'Sécurité' },
          { icon: 'people-outline', label: "Co-gestion d'événement" },
          { icon: 'help-circle-outline', label: "Centre d'aide" },
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

      <ClientProfile visible={profileModalVisible} onClose={() => setProfileModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F1F33',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 24,
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
