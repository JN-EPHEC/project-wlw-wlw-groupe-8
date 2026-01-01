import { Card } from '@/components/Card';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/UseThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type SubscriptionPlanId = 'free' | 'premium';

type Plan = {
    id: SubscriptionPlanId;
    title: string;
    description: string;
    price: string;
    unit: string;
    subtext?: string;
    badge?: string;
    requiresPayment: boolean;
};

const plans: Plan[] = [
    {
        id: 'free',
        title: 'Version gratuite',
        description: 'Limité à 3 rendez-vous par mois',
        price: '0 €',
        unit: '/mois',
        subtext: 'Convient pour tester la plateforme',
        requiresPayment: false,
    },
    {
        id: 'premium',
        title: 'Abonnement Premium',
        description: 'Rendez-vous illimités et visibilité renforcée',
        price: '9,99 €',
        unit: '/mois',
        subtext: 'Priorité dans les recherches clients',
        requiresPayment: true,
    },
];

const paymentMethods = [
    { id: 'card', label: 'Carte', icon: 'card-outline' as const },
    { id: 'paypal', label: 'PayPal', icon: 'logo-paypal' as const },
    { id: 'sepa', label: 'SEPA', icon: 'swap-horizontal-outline' as const },
];

type PrestataireSubscriptionProps = {
    signUp: () => void;
    loading?: boolean;
    errorMessage?: string | null;
    selectedPlan: SubscriptionPlanId;
    onSelectPlan: (plan: SubscriptionPlanId) => void;
};

export default function PrestataireSubscription({
    signUp,
    loading = false,
    errorMessage = null,
    selectedPlan,
    onSelectPlan,
}: PrestataireSubscriptionProps) {
    const colors = useThemeColors();
    const currentPlan = plans.find((plan) => plan.id === selectedPlan) ?? plans[0];
    const ctaLabel =
        selectedPlan === 'free'
            ? 'Continuer avec la version gratuite'
            : 'Confirmer et payer 9,99 €/mois';
    const paymentNote = currentPlan.requiresPayment
        ? 'Paiement 100% sécurisé'
        : 'Aucun paiement requis pour la version gratuite';

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
                        onPress={() => onSelectPlan(plan.id)}
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

            <View style={styles.paymentInfo}>
                <Ionicons
                    name={currentPlan.requiresPayment ? 'shield-checkmark' : 'information-circle-outline'}
                    size={18}
                    color={currentPlan.requiresPayment ? Colors.light.blue : Colors.light.pink}
                />
                <ThemedText variant="body" color="gray" style={styles.paymentLabel}>
                    {paymentNote}
                </ThemedText>
            </View>

            {currentPlan.requiresPayment ? (
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
            ) : (
                <ThemedText variant="body" color="gray" style={styles.freeNote}>
                    Passez en Premium quand vous le souhaitez pour débloquer toutes les fonctionnalités.
                </ThemedText>
            )}

            <Pressable style={styles.primaryAction} onPress={signUp} disabled={loading}>
                <LinearGradient
                    colors={[Colors.light.pink, Colors.light.purple, Colors.light.blue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                >
                    <ThemedText color="white" style={styles.primaryLabel}>
                        {loading ? 'Traitement...' : ctaLabel}
                    </ThemedText>
                </LinearGradient>
            </Pressable>
            {errorMessage ? (
                <ThemedText color="pink" style={styles.errorText}>
                    {errorMessage}
                </ThemedText>
            ) : null}

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
    freeNote: {
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 8,
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
    primaryButtonDisabled: {
        opacity: 0.6,
    },
    primaryLabel: {
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
    },
    footerNote: {
        textAlign: 'center',
        marginTop: 16,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 12,
    },
});
