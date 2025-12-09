export type TimeSlot = {
  start: string;
  end: string;
};

const clampMinutes = (value: number) => Math.max(0, value);

export const parseTimeToMinutes = (value: string) => {
  const [hourString = '0', minuteString = '0'] = value.split(':');
  const hours = Number(hourString);
  const minutes = Number(minuteString);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }
  return clampMinutes(hours * 60 + minutes);
};

export const minutesToTimeLabel = (value: number) => {
  const normalized = clampMinutes(value);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const slotsOverlap = (slotA: TimeSlot, slotB: TimeSlot) => {
  const startA = parseTimeToMinutes(slotA.start);
  const endA = parseTimeToMinutes(slotA.end);
  const startB = parseTimeToMinutes(slotB.start);
  const endB = parseTimeToMinutes(slotB.end);
  return startA < endB && endA > startB;
};

export const generateBookableSlots = (
  windows: TimeSlot[],
  durationMinutes: number,
  reservations: TimeSlot[] = [],
  stepMinutes = 30,
) => {
  if (!Array.isArray(windows) || windows.length === 0 || durationMinutes <= 0) {
    return [];
  }
  const step = Math.max(5, stepMinutes);
  const slots: TimeSlot[] = [];
  windows.forEach((window) => {
    const windowStart = parseTimeToMinutes(window.start);
    const windowEnd = parseTimeToMinutes(window.end);
    if (windowEnd - windowStart < durationMinutes) {
      return;
    }
    for (let cursor = windowStart; cursor + durationMinutes <= windowEnd; cursor += step) {
      const candidate: TimeSlot = {
        start: minutesToTimeLabel(cursor),
        end: minutesToTimeLabel(cursor + durationMinutes),
      };
      const overlapsExisting = reservations.some((reservation) => slotsOverlap(reservation, candidate));
      if (!overlapsExisting) {
        slots.push(candidate);
      }
    }
  });
  return slots;
};
