import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ClientHeroHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function ClientHeroHeader({ title, subtitle }: ClientHeroHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[Colors.light.pink, Colors.light.purple]}
      start={{ x: 0, y: 0}}
      end={{ x: 1, y: 1 }}
      style={[styles.heroGradient, { paddingTop: insets.top + 24 }]}
    >
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroGradient: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 24,
    paddingBottom: 28,
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: '#F8FAFC',
    textAlign: 'center',
  },
});
