import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';


const collections = [
  {
    title: "Expériences immersives",
    description: "Mapping vidéo, scénographie interactive et éclairages sur mesure.",
    color: "#F48BB6",
  },
  {
    title: "Hospitalité & bien-être",
    description: "Bars à jus, espace zen, massages express pour vos invités VIP.",
    color: "#12DFD8",
  },
  {
    title: "Art culinaire créatif",
    description: "Menus signatures, ateliers participatifs, expériences sensorielles.",
    color: "#FBB1D5",
  },
];

export default function ExploreScreen() {
  return (
    <LinearGradient
      colors={["#F8FFFE", "#FFE6F0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, gap: 22 }}
        >
          <View className="gap-2">
            <Text className="text-3xl font-semibold text-[#1B3C3A]">Explorer</Text>
            <Text className="text-base text-[#40615E]">
              Inspirez-vous des tendances et imaginez des expériences inoubliables pour votre prochaine production.
            </Text>
          </View>

          {collections.map((item) => (
            <View
              key={item.title}
              className="rounded-3xl px-6 py-5 bg-white/90 shadow-lg"
              style={{
                shadowColor: item.color,
                shadowOpacity: 0.15,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 8 },
                elevation: 6,
              }}
            >
              <View className="h-1.5 w-16 rounded-full mb-4" style={{ backgroundColor: item.color }} />
              <Text className="text-xl font-semibold text-[#1B3C3A]">{item.title}</Text>
              <Text className="text-sm text-[#40615E] mt-2">{item.description}</Text>
            </View>
          ))}

          <View className="bg-white rounded-3xl p-5 shadow-md gap-3">
            <Text className="text-lg font-semibold text-[#1B3C3A]">Sélection en temps réel</Text>
            <Text className="text-sm text-[#40615E]">
              Nous analysons pour vous les disponibilités les plus adaptées à votre planning et vos attentes.
            </Text>
            <View className="rounded-2xl bg-[#12DFD8]/10 px-4 py-3">
              <Text className="text-sm font-medium text-[#0E615C]">3 prestataires libres ce week-end</Text>
            </View>
            <View className="rounded-2xl bg-[#F48BB6]/10 px-4 py-3">
              <Text className="text-sm font-medium text-[#B4367F]">2 expériences culinaires exclusives à Bruxelles</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
