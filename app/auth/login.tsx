import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/UseThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useMemo, useState } from 'react';

import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../fireBaseConfig';

export default function SignInScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const contactsCollection = collection(db, 'contacts');


  const canSubmit = useMemo(() => email.trim() !== '' && password.trim() !== '', [email, password]);

  const handleSignIn = async () => {
    try {
      setSubmitting(true);
      setAuthError(null);
      const user = await signInWithEmailAndPassword(auth, email, password);
      const q = query(contactsCollection, where("userId", "==", user.user.uid));
      const data = await getDocs(q);
      const userType = data.docs[0]?.data().type;
      if (!user.user.emailVerified) {
        setAuthError('Veuillez vérifier votre adresse e-mail avant de vous connecter.');
        await auth.signOut();
        return;
      }
      if(userType === 'prestataire') {
        router.replace('/(tabs)/prestataire');
        return;
      } else if(userType === 'client') {
        router.replace('/(tabs)/client');
        return;
      }
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'auth/invalid-credential') {
        setAuthError("Email ou mot de passe incorrect. Veuillez réessayer.");
      } else {
        console.error('Erreur lors de la connexion : ', err);
        setAuthError("Une erreur est survenue. Merci de réessayer plus tard.");
      }
    } finally {
      setSubmitting(false);
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
              <Image
                source={require('@/assets/images/9db6d727a0d8bccb023dba357b419979d8ccb303.png')}
                style={styles.logo}
                resizeMode="contain"
              />

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
                <Pressable
                  style={styles.forgotPassword}
                  onPress={() => {
                    setResetEmail(email);
                    setResetFeedback(null);
                    setResetModalVisible(true);
                  }}
                >
                  <ThemedText color="purple">Mot de passe oublié ?</ThemedText>
                </Pressable>
              </View>

              <Pressable style={styles.primaryButton} onPress={handleSignIn} disabled={!canSubmit || submitting}>
                <LinearGradient
                  colors={[Colors.light.pink, Colors.light.purple, Colors.light.blue]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.primaryGradient, (!canSubmit || submitting) && styles.primaryDisabled]}
                >
                  <ThemedText color="white" style={styles.primaryLabel}>
                    {submitting ? 'Connexion...' : 'Se connecter'}
                  </ThemedText>
                </LinearGradient>
              </Pressable>
              {authError ? (
                <ThemedText color="pink" style={styles.errorText}>
                  {authError}
                </ThemedText>
              ) : null}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <ThemedText color="gray" style={styles.dividerLabel}>
                  Ou continuez avec
                </ThemedText>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <Pressable style={styles.socialButton}>
                  <Ionicons name="logo-google" size={18} color={Colors.light.black} style={styles.socialIconLeft} />
                  <ThemedText color="black" style={styles.socialLabel}>
                    Google
                  </ThemedText>
                </Pressable>
                <Pressable style={[styles.socialButton, styles.socialApple]}>
                  <Ionicons name="logo-apple" size={18} color={Colors.light.white} style={styles.socialIconLeft} />
                  <ThemedText color="white" style={styles.socialLabel}>
                    Apple
                  </ThemedText>
                </Pressable>
                <Pressable style={[styles.socialButton, styles.socialFacebook]}>
                  <Ionicons name="logo-facebook" size={18} color={Colors.light.white} style={styles.socialIconLeft} />
                  <ThemedText color="white" style={styles.socialLabel}>
                    Facebook
                  </ThemedText>
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

      <Modal animationType="slide" visible={resetModalVisible} onRequestClose={() => setResetModalVisible(false)}>
        <View style={styles.resetFullScreen}>
          <View style={styles.resetCard}>
            <Pressable onPress={() => setResetModalVisible(false)} hitSlop={12} style={styles.resetClose}>
              <Ionicons name="close" size={22} color={Colors.light.black} />
            </Pressable>
            <View style={styles.resetHeader}>
              <ThemedText variant="title" color="black">
                Réinitialiser le mot de passe
              </ThemedText>
            </View>
            <ThemedText color="black">
              Entrez l’adresse e-mail associée à votre compte pour recevoir un lien de réinitialisation.
            </ThemedText>
            <TextInput
              placeholder="monadresse@email.com"
              placeholderTextColor={colors.gray}
              autoCapitalize="none"
              keyboardType="email-address"
              value={resetEmail}
              onChangeText={(value) => {
                setResetEmail(value);
                setResetFeedback(null);
              }}
              style={[styles.input, { backgroundColor: Colors.light.lightBlue, marginTop: 16 }]}
            />
            {resetFeedback ? (
              <ThemedText color={resetFeedback.includes('envoyé') ? 'green' : 'pink'} style={styles.resetFeedback}>
                {resetFeedback}
              </ThemedText>
            ) : null}
            <Pressable
              style={[styles.primaryButton, styles.resetButton]}
              onPress={async () => {
                if (!resetEmail.trim()) {
                  setResetFeedback('Veuillez indiquer une adresse e-mail.');
                  return;
                }
                try {
                  setSendingReset(true);
                  setResetFeedback(null);
                  await sendPasswordResetEmail(auth, resetEmail.trim());
                  setResetFeedback('Un e-mail de réinitialisation vient de vous être envoyé.');
                } catch {
                  setResetFeedback("Impossible d'envoyer l'e-mail. Vérifiez votre adresse.");
                } finally {
                  setSendingReset(false);
                }
              }}
              disabled={sendingReset}
            >
              <LinearGradient
                colors={[Colors.light.pink, Colors.light.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.primaryGradient, sendingReset && styles.primaryDisabled]}
              >
                <ThemedText color="white" style={styles.primaryLabel}>
                  {sendingReset ? 'Envoi...' : 'Envoyer le lien'}
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  logo: {
    width: 110,
    height: 110,
    alignSelf: 'center',
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
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: Colors.light.lightBlue,
  },
  socialIconLeft: {
    marginRight: 12,
  },
  socialLabel: {
    flex: 1,
    textAlign: 'center',
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
  errorText: {
    textAlign: 'center',
  },
  resetFullScreen: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  resetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    gap: 16,
  },
  resetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetClose: {
    alignSelf: 'flex-end',
  },
  resetFeedback: {
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 8,
  },
});
