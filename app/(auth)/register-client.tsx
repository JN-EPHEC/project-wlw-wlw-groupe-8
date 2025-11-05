// app/(auth)/registre-client.tsx
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Strength = "weak" | "medium" | "strong" | null;

type FormData = {
  emailPhone: string;
  password: string;
  confirmPassword: string;
};

type ValidationState = {
  emailPhone: { isValid: boolean; message: string };
  password: { isValid: boolean; message: string; strength: Strength };
  confirmPassword: { isValid: boolean; message: string };
};

export default function RegistreClientScreen() {
  const [formData, setFormData] = useState<FormData>({
    emailPhone: "",
    password: "",
    confirmPassword: "",
  });

  const [validation, setValidation] = useState<ValidationState>({
    emailPhone: { isValid: false, message: "" },
    password: { isValid: false, message: "", strength: null },
    confirmPassword: { isValid: false, message: "" },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isFormValid = useMemo(
    () =>
      validation.emailPhone.isValid &&
      validation.password.isValid &&
      validation.confirmPassword.isValid,
    [validation]
  );

  // Petite anim d'apparition
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(40)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // --- Validation helpers (email / phone FR-like, mdp, etc) ---
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // FR format de téléphone (+33 ou 0, 9 chiffres derrière)
  const validatePhone = (phone: string) => {
    const p = phone.replace(/\s/g, "");
    return /^(?:\+33|0)[1-9][0-9]{8}$/.test(p);
  };

  const validateEmailPhone = (value: string) => {
    if (!value.trim())
      return { isValid: false, message: "Ce champ est requis" };

    const isEmail = value.includes("@");
    const ok = isEmail ? validateEmail(value) : validatePhone(value);
    return ok
      ? { isValid: true, message: "" }
      : {
          isValid: false,
          message: isEmail
            ? "Format d'email invalide"
            : "Format de téléphone invalide (ex: 06 12 34 56 78)",
        };
  };

  const getPasswordStrength = (password: string): Exclude<Strength, null> => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 3) return "weak";
    if (score < 5) return "medium";
    return "strong";
  };

  const validatePassword = (password: string) => {
    if (!password)
      return { isValid: false, message: "Le mot de passe est requis", strength: null as Strength };

    if (password.length < 8)
      return {
        isValid: false,
        message: "Le mot de passe doit contenir au moins 8 caractères",
        strength: "weak" as const,
      };

    const s = getPasswordStrength(password);
    return {
      isValid: s !== "weak",
      message: s === "weak" ? "Mot de passe trop faible" : "",
      strength: s,
    };
  };

  const validateConfirmPassword = (confirm: string, password: string) => {
    if (!confirm)
      return { isValid: false, message: "Veuillez confirmer votre mot de passe" };
    if (confirm !== password)
      return { isValid: false, message: "Les mots de passe ne correspondent pas" };
    return { isValid: true, message: "" };
  };

  const onChangeField = (field: keyof FormData, value: string) => {
    const next = { ...formData, [field]: value };
    setFormData(next);

    const nextValid = { ...validation };
    if (field === "emailPhone") {
      nextValid.emailPhone = validateEmailPhone(value);
    }
    if (field === "password") {
      nextValid.password = validatePassword(value);
      nextValid.confirmPassword = validateConfirmPassword(next.confirmPassword, value);
    }
    if (field === "confirmPassword") {
      nextValid.confirmPassword = validateConfirmPassword(value, next.password);
    }
    setValidation(nextValid);
  };

  const strengthColor = (s: Strength) => {
    switch (s) {
      case "weak":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "strong":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };
  const strengthLabel = (s: Strength) => {
    switch (s) {
      case "weak":
        return "Faible";
      case "medium":
        return "Moyen";
      case "strong":
        return "Fort";
      default:
        return "";
    }
  };

  const onSubmit = async () => {
    if (!isFormValid) return;
    try {
      // TODO: brancher ton API d'inscription ici
      await new Promise((r) => setTimeout(r, 800));
      Alert.alert(
        "Compte créé ✅",
        "Votre compte client a été créé avec succès.",
        [
          {
            text: "Continuer",
            onPress: () => {
              // Exemple de navigation :
              // router.replace("/(tabs)/home");
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert("Erreur", "Une erreur est survenue lors de la création du compte.");
    }
  };

  return (
    <LinearGradient
      colors={["#FFD3E6", "#FFC0DA", "#FFABD0", "#FF9AC7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Blobs d'arrière-plan */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.blob, styles.blob1]} />
          <View style={[styles.blob, styles.blob2]} />
          <View style={[styles.blob, styles.blob3]} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={{
                width: "100%",
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslate }],
              }}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>SpeedEvent</Text>
                <Text style={styles.subtitle}>Créez votre compte client</Text>
              </View>

              {/* Form (verre) */}
              <View style={styles.formCard}>
                {/* Email / Téléphone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputIcon}>📧</Text>
                  <TextInput
                    placeholder="Email ou numéro de téléphone"
                    placeholderTextColor="#6b7280"
                    value={formData.emailPhone}
                    onChangeText={(v) => onChangeField("emailPhone", v)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={[
                      styles.input,
                      validation.emailPhone.isValid && styles.inputValid,
                      !!validation.emailPhone.message &&
                        !validation.emailPhone.isValid &&
                        styles.inputInvalid,
                    ]}
                    accessibilityLabel="Email ou numéro de téléphone"
                  />
                  {!!validation.emailPhone.message && !validation.emailPhone.isValid && (
                    <Text style={styles.errorText}>{validation.emailPhone.message}</Text>
                  )}
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    placeholder="Créer un mot de passe"
                    placeholderTextColor="#6b7280"
                    value={formData.password}
                    onChangeText={(v) => onChangeField("password", v)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={[
                      styles.input,
                      validation.password.isValid && styles.inputValid,
                      !!validation.password.message &&
                        !validation.password.isValid &&
                        styles.inputInvalid,
                    ]}
                    accessibilityLabel="Mot de passe"
                  />
                  <Pressable
                    onPress={() => setShowPassword((s) => !s)}
                    style={styles.toggle}
                    hitSlop={10}
                    accessibilityLabel={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    <Text style={styles.toggleIcon}>{showPassword ? "🙈" : "👁️"}</Text>
                  </Pressable>
                  {!!validation.password.message && !validation.password.isValid && (
                    <Text style={styles.errorText}>{validation.password.message}</Text>
                  )}
                  {!!formData.password && validation.password.strength && (
                    <View
                      style={[
                        styles.strengthPill,
                        { backgroundColor: strengthColor(validation.password.strength) + "20" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.strengthText,
                          { color: strengthColor(validation.password.strength) },
                        ]}
                      >
                        Force : {strengthLabel(validation.password.strength)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputIcon}>🔐</Text>
                  <TextInput
                    placeholder="Confirmer le mot de passe"
                    placeholderTextColor="#6b7280"
                    value={formData.confirmPassword}
                    onChangeText={(v) => onChangeField("confirmPassword", v)}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    style={[
                      styles.input,
                      validation.confirmPassword.isValid && styles.inputValid,
                      !!validation.confirmPassword.message &&
                        !validation.confirmPassword.isValid &&
                        styles.inputInvalid,
                    ]}
                    accessibilityLabel="Confirmer le mot de passe"
                  />
                  <Pressable
                    onPress={() => setShowConfirm((s) => !s)}
                    style={styles.toggle}
                    hitSlop={10}
                    accessibilityLabel={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}
                  >
                    <Text style={styles.toggleIcon}>{showConfirm ? "🙈" : "👁️"}</Text>
                  </Pressable>
                  {!!validation.confirmPassword.message &&
                    !validation.confirmPassword.isValid && (
                      <Text style={styles.errorText}>
                        {validation.confirmPassword.message}
                      </Text>
                    )}
                </View>

                {/* Submit */}
                <Pressable
                  onPress={onSubmit}
                  disabled={!isFormValid}
                  style={({ pressed }) => [
                    styles.submitButton,
                    !isFormValid && styles.submitDisabled,
                    pressed && isFormValid && styles.submitPressed,
                  ]}
                  accessibilityLabel="Créer mon compte"
                >
                  <LinearGradient
                    colors={["#12DFD8", "#0891b2"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitGradient}
                  >
                    <Text style={styles.submitText}>Créer mon compte</Text>
                  </LinearGradient>
                </Pressable>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Pressable onPress={() => router.push("/(auth)/login")}>
                  <Text style={styles.footerLink}>
                    Vous avez déjà un compte ? Se connecter
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
  },

  // Blobs (simples bulles translucides pour rappeler Canva)
  blob: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  blob1: { width: 120, height: 120, top: "10%", left: -30 },
  blob2: { width: 80, height: 80, top: "30%", right: -20 },
  blob3: { width: 100, height: 100, bottom: "20%", left: 20 },

  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    color: "#12DFD8",
    marginBottom: 6,
    textShadowColor: "rgba(18,223,216,0.3)",
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#374151",
    opacity: 0.9,
    fontWeight: "500",
  },

  formCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    marginBottom: 24,
  },

  inputGroup: {
    marginBottom: 18,
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    top: 16,
    fontSize: 18,
    color: "#6b7280",
  },
  input: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.82)",
    paddingVertical: 14,
    paddingLeft: 50,
    paddingRight: 50,
    fontSize: 16,
    color: "#111827",
    minHeight: 48,
  },
  inputValid: { borderColor: "#10b981" },
  inputInvalid: { borderColor: "#ef4444" },
  toggle: { position: "absolute", right: 16, top: 14 },
  toggleIcon: { fontSize: 18 },

  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },

  strengthPill: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "500",
  },

  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 16,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitDisabled: { opacity: 0.5 },
  submitPressed: { transform: [{ scale: 0.98 }] },

  footer: { alignItems: "center" },
  footerLink: {
    color: "#12DFD8",
    fontSize: 14,
    fontWeight: "500",
  },
});