/**
 * OrderConfirmationScreen.js
 * Shown after an order is successfully placed.
 * Features an animated check-mark, order details, and navigation options.
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GOLD = '#D4AF37';

const MATERIAL_EMOJI = {
    Marble:    '🏛️',
    Granite:   '🪨',
    Rock:      '⛰️',
    Sandstone: '🌅',
    Brick:     '🧱',
    Wood:      '🪵',
    Concrete:  '🏗️',
};

export default function OrderConfirmationScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const {
        material     = 'Marble',
        projectTitle = 'Untitled Project',
        userEmail    = '',
        orderId      = '',
    } = route?.params || {};

    // ── Animations ────────────────────────────────────────────────────────────
    const scaleAnim   = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const slideAnim   = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        // Circle pops in first
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 60,
            friction: 7,
            useNativeDriver: true,
        }).start();

        // Content fades + slides up with delay
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 550,
                delay: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 480,
                delay: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleBackToCanvas = () => {
        // Pop back to canvas (or go to Dashboard if canvas is gone)
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('DashboardScreen');
        }
    };

    const handleViewOrders = () => {
        navigation.navigate('OrdersScreen');
    };

    return (
        <View style={[s.root, { paddingTop: insets.top }]}>
            {/* Background glow */}
            <View style={s.glowBg} pointerEvents="none" />

            <View style={s.content}>
                {/* Animated check circle */}
                <Animated.View style={[s.checkCircleOuter, { transform: [{ scale: scaleAnim }] }]}>
                    <View style={s.checkCircleInner}>
                        <Ionicons name="checkmark" size={52} color="#0A0A1A" />
                    </View>
                </Animated.View>

                {/* Text content */}
                <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
                    <Text style={s.title}>Order Placed{'\n'}Successfully!</Text>
                    <Text style={s.subtitle}>
                        Your architectural design has been submitted.{'\n'}
                        Our team will review it and contact you within 24 hours.
                    </Text>

                    {/* Order details card */}
                    <View style={s.detailCard}>
                        <View style={s.detailRow}>
                            <Ionicons name="folder-outline" size={18} color={GOLD} />
                            <View style={s.detailTextWrap}>
                                <Text style={s.detailLabel}>Project</Text>
                                <Text style={s.detailValue} numberOfLines={1}>{projectTitle}</Text>
                            </View>
                        </View>
                        <View style={s.detailDivider} />
                        <View style={s.detailRow}>
                            <Text style={s.materialEmoji}>{MATERIAL_EMOJI[material] || '🏛️'}</Text>
                            <View style={s.detailTextWrap}>
                                <Text style={s.detailLabel}>Material</Text>
                                <Text style={s.detailValue}>{material}</Text>
                            </View>
                        </View>
                        {userEmail ? (
                            <>
                                <View style={s.detailDivider} />
                                <View style={s.detailRow}>
                                    <Ionicons name="mail-outline" size={18} color={GOLD} />
                                    <View style={s.detailTextWrap}>
                                        <Text style={s.detailLabel}>Confirmation to</Text>
                                        <Text style={s.detailValue} numberOfLines={1}>{userEmail}</Text>
                                    </View>
                                </View>
                            </>
                        ) : null}
                    </View>

                    {/* Buttons */}
                    <TouchableOpacity style={s.primaryBtn} onPress={handleViewOrders} activeOpacity={0.85}>
                        <Ionicons name="receipt-outline" size={18} color="#0A0A1A" />
                        <Text style={s.primaryBtnTxt}>View My Orders</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={s.secondaryBtn} onPress={handleBackToCanvas} activeOpacity={0.75}>
                        <Ionicons name="arrow-back-outline" size={16} color="rgba(255,255,255,0.6)" />
                        <Text style={s.secondaryBtnTxt}>Back to Canvas</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#06060F',
    },
    glowBg: {
        position: 'absolute',
        top: -80,
        alignSelf: 'center',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(212,175,55,0.06)',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
    },

    // Check circle
    checkCircleOuter: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(212,175,55,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        borderWidth: 2,
        borderColor: 'rgba(212,175,55,0.35)',
    },
    checkCircleInner: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: GOLD,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: GOLD,
        shadowOpacity: 0.5,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
    },

    title: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 0.3,
        lineHeight: 36,
        marginBottom: 14,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 28,
    },

    // Detail card
    detailCard: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.15)',
        marginBottom: 28,
        width: '100%',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    materialEmoji: { fontSize: 18 },
    detailTextWrap: { flex: 1 },
    detailLabel: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    detailValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 2,
    },
    detailDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },

    // Buttons
    primaryBtn: {
        backgroundColor: GOLD,
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        elevation: 6,
        shadowColor: GOLD,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 },
        marginBottom: 12,
        width: '100%',
    },
    primaryBtnTxt: {
        color: '#0A0A1A',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
    secondaryBtn: {
        borderRadius: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        width: '100%',
    },
    secondaryBtnTxt: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: '700',
    },
});
