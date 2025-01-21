import { ReactNode } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";

interface CardProps {
    children: ReactNode; 
    style?: StyleProp<ViewStyle>; 
  }

export const Card: React.FC<CardProps> = ({ children, style }) => {
    return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
    card: {
        width: 350,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        padding: 20,
    }
});