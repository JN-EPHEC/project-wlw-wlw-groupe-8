
import { ChoiceOfStatus } from '@/components/ChoiceOfStatus';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/UseThemeColors';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



export default function HomePage() {
  const colors = useThemeColors();
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.lila, colors.lightBlue]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <ChoiceOfStatus/>
            <View style={styles.loginBlock}>
              <ThemedText variant="subtitle" color="gray" style={styles.account}>
                Vous avez déjà un compte ?
              </ThemedText>
              <Link href="/auth/login" asChild>
                <Pressable hitSlop={8}>
                  <ThemedText variant="subtitle" style={styles.loginLink}>
                    Se connecter
                  </ThemedText>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loginBlock: {
    marginTop: 24,
    alignItems: 'center',
    gap: 6,
  },
  account: {
    textAlign: 'center',
  },
  loginLink: {
    textAlign: 'center',
    color: Colors.light.purple,
    fontWeight: '700',
  },
});