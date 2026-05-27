import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
    Dimensions,
    StatusBar,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const { width } = Dimensions.get('window');

const SubscriptionScreen = ({ navigation }) => {
    const { currentUser } = useAuth();
    const { isPremium, loading: subLoading } = useSubscription();
    const [notifying, setNotifying] = useState(false);

    const handleNotifyMe = async () => {
        if (!currentUser) {
            Alert.alert('Error', 'You must be logged in.');
            return;
        }
        setNotifying(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                interestedInPremium: true,
                interestedAt: serverTimestamp(),
            });
            Alert.alert('Success', "We've saved your interest! We will notify you when Premium is available.");
        } catch (error) {
            console.error('Error updating interest:', error);
            Alert.alert('Error', 'Could not save your interest. Please try again later.');
        } finally {
            setNotifying(false);
        }
    };

    if (subLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#D4AF37" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ImageBackground
                source={require('../../assets/marble_bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.95)']}
                    style={StyleSheet.absoluteFill}
                />

                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Plans</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <Text style={styles.subtitle}>Unlock the full potential of sacred architecture.</Text>

                        <View style={styles.cardsRow}>
                            {/* FREE PLAN */}
                            <View style={[styles.planCard, styles.freeCard]}>
                                <View style={styles.planHeader}>
                                    <Text style={[styles.planName, { color: '#888' }]}>Free</Text>
                                    <Text style={styles.priceText}>₹0</Text>
                                    <Text style={styles.periodText}>/ forever</Text>
                                </View>

                                <View style={styles.featuresList}>
                                    <View style={styles.featureItem}><Ionicons name="checkmark" size={16} color="#888" /><Text style={styles.featureText}>1 project</Text></View>
                                    <View style={styles.featureItem}><Ionicons name="checkmark" size={16} color="#888" /><Text style={styles.featureText}>Basic assets only</Text></View>
                                    <View style={styles.featureItem}><Ionicons name="checkmark" size={16} color="#888" /><Text style={styles.featureText}>Standard canvas tools</Text></View>
                                </View>

                                {isPremium ? (
                                    <View style={[styles.selectBtn, { backgroundColor: '#EEE' }]}>
                                        <Text style={[styles.selectBtnText, { color: '#888' }]}>Downgrade</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.selectBtn, { backgroundColor: '#CCC' }]}>
                                        <Text style={styles.selectBtnText}>Current Plan</Text>
                                    </View>
                                )}
                            </View>

                            {/* PREMIUM PLAN */}
                            <View style={[styles.planCard, styles.premiumCard]}>
                                <View style={styles.popularBadge}>
                                    <Text style={styles.popularText}>{isPremium ? "ACTIVE PLAN" : "MOST POPULAR"}</Text>
                                </View>
                                <View style={styles.planHeader}>
                                    <Text style={[styles.planName, { color: '#D4AF37' }]}>Premium</Text>
                                    <Text style={[styles.priceText, { fontSize: 18, marginTop: 4 }]}>Coming Soon</Text>
                                </View>

                                <View style={styles.featuresList}>
                                    <View style={styles.featureItem}><Ionicons name="checkmark-circle" size={16} color="#D4AF37" /><Text style={styles.featureText}>Unlimited projects</Text></View>
                                    <View style={styles.featureItem}><Ionicons name="checkmark-circle" size={16} color="#D4AF37" /><Text style={styles.featureText}>All premium assets unlocked</Text></View>
                                    <View style={styles.featureItem}><Ionicons name="checkmark-circle" size={16} color="#D4AF37" /><Text style={styles.featureText}>Full canvas tools</Text></View>
                                    <View style={styles.featureItem}><Ionicons name="checkmark-circle" size={16} color="#D4AF37" /><Text style={styles.featureText}>Priority support</Text></View>
                                </View>

                                {isPremium ? (
                                    <View style={[styles.selectBtn, { backgroundColor: '#D4AF37' }]}>
                                        <Text style={styles.selectBtnText}>Current Plan</Text>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.selectBtn, { backgroundColor: '#D4AF37' }]}
                                        onPress={handleNotifyMe}
                                        disabled={notifying}
                                    >
                                        {notifying ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <Text style={styles.selectBtnText}>Notify Me</Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        
                        {!isPremium && (
                            <Text style={styles.notifyNote}>Pricing coming soon. Tap 'Notify Me' and we'll let you know first.</Text>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F5F0' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    scrollContent: { paddingHorizontal: 16, paddingBottom: 50, paddingTop: 8 },
    subtitle: { fontSize: 15, color: '#777', textAlign: 'center', marginBottom: 24, paddingHorizontal: 10, fontWeight: '500' },
    cardsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    planCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 14,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
        elevation: 4,
        justifyContent: 'space-between',
        minHeight: 320,
    },
    freeCard: {
        borderColor: '#EEE',
        borderWidth: 1,
    },
    premiumCard: {
        borderColor: '#D4AF37',
        borderWidth: 2,
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        backgroundColor: '#D4AF37',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 10,
    },
    popularText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
    planHeader: { marginBottom: 16 },
    planName: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    priceText: { fontSize: 26, fontWeight: '900', color: '#1a1a1a', marginTop: 8 },
    periodText: { fontSize: 12, color: '#999', fontWeight: '600' },
    featuresList: { marginBottom: 20, flex: 1 },
    featureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    featureText: { fontSize: 12, color: '#444', marginLeft: 6, fontWeight: '500', flex: 1, lineHeight: 16 },
    selectBtn: {
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
    notifyNote: {
        marginTop: 24,
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
        paddingHorizontal: 20,
    }
});

export default SubscriptionScreen;
