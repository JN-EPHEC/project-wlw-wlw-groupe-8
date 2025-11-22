import { Card } from '@/components/Card';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/UseThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

export default function ClientSignup() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.lila, colors.lightBlue]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={colors.black} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <Card style={styles.card}>
            <ThemedText variant="title" color="black" style={styles.title}>
              Créer un compte client
            </ThemedText>
            <ThemedText
              variant="subtitle"
              color="gray"
              style={styles.subtitle}
            >
              Commençons par vos informations personnelles
            </ThemedText>

            <View style={styles.inputs}>
              <TextInput
                placeholder="Entrez votre nom"
                placeholderTextColor={colors.gray}
                style={[styles.input, { backgroundColor: Colors.light.lightBlue }]}
              />
              <TextInput
                placeholder="Entrez votre prénom"
                placeholderTextColor={colors.gray}
                style={[styles.input, { backgroundColor: Colors.light.lightBlue }]}
              />
            </View>

            <Link href="/signup/client/client-credentials" asChild>
            <Pressable style={styles.button}>
              <LinearGradient
                colors={[Colors.light.pink, Colors.light.purple, Colors.light.blue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <ThemedText color="white" style={styles.buttonLabel}>
                  Continuer
                </ThemedText>
              </LinearGradient>
            </Pressable>
            </Link>
          </Card>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    padding: 28,
    gap: 18,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  inputs: {
    gap: 12,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.light.black,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  buttonLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
});
