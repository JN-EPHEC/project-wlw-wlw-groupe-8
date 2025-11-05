import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const ACCENT = '#12dfd8ff';

const HomeScreen = () => {
  const handleGoProvider = () => {
    console.log('Naviguer vers espace Prestataire');
  };

  const handleGoClient = () => {
    console.log('Naviguer vers espace Client');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>SpeedEvent</Text>

        <View style={styles.cardsWrapper}>
          <Pressable
            onPress={handleGoProvider}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={styles.cardIcon}>🤝</Text>
            <Text style={styles.cardTitle}>Prestataire</Text>
            <Text style={styles.cardSubtitle}>Je propose mes services</Text>
          </Pressable>

          <Pressable
            onPress={handleGoClient}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={styles.cardIcon}>👥</Text>
            <Text style={styles.cardTitle}>Client</Text>
            <Text style={styles.cardSubtitle}>Je veux créer un événement</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.homeIndicator} />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 36,
    paddingBottom: 28,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    flexGrow: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: ACCENT,
    letterSpacing: 2,
    marginBottom: 32,
  },
  cardsWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    width: '78%',
    minHeight: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ACCENT,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardIcon: {
    fontSize: 42,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#050505',
  },
  cardSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#4A4A4A',
  },
  homeIndicator: {
    width: 120,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D8D8D8',
  },
});
