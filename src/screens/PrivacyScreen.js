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

const PrivacyScreen = ({ navigation }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.statusBar} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
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
                            1. Information We Collect
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            We collect information you provide directly, including:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Account details (name, email, profile photo)
                            </Text>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Design projects and content you create within the App
                            </Text>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Usage data and App interaction patterns
                            </Text>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Device information (OS, device model, unique identifiers)
                            </Text>
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            2. How We Use Your Information
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            Your information is used to:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Provide, maintain, and improve the App
                            </Text>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Process transactions and manage subscriptions
                            </Text>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Send important updates and service notifications
                            </Text>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Personalize your experience with AI-powered features
                            </Text>
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            3. Data Storage & Security
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            We implement industry-standard security measures to protect your data. Your design projects are stored securely with end-to-end encryption. We use cloud infrastructure with regular security audits.
                        </Text>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            4. Data Sharing
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            We do not sell your personal data. We may share information with:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Service providers who assist in operating the App
                            </Text>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Legal authorities when required by law
                            </Text>
                            <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                                • Business partners with your explicit consent
                            </Text>
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            5. Your Rights
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            You have the right to access, correct, or delete your personal data. You can request a copy of your data or request account deletion by contacting our support team.
                        </Text>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            6. Cookies & Analytics
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            We use analytics tools to understand App usage patterns and improve performance. You can manage your preferences in the App Settings.
                        </Text>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            7. Children's Privacy
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            The App is not intended for children under the age of 13. We do not knowingly collect personal information from children.
                        </Text>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            8. Contact Us
                        </Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                            If you have questions about this Privacy Policy, please contact us at privacy@a1architecture.com.
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

export default PrivacyScreen;
