import { Card } from '@/components/Card';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/UseThemeColors';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View
} from 'react-native';

export default function PrestataireFirstInfo(props: any) {
    const colors = useThemeColors()
    const { lastName, setLastName, firstName, setFirstName, vat, setVat, step, setStep } = props;
    const [touched, setTouched] = useState({
        lastName: false,
        firstName: false,
        vat: false,
    });

    const lastNameError =
        touched.lastName && !lastName.trim() ? 'Ce champ est obligatoire' : '';
    const firstNameError =
        touched.firstName && !firstName.trim() ? 'Ce champ est obligatoire' : '';
    const vatError = touched.vat && !vat.trim() ? 'Ce champ est obligatoire' : '';
    const isFormValid =
        lastName.trim().length > 0 && firstName.trim().length > 0 && vat.trim().length > 0;

    const handleContinue = () => {
      if (!isFormValid) {
        setTouched({ lastName: true, firstName: true, vat: true });
        return;
      }
      setStep(step + 1);
    };


    return(
      <Card style={styles.card}>
        <ThemedText variant="title" color="black" style={styles.title}>
            Créer un compte prestataire
        </ThemedText>
      <ThemedText
        variant="subtitle"
        color="gray"
        style={styles.subtitle}
      >
        Complétez vos informations personnelles.
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
        <TextInput
          placeholder="Entrez votre numéro de TVA"
          placeholderTextColor={colors.gray}
          value={vat}
          onChangeText={(value) => {
            if (!touched.vat) setTouched((prev) => ({ ...prev, vat: true }));
            setVat(value);
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, vat: true }))}
          style={[
            styles.input,
            { backgroundColor: Colors.light.lightBlue },
            vatError ? styles.inputError : null,
          ]}
        />
        {vatError ? (
          <ThemedText color="pink" style={styles.errorText}>
            {vatError}
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
            Suivant
          </ThemedText>
        </LinearGradient>
      </Pressable>
    </Card>
    )
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
  buttonDisabled: {
    opacity: 0.6,
  },
});