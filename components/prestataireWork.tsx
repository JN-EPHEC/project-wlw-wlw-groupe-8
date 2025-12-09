import { Card } from '@/components/Card';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/UseThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

type PrestataireWorkProps = {
  job: string;
  setJob: (value: string) => void;
  cities: string[];
  setCities: (value: string) => void;
  step: number;
  setStep: (value: number) => void;
};

export default function PrestataireWork({
  job,
  setJob,
  cities,
  setCities,
  step,
  setStep,
}: PrestataireWorkProps) {
    const colors = useThemeColors();
    const jobOptions = [
  "DJ",
  "Photographe",
  "Vidéaste",
  "Traiteur",
  "Barman",
  "Serveur / Serveuse",
  "Food truck",
  "Animateur",
  "Groupe de musique",
  "Musicien solo",
  "Photobooth",
  "Décorateur",
  "Fleuriste",
  "Agent de sécurité",
  "Hôte / Hôtesse d’accueil",
  "Location de matériel (tables, chaises, mobilier…)",
  "Location de tente",
  "Chauffeur privé",
  "Animation enfants",
  "Maquilleuse professionnelle",
  "Magicien"
];
    const cityOptions = [
  "Bruxelles",
  "Anvers",
  "Gand",
  "Bruges",
  "Liège",
  "Charleroi",
  "Namur",
  "Louvain",
  "Mons",
  "Tournai",
  "Ostende",
  "Malines",
  "Hasselt",
  "Courtrai",
  "La Louvière",
  "Arlon",
  "Verviers",
  "Seraing",
  "Wavre",
  "Dinant",
  "Knokke-Heist",
  "Ypres",
  "Roulers",
  "Alost",
  "Saint-Nicolas",
  "Blankenberge",
  "Nivelles",
  "Waterloo",
  "Bastogne",
  "Durbuy"
];
    const [showErrors, setShowErrors] = useState(false);
    const [jobOpen, setJobOpen] = useState(false);
    const [cityOpen, setCityOpen] = useState(false);
    const selectedCitiesLabel = cities.length ? cities.join(', ') : 'Ajouter une ville';

    const toggleCitySelection = (option: string) =>
        setCities((prev: any) =>
            prev.includes(option) ? prev.filter((value) => value !== option) : [...prev, option]
        );
    const isFormValid = job && cities.length > 0;
    const jobError = showErrors && !job;
    const cityError = showErrors && cities.length === 0;
        
    const handleContinue = () => {
      if (!isFormValid) {
        setShowErrors(true);
        return;
      }
        setStep(step + 1);
    };

    return(
        <Card style={styles.card}>
    <ThemedText variant="title" color="black" style={styles.title}>
      Votre activité
    </ThemedText>
    <ThemedText
      variant="subtitle"
      color="gray"
      style={styles.subtitle}
    >
      Parlez-nous de votre métier et de votre zone d&apos;activité.
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
        {cities.map((city: any) => (
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
