import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

const MessageDetailScreen = () => {
  const params = useLocalSearchParams<{ id?: string; name?: string }>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: params.name ? `Message - ${params.name}` : 'Message' }} />

      <View style={styles.card}>
        <Text style={styles.title}>{params.name ?? 'Conversation'}</Text>
        <Text style={styles.subtitle}>Identifiant : {params.id ?? '—'}</Text>
        <Text style={styles.body}>
          Cet écran détaillera bientôt la conversation complète avec le prestataire sélectionné.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default MessageDetailScreen;

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
  subtitle: {
    fontSize: 14,
    color: '#6B6B7B',
  },
  body: {
    fontSize: 15,
    color: '#4B4C5A',
    lineHeight: 22,
  },
});
