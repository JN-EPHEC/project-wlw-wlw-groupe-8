import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const auth = getAuth();
  const router = useRouter();
const signOutUser = () => {
    auth.signOut().then(() => {
        router.replace("..");
    })
}
export default function PrestataireScreen() {
    console.log("Prestataire Screen loaded");
    const test = () => {
        console.log("ProfilePanel closed");
    }
    return (
        <SafeAreaView>
            <Text>Prestataire Screen</Text>
            <Text>Prestataire Screen</Text>
            <Text>Prestataire Screen</Text>
            <Pressable
              onPress={signOutUser}
              accessibilityRole="button"
              accessibilityLabel="Se déconnecter"
            >
              <Text>Déconnexion</Text>
            </Pressable>
        </SafeAreaView>
    )
}