import { ThemedText } from '@/components/ThemedText';
import { useThemeColors } from '@/hooks/UseThemeColors';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';


export default function LoadingScreen() {
  const colors = useThemeColors();
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.lila, colors.lightBlue]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        <Image
          source={require('@/assets/images/9db6d727a0d8bccb023dba357b419979d8ccb303.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText variant="title" color="purple" style={styles.title}>
          SpeedEvent
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
  },
});
