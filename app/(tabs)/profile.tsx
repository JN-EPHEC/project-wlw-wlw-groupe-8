import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
// import { router } from "expo-router"; // décommente si tu utilises Expo Router

const stats = [
  { label: "Événements créés", value: 12 },
  { label: "Prestataires favoris", value: 8 },
  { label: "Avis reçus", value: 24 },
];

const preferences = [
  "Notifications push actives",
  "Factures envoyées chaque fin de mois",
  "Mode collaboration partagé",
];

const ProfileScreen = () => {
  const navigateTo = (route: string) => {
    console.log("Navigate:", route);
    // router.push(route);
  };

  const onLogout = () => {
    console.log("Logout");
    // TODO: clear token/session
    // router.replace("/login");
  };

  return (
    <LinearGradient
      colors={['#FFE6F0', '#FBB1D5', '#F48BB6']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Conteneur relatif pour fixer le footer en bas */}
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: 140 }}
          >
            
            <View style={[styles.card, { backgroundColor: "rgba(255,255,255,0.9)" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <View
                  style={{
                    height: 64,
                    width: 64,
                    borderRadius: 16,
                    overflow: "hidden",
                    backgroundColor: "#12DFD8",
                    opacity: 0.2,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    source={{ uri: "https://i.pravatar.cc/150?img=12" }}
                    style={{ height: "100%", width: "100%" }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hUser}>Mehdi Segraoui </Text>
                  <Text style={styles.userSubtitle}>
                    Membre depuis 23 octobre 2025
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.hBlock}>Activité</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                {stats.map((item) => (
                  <View key={item.label} style={{ alignItems: "center", flex: 1 }}>
                    <Text style={styles.statValue}>{item.value}</Text>
                    <Text style={styles.statLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.card, { gap: 12, paddingBottom: 20 }]}>
              <Text style={styles.hBlock}>Préférences</Text>
              {preferences.map((pref) => (
                <View
                  key={pref}
                  style={{
                    borderRadius: 16,
                    backgroundColor: "rgba(18,223,216,0.1)",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={styles.prefText}>{pref}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.hBlock}>Coordonnées</Text>
              <View style={{ gap: 6 }}>
                <Text style={styles.coordText}>mehdi.segraoui@speedevent.com</Text>
                <Text style={styles.coordText}>+32 498 52 10 34</Text>
                <Text style={styles.coordText}>Préférence de contact : email</Text>
              </View>
            </View>


            <View style={styles.card}>
              <Text style={styles.cardTitleTop}>Compte</Text>

              <MenuItem
                icon="👤"
                title="Voir le profil"
                onPress={() => navigateTo("/(profile)/view")}
              />
              <Separator />
              <MenuItem
                icon="⚙️"
                title="Paramètres du compte"
                onPress={() => navigateTo("/(profile)/settings")}
              />
              <Separator />
              <MenuItem
                icon="🔒"
                title="Confidentialité"
                onPress={() => navigateTo("/(profile)/privacy")}
              />
              <Separator />
              <MenuItem
                icon="❓"
                title="Obtenir de l’aide"
                onPress={() => navigateTo("/(support)/help")}
                showSeparator={false}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitleTop}>Avantages & Services</Text>

              <MenuItem
                icon="🤝"
                title="Parrainer un hôte"
                onPress={() => navigateTo("/(referral)/host")}
              />
              <Separator />
              <MenuItem
                icon="🎁"
                title="Carte cadeau"
                onPress={() => navigateTo("/(wallet)/gift-cards")}
                showSeparator={false}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitleTop}>À propos</Text>

              <MenuItem
                icon="📋"
                title="Juridique"
                onPress={() => navigateTo("/(legal)/index")}
                showSeparator={false}
              />
            </View>
          </ScrollView>

          {/* ====== FOOTER Déconnexion FIXE EN BAS ====== */}
          <View style={styles.footer}>
            <Pressable
              onPress={onLogout}
              accessibilityRole="button"
              accessibilityLabel="Se déconnecter"
              style={({ pressed }) => [
                styles.logoutBtn,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.logoutText}>Déconnexion</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const MenuItem = ({
  icon,
  title,
  onPress,
}: {
  icon: string;
  title: string;
  onPress: () => void;
  showSeparator?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={title}
    style={({ pressed }) => [
      styles.itemRow,
      pressed && { transform: [{ scale: 0.98 }], backgroundColor: "#f9fafb" },
    ]}
  >
    <Text style={styles.itemIcon}>{icon}</Text>
    <Text style={styles.itemLabel}>{title}</Text>
    <Text style={styles.itemChevron}>›</Text>
  </Pressable>
);

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  hUser: {
    fontSize: 18,
    fontWeight: "700",
    color: "#014B48",
  },
  userSubtitle: {
    fontSize: 13,
    color: "#0D6F69",
    marginTop: 4,
  },
  hBlock: {
    fontSize: 16,
    fontWeight: "700",
    color: "#024542",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#12DFD8",
  },
  statLabel: {
    fontSize: 12,
    color: "#3F706E",
    marginTop: 4,
    textAlign: "center",
  },
  prefText: {
    fontSize: 14,
    color: "#0D6F69",
  },
  coordText: {
    fontSize: 14,
    color: "#0D6F69",
  },

  cardTitleTop: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 8,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  itemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
  },
  itemChevron: {
    fontSize: 20,
    color: "#9aa0a6",
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e7eb",
    marginLeft: 44, // aligne sous le libellé (après l’emoji)
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  logoutBtn: {
    backgroundColor: "#e23",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default ProfileScreen;