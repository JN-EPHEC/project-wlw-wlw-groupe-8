// app/(tabs)/messages.tsx
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Conversation = {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
};

type Reservation = {
  id: string;
  client: string;
  date: string;  // "2025-10-21"
  time: string;  // "10:00"
  service: string;
  status: "confirmée" | "en attente";
};

/* ======= Données (messages) ======= */
const conversations: Conversation[] = [
  {
    id: "1",
    name: "Studio Lumière",
    preview:
      "Merci pour votre message, nous confirmons le rendez-vous de mardi.",
    time: "Il y a 2h",
    unread: 1,
  },
  {
    id: "2",
    name: "Chef Nomade",
    preview:
      "Voici notre proposition de menu végétarien pour 120 invités.",
    time: "Il y a 5h",
    unread: 1,
  },
  {
    id: "3",
    name: "DJ Skyline",
    preview:
      "Je peux adapter la playlist selon le brief envoyé. On en parle ?",
    time: "Hier",
    unread: 0,
  },
  {
    id: "4",
    name: "Thomas Bernard",
    preview: "Merci beaucoup pour votre aide précieuse.",
    time: "Hier",
    unread: 0,
  },
];

/* Exemples de réservations (onglet Réservations) */
const reservations: Reservation[] = [
  { id: "r1", client: "Marie Lefebvre", date: "2025-10-15", time: "10:00", service: "Consultation", status: "confirmée" },
  { id: "r2", client: "Pierre Moreau", date: "2025-10-16", time: "14:30", service: "Rendez-vous", status: "en attente" },
  { id: "r3", client: "Julie Petit",   date: "2025-10-18", time: "09:00", service: "Session",      status: "confirmée" },
  { id: "r4", client: "Antoine Laurent",date: "2025-10-20", time: "16:00", service: "Consultation", status: "confirmée" },
];

/* ======= Utils calendrier (style Canva) ======= */
const monthNames = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

function getCalendarCells(date: Date) {
  // Grille Lundi → Dimanche
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Dim ... 6=Sam
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1; // Lundi=0
  const total = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < adjustedFirst; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  return cells;
}

export default function MessagesScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"messages" | "reservations">("messages");

  const cells = useMemo(() => getCalendarCells(currentDate), [currentDate]);
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const isToday = (day: number | null) => {
    if (!day) return false;
    const t = new Date();
    return (
      day === t.getDate() &&
      month === t.getMonth() &&
      year === t.getFullYear()
    );
  };

  const prevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
    setSelectedDay(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f7f8" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.h1}>Messages & Réservations</Text>
          <Text style={styles.sub}>Gérez vos communications et plannings</Text>
        </View>

        {/* Calendrier dégradé rose (Canva-like) */}
        <LinearGradient
          colors={["#ff6b9d", "#ffc3e0", "#ff8fab"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.calendarCard}
        >
          <View style={styles.calendarHeader}>
            <Pressable
              onPress={prevMonth}
              style={({ pressed }) => [styles.monthBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.monthBtnText}>← Précédent</Text>
            </Pressable>

            <Text style={styles.monthLabel}>
              {monthNames[month]} {year}
            </Text>

            <Pressable
              onPress={nextMonth}
              style={({ pressed }) => [styles.monthBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.monthBtnText}>Suivant →</Text>
            </Pressable>
          </View>

          {/* Jours de la semaine */}
          <View style={styles.weekRow}>
            {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d) => (
              <Text key={d} style={styles.weekCell}>{d}</Text>
            ))}
          </View>

          {/* Grille */}
          <View style={styles.grid}>
            {cells.map((day, i) => {
              const today = isToday(day);
              const selected = day != null && selectedDay === day;
              return (
                <Pressable
                  key={`c-${i}`}
                  style={({ pressed }) => [
                    styles.dayCell,
                    pressed && { transform: [{ scale: 0.98 }] },
                    selected && { backgroundColor: "#fff" },
                    today && !selected && { backgroundColor: "rgba(255,255,255,0.9)" },
                  ]}
                  disabled={day == null}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selected && { color: "#c2185b" },
                      today && !selected && { color: "#c2185b", fontWeight: "800" },
                      day == null && { color: "transparent" },
                    ]}
                  >
                    {day ?? ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </LinearGradient>

        {/* Onglets */}
        <View style={styles.tabsRow}>
          <Pressable
            onPress={() => setActiveTab("messages")}
            style={[
              styles.tabBtn,
              activeTab === "messages" && styles.tabBtnActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "messages" && styles.tabTextActive,
              ]}
            >
              📧 Messages
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("reservations")}
            style={[
              styles.tabBtn,
              activeTab === "reservations" && styles.tabBtnActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "reservations" && styles.tabTextActive,
              ]}
            >
              📅 Réservations
            </Text>
          </Pressable>
        </View>

        {/* Contenu des onglets */}
        {activeTab === "messages" ? (
          <View style={styles.contentCard}>
            <Text style={styles.contentTitle}>Messages récents</Text>

            {conversations.map((msg) => (
              <Pressable
                key={msg.id}
                onPress={() =>
                  router.push({
                    pathname: "/(messages)/[id]",
                    params: { id: msg.id, name: msg.name },
                  })
                }
                style={({ pressed }) => [
                  styles.messageCard,
                  msg.unread
                    ? { borderLeftColor: "#ec4899", backgroundColor: "#fff1f5" }
                    : { borderLeftColor: "#d1d5db", backgroundColor: "#fff" },
                  pressed && { transform: [{ scale: 0.99 }] },
                ]}
              >
                <View style={styles.msgTop}>
                  <View style={styles.msgLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {msg.name.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.msgFrom}>{msg.name}</Text>
                      <Text style={styles.msgSubject} numberOfLines={1}>
                        {msg.preview.slice(0, 48)}
                        {msg.preview.length > 48 ? "…" : ""}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.msgTime}>{msg.time}</Text>
                </View>

                <Text style={styles.msgPreview}>{msg.preview}</Text>

                {msg.unread ? (
                  <View style={styles.badgeNew}>
                    <Text style={styles.badgeNewText}>Nouveau</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.contentCard}>
            <Text style={styles.contentTitle}>Réservations à venir</Text>
            {reservations.map((res) => (
              <Pressable
                key={res.id}
                onPress={() =>
                  router.push({
                    pathname: "/(reservations)/[id]",
                    params: { id: res.id },
                  })
                }
                style={({ pressed }) => [
                  styles.resCard,
                  pressed && { transform: [{ translateY: -2 }] },
                ]}
              >
                <View style={styles.resHeader}>
                  <View style={styles.msgLeft}>
                    <View style={[styles.avatar, { width: 48, height: 48 }]}>
                      <Text style={styles.avatarText}>
                        {res.client.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.resClient}>{res.client}</Text>
                      <Text style={styles.resService}>{res.service}</Text>
                      <Text style={styles.resWhen}>
                        📅 {res.date} à {res.time}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      res.status === "confirmée"
                        ? { backgroundColor: "#dcfce7" }
                        : { backgroundColor: "#fef9c3" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        res.status === "confirmée"
                          ? { color: "#166534" }
                          : { color: "#92400e" },
                      ]}
                    >
                      {res.status === "confirmée" ? "✓ Confirmée" : "⏳ En attente"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= Styles ================= */
const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: "800", color: "#1f2937" },
  sub: { color: "#6b7280", marginTop: 2 },

  calendarCard: {
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  monthBtn: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  monthBtnText: { color: "#fff", fontWeight: "700" },
  monthLabel: { color: "#fff", fontSize: 20, fontWeight: "800" },

  weekRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  weekCell: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    paddingVertical: 6,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayCell: {
    width: "13.6%", // ~7 colonnes (marge incluse)
    aspectRatio: 1.2,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    color: "#fff",
    fontWeight: "700",
  },

  tabsRow: {
    flexDirection: "row",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
    marginBottom: 12,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: "transparent",
  },
  tabBtnActive: {
    backgroundColor: "#ff8fab",
  },
  tabText: {
    fontWeight: "700",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#fff",
  },

  contentCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 12,
  },

  /* Messages */
  messageCard: {
    borderLeftWidth: 4,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  msgTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  msgLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#db2777",
  },
  avatarText: { color: "#fff", fontWeight: "800" },
  msgFrom: { fontWeight: "800", color: "#1f2937" },
  msgSubject: { fontSize: 12, color: "#4b5563" },
  msgTime: { fontSize: 12, color: "#6b7280" },
  msgPreview: { fontSize: 13, color: "#4b5563", marginLeft: 52 },

  badgeNew: {
    alignSelf: "flex-start",
    marginLeft: 52,
    marginTop: 6,
    backgroundColor: "#ec4899",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeNewText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  /* Réservations */
  resCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  resHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  resClient: { fontWeight: "800", color: "#1f2937" },
  resService: { fontSize: 13, color: "#4b5563" },
  resWhen: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
});