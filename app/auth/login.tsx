import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/UseThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../fireBaseConfig';

export default function SignInScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = useMemo(() => email.trim() !== '' && password.trim() !== '', [email, password]);

  const handleSignIn = async () => {
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      router.push('/../../HomeScreen');
    } catch(error) {
      console.error('Erreur lors de la connexion : ', error);
    }

  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.lila, colors.lightBlue]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoider}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="arrow-back" size={22} color={colors.black} />
            </Pressable>

            <View style={styles.card}>
              <View style={styles.logoPlaceholder} />

              <ThemedText variant="title" color="black" style={styles.title}>
                Connexion
              </ThemedText>

              <View style={styles.inputs}>
                <TextInput
                  placeholder="Entrez votre adresse e-mail"
                  placeholderTextColor={colors.gray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, { backgroundColor: Colors.light.lightBlue }]}
                />
                <TextInput
                  placeholder="Entrez votre mot de passe"
                  placeholderTextColor={colors.gray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={[styles.input, { backgroundColor: Colors.light.lightBlue }]}
                />
                <Pressable style={styles.forgotPassword}>
                  <ThemedText color="purple">Mot de passe oublié ?</ThemedText>
                </Pressable>
              </View>

              <Pressable style={styles.primaryButton} onPress={handleSignIn} disabled={!canSubmit}>
                <LinearGradient
                  colors={[Colors.light.pink, Colors.light.purple, Colors.light.blue]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.primaryGradient, !canSubmit && styles.primaryDisabled]}
                >
                  <ThemedText color="white" style={styles.primaryLabel}>
                    Se connecter
                  </ThemedText>
                </LinearGradient>
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <ThemedText color="gray" style={styles.dividerLabel}>
                  Ou continuez avec
                </ThemedText>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <Pressable style={styles.socialButton}>
                  <ThemedText color="black">Google</ThemedText>
                </Pressable>
                <Pressable style={[styles.socialButton, styles.socialApple]}>
                  <ThemedText color="white">Apple</ThemedText>
                </Pressable>
                <Pressable style={[styles.socialButton, styles.socialFacebook]}>
                  <ThemedText color="white">Facebook</ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.footer}>
              <ThemedText color="black">Pas encore de compte ? </ThemedText>
              <Pressable onPress={() => router.push('/')}>
                <ThemedText color="purple" style={styles.footerLink}>
                  Créez-en un maintenant.
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardAvoider: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  card: {
    padding: 28,
    borderRadius: 28,
    backgroundColor: Colors.light.white,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  logoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 24,
    alignSelf: 'center',
    backgroundColor: Colors.light.lightBlue,
  },
  title: {
    textAlign: 'center',
  },
  inputs: {
    gap: 12,
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.light.black,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  primaryButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  primaryGradient: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.lightBlue,
  },
  dividerLabel: {
    fontSize: 13,
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: Colors.light.lightBlue,
  },
  socialApple: {
    backgroundColor: Colors.light.black,
    borderColor: Colors.light.black,
  },
  socialFacebook: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  footerLink: {
    fontWeight: '600',
  },
});
