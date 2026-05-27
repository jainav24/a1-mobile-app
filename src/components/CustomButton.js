import React from 'react';
import {
    StyleSheet,
    Text,
    Pressable,
    ActivityIndicator,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const CustomButton = ({
    onPress,
    title,
    loading = false,
    disabled = false,
    colors = ['#D4AF37', '#B8860B'],
    style,
    textStyle,
}) => {
    const isButtonDisabled = loading || disabled;

    return (
        <Pressable
            onPress={onPress}
            disabled={isButtonDisabled}
            style={({ pressed }) => [
                styles.button,
                style,
                pressed && !isButtonDisabled && styles.pressed,
                isButtonDisabled && styles.disabled,
            ]}
        >
            <LinearGradient
                colors={isButtonDisabled ? ['#999', '#777'] : colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                ) : (
                    <Text style={[styles.text, textStyle]}>{title}</Text>
                )}
            </LinearGradient>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 56,
        borderRadius: 28,
        marginTop: 18,
        overflow: 'hidden',
        // Shadow for iOS
        boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
        // Elevation for Android
        elevation: 4,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    text: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 1,
    },
    pressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },
    disabled: {
        opacity: 0.8,
        elevation: 0,
        boxShadow: 'none',
    },
});

export default CustomButton;
