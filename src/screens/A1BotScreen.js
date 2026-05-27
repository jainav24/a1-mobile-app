import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ImageBackground,
    Dimensions,
    StatusBar,
    Animated,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '../hooks/useSubscription';

const { width } = Dimensions.get('window');

const A1BotScreen = ({ navigation }) => {
    const [query, setQuery] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { canAccessAIBot } = useSubscription();

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
        }).start();
    }, []);

    const suggestions = [
        "Generate a Shiva temple layout in Nagara style",
        "Modern Vedantic meditation hall design",
        "Temple entrance with carved gold pillars",
        "12th century Chola architecture floor plan"
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ImageBackground
                source={require('../../assets/marble_bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.95)']}
                    style={StyleSheet.absoluteFill}
                />

                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>AI Temple Generator</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {!canAccessAIBot() ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                            <Ionicons name="lock-closed" size={64} color="#D4AF37" />
                            <Text style={{ fontSize: 24, fontWeight: '800', marginTop: 24, color: '#1a1a1a' }}>A1 Bot is a Premium Feature</Text>
                            <Text style={{ fontSize: 16, textAlign: 'center', color: '#666', marginTop: 12, marginBottom: 32 }}>Upgrade to Premium to access your AI architectural assistant.</Text>
                            <TouchableOpacity style={{ backgroundColor: '#D4AF37', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24 }} onPress={() => navigation.navigate('SubscriptionScreen')}>
                                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>Upgrade to Premium</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ flex: 1 }}
                        >
                        <View style={styles.chatContainer}>
                            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                                <Animated.View style={[styles.welcomeSection, { opacity: fadeAnim }]}>
                                    <View style={styles.aiIconWrapper}>
                                        <LinearGradient colors={['#D4AF37', '#F3E5AB']} style={styles.aiIconGradient}>
                                            <Ionicons name="sparkles" size={40} color="#FFF" />
                                        </LinearGradient>
                                    </View>
                                    <Text style={styles.welcomeTitle}>I am your AI Architect</Text>
                                    <Text style={styles.welcomeSubtitle}>Describe your vision, and I will generate a sacred layout for you.</Text>
                                </Animated.View>

                                <View style={styles.suggestionsSection}>
                                    <Text style={styles.sectionHeading}>Recent Suggestions</Text>
                                    {suggestions.map((item, index) => (
                                        <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => setQuery(item)}>
                                            <Ionicons name="chatbox-ellipses-outline" size={18} color="#D4AF37" />
                                            <Text style={styles.suggestionText} numberOfLines={1}>{item}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>

                            <View style={styles.inputArea}>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Describe your temple layout..."
                                        placeholderTextColor="#999"
                                        value={query}
                                        onChangeText={setQuery}
                                        multiline
                                    />
                                    <TouchableOpacity style={styles.sendBtn}>
                                        <LinearGradient colors={['#C42D2D', '#8B1E1E']} style={styles.sendGradient}>
                                            <Ionicons name="arrow-up" size={24} color="#FFF" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                    )}
                </SafeAreaView>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F5F0' },
    backgroundImage: { flex: 1 },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#1a1a1a' },
    chatContainer: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 100 },
    welcomeSection: { alignItems: 'center', marginTop: 40, marginBottom: 50 },
    aiIconWrapper: { width: 100, height: 100, borderRadius: 35, overflow: 'hidden', marginBottom: 24, elevation: 10, boxShadow: '0px 10px 20px rgba(212,175,55,0.2)' },
    aiIconGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    welcomeTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', marginBottom: 12 },
    welcomeSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
    suggestionsSection: { marginTop: 20 },
    sectionHeading: { fontSize: 14, fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
        elevation: 4,
    },
    suggestionText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#333', fontWeight: '600' },
    inputArea: { padding: 20, position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'transparent' },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F1F1F1',
        borderRadius: 27,
        paddingHorizontal: 20,
        paddingVertical: 10,
        boxShadow: '0px 4px 10px rgba(0,0,0,0.06)',
        elevation: 10,
    },
    input: { flex: 1, minHeight: 40, maxHeight: 120, fontSize: 16, color: '#1a1a1a', paddingTop: 10 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', marginLeft: 10, marginBottom: 2 },
    sendGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#C62828' },
});

export default A1BotScreen;
