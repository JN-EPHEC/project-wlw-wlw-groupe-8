import PrestataireAvailability, {
  WeeklySchedule,
  defaultWeeklySchedule,
} from '@/components/prestataireAvailability';
import PrestataireCredentials from '@/components/prestataireCredentials';
import PrestataireFirstInfo from '@/components/prestataireFirstInfo';
import PrestataireServices, { DraftService } from '@/components/prestataireServices';
import PrestataireSubscription from '@/components/prestataireSubscription';
import PrestataireWork from '@/components/prestataireWork';
import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/UseThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../fireBaseConfig';



export default function PrestataireFirstInfos() {
  const colors = useThemeColors();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [vat, setVat] = useState('');
  const [job, setJob] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [services, setServices] = useState<DraftService[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(defaultWeeklySchedule);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingUp, setSigningUp] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const contactsCollection = collection(db, 'contacts');
  

  const handleGoBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  }

    const signUp = async () => {
      try {
        setSigningUp(true);
        setSignupError(null);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if(userCredential){
        const normalizedServices = services
          .filter((service) => service.name.trim())
          .map((service) => ({
            name: service.name.trim(),
            priceFrom: service.price ? Number(service.price) : null,
            durationHours: service.duration ? Number(service.duration) : null,
          }));

        const availabilityPayload = Object.keys(weeklySchedule).reduce(
          (acc, key) => {
            acc[key as keyof WeeklySchedule] = {
              active: weeklySchedule[key as keyof WeeklySchedule].active,
              start: weeklySchedule[key as keyof WeeklySchedule].start,
              end: weeklySchedule[key as keyof WeeklySchedule].end,
            };
            return acc;
          },
          {} as WeeklySchedule,
        );

        await addDoc(contactsCollection, { 
          lastname: lastName, 
          firstname: firstName,
          vat: vat, 
          job: job,
          cities: cities,
          services: normalizedServices,
          availability: {
            weekly: availabilityPayload,
            blockedDates: [],
            blockedRanges: [],
          },
          type: "prestataire",
          userId: userCredential.user.uid 
        });
        await sendEmailVerification(userCredential.user);
        router.replace('/auth/verify-email');
        } 
      }catch(e){
        if (e instanceof FirebaseError && e.code === 'auth/email-already-in-use') {
          setSignupError('Cette adresse e-mail est déjà utilisée.');
        } else {
          console.error(e);
          setSignupError("Impossible de créer le compte. Vérifiez vos informations.");
        }
      } finally {
        setSigningUp(false);
      }
    }

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
              <Pressable onPress={handleGoBack} hitSlop={12}>
                <Ionicons name="arrow-back" size={22} color={colors.black} />
              </Pressable>
            </View>

            <View style={styles.content}>
              {step === 0 &&
                <PrestataireFirstInfo
                  lastName={lastName}
                  setLastName={setLastName}
                  firstName={firstName}
                  setFirstName={setFirstName}
                  vat={vat}
                  setVat={setVat}
                  step={step}
                  setStep={setStep}
                />
              }
              {step === 1 &&
                <PrestataireWork
                  job={job}
                  setJob={setJob}
                  cities={cities}
                  setCities={setCities}
                  step={step}
                  setStep={setStep}
                />
              }
              {step === 2 &&
                <PrestataireServices
                  services={services}
                  setServices={setServices}
                  step={step}
                  setStep={setStep}
                />
              }
              {step === 3 &&
                <PrestataireAvailability
                  weeklySchedule={weeklySchedule}
                  setWeeklySchedule={setWeeklySchedule}
                  step={step}
                  setStep={setStep}
                />
              }
              {step === 4 &&
                <PrestataireCredentials
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  step={step}
                  setStep={setStep}
                />
              }
              {step === 5 &&
                <PrestataireSubscription
                  signUp={signUp}
                  loading={signingUp}
                  errorMessage={signupError}
                />
              }
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
