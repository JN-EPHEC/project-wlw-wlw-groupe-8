import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Coucou() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Coucou</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF", // fond blanc propre
  },
  text: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333333", // texte gris foncé élégant
  },
});

