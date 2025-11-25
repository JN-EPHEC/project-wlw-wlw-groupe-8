// app/(auth)/register-provider.tsx
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

type CategoryKey =
  | "traiteur"
  | "dj"
  | "photographe"
  | "lieu"
  | "decoration"
  | "animation";

type FormData = {
  emailPhone: string;
  companyNumber: string; // BCE / TVA (BE + 10 chiffres ou 10 chiffres)
  companyName: string; // raison sociale
  businessName: string; // nom commercial (optionnel)
  category: CategoryKey | "";
  password: string;
  confirmPassword: string;
};

type ValidationState = {
  emailPhone: { isValid: boolean; message: string };
  companyNumber: { isValid: boolean; message: string; verifying: boolean };
  companyName: { isValid: boolean; message: string };
  businessName: { isValid: boolean; message: string }; // toujours valide (optionnel)
  category: { isValid: boolean; message: string };
  password: {
    isValid: boolean;
    message: string;
    strength: "weak" | "medium" | "strong" | null;
  };
  confirmPassword: { isValid: boolean; message: string };
};

const categories: { key: CategoryKey; label: string; emoji: string }[] = [
  { key: "traiteur", label: "Traiteur", emoji: "🍽️" },
  { key: "dj", label: "DJ / Musique", emoji: "🎧" },
  { key: "photographe", label: "Photographe", emoji: "📸" },
  { key: "lieu", label: "Lieu", emoji: "🏰" },
  { key: "decoration", label: "Décoration", emoji: "🎨" },
  { key: "animation", label: "Animation", emoji: "🎪" },
];

export default function RegisterProviderScreen() {
  const [formData, setFormData] = useState<FormData>({
    emailPhone: "",
    companyNumber: "",
    companyName: "",
    businessName: "",
    category: "",
    password: "",
    confirmPassword: "",
  });

  const [validation, setValidation] = useState<ValidationState>({
    emailPhone: { isValid: false, message: "" },
    companyNumber: { isValid: false, message: "", verifying: false },
    companyName: { isValid: false, message: "" },
    businessName: { isValid: true, message: "" },
    category: { isValid: false, message: "" },
    password: { isValid: false, message: "", strength: null },
    confirmPassword: { isValid: false, message: "" },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // jolis effets d’entrée
  const contentAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentAnim, translateYAnim]);

  const isFormValid = useMemo(() => {
    const v = validation;
    return (
      v.emailPhone.isValid &&
      v.companyNumber.isValid &&
      v.companyName.isValid &&
      v.businessName.isValid &&
      v.category.isValid &&
      v.password.isValid &&
      v.confirmPassword.isValid &&
      !v.companyNumber.verifying
    );
  }, [validation]);

  // ---------- Helpers validation (Belgique) ----------

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Téléphone BE : accepte 0… ou +32…, on reste permissif mais exige 9–10 chiffres utiles.
  const validateBEPhone = (input: string) => {
    const raw = input.replace(/\D/g, "");
    // +32 -> 32..., 0 -> 0...
    // on accepte 9 à 11 chiffres selon le préfixe
    if (raw.startsWith("32")) {
      return raw.length >= 11 && raw.length <= 12; // ex +32 4xx xx xx xx (32 + 9/10)
    }
    if (raw.startsWith("0")) {
      return raw.length >= 9 && raw.length <= 10; // 0x… (lignes/mobiles)
    }
    // si l’utilisateur tape sans préfixe clair, on demande un format BE
    return false;
  };

  const validateEmailOrPhoneBE = (value: string) => {
    if (!value.trim()) {
      return { isValid: false, message: "Email ou téléphone requis" };
    }
    const isEmail = value.includes("@");
    const ok = isEmail ? validateEmail(value) : validateBEPhone(value);
    return ok
      ? { isValid: true, message: "" }
      : {
          isValid: false,
          message: isEmail
            ? "Format d'email invalide"
            : "Téléphone BE invalide (ex : 0470 12 34 56 ou +32 470 12 34 56)",
        };
  };

  // Numéro d’entreprise belge (BCE/TVA) :
  // accepte "BE" optionnel + 10 chiffres. (ex: BE0123456789 ou 0123456789)
  // Ici on valide surtout la longueur/chiffres ; (le contrôle mod 97 peut être ajouté côté backend).
  const normalizeCompanyNumber = (v: string) => v.replace(/[\s\.]/g, "").toUpperCase();
  const validateCompanyNumberBE = (value: string) => {
    const v = normalizeCompanyNumber(value);
    const stripBE = v.startsWith("BE") ? v.slice(2) : v;
    const numeric = stripBE.replace(/\D/g, "");
    if (numeric.length !== 10) {
      return {
        isValid: false,
        message: "Le numéro d'entreprise doit contenir 10 chiffres (ex : BE0xxx.xxx.xxx)",
      };
    }
    if (!/^\d{10}$/.test(numeric)) {
      return { isValid: false, message: "Uniquement des chiffres (et préfixe BE optionnel)" };
    }
    return { isValid: true, message: "" };
  };

  const getPasswordStrength = (password: string): "weak" | "medium" | "strong" => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return "weak";
    if (score <= 4) return "medium";
    return "strong";
  };

  // ---------- Handlers ----------
  const handleChange = (field: keyof FormData, value: string) => {
    const next = { ...formData, [field]: value };
    setFormData(next);

    const v = { ...validation };

    switch (field) {
      case "emailPhone":
        v.emailPhone = validateEmailOrPhoneBE(value);
        break;

      case "companyNumber": {
        v.companyNumber.verifying = true;
        const res = validateCompanyNumberBE(value);
        // petite simulation “vérification”
        setTimeout(() => {
          setValidation((old) => ({
            ...old,
            companyNumber: { ...res, verifying: false },
          }));
        }, 600);
        return; // on sort car setValidation async ci-dessus
      }

      case "companyName":
        if (!value.trim()) {
          v.companyName = { isValid: false, message: "Raison sociale requise" };
        } else if (value.trim().length < 2) {
          v.companyName = { isValid: false, message: "Raison sociale trop courte" };
        } else {
          v.companyName = { isValid: true, message: "" };
        }
        break;

      case "businessName":
        v.businessName = { isValid: true, message: "" }; // optionnel
        break;

      case "password": {
        if (!value) {
          v.password = { isValid: false, message: "Mot de passe requis", strength: null };
        } else if (value.length < 8) {
          v.password = {
            isValid: false,
            message: "Au moins 8 caractères",
            strength: "weak",
          };
        } else {
          const s = getPasswordStrength(value);
          v.password = {
            isValid: s !== "weak",
            message: s === "weak" ? "Mot de passe trop faible" : "",
            strength: s,
          };
        }
        // revalider la conf
        v.confirmPassword =
          next.confirmPassword && next.confirmPassword !== value
            ? { isValid: false, message: "Les mots de passe ne correspondent pas" }
            : next.confirmPassword
            ? { isValid: true, message: "" }
            : { isValid: false, message: "Veuillez confirmer le mot de passe" };
        break;
      }

      case "confirmPassword":
        v.confirmPassword =
          value && value === next.password
            ? { isValid: true, message: "" }
            : value
            ? { isValid: false, message: "Les mots de passe ne correspondent pas" }
            : { isValid: false, message: "Veuillez confirmer le mot de passe" };
        break;
    }

    setValidation(v);
  };

  const handleSelectCategory = (key: CategoryKey) => {
    setFormData((f) => ({ ...f, category: key }));
    setValidation((v) => ({ ...v, category: { isValid: true, message: "" } }));
  };

  const handleSubmit = async () => {
    // ultime garde-fou
    if (!isFormValid) return;

    try {
      // TODO: call API signup prestataire
      await new Promise((r) => setTimeout(r, 800));
      Alert.alert(
        "Compte prestataire créé 🎉",
        `Entreprise : ${formData.companyName}\nN° entreprise : ${normalizeCompanyNumber(
          formData.companyNumber
        )}\nCatégorie : ${formData.category}`,
        [
          {
            text: "Continuer",
            onPress: () => {
              // router.replace("/(provider)/dashboard");
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert("Erreur", "Impossible de créer votre compte pour le moment.");
    }
  };

  // ---------- UI ----------
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#FFD3E6", "#FFC0DA", "#FFABD0", "#FF9AC7", "#FF8BC1"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.gradient}
      >
        {/* blobs décoratifs */}
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
        <View style={[styles.blob, styles.blob3]} />
        <View style={[styles.blob, styles.blob4]} />

        <SafeAreaView style={styles.safe}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <AnimatedContainer contentAnim={contentAnim} translateYAnim={translateYAnim}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>SpeedEvent</Text>
                <Text style={styles.subtitle}>Rejoignez notre réseau de prestataires</Text>
              </View>

              {/* Form */}
              <View style={styles.formCard}>
                {/* Email / Téléphone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputIcon}>📧</Text>
                  <TextInput
                    value={formData.emailPhone}
                    onChangeText={(t) => handleChange("emailPhone", t)}
                    placeholder="Email professionnel ou téléphone (BE)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[
                      styles.input,
                      validation.emailPhone.isValid && styles.inputValid,
                      !!validation.emailPhone.message &&
                        !validation.emailPhone.isValid &&
                        styles.inputInvalid,
                    ]}
                  />
                  {!!validation.emailPhone.message && !validation.emailPhone.isValid && (
                    <Text style={styles.errorText}>{validation.emailPhone.message}</Text>
                  )}
                </View>

                {/* Numéro d'entreprise (BCE/TVA BE) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputIcon}>🏢</Text>
                  <TextInput
                    value={formData.companyNumber}
                    onChangeText={(t) => handleChange("companyNumber", t)}
                    placeholder="Numéro d’entreprise (BCE / TVA BE0123456789)"
                    keyboardType="number-pad"
                    autoCapitalize="characters"
                    style={[
                      styles.input,
                      validation.companyNumber.isValid && styles.inputValid,
                      !!validation.companyNumber.message &&
                        !validation.companyNumber.isValid &&
                        styles.inputInvalid,
                    ]}
                  />
                  {validation.companyNumber.verifying ? (
                    <Text style={styles.infoText}>Vérification…</Text>
                  ) : !!validation.companyNumber.message &&
                    !validation.companyNumber.isValid ? (
                    <Text style={styles.errorText}>{validation.companyNumber.message}</Text>
                  ) : null}
                </View>

                {/* Raison sociale */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputIcon}>🏛️</Text>
                  <TextInput
                    value={formData.companyName}
                    onChangeText={(t) => handleChange("companyName", t)}
                    placeholder="Raison sociale de l’entreprise"
                    style={[
                      styles.input,
                      validation.companyName.isValid && styles.inputValid,
                      !!validation.companyName.message &&
                        !validation.companyName.isValid &&
                        styles.inputInvalid,
                    ]}
                  />
                  {!!validation.companyName.message && !validation.companyName.isValid && (
                    <Text style={styles.errorText}>{validation.companyName.message}</Text>
                  )}
                </View>

                {/* Nom commercial (optionnel) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputIcon}>✨</Text>
                  <TextInput
                    value={formData.businessName}
                    onChangeText={(t) => handleChange("businessName", t)}
                    placeholder="Nom commercial (optionnel)"
                    style={[styles.input]}
                  />
                </View>

                {/* Catégorie */}
                <View style={{ marginBottom: 18 }}>
                  <Text style={styles.label}>Catégorie de prestation *</Text>
                  <View style={styles.grid2}>
                    {categories.map((c) => {
                      const selected = formData.category === c.key;
                      return (
                        <Pressable
                          key={c.key}
                          onPress={() => handleSelectCategory(c.key)}
                          style={({ pressed }) => [
                            styles.categoryCard,
                            selected && styles.categorySelected,
                            pressed && styles.cardPressed,
                          ]}
                        >
                          <Text style={styles.categoryEmoji}>{c.emoji}</Text>
                          <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                            {c.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {!!validation.category.message && !validation.category.isValid && (
                    <Text style={styles.errorText}>{validation.category.message}</Text>
                  )}
                </View>

                {/* Mot de passe */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    value={formData.password}
                    onChangeText={(t) => handleChange("password", t)}
                    placeholder="Créer un mot de passe sécurisé"
                    secureTextEntry={!showPassword}
                    style={[
                      styles.input,
                      validation.password.isValid && styles.inputValid,
                      !!validation.password.message &&
                        !validation.password.isValid &&
                        styles.inputInvalid,
                    ]}
                  />
                  <Pressable style={styles.toggle} onPress={() => setShowPassword((s) => !s)}>
                    <Text style={styles.toggleText}>{showPassword ? "🙈" : "👁️"}</Text>
                  </Pressable>
                  {!!validation.password.message && !validation.password.isValid && (
                    <Text style={styles.errorText}>{validation.password.message}</Text>
                  )}
                  {formData.password && validation.password.strength && (
                    <View
                      style={[
                        styles.strengthPill,
                        strengthBg(validation.password.strength),
                      ]}
                    >
                      <Text style={[styles.strengthText, strengthColor(validation.password.strength)]}>
                        Force : {strengthLabel(validation.password.strength)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirmation */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputIcon}>🔐</Text>
                  <TextInput
                    value={formData.confirmPassword}
                    onChangeText={(t) => handleChange("confirmPassword", t)}
                    placeholder="Confirmer le mot de passe"
                    secureTextEntry={!showConfirm}
                    style={[
                      styles.input,
                      validation.confirmPassword.isValid && styles.inputValid,
                      !!validation.confirmPassword.message &&
                        !validation.confirmPassword.isValid &&
                        styles.inputInvalid,
                    ]}
                  />
                  <Pressable style={styles.toggle} onPress={() => setShowConfirm((s) => !s)}>
                    <Text style={styles.toggleText}>{showConfirm ? "🙈" : "👁️"}</Text>
                  </Pressable>
                  {!!validation.confirmPassword.message && !validation.confirmPassword.isValid && (
                    <Text style={styles.errorText}>{validation.confirmPassword.message}</Text>
                  )}
                </View>

                {/* Submit */}
                <Pressable
                  disabled={!isFormValid}
                  onPress={handleSubmit}
                  style={({ pressed }) => [
                    styles.submitWrap,
                    !isFormValid && styles.submitDisabled,
                    pressed && isFormValid && styles.cardPressed,
                  ]}
                >
                  <LinearGradient
                    colors={["#12DFD8", "#0891b2", "#0e7490"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitBtn}
                  >
                    <Text style={styles.submitText}>
                      {isFormValid ? "🚀 Créer mon compte prestataire" : "⏳ Complétez tous les champs requis"}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>

              {/* Footer */}
              <View style={{ alignItems: "center" }}>
                <Pressable onPress={() => router.push("/(auth)/login")}>
                  <Text style={styles.footerLink}>Vous avez déjà un compte ? Se connecter</Text>
                </Pressable>
              </View>
            </AnimatedContainer>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const AnimatedView = Animated.View;
const AnimatedContainer = ({
  children,
  contentAnim,
  translateYAnim,
}: {
  children: React.ReactNode;
  contentAnim: Animated.Value;
  translateYAnim: Animated.Value;
}) => (
  <AnimatedView
    style={{
      opacity: contentAnim,
      transform: [{ translateY: translateYAnim }],
      gap: 24,
    }}
  >
    {children}
  </AnimatedView>
);

/* ---------------------------- Styles ---------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, position: "relative" },
  safe: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32, gap: 24 },

  header: { alignItems: "center", marginTop: 8 },
  title: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    color: "#12DFD8",
  },
  subtitle: {
    fontSize: 17,
    color: "#374151",
    opacity: 0.95,
    fontWeight: "600",
    marginTop: 6,
  },

  // glass form
  formCard: {
    backgroundColor: "rgba(255,255,255,0.28)",
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    gap: 14,
  },

  inputGroup: {
    position: "relative",
    marginBottom: 6,
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    top: 16,
    fontSize: 18,
    zIndex: 1,
  },
  input: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingLeft: 54,
    paddingRight: 54,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    fontSize: 16,
    minHeight: 52,
    color: "#0f172a",
  },
  inputValid: { borderColor: "#10b981" },
  inputInvalid: { borderColor: "#ef4444" },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 6,
    fontWeight: "600",
  },
  infoText: {
    color: "#f59e0b",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 6,
    fontWeight: "600",
  },
  toggle: { position: "absolute", right: 16, top: 14 },
  toggleText: { fontSize: 18 },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    marginLeft: 2,
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    flexBasis: "48%",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
  },
  categorySelected: {
    backgroundColor: "#12DFD8",
    borderColor: "#0ea5b7",
    shadowColor: "#12DFD8",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  categoryEmoji: { fontSize: 22, marginBottom: 6 },
  categoryText: { fontSize: 12, fontWeight: "700", color: "#111827" },
  categoryTextSelected: { color: "white" },
  cardPressed: { transform: [{ scale: 0.98 }] },

  // password strength
  strengthPill: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  strengthText: { fontSize: 12, fontWeight: "700" },

  // submit
  submitWrap: { borderRadius: 20, overflow: "hidden" },
  submitDisabled: { opacity: 0.6 },
  submitBtn: {
    paddingVertical: 16,
    alignItems: "center",
  },
  submitText: { color: "white", fontSize: 16, fontWeight: "700" },

  footerLink: {
    color: "#12DFD8",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },

  // blobs
  blob: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  blob1: { width: 160, height: 160, top: "6%", left: -40 },
  blob2: { width: 120, height: 120, top: "22%", right: -30 },
  blob3: { width: 140, height: 140, top: "48%", left: -20 },
  blob4: { width: 100, height: 100, top: "72%", right: -25 },
});

/* --------- helpers styles selon force mdp --------- */
function strengthBg(s: "weak" | "medium" | "strong") {
  switch (s) {
    case "weak":
      return { backgroundColor: "rgba(239,68,68,0.15)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" };
    case "medium":
      return { backgroundColor: "rgba(245,158,11,0.15)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" };
    case "strong":
      return { backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)" };
  }
}
function strengthColor(s: "weak" | "medium" | "strong") {
  switch (s) {
    case "weak":
      return { color: "#ef4444" };
    case "medium":
      return { color: "#f59e0b" };
    case "strong":
      return { color: "#10b981" };
  }
}
function strengthLabel(s: "weak" | "medium" | "strong") {
  switch (s) {
    case "weak":
      return "Faible";
    case "medium":
      return "Moyen";
    case "strong":
      return "Fort";
  }
}
