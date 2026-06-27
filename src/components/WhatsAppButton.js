import React from 'react';
import { StyleSheet, TouchableOpacity, Text, Linking, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WHATSAPP_NUMBER, WHATSAPP_MESSAGE } from '../config/contact';

const WhatsAppButton = () => {
    const handlePress = async () => {
        const text = encodeURIComponent(WHATSAPP_MESSAGE);
        const scheme = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${text}`;
        const webUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

        try {
            const supported = await Linking.canOpenURL(scheme);
            if (supported) {
                await Linking.openURL(scheme);
            } else {
                await Linking.openURL(webUrl);
            }
        } catch (error) {
            console.error('Error opening WhatsApp', error);
        }
    };

    return (
        <TouchableOpacity style={styles.fab} onPress={handlePress} activeOpacity={0.8}>
            <View style={styles.iconContainer}>
                <Ionicons name="logo-whatsapp" size={24} color="#FFF" />
            </View>
            <Text style={styles.text}>Chat with Us</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 64,
        left: 16,
        backgroundColor: '#25D366',
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 9999,
    },
    iconContainer: {
        marginRight: 8,
    },
    text: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
});

export default WhatsAppButton;
