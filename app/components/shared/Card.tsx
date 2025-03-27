import React, { forwardRef } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { COLORS } from '../../../src/constants';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export const Card = forwardRef<View, CardProps>(({ children, style }, ref) => {
    return <View ref={ref} style={[styles.card, style]}>{children}</View>;
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 16,
        elevation: 6,
        shadowColor: COLORS.primary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 230, 118, 0.1)',
    }
});

// Add default export for expo-router
export default Card;