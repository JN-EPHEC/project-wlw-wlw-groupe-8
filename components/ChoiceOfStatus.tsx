import { useThemeColors } from '@/hooks/UseThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card } from './Card';
import { ThemedText } from './ThemedText';

export function ChoiceOfStatus() {
  const colors = useThemeColors();

  return (
    <View style={{paddingHorizontal: 18}}>
      <View style={styles.header}>
        <ThemedText variant="title" color="black">Bienvenue</ThemedText>
        <ThemedText variant="subtitle" color="gray">Selectionnez votre type de compte.</ThemedText>
      </View>

      <View style={styles.cardsContainer}>
        <Link href="/auth/client/client-firstInfos" asChild>
          <Pressable>
            <Card style={{padding: 38, alignItems: 'center', gap: 5}}>
              <LinearGradient
                colors={['#11b7fc', '#674af8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Ionicons name="people" size={36} color={colors.white} />
              </LinearGradient>
              <ThemedText variant="title" color="black">Client</ThemedText>
              <ThemedText variant="subtitle" color="gray" style={{textAlign: 'center'}}>Recherchez et réservez des évènements.</ThemedText>
            </Card>
          </Pressable>
        </Link>

        <Link href="/auth/prestataire/prestataire-firstInfos" asChild>
          <Pressable>
            <Card style={{padding: 38, alignItems: 'center', gap: 5}}>
              <LinearGradient
                colors={[colors.blue, colors.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Ionicons name="briefcase" size={36} color={colors.white} />
              </LinearGradient>
              <ThemedText variant="title" color="black">Prestataire</ThemedText>
              <ThemedText variant="subtitle" color="gray" style={{textAlign: 'center'}}>Gérez vos services et réservations.</ThemedText>
            </Card>
          </Pressable>
        </Link>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 28,
    alignItems: 'center',
  },
  cardsContainer: {
    gap: 22,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
});
