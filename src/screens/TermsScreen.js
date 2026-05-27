import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const TermsScreen = ({ navigation }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.statusBar} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Terms of Service</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
                            Last updated: March 23, 2026
                        </Text>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            1. Acceptance of Terms
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            By accessing or using the A1 Temple Studio application ("App"), you agree to be bound by these Terms of Service. If you do not agree, do not use this App.
                        </Text>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            2. Use of Service
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            You may use the App solely for lawful purposes and in accordance with these Terms. You agree not to:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Use the App in violation of any applicable law or regulation
                            </Text>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Distribute, copy, or modify any part of the App without prior written consent
                            </Text>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Attempt to reverse-engineer or extract the source code of the App
                            </Text>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Use automated systems or bots to access the App
                            </Text>
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            3. Intellectual Property
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            All content, designs, templates, and materials provided within the App are the intellectual property of A1 Architecture Group. Users retain ownership of their own created designs but grant A1 a non-exclusive license to display and process them within the App.
                        </Text>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            4. Subscriptions & Payments
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            Certain features require a paid subscription. Payment is charged at the start of each billing cycle. Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date. Refunds are subject to our refund policy.
                        </Text>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            5. User Accounts
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.
                        </Text>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            6. Limitation of Liability
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            The App is provided "as is" without warranties of any kind. A1 Architecture Group shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App.
                        </Text>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            7. Termination
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            We reserve the right to suspend or terminate your access to the App at any time for violations of these Terms or for any other reason at our sole discretion.
                        </Text>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            8. Changes to Terms
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            We may update these Terms from time to time. Continued use of the App after changes constitutes acceptance of the new Terms.
                        </Text>

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: colors.textMuted }]}>
                                © 2026 A1 Architecture Group
                            </Text>
                            <Text style={[styles.footerText, { color: colors.textMuted }]}>
                                All rights reserved.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
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
        paddingHorizontal: 20,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '600' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
    card: {
        borderRadius: 20,
        padding: 24,
        boxShadow: '0px 4px 10px rgba(0,0,0,0.06)',
        elevation: 3,
    },
    lastUpdated: { fontSize: 12, fontWeight: '600', marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 8 },
    paragraph: { fontSize: 14, fontWeight: '500', lineHeight: 22 },
    bulletList: { marginLeft: 8, marginTop: 4 },
    bullet: { fontSize: 14, fontWeight: '500', lineHeight: 24 },
    footer: {
        alignItems: 'center',
        marginTop: 32,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    footerText: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
});

export default TermsScreen;
