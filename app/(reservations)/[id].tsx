import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

const ReservationDetailScreen = () => {
  const params = useLocalSearchParams<{ id?: string }>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: `Réservation ${params.id ?? ''}` }} />
      <View style={styles.card}>
        <Text style={styles.title}>Réservation #{params.id ?? '—'}</Text>
        <Text style={styles.body}>
          Les détails complets de la réservation s&apos;afficheront ici (client, service, statut, documents, etc.).
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default ReservationDetailScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5FA',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1F33',
  },
  body: {
    fontSize: 15,
    color: '#4B4C5A',
    lineHeight: 22,
  },
});
