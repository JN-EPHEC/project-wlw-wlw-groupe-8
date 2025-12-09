import { Card } from '@/components/Card';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type DaySchedule = {
  active: boolean;
  start: string;
  end: string;
};

export type WeeklySchedule = Record<DayKey, DaySchedule>;

const dayConfig: { key: DayKey; label: string }[] = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

export const defaultWeeklySchedule: WeeklySchedule = dayConfig.reduce((acc, day) => {
  const isWeekend = day.key === 'saturday' || day.key === 'sunday';
  acc[day.key] = {
    active: !isWeekend,
    start: !isWeekend ? '09:00' : '',
    end: !isWeekend ? '18:00' : '',
  };
  return acc;
}, {} as WeeklySchedule);

type PrestataireAvailabilityProps = {
  weeklySchedule: WeeklySchedule;
  setWeeklySchedule: React.Dispatch<React.SetStateAction<WeeklySchedule>>;
  step: number;
  setStep: (value: number) => void;
};

export default function PrestataireAvailability({
  weeklySchedule,
  setWeeklySchedule,
  step,
  setStep,
}: PrestataireAvailabilityProps) {
  const formatTimeInput = (raw: string, previous: string) => {
    const cleaned = raw.replace(/[^\d]/g, '');
    if (cleaned.length === 0) return '';
    let hours = cleaned.slice(0, 2);
    let minutes = cleaned.slice(2, 4);
    if (hours.length === 1 && Number(hours) > 2) {
      hours = `0${hours}`;
    }
    if (hours.length === 2 && Number(hours) > 23) {
      return previous;
    }
    if (minutes.length > 0 && hours.length < 2) {
      return `${hours}:${minutes}`;
    }
    if (minutes.length > 2) {
      minutes = minutes.slice(0, 2);
    }
    if (minutes.length === 2 && Number(minutes) > 59) {
      return `${hours}:${minutes.slice(0, 1)}`;
    }
    return minutes.length > 0 ? `${hours}:${minutes}` : `${hours}${cleaned.length === 2 ? ':' : ''}`;
  };
  const handleToggleDay = (day: DayKey) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active },
    }));
  };

  const handleTimeChange = (day: DayKey, field: keyof DaySchedule, value: string) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const canContinue = Object.values(weeklySchedule).every((schedule) => {
    if (!schedule.active) return true;
    return schedule.start.trim() !== '' && schedule.end.trim() !== '';
  });

  return (
    <Card style={styles.card}>
      <ThemedText variant="title" color="black" style={styles.title}>
        Vos disponibilités
      </ThemedText>
      <ThemedText variant="subtitle" color="gray" style={styles.subtitle}>
        Indiquez pour chaque jour vos horaires de travail.
      </ThemedText>

      <View style={styles.scheduleList}>
        {dayConfig.map((day) => {
          const schedule = weeklySchedule[day.key];
          return (
            <View key={day.key} style={styles.scheduleRow}>
              <View style={styles.scheduleHeader}>
                <ThemedText color="black" style={styles.dayLabel}>
                  {day.label}
                </ThemedText>
                <View style={styles.switchRow}>
                  <ThemedText color="gray">
                    {schedule.active ? 'Disponible' : 'Jour off'}
                  </ThemedText>
                  <Switch
                    value={schedule.active}
                    onValueChange={() => handleToggleDay(day.key)}
                    thumbColor={schedule.active ? Colors.light.purple : '#FFFFFF'}
                    trackColor={{ true: '#E8D8FF', false: '#D9DBE8' }}
                  />
                </View>
              </View>
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Ionicons name="time-outline" size={16} color="#7A7C8C" />
                  <TextInput
                    editable={schedule.active}
                    value={schedule.start}
                    onChangeText={(value) =>
                      handleTimeChange(day.key, 'start', formatTimeInput(value, schedule.start))
                    }
                    placeholder="09:00"
                    keyboardType="numbers-and-punctuation"
                    style={[
                      styles.timeInput,
                      !schedule.active && styles.disabledInput,
                    ]}
                  />
                </View>
                <ThemedText style={styles.separator} color="gray">
                  -
                </ThemedText>
                <View style={styles.timeField}>
                  <Ionicons name="time-outline" size={16} color="#7A7C8C" />
                  <TextInput
                    editable={schedule.active}
                    value={schedule.end}
                    onChangeText={(value) =>
                      handleTimeChange(day.key, 'end', formatTimeInput(value, schedule.end))
                    }
                    placeholder="18:00"
                    keyboardType="numbers-and-punctuation"
                    style={[
                      styles.timeInput,
                      !schedule.active && styles.disabledInput,
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <Pressable
        style={styles.button}
        disabled={!canContinue}
        onPress={() => setStep(step + 1)}
      >
        <LinearGradient
          colors={[Colors.light.pink, Colors.light.purple, Colors.light.blue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.buttonGradient, !canContinue && styles.buttonDisabled]}
        >
          <ThemedText color="white" style={styles.buttonLabel}>
            Étape suivante
          </ThemedText>
        </LinearGradient>
      </Pressable>
      {!canContinue ? (
        <ThemedText color="pink" style={styles.helper}>
          Chaque jour actif doit comporter une heure de début et de fin.
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
  scheduleList: {
    gap: 14,
  },
  scheduleRow: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4E6F1',
    padding: 14,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabel: {
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E6F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.lightBlue,
  },
  timeInput: {
    flex: 1,
  },
  disabledInput: {
    opacity: 0.4,
  },
  separator: {
    fontWeight: '600',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
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
    marginTop: 8,
  },
});
