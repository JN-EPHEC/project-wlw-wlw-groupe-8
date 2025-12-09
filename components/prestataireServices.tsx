import { Card } from '@/components/Card';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

export type DraftService = {
  name: string;
  price: string;
  duration: string;
};

type PrestataireServicesProps = {
  services: DraftService[];
  setServices: (value: DraftService[]) => void;
  step: number;
  setStep: (value: number) => void;
};

const MAX_SERVICES = 6;

export default function PrestataireServices({
  services,
  setServices,
  step,
  setStep,
}: PrestataireServicesProps) {
  const handleAddService = () => {
    if (services.length >= MAX_SERVICES) return;
    setServices([...services, { name: '', price: '', duration: '' }]);
  };

  const handleUpdate = (index: number, field: keyof DraftService, value: string) => {
    const next = [...services];
    next[index] = { ...next[index], [field]: value };
    setServices(next);
  };

  const handleRemove = (index: number) => {
    const next = services.filter((_, idx) => idx !== index);
    setServices(next);
  };

  const canContinue =
    services.length > 0 &&
    services.every(
      (service) =>
        service.name.trim() !== '' && service.price.trim() !== '' && service.duration.trim() !== '',
    );

  return (
    <Card style={styles.card}>
      <ThemedText variant="title" color="black" style={styles.title}>
        Vos services
      </ThemedText>
      <ThemedText variant="subtitle" color="gray" style={styles.subtitle}>
        Ajoutez les services que vous proposez, avec leur prix minimum et leur durée.
      </ThemedText>

      <View style={styles.serviceList}>
        {services.length === 0 ? (
          <ThemedText color="gray" style={styles.emptyText}>
            Ajoutez votre premier service.
          </ThemedText>
        ) : null}
        {services.map((service, index) => (
          <View key={`service-${index}`} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <ThemedText color="black" style={styles.serviceTitle}>
                Service {index + 1}
              </ThemedText>
              <Pressable onPress={() => handleRemove(index)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color="#D6455F" />
              </Pressable>
            </View>
            <TextInput
              placeholder="Nom du service"
              placeholderTextColor="#A0A1AF"
              value={service.name}
              onChangeText={(value) => handleUpdate(index, 'name', value)}
              style={styles.input}
            />
            <View style={styles.row}>
              <View style={styles.field}>
                <ThemedText style={styles.label} color="gray">
                  Prix minimum (€)
                </ThemedText>
                <TextInput
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#A0A1AF"
                  value={service.price}
                  onChangeText={(value) => handleUpdate(index, 'price', value.replace(/[^0-9]/g, ''))}
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <ThemedText style={styles.label} color="gray">
                  Durée (h)
                </ThemedText>
                <TextInput
                  keyboardType="numeric"
                  placeholder="ex: 2"
                  placeholderTextColor="#A0A1AF"
                  value={service.duration}
                  onChangeText={(value) =>
                    handleUpdate(index, 'duration', value.replace(/[^0-9]/g, ''))
                  }
                  style={styles.input}
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        style={[styles.addButton, services.length >= MAX_SERVICES && styles.buttonDisabled]}
        onPress={handleAddService}
        disabled={services.length >= MAX_SERVICES}
      >
        <LinearGradient colors={[Colors.light.pink, Colors.light.purple]} style={styles.addGradient}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <ThemedText color="white" style={styles.addLabel}>
            Ajouter un service
          </ThemedText>
        </LinearGradient>
      </Pressable>

      <Pressable
        style={styles.continueButton}
        disabled={!canContinue}
        onPress={() => setStep(step + 1)}
      >
        <LinearGradient
          colors={[Colors.light.pink, Colors.light.purple, Colors.light.blue]}
          style={[styles.continueGradient, !canContinue && styles.buttonDisabled]}
        >
          <ThemedText color="white" style={styles.buttonLabel}>
            Étape suivante
          </ThemedText>
        </LinearGradient>
      </Pressable>
      {!canContinue ? (
        <ThemedText color="pink" style={styles.helper}>
          Ajoutez au moins un service complet (nom, prix, durée).
        </ThemedText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 28,
    gap: 16,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  serviceList: {
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
  },
  serviceCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3E4F0',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitle: {
    fontWeight: '600',
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E3E4F0',
    backgroundColor: Colors.light.lightBlue,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 13,
  },
  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  addGradient: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  addLabel: {
    fontWeight: '600',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontWeight: '700',
  },
  helper: {
    textAlign: 'center',
  },
});
