import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/UseThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyEmailScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[colors.lila, colors.lightBlue]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <Pressable style={styles.backButton} onPress={() => router.replace('/auth/login')} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </Pressable>
        <View style={styles.card}>
          <ThemedText variant="title" color="black" style={styles.title}>
            Vérifiez votre boîte mail
          </ThemedText>
          <ThemedText color="black" style={styles.subtitle}>
            Nous vous avons envoyé un e-mail de confirmation. Cliquez sur le lien reçu pour activer votre compte, puis connectez-vous.
          </ThemedText>
          <Pressable style={styles.button} onPress={() => router.replace('/auth/login')}>
            <LinearGradient colors={[Colors.light.pink, Colors.light.purple]} style={styles.buttonGradient}>
              <ThemedText color="white" style={styles.buttonLabel}>
                Retour à la connexion
              </ThemedText>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1, padding: 24, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 24, left: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', lineHeight: 22 },
  button: { borderRadius: 18, overflow: 'hidden', marginTop: 12 },
  buttonGradient: { paddingVertical: 14, alignItems: 'center' },
  buttonLabel: { fontWeight: '700' },
});
