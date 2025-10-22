import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type AuthMode = 'login' | 'signup';

type LoginForm = {
  email: string;
  password: string;
};

type SignUpForm = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const createInitialLoginForm = (): LoginForm => ({
  email: '',
  password: '',
});

const createInitialSignUpForm = (): SignUpForm => ({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const isEmailValid = (email: string) => /\S+@\S+\.\S+/.test(email.trim());

export default function HomeScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginForm, setLoginForm] = useState<LoginForm>(createInitialLoginForm);
  const [signUpForm, setSignUpForm] = useState<SignUpForm>(createInitialSignUpForm);

  const isLoginValid = useMemo(
    () => isEmailValid(loginForm.email) && loginForm.password.trim().length >= 6,
    [loginForm.email, loginForm.password]
  );

  const isSignUpValid = useMemo(() => {
    const { fullName, email, password, confirmPassword } = signUpForm;
    return (
      fullName.trim().length > 1 &&
      isEmailValid(email) &&
      password.trim().length >= 6 &&
      password === confirmPassword
    );
  }, [signUpForm]);

  const handleLoginChange =
    (field: keyof LoginForm) =>
    (value: string) =>
      setLoginForm((prev) => ({ ...prev, [field]: value }));

  const handleSignUpChange =
    (field: keyof SignUpForm) =>
    (value: string) =>
      setSignUpForm((prev) => ({ ...prev, [field]: value }));

  const handleSwitchMode = (targetMode: AuthMode) => {
    if (targetMode === mode) return;

    setMode(targetMode);

    if (targetMode === 'login') {
      setSignUpForm(createInitialSignUpForm());
    } else {
      setLoginForm(createInitialLoginForm());
    }
  };

  const handleLogin = () => {
    if (!isLoginValid) {
      Alert.alert('Connexion', 'Veuillez saisir un email valide et un mot de passe de 6 caractères.');
      return;
    }

    Alert.alert('Connexion', 'Connexion réussie (simulation).');
  };

  const handleSignUp = () => {
    if (!isSignUpValid) {
      Alert.alert(
        'Inscription',
        "Vérifiez vos informations : email valide, mot de passe d'au moins 6 caractères et confirmation identique."
      );
      return;
    }

    Alert.alert('Inscription', 'Compte créé (simulation).');
    setMode('login');
    setSignUpForm(createInitialSignUpForm());
  };

  const renderLoginForm = () => (
    <ThemedView style={styles.formSection}>
      <ThemedText type="subtitle">Se connecter</ThemedText>
      <AuthInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={loginForm.email}
        onChangeText={handleLoginChange('email')}
        returnKeyType="next"
      />
      <AuthInput
        placeholder="Mot de passe"
        secureTextEntry
        value={loginForm.password}
        onChangeText={handleLoginChange('password')}
        returnKeyType="done"
      />
      <PrimaryButton label="Connexion" onPress={handleLogin} disabled={!isLoginValid} />
      <TouchableOpacity>
        <ThemedText style={styles.linkText}>Mot de passe oublié ?</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  const renderSignUpForm = () => (
    <ThemedView style={styles.formSection}>
      <ThemedText type="subtitle">Créer un compte</ThemedText>
      <AuthInput
        placeholder="Nom complet"
        value={signUpForm.fullName}
        onChangeText={handleSignUpChange('fullName')}
        returnKeyType="next"
      />
      <AuthInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={signUpForm.email}
        onChangeText={handleSignUpChange('email')}
        returnKeyType="next"
      />
      <AuthInput
        placeholder="Mot de passe (min. 6 caractères)"
        secureTextEntry
        value={signUpForm.password}
        onChangeText={handleSignUpChange('password')}
        returnKeyType="next"
      />
      <AuthInput
        placeholder="Confirmer le mot de passe"
        secureTextEntry
        value={signUpForm.confirmPassword}
        onChangeText={handleSignUpChange('confirmPassword')}
        returnKeyType="done"
      />
      <PrimaryButton label="Créer mon compte" onPress={handleSignUp} disabled={!isSignUpValid} />
    </ThemedView>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#F5E6D3', dark: '#140D0B' }}
      headerImage={
        <Image source={require('@/assets/images/partial-react-logo.png')} style={styles.headerIllustration} />
      }>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedView style={styles.heroSection}>
            <ThemedText type="title">Bienvenue sur SpeedEvents</ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Gère tes événements, invite tes participants et suis tes statistiques en temps réel.
            </ThemedText>
          </ThemedView>

          <View style={styles.modeSwitcher}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}
              onPress={() => handleSwitchMode('login')}>
              <ThemedText type="defaultSemiBold" style={mode === 'login' ? styles.modeTextActive : styles.modeText}>
                Connexion
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'signup' && styles.modeButtonActive]}
              onPress={() => handleSwitchMode('signup')}>
              <ThemedText
                type="defaultSemiBold"
                style={mode === 'signup' ? styles.modeTextActive : styles.modeText}>
                Inscription
              </ThemedText>
            </TouchableOpacity>
          </View>

          {mode === 'login' ? renderLoginForm() : renderSignUpForm()}

          <ThemedView style={styles.exploreSection}>
            <ThemedText type="defaultSemiBold">Découvre SpeedEvents</ThemedText>
            <ThemedText style={styles.exploreText}>
              Après ta connexion, tu pourras créer des événements, gérer les inscriptions et suivre les performances
              de tes soirées en un coup d’œil.
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ParallaxScrollView>
  );
}

type AuthInputProps = React.ComponentProps<typeof TextInput>;

const AuthInput = ({ style, ...props }: AuthInputProps) => (
  <TextInput
    style={[styles.input, style]}
    placeholderTextColor="#7F8A96"
    autoCapitalize="none"
    {...props}
  />
);

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

const PrimaryButton = ({ label, onPress, disabled }: PrimaryButtonProps) => (
  <TouchableOpacity
    style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}
    onPress={onPress}
    disabled={disabled}>
    <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
      {label}
    </ThemedText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 24,
  },
  heroSection: {
    gap: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  heroSubtitle: {
    lineHeight: 20,
  },
  modeSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#00B8A9',
  },
  modeText: {
    color: '#1F1F1F',
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  formSection: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D3D9E0',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    backgroundColor: '#F9FAFB',
    fontSize: 16,
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: '#00B8A9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#00B8A9',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  exploreSection: {
    gap: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  exploreText: {
    lineHeight: 20,
  },
  headerIllustration: {
    height: 200,
    width: 260,
    position: 'absolute',
    bottom: -16,
    left: -20,
  },
  linkText: {
    color: '#00B8A9',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
