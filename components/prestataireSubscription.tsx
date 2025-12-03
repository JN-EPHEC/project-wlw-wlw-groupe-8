import { Card } from '@/components/Card';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/UseThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Plan = {
    id: 'monthly' | 'annual';
    title: string;
    description: string;
    price: string;
    unit: string;
    subtext?: string;
    badge?: string;
};

const plans: Plan[] = [
    {
        id: 'monthly',
        title: 'Formule Mensuelle',
        description: 'Flexible et sans engagement',
        price: '19,99 €',
        unit: '/mois',
    },
    {
        id: 'annual',
        title: 'Formule Annuelle',
        description: 'Économisez 25% sur l’année',
        price: '179,99 €',
        unit: '/an',
        subtext: 'Soit 14,99 €/mois',
        badge: 'Recommandé',
    },
];

const advantages = [
    'Gestion illimitée de vos services',
    'Visibilité auprès des clients',
    'Système de réservation en ligne',
    'Support client prioritaire',
];

const paymentMethods = [
    { id: 'card', label: 'Carte', icon: 'card-outline' as const },
    { id: 'paypal', label: 'PayPal', icon: 'logo-paypal' as const },
    { id: 'sepa', label: 'SEPA', icon: 'swap-horizontal-outline' as const },
];

export default function PrestataireSubscription(props: any) {
    const colors = useThemeColors();
    const { signUp } = props;
    const [selectedPlan, setSelectedPlan] = useState<Plan['id']>('annual');

    return (
        <Card style={styles.card}>
            <ThemedText variant="title" color="black" style={styles.title}>
                Choisissez votre abonnement
            </ThemedText>
            <ThemedText variant="subtitle" color="gray" style={styles.subtitle}>
                Sélectionnez la formule qui correspond le mieux à vos besoins.
            </ThemedText>

            {plans.map((plan) => {
                const isSelected = plan.id === selectedPlan;
                const showGradient = isSelected;

                const planContent = (
                    <>
                        <View style={styles.planTopRow}>
                            <View>
                                <ThemedText
                                    variant="subtitle"
                                    color={showGradient ? 'white' : 'black'}
                                    style={styles.planTitle}
                                >
                                    {plan.title}
                                </ThemedText>
                                <ThemedText
                                    variant="body"
                                    color={showGradient ? 'white' : 'gray'}
                                    style={styles.planDescription}
                                >
                                    {plan.description}
                                </ThemedText>
                            </View>
                            {plan.badge ? (
                                <View style={styles.badge}>
                                    <ThemedText color="white" style={styles.badgeLabel}>
                                        {plan.badge}
                                    </ThemedText>
                                </View>
                            ) : (
                                <View style={{ width: 1 }} />
                            )}
                        </View>

                        <View style={styles.priceRow}>
                            <ThemedText
                                variant="title"
                                color={showGradient ? 'white' : 'black'}
                                style={styles.price}
                            >
                                {plan.price}
                            </ThemedText>
                            <ThemedText
                                variant="subtitle"
                                color={showGradient ? 'white' : 'gray'}
                                style={styles.priceUnit}
                            >
                                {plan.unit}
                            </ThemedText>
                        </View>
                        {plan.subtext ? (
                            <ThemedText variant="body" color={showGradient ? 'white' : 'gray'}>
                                {plan.subtext}
                            </ThemedText>
                        ) : null}
                    </>
                );

                return (
                    <Pressable
                        key={plan.id}
                        onPress={() => setSelectedPlan(plan.id)}
                        style={styles.planOption}
                    >
                        {showGradient ? (
                            <LinearGradient
                                colors={[Colors.light.pink, Colors.light.purple, Colors.light.blue]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[
                                    styles.planCard,
                                    styles.planGradient,
                                    isSelected && styles.planSelectedShadow,
                                ]}
                            >
                                <View style={styles.planInner}>
                                    <View style={styles.planDetails}>{planContent}</View>
                                    <View
                                        style={[
                                            styles.radio,
                                            styles.radioOnGradient,
                                            styles.radioFloating,
                                            isSelected && styles.radioCheckedOnGradient,
                                        ]}
                                    >
                                        {isSelected ? (
                                            <Ionicons name="checkmark" size={16} color={Colors.light.white} />
                                        ) : null}
                                    </View>
                                </View>
                            </LinearGradient>
                        ) : (
                            <View
                                style={[
                                    styles.planCard,
                                    styles.planDefault,
                                    isSelected && styles.planSelected,
                                    { borderColor: isSelected ? Colors.light.pink : 'rgba(0,0,0,0.05)' },
                                ]}
                            >
                                <View style={styles.planInner}>
                                    <View style={styles.planDetails}>{planContent}</View>
                                    <View
                                        style={[
                                            styles.radio,
                                            styles.radioDefault,
                                            styles.radioFloating,
                                            isSelected && styles.radioChecked,
                                        ]}
                                    >
                                        {isSelected ? (
                                            <Ionicons name="checkmark" size={16} color={Colors.light.white} />
                                        ) : null}
                                    </View>
                                </View>
                            </View>
                        )}
                    </Pressable>
                );
            })}

            <View style={styles.features}>
                <ThemedText variant="subtitle" color="black" style={styles.featuresTitle}>
                    Tous les abonnements incluent :
                </ThemedText>
                {advantages.map((advantage) => (
                    <View key={advantage} style={styles.featureItem}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="checkmark" size={14} color={Colors.light.white} />
                        </View>
                        <ThemedText variant="body" color="gray" style={styles.featureLabel}>
                            {advantage}
                        </ThemedText>
                    </View>
                ))}
            </View>

            <View style={styles.paymentInfo}>
                <Ionicons name="shield-checkmark" size={18} color={Colors.light.blue} />
                <ThemedText variant="body" color="gray" style={styles.paymentLabel}>
                    Paiement 100% sécurisé
                </ThemedText>
            </View>

            <View style={styles.paymentMethods}>
                {paymentMethods.map((method) => (
                    <View key={method.id} style={[styles.methodCard, { borderColor: colors.lila }]}>
                        <Ionicons name={method.icon} size={20} color={colors.black} />
                        <ThemedText variant="body" color="black" style={styles.methodLabel}>
                            {method.label}
                        </ThemedText>
                    </View>
                ))}
            </View>

            <Pressable style={styles.primaryAction} onPress={() => signUp()}>
                <LinearGradient
                    colors={[Colors.light.pink, Colors.light.purple, Colors.light.blue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButton}
                >
                    <ThemedText color="white" style={styles.primaryLabel}>
                        Confirmer et payer
                    </ThemedText>
                </LinearGradient>
            </Pressable>

            <ThemedText variant="body" color="gray" style={styles.footerNote}>
                Vous pouvez annuler votre abonnement à tout moment.
            </ThemedText>
        </Card>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 48,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.white,
    },
    card: {
        padding: 28,
        gap: 10,
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 24,
    },
    planOption: {
        marginBottom: 16,
    },
    planCard: {
        borderRadius: 28,
        padding: 24,
        flex: 1,
    },
    planDefault: {
        borderWidth: 2,
        backgroundColor: Colors.light.white,
    },
    planSelected: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
        elevation: 4,
    },
    planGradient: {
        borderWidth: 0,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 12 },
        elevation: 4,
    },
    planSelectedShadow: {
        transform: [{ scale: 1.01 }],
    },
    planTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    planTitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 20,
        marginBottom: 4,
    },
    planDescription: {
        marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 32,
        fontFamily: 'Poppins-Regular',
        fontWeight: '700',
    },
    priceUnit: {
        marginLeft: 6,
    },
    planInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    planDetails: {
        flex: 1,
    },
    radio: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioFloating: {
        marginLeft: 16,
    },
    radioDefault: {
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.15)',
    },
    radioOnGradient: {
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    radioChecked: {
        backgroundColor: Colors.light.pink,
        borderColor: Colors.light.pink,
    },
    radioCheckedOnGradient: {
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    badge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#15C872',
        alignSelf: 'flex-start',
    },
    badgeLabel: {
        fontSize: 12,
        letterSpacing: 0.5,
        fontFamily: 'Poppins-Regular',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    features: {
        marginTop: 16,
        padding: 20,
        borderRadius: 24,
        backgroundColor: 'rgba(217, 238, 251, 0.6)',
    },
    featuresTitle: {
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    featureIcon: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: Colors.light.pink,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    featureLabel: {
        flex: 1,
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
    },
    paymentLabel: {
        marginLeft: 8,
    },
    paymentMethods: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    methodCard: {
        flex: 1,
        marginHorizontal: 6,
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.white,
    },
    methodLabel: {
        marginTop: 6,
        fontWeight: '600',
    },
    primaryAction: {
        marginTop: 24,
    },
    primaryButton: {
        borderRadius: 24,
        paddingVertical: 18,
        alignItems: 'center',
    },
    primaryLabel: {
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
    },
    footerNote: {
        textAlign: 'center',
        marginTop: 16,
    },
});