import { useThemeColors } from '@/hooks/UseThemeColors';
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
