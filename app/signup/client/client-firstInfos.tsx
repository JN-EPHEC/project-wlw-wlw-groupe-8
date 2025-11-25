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
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

export default function ClientSignup() {
  const colors = useThemeColors();
  const router = useRouter();
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [touched, setTouched] = useState({ lastName: false, firstName: false });

  const lastNameError =
    touched.lastName && !lastName.trim() ? 'Ce champ est obligatoire' : '';
  const firstNameError =
    touched.firstName && !firstName.trim() ? 'Ce champ est obligatoire' : '';
  const isFormValid = lastName.trim().length > 0 && firstName.trim().length > 0;

  const handleContinue = () => {
    if (!isFormValid) {
      setTouched({ lastName: true, firstName: true });
      return;
    }
    router.push('/signup/client/client-credentials');
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
                    value={lastName}
                    onChangeText={(value) => {
                      if (!touched.lastName) setTouched((prev) => ({ ...prev, lastName: true }));
                      setLastName(value);
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, lastName: true }))}
                    style={[
                      styles.input,
                      { backgroundColor: Colors.light.lightBlue },
                      lastNameError ? styles.inputError : null,
                    ]}
                  />
                  {lastNameError ? (
                    <ThemedText color="pink" style={styles.errorText}>
                      {lastNameError}
                    </ThemedText>
                  ) : null}
                  <TextInput
                    placeholder="Entrez votre prénom"
                    placeholderTextColor={colors.gray}
                    value={firstName}
                    onChangeText={(value) => {
                      if (!touched.firstName) setTouched((prev) => ({ ...prev, firstName: true }));
                      setFirstName(value);
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, firstName: true }))}
                    style={[
                      styles.input,
                      { backgroundColor: Colors.light.lightBlue },
                      firstNameError ? styles.inputError : null,
                    ]}
                  />
                  {firstNameError ? (
                    <ThemedText color="pink" style={styles.errorText}>
                      {firstNameError}
                    </ThemedText>
                  ) : null}
                </View>

                <Pressable style={styles.button} onPress={handleContinue}>
                  <LinearGradient
                    colors={[Colors.light.pink, Colors.light.purple, Colors.light.blue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.buttonGradient, !isFormValid && styles.buttonDisabled]}
                  >
                    <ThemedText color="white" style={styles.buttonLabel}>
                      Continuer
                    </ThemedText>
                  </LinearGradient>
                </Pressable>
              </Card>
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
  },
  buttonDisabled: {
    opacity: 0.6,
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
