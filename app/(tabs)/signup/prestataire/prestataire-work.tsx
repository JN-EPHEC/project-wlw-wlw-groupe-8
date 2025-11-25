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

export default function PrestataireWork() {
  const colors = useThemeColors();
  const router = useRouter();
  const jobOptions = ['Fleuriste', 'DJ', 'Photographe', 'Traiteur', 'Animateur', 'Décorateur'];
  const cityOptions = ['Bruxelles', 'Liège', 'Anvers', 'Namur', 'Gand', 'Ostande'];
  const [job, setJob] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [jobOpen, setJobOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const selectedCitiesLabel = cities.length ? cities.join(', ') : 'Ajouter une ville';

  const toggleCitySelection = (option: string) =>
    setCities((prev) =>
      prev.includes(option) ? prev.filter((value) => value !== option) : [...prev, option]
    );
  const isFormValid = job && cities.length > 0 && price.trim().length > 0;
  const jobError = showErrors && !job;
  const cityError = showErrors && cities.length === 0;
  const priceError = showErrors && !price.trim();

  const handleContinue = () => {
    if (!isFormValid) {
      setShowErrors(true);
      return;
    }
    router.push('/signup/prestataire/prestataire-credentials');
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
                  Votre activité
                </ThemedText>
                <ThemedText
                  variant="subtitle"
                  color="gray"
                  style={styles.subtitle}
                >
                  Parlez-nous de votre métier et de votre zone d'activité.
                </ThemedText>

                <View style={styles.formSection}>
                  <ThemedText variant="body" color="black" style={styles.label}>
                    Votre métier
                  </ThemedText>
                  <Pressable
                    style={styles.select}
                    onPress={() => {
                      setJobOpen((prev) => !prev);
                      setCityOpen(false);
                    }}
                  >
                    <ThemedText color={job ? 'black' : 'gray'}>
                      {job || 'Sélectionnez votre métier'}
                    </ThemedText>
                    <Ionicons name="chevron-down" size={18} color={colors.gray} />
                  </Pressable>
                  {jobOpen ? (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {jobOptions.map((option) => (
                        <Pressable
                          key={option}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setJob(option);
                            setJobOpen(false);
                          }}
                        >
                          <ThemedText color="black">{option}</ThemedText>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}
                  <ThemedText color={jobError ? 'pink' : 'gray'} style={styles.helper}>
                    Veuillez sélectionner votre métier
                  </ThemedText>
                </View>

                <View style={styles.formSection}>
                  <ThemedText variant="body" color="black" style={styles.label}>
                    Villes où vous travaillez
                  </ThemedText>

                  <View style={styles.pillsContainer}>
                    {cities.map((city) => (
                      <LinearGradient
                        key={city}
                        colors={[Colors.light.pink, Colors.light.purple, Colors.light.blue]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.pill}
                      >
                        <ThemedText color="white" style={styles.pillText}>
                          {city}
                        </ThemedText>
                        <Pressable onPress={() => toggleCitySelection(city)} hitSlop={6}>
                          <Ionicons name="close" size={16} color={Colors.light.white} />
                        </Pressable>
                      </LinearGradient>
                    ))}
                  </View>

                  <Pressable
                    style={styles.select}
                    onPress={() => {
                      setCityOpen((prev) => !prev);
                      setJobOpen(false);
                    }}
                  >
                    <ThemedText color={cities.length ? 'black' : 'gray'}>
                      {selectedCitiesLabel}
                    </ThemedText>
                    <Ionicons name="chevron-down" size={18} color={colors.gray} />
                  </Pressable>
                  {cityOpen ? (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {cityOptions.map((option) => (
                        <Pressable
                          key={option}
                          style={styles.dropdownItem}
                          onPress={() => toggleCitySelection(option)}
                        >
                          <View style={styles.multiRow}>
                            <ThemedText color="black">{option}</ThemedText>
                            {cities.includes(option) ? (
                              <Ionicons name="checkmark" size={18} color={Colors.light.purple} />
                            ) : null}
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}
                  <ThemedText color={cityError ? 'pink' : 'gray'} style={styles.helper}>
                    Veuillez sélectionner au moins une ville
                  </ThemedText>
                </View>

                <View style={styles.formSection}>
                  <ThemedText variant="body" color="black" style={styles.label}>
                    Prix moyen par soirée ou demi-journée
                  </ThemedText>
                  <TextInput
                    placeholder="Ex. : 350 € par soirée"
                    placeholderTextColor={colors.gray}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={(value) => {
                      const numeric = value.replace(/[^0-9]/g, '');
                      setPrice(numeric);
                    }}
                    style={[
                      styles.input,
                      { backgroundColor: Colors.light.lightBlue },
                      priceError ? styles.inputError : null,
                    ]}
                  />
                  {priceError ? (
                    <ThemedText color="pink" style={styles.errorText}>
                      Ce champ est obligatoire
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
                      Étape suivante
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
  formSection: {
    gap: 6,
  },
  label: {
    fontWeight: '600',
  },
  select: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.lightBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helper: {
    fontSize: 12,
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
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  pillText: {
    fontFamily: 'Inter-Regular',
  },
  dropdownList: {
    borderRadius: 14,
    backgroundColor: Colors.light.white,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.light.lightBlue,
    overflow: 'hidden',
    maxHeight: 160,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightBlue,
  },
  multiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
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
