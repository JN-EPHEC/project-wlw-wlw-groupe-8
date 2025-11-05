import React, { useEffect, useRef } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";

const ACCENT = "#12DFD8";

const BackdropBlobs = () => {
  const blob1Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const blob2Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const blob3Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const blob4Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const blob5Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const opacity1 = useRef(new Animated.Value(0.4)).current;
  const opacity2 = useRef(new Animated.Value(0.4)).current;
  const opacity3 = useRef(new Animated.Value(0.4)).current;
  const opacity4 = useRef(new Animated.Value(0.4)).current;
  const opacity5 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const createLoop = (anim: Animated.ValueXY, opacity: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(anim, {
              toValue: { x: 6, y: -14 },
              duration: 2200,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.55,
              duration: 2200,
              delay,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: { x: 12, y: 4 },
              duration: 2200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.65,
              duration: 2200,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: { x: -6, y: 12 },
              duration: 2200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.45,
              duration: 2200,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: { x: 0, y: 0 },
              duration: 2200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.4,
              duration: 2200,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

    const loops = [
      createLoop(blob1Anim, opacity1, 0),
      createLoop(blob2Anim, opacity2, 800),
      createLoop(blob3Anim, opacity3, 1600),
      createLoop(blob4Anim, opacity4, 2400),
      createLoop(blob5Anim, opacity5, 3200),
    ];

    loops.forEach((loop) => loop.start());

    return () => loops.forEach((loop) => loop.stop());
  }, [blob1Anim, blob2Anim, blob3Anim, blob4Anim, blob5Anim, opacity1, opacity2, opacity3, opacity4, opacity5]);

  return (
    <>
      <Animated.View
        style={[
          styles.blob,
          styles.blob1,
          { transform: blob1Anim.getTranslateTransform(), opacity: opacity1 },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob2,
          { transform: blob2Anim.getTranslateTransform(), opacity: opacity2 },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob3,
          { transform: blob3Anim.getTranslateTransform(), opacity: opacity3 },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob4,
          { transform: blob4Anim.getTranslateTransform(), opacity: opacity4 },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob5,
          { transform: blob5Anim.getTranslateTransform(), opacity: opacity5 },
        ]}
      />
    </>
  );
};

const ParticleLayer = () => {
  const particles = Array.from({ length: 6 }).map((_, index) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0.8,
              duration: 1800,
              delay: index * 400,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 1800,
              delay: index * 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1800,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      loop.start();
      return () => loop.stop();
    }, [opacity, scale, index]);

    const positions = [
      styles.particle1,
      styles.particle2,
      styles.particle3,
      styles.particle4,
      styles.particle5,
      styles.particle6,
    ];

    return (
      <Animated.View
        key={`particle-${index}`}
        style={[
          styles.particle,
          positions[index],
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      />
    );
  });

  return <>{particles}</>;
};

const AnimatedCard = ({
  emoji,
  title,
  subtitle,
  onPress,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2800,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmer]);

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-1, 1],
  });

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [styles.roleCard, pressed && styles.roleCardPressed]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmer,
            {
              transform: [
                {
                  translateX: shimmerTranslate.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-400, 400],
                  }),
                },
              ],
            },
          ]}
        />
        <View style={styles.emojiCircle}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </Pressable>
    </Animated.View>
  );
};

const HomeScreen = () => {
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentTranslate]);

  return (
    <LinearGradient
      colors={["#FFD3E6", "#FFC0DA", "#FFABD0", "#FF9AC7"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <BackdropBlobs />
            <ParticleLayer />

            <Animated.View
              style={[
                styles.content,
                {
                  opacity: contentOpacity,
                  transform: [{ translateY: contentTranslate }],
                },
              ]}
            >
              <View style={styles.header}>
                <Text style={styles.title}>SpeedEvent</Text>
                <Text style={styles.subtitle}>Démarrons ensemble votre expérience</Text>
              </View>

              <View style={styles.cardsContainer}>
                <AnimatedCard
                  emoji="🤝"
                  title="Prestataire"
                  subtitle="Je suis un prestataire d'événements"
                  onPress={() => router.push("/(auth)/register-provider")}
                />
                <AnimatedCard
                  emoji="👥"
                  title="Client"
                  subtitle="Je veux créer un événement"
                  onPress={() => router.push("/(auth)/register-client")}
                />
              </View>

              <View style={styles.footer}>
                <Pressable onPress={() => router.push("/(auth)/login")}>
                  <Text style={styles.footerLink}>
                    Vous avez déjà un compte ? Se connecter
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: "relative",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
    textAlign: "center",
    textShadowColor: "rgba(18, 223, 216, 0.3)",
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 12,
    color: ACCENT,
  },
  subtitle: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
    opacity: 0.9,
    fontWeight: "500",
  },
  cardsContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
  },
  roleCard: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    shadowColor: "#ff6b9d",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    overflow: "hidden",
  },
  roleCardPressed: {
    borderColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.35,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    opacity: 0.4,
  },
  emojiCircle: {
    width: 72,
    height: 72,
    borderRadius: 72,
    backgroundColor: "rgba(18,223,216,0.12)",
    borderWidth: 2,
    borderColor: "rgba(18,223,216,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  emoji: {
    fontSize: 36,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0b4240",
    marginBottom: 12,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 15,
    color: "#374151",
    opacity: 0.85,
    textAlign: "center",
    lineHeight: 22,
  },
  footer: {
    alignItems: "center",
  },
  footerLink: {
    fontSize: 14,
    color: ACCENT,
    textAlign: "center",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.3)",
    shadowColor: "rgba(255,255,255,0.4)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  blob1: {
    width: 140,
    height: 140,
    top: "8%",
    left: -30,
  },
  blob2: {
    width: 100,
    height: 100,
    top: "25%",
    right: -20,
  },
  blob3: {
    width: 120,
    height: 120,
    bottom: "15%",
    left: 10,
  },
  blob4: {
    width: 60,
    height: 60,
    top: "50%",
    right: 30,
  },
  blob5: {
    width: 80,
    height: 80,
    bottom: "35%",
    right: -15,
  },
  particle: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(18,223,216,0.6)",
  },
  particle1: {
    top: "15%",
    left: "18%",
  },
  particle2: {
    top: "22%",
    right: "18%",
  },
  particle3: {
    top: "42%",
    left: "12%",
  },
  particle4: {
    bottom: "32%",
    right: "24%",
  },
  particle5: {
    bottom: "20%",
    left: "30%",
  },
  particle6: {
    top: "38%",
    right: "32%",
  },
});
