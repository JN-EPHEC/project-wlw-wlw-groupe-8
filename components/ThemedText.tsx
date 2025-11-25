import { Colors } from "@/constants/Colors";
import { useThemeColors } from "@/hooks/UseThemeColors";
import React from "react";
import { StyleSheet, Text, type TextProps } from "react-native";

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Poppins-Regular',
    fontSize: 36,
    fontWeight: 'bold'
  },
subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    fontWeight: 'normal'
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: 'normal'
  }
});

type Props = TextProps & {
    variant?: keyof typeof styles,
    color?: keyof typeof Colors['light']
};

export function ThemedText({variant, color, style, ...rest}: Props) {
    const colors = useThemeColors();
    return <Text style={[styles[variant ?? 'body'], {color: colors[color ?? "black"] }, style]} {...rest} />;
}

