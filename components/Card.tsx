import { Shadows } from "@/constants/Shadows";
import { useThemeColors } from "@/hooks/UseThemeColors";
import { View, ViewProps, ViewStyle } from "react-native";

type Props = ViewProps;

export function Card({style, ...rest}: Props) {
    const colors = useThemeColors();
    return <View  style={[style, styles, {backgroundColor: colors.white}]} {...rest}/>
}

const styles = {
    borderRadius: 32,
    ...Shadows.dp2
} satisfies ViewStyle