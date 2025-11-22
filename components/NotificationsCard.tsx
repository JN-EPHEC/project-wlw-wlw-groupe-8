import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

type ActionButton = {
  label: string;
  variant?: 'primary' | 'accent' | 'ghost';
  onPress?: () => void;
};

type ButtonVariant = NonNullable<ActionButton['variant']>;

export type NotificationsCardProps = {
  title: string;
  description?: string;
  date?: string | Date;
  onPress?: () => void;
  providerName?: string;
  serviceType?: string;
  eventName?: string;
  location?: string;
  timestampLabel?: string;
  statusColor?: string;
  highlightTitle?: string;
  actions?: ActionButton[];
  avatarUri?: string;
  onDismiss?: () => void;
};

const PALETTE = {
  cardBorder: '#28D0FF',
  cardShadow: '#0A1F44',
  statusYellow: '#FFBC00',
  textPrimary: '#1F1F39',
  textSecondary: '#8A8A9F',
  metaIconBg: '#E8F9FF',
  highlightBg: '#FFE3B3',
  highlightText: '#B86800',
  highlightBorder: '#F6C56A',
  primaryButton: '#00B4F0',
  accentStart: '#4A62FF',
  accentEnd: '#C238FF',
  ghostBorder: '#E1E3EF',
  ghostText: '#5A5A6F',
};

const defaultActions: ActionButton[] = [
  { label: 'Voir le profil', variant: 'primary' },
  { label: 'Réserver', variant: 'accent' },
  { label: 'Ignorer', variant: 'ghost' },
];

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=facearea&w=200&h=200&q=80';

function formatDate(date?: string | Date) {
  if (!date) return '';
  const parsed = typeof date === 'string' ? new Date(date) : date;
  return parsed.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const MetaRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) => (
  <View style={styles.metaRow}>
    <View style={styles.metaIconWrapper}>
      <Ionicons name={icon} size={14} color="#6A6A7C" />
    </View>
    <View>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  </View>
);

const HighlightMeta = ({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) => (
  <View style={styles.highlightMetaRow}>
    <Ionicons name={icon} size={14} color={PALETTE.highlightText} style={styles.highlightMetaIcon} />
    <Text style={styles.highlightMetaText}>
      <Text style={styles.highlightMetaLabel}>{label} </Text>
      <Text style={styles.highlightMetaValue}>{value}</Text>
    </Text>
  </View>
);

const CTAButton = ({ label, variant = 'primary', onPress }: ActionButton) => {
  const variantStyles = getVariantStyles(variant);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variantStyles.button,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.actionLabel, variantStyles.label]}>{label}</Text>
    </Pressable>
  );
};

const getVariantStyles = (variant: ButtonVariant) => {
  switch (variant) {
    case 'accent':
      return { button: styles.accentButton, label: styles.accentLabel };
    case 'ghost':
      return { button: styles.ghostButton, label: styles.ghostLabel };
    default:
      return { button: styles.primaryButton, label: styles.primaryLabel };
  }
};

export const NotificationsCard = ({
  title,
  description = 'DJ SoundPro est maintenant disponible !',
  date,
  onPress,
  providerName = 'DJ SoundPro',
  serviceType = 'DJ',
  eventName = 'Mariage',
  location = 'Bruxelles',
  timestampLabel = "À l'instant",
  statusColor = PALETTE.statusYellow,
  highlightTitle,
  actions = defaultActions,
  avatarUri = FALLBACK_AVATAR,
  onDismiss,
}: NotificationsCardProps) => {
  const formattedDate = formatDate(date);
  const highlight = highlightTitle ?? description;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && onPress ? styles.cardPressed : null,
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusLabel}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.timestamp}>{timestampLabel}</Text>
          <Pressable hitSlop={8} onPress={onDismiss}>
            <Ionicons name="close" size={16} color="#A0A0B0" />
          </Pressable>
        </View>
      </View>

      <View style={styles.providerRow}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        <Text style={styles.providerLine}>
          <Text style={styles.providerLabel}>Prestataire: </Text>
          <Text style={styles.providerName}>{providerName}</Text>
        </Text>
      </View>

      <MetaRow icon="briefcase-outline" label="Service" value={serviceType} />
      <MetaRow
        icon="calendar-outline"
        label="Événement"
        value={formattedDate ? `${eventName} - ${formattedDate}` : eventName}
      />

      <View style={styles.highlightBox}>
        <Text style={styles.highlightTitle}>{highlight}</Text>
        {formattedDate ? (
          <HighlightMeta icon="calendar-clear-outline" label="Date :" value={formattedDate} />
        ) : null}
        {location ? (
          <HighlightMeta icon="location-outline" label="Lieu :" value={location} />
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        {actions.map((action) => (
          <CTAButton key={action.label} {...action} />
        ))}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#fff',
    padding: 18,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: PALETTE.cardBorder,
    shadowColor: PALETTE.cardShadow,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  timestamp: {
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  providerLine: {
    fontSize: 16,
    color: PALETTE.textPrimary,
    fontWeight: '700',
  },
  providerLabel: {
    fontSize: 15,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  metaIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: PALETTE.metaIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },
  highlightBox: {
    backgroundColor: PALETTE.highlightBg,
    borderColor: PALETTE.highlightBorder,
    borderWidth: 1,
    padding: 14,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.highlightText,
    marginBottom: 8,
  },
  highlightMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  highlightMetaIcon: {
    marginRight: 8,
  },
  highlightMetaText: {
    fontSize: 13,
    color: PALETTE.highlightText,
  },
  highlightMetaLabel: {
    fontWeight: '600',
  },
  highlightMetaValue: {
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  primaryButton: {
    backgroundColor: PALETTE.primaryButton,
  },
  accentButton: {
    backgroundColor: PALETTE.accentStart,
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: PALETTE.ghostBorder,
    backgroundColor: '#fff',
  },
  actionLabel: {
    fontWeight: '700',
    fontSize: 13,
  },
  primaryLabel: {
    color: '#fff',
  },
  accentLabel: {
    color: '#fff',
  },
  ghostLabel: {
    color: PALETTE.ghostText,
  },
});
