import { Card } from '@/components/Card';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/UseThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

const getEmailError = (value: string) => {
  if (!value.trim()) return 'Ce champ est obligatoire';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) return 'Adresse email invalide';
  return '';
};

const getPasswordError = (value: string) => {
  if (!value) return 'Ce champ est obligatoire';
  if (value.length < 6) return '6 caractères minimum';
  return '';
};

const getConfirmError = (value: string, password: string) => {
  if (!value) return 'Ce champ est obligatoire';
  if (value !== password) return 'Les mots de passe ne correspondent pas';
  return '';
};

export default function ClientCredentials() {
  const colors = useThemeColors();
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirm: false,
  });

  const emailValidation = getEmailError(email);
  const passwordValidation = getPasswordError(password);
  const confirmValidation = getConfirmError(confirmPassword, password);

  const emailError = touched.email ? emailValidation : '';
  const passwordError = touched.password ? passwordValidation : '';
  const confirmError = touched.confirm ? confirmValidation : '';
  const isFormValid =
    accepted &&
    !emailValidation &&
    !passwordValidation &&
    !confirmValidation;

  const markTouched = (field: keyof typeof touched) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

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
              Maintenant, créez vos identifiants de connexion
            </ThemedText>

            <View style={styles.inputs}>
              <TextInput
                placeholder="exemple@email.com"
                placeholderTextColor={colors.gray}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(value) => {
                  if (!touched.email) markTouched('email');
                  setEmail(value);
                }}
                onBlur={() => markTouched('email')}
                style={[
                  styles.input,
                  { backgroundColor: Colors.light.lightBlue },
                  emailError ? styles.inputError : null,
                ]}
              />
              {emailError ? (
                <ThemedText color="pink" style={styles.errorText}>
                  {emailError}
                </ThemedText>
              ) : null}
              <TextInput
                placeholder="Créez un mot de passe"
                placeholderTextColor={colors.gray}
                secureTextEntry
                value={password}
                onChangeText={(value) => {
                  if (!touched.password) markTouched('password');
                  setPassword(value);
                }}
                onBlur={() => markTouched('password')}
                style={[
                  styles.input,
                  { backgroundColor: Colors.light.lightBlue },
                  passwordError ? styles.inputError : null,
                ]}
              />
              {passwordError ? (
                <ThemedText color="pink" style={styles.errorText}>
                  {passwordError}
                </ThemedText>
              ) : null}
              <TextInput
                placeholder="Confirmez votre mot de passe"
                placeholderTextColor={colors.gray}
                secureTextEntry
                value={confirmPassword}
                onChangeText={(value) => {
                  if (!touched.confirm) markTouched('confirm');
                  setConfirmPassword(value);
                }}
                onBlur={() => markTouched('confirm')}
                style={[
                  styles.input,
                  { backgroundColor: Colors.light.lightBlue },
                  confirmError ? styles.inputError : null,
                ]}
              />
              {confirmError ? (
                <ThemedText color="pink" style={styles.errorText}>
                  {confirmError}
                </ThemedText>
              ) : null}
            </View>

            <Pressable
              style={styles.checkboxRow}
              onPress={() => setAccepted((prev) => !prev)}
              hitSlop={6}
            >
              <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                {accepted ? <Ionicons name="checkmark" size={14} color={Colors.light.white} /> : null}
              </View>
              <ThemedText variant="body" color="gray" style={styles.legalText}>
                J'accepte les <ThemedText variant="body" style={styles.link}>conditions d'utilisation</ThemedText> et la{' '}
                <ThemedText variant="body" style={styles.link}>politique de confidentialité</ThemedText>
              </ThemedText>
            </Pressable>

            <Pressable style={styles.button} disabled={!isFormValid}>
              <LinearGradient
                colors={[Colors.light.pink, Colors.light.purple, Colors.light.blue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.buttonGradient, !isFormValid && styles.buttonDisabled]}
              >
                <ThemedText color="white" style={styles.buttonLabel}>
                  Créer mon compte
                </ThemedText>
              </LinearGradient>
            </Pressable>
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: Colors.light.pink,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.light.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.light.purple,
    borderColor: Colors.light.purple,
  },
  legalText: {
    flex: 1,
    lineHeight: 18,
  },
  link: {
    color: Colors.light.purple,
    textDecorationLine: 'underline',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
});
