import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const LoginScreen = () => {
  return (
    <LinearGradient
      colors={['#FFE6F0', '#FBB1D5', '#F48BB6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.card}>
          <Text style={styles.title}>Connexion SpeedEvent</Text>
          <Text style={styles.subtitle}>
            L&apos;écran de connexion complet arrive bientôt. En attendant, retournez à l&apos;accueil pour explorer nos
            prestataires.
          </Text>

          <Pressable style={styles.backButton} onPress={() => router.push('/')}>
            <Text style={styles.backButtonText}>Retour à l&apos;accueil</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 28,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F1F33',
  },
  subtitle: {
    fontSize: 15,
    color: '#4C4D63',
    lineHeight: 22,
  },
  backButton: {
    marginTop: 12,
    backgroundColor: '#4B6BFF',
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
