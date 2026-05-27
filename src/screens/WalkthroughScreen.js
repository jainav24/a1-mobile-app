import React, { useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const WalkthroughScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 700,
                useNativeDriver: false,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: false,
            }),
        ]).start();

        // Pulse animation for the icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: false }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
            ])
        ).start();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.statusBar} />

            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                    >
                        <Ionicons name="chevron-back" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>3D Walkthrough</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Body */}
                <Animated.View
                    style={[
                        styles.body,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    {/* Icon Card */}
                    <LinearGradient
                        colors={[colors.primary + '22', colors.primary + '08']}
                        style={styles.iconCard}
                    >
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="cube" size={64} color={colors.primary} />
                            </View>
                        </Animated.View>
                    </LinearGradient>

                    {/* Text */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        3D Walkthrough
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.subText }]}>
                        Immersive 3D rendering of your temple designs is coming soon. Walk through every detail like you're already there.
                    </Text>

                    {/* Feature List */}
                    {[
                        { icon: 'walk-outline', label: 'First-person exploration' },
                        { icon: 'sunny-outline', label: 'Real-time lighting & shadows' },
                        { icon: 'phone-portrait-outline', label: 'AR preview on device' },
                    ].map((feat) => (
                        <View key={feat.label} style={[styles.featureRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
                            <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name={feat.icon} size={20} color={colors.primary} />
                            </View>
                            <Text style={[styles.featureLabel, { color: colors.text }]}>{feat.label}</Text>
                            <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
                        </View>
                    ))}

                    {/* CTA */}
                    <TouchableOpacity
                        style={styles.ctaBtn}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('SubscriptionScreen')}
                    >
                        <LinearGradient
                            colors={[colors.primary, '#C9A227']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.ctaGradient}
                        >
                            <Ionicons name="ribbon-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.ctaText}>Unlock with A1 Pro</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 0.4 },
    body: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    iconCard: {
        width: width * 0.55,
        height: width * 0.55,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 0.5,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    featureIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    featureLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
    },
    ctaBtn: {
        width: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        marginTop: 24,
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    ctaText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
});

export default WalkthroughScreen;
