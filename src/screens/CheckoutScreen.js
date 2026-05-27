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
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CheckoutScreen = ({ route, navigation }) => {
    const { plan } = route.params || { plan: { name: 'Golden', price: '₹999', color: '#D4AF37' } };
    const [selectedMethod, setSelectedMethod] = useState('card');

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
                        <Text style={styles.headerTitle}>Checkout</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* ORDER SUMMARY */}
                        <View style={styles.orderSummary}>
                            <Text style={styles.sectionTitle}>Order Summary</Text>
                            <View style={styles.summaryCard}>
                                <View style={styles.planInfo}>
                                    <View style={[styles.planColorIcon, { backgroundColor: plan.color }]} />
                                    <View>
                                        <Text style={styles.summaryPlanName}>A1 Temple Studio {plan.name}</Text>
                                        <Text style={styles.summaryPeriod}>Monthly Subscription</Text>
                                    </View>
                                </View>
                                <Text style={styles.summaryPrice}>{plan.price}</Text>
                            </View>
                        </View>

                        {/* PAYMENT METHODS */}
                        <Text style={styles.sectionTitle}>Payment Method</Text>
                        <View style={styles.methodsRow}>
                            <TouchableOpacity
                                style={[styles.methodBtn, selectedMethod === 'card' && styles.methodBtnActive]}
                                onPress={() => setSelectedMethod('card')}
                            >
                                <Ionicons name="card-outline" size={24} color={selectedMethod === 'card' ? '#FFF' : '#666'} />
                                <Text style={[styles.methodText, selectedMethod === 'card' && styles.methodTextActive]}>Card</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.methodBtn, selectedMethod === 'upi' && styles.methodBtnActive]}
                                onPress={() => setSelectedMethod('upi')}
                            >
                                <Ionicons name="phone-portrait-outline" size={24} color={selectedMethod === 'upi' ? '#FFF' : '#666'} />
                                <Text style={[styles.methodText, selectedMethod === 'upi' && styles.methodTextActive]}>UPI</Text>
                            </TouchableOpacity>
                        </View>

                        {/* CARD FORM */}
                        {selectedMethod === 'card' && (
                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Card Number</Text>
                                    <TextInput style={styles.input} placeholder="**** **** **** 1234" placeholderTextColor="#BBB" />
                                </View>
                                <View style={styles.rowInputs}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 15 }]}>
                                        <Text style={styles.label}>Expiry</Text>
                                        <TextInput style={styles.input} placeholder="MM/YY" placeholderTextColor="#BBB" />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>CVV</Text>
                                        <TextInput style={styles.input} placeholder="***" placeholderTextColor="#BBB" secureTextEntry />
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* TOTAL & PAY */}
                        <View style={styles.totalContainer}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Grand Total</Text>
                                <Text style={styles.totalValue}>{plan.price}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.payBtn}
                                onPress={() => {
                                    alert('Payment Successful!');
                                    navigation.replace('DashboardScreen');
                                }}
                            >
                                <LinearGradient colors={['#C42D2D', '#8B1E1E']} style={styles.payGradient}>
                                    <Text style={styles.payText}>Pay & Activate</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <Text style={styles.secureText}>
                                <Ionicons name="lock-closed" size={12} color="#BBB" /> Secure 256-bit encrypted payment
                            </Text>
                        </View>
                    </ScrollView>
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
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 5 },
    orderSummary: { marginBottom: 30 },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
        elevation: 4,
    },
    planInfo: { flexDirection: 'row', alignItems: 'center' },
    planColorIcon: { width: 44, height: 44, borderRadius: 12, marginRight: 15 },
    summaryPlanName: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
    summaryPeriod: { fontSize: 12, color: '#999', fontWeight: '600' },
    summaryPrice: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
    methodsRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
    methodBtn: { flex: 1, height: 70, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', boxShadow: '0px 4px 10px rgba(0,0,0,0.04)', elevation: 2 },
    methodBtnActive: { backgroundColor: '#D4AF37' },
    methodText: { fontSize: 13, fontWeight: '700', color: '#666', marginTop: 4 },
    methodTextActive: { color: '#FFF' },
    form: { marginBottom: 30 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 8, marginLeft: 5 },
    input: { height: 56, backgroundColor: '#F1F1F1', borderRadius: 14, paddingHorizontal: 20, fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
    rowInputs: { flexDirection: 'row' },
    totalContainer: { marginTop: 10, marginBottom: 40 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 5 },
    totalLabel: { fontSize: 18, fontWeight: '800', color: '#666' },
    totalValue: { fontSize: 24, fontWeight: '900', color: '#1a1a1a' },
    payBtn: {
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        boxShadow: '0px 8px 15px rgba(0,0,0,0.15)',
        elevation: 8,
    },
    payGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#C62828' },
    payText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    secureText: { textAlign: 'center', fontSize: 12, color: '#BBB', marginTop: 15, fontWeight: '600' },
});

export default CheckoutScreen;
