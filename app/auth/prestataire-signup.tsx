import PrestataireCredentials from '@/components/prestataireCredentials';
import PrestataireFirstInfo from '@/components/prestataireFirstInfo';
import PrestataireSubscription from '@/components/prestataireSubscription';
import PrestataireWork from '@/components/prestataireWork';
import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/UseThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
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
  const [price, setPrice] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        const user = await createUserWithEmailAndPassword(auth, email, password);
        if(user){
        await addDoc(contactsCollection, { 
          lastname: lastName, 
          firstname: firstName,
          vat: vat, 
          job: job,
          cities: cities,
          price: price, 
          type: "prestataire",
          userId: user.user.uid 
        });
        router.replace("/(tabs)/prestataire");
        } 
      }catch(e){
        alert("Erreur : " + e);
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
              {step == 0 &&
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
              {step == 1 &&
                <PrestataireWork
                  job={job}
                  setJob={setJob}
                  cities={cities}
                  setCities={setCities}
                  price={price}
                  setPrice={setPrice}
                  step={step}
                  setStep={setStep}
                />
              }
              {step == 2 &&
                <PrestataireCredentials
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  step={step}
                  setStep={setStep}
                />
              }
              {step == 3 &&
                <PrestataireSubscription
                  signUp={signUp}
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
