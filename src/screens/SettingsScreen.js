import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
    Dimensions,
    StatusBar,
    Switch,
    Animated,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

// Import Modular Components
import ProfileCard from '../components/ProfileCard';
import EditProfileModal from '../components/EditProfileModal';
import ChangePasswordModal from '../components/ChangePasswordModal';

const { width } = Dimensions.get('window');

const SettingItem = ({ title, icon, library: Library = Ionicons, type, value, setter, onNavigate, colors, isLast }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: false,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: false,
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                style={[
                    styles.settingItem,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                onPress={onNavigate || (() => {})}
                activeOpacity={0.7}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={type === 'switch'}
            >
                <View style={styles.itemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.inputBg }]}>
                        <Library name={icon} size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
                </View>

                {type === 'switch' && (
                    <Switch
                        value={value}
                        onValueChange={setter}
                        trackColor={{ false: colors.switchTrack, true: colors.primary }}
                        thumbColor={Platform.OS === 'ios' ? '#FFF' : (value ? colors.primary : '#F4F3F4')}
                        ios_backgroundColor={colors.switchTrack}
                    />
                )}

                {(type === 'nav' || type === 'button') && (
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const SettingsScreen = ({ navigation }) => {
    const { theme, toggleTheme, colors } = useTheme();
    
    // User Profile State
    const [user, setUser] = useState({
        name: 'Jainav',
        email: 'jainav@example.com',
        profileImage: null
    });

    // UI States
    const [notifs, setNotifs] = useState(true);
    const [cloudSync, setCloudSync] = useState(true);
    const [biometrics, setBiometrics] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPassModal, setShowPassModal] = useState(false);

    const isDark = theme === 'dark';

    // LOAD PROFILE ON MOUNT
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const savedData = await AsyncStorage.getItem('user_profile');
            if (savedData) {
                setUser(JSON.parse(savedData));
            }
        } catch (err) {
            console.error('Error loading profile:', err);
        }
    };

    const saveProfile = async (updatedUser) => {
        try {
            await AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } catch (err) {
            console.error('Error saving profile:', err);
            Alert.alert('Error', 'Failed to save profile changes');
        }
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to change your avatar.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            const updatedUser = { ...user, profileImage: result.assets[0].uri };
            saveProfile(updatedUser);
        }
    };

    const handleUpdateName = (newName) => {
        const updatedUser = { ...user, name: newName };
        saveProfile(updatedUser);
    };

    const settingSections = [
        {
            title: 'App Preferences',
            items: [
                { id: '1', title: 'Notifications', type: 'switch', value: notifs, setter: setNotifs, icon: 'notifications-outline' },
                { id: '2', title: 'Cloud Sync', type: 'switch', value: cloudSync, setter: setCloudSync, icon: 'cloud-upload-outline' },
                { id: '3', title: 'Dark Mode', type: 'switch', value: isDark, setter: toggleTheme, icon: isDark ? 'moon' : 'sunny-outline' },
            ]
        },
        {
            title: 'Security',
            items: [
                { id: '4', title: 'Biometric Lock', type: 'switch', value: biometrics, setter: setBiometrics, icon: 'finger-print-outline' },
                { id: '5', title: 'Change Password', type: 'button', icon: 'lock-closed-outline' },
            ]
        },
        {
            title: 'Legal',
            items: [
                { id: '6', title: 'Terms of Service', type: 'nav', screen: 'TermsScreen', icon: 'document-text-outline' },
                { id: '7', title: 'Privacy Policy', type: 'nav', screen: 'PrivacyScreen', icon: 'shield-checkmark-outline' },
            ]
        }
    ];

    const content = (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Account</Text>
                <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => setShowEditModal(true)}
                >
                    <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* FUNCTIONAL PROFILE CARD */}
                <ProfileCard 
                    name={user.name}
                    email={user.email}
                    profileImage={user.profileImage}
                    onEdit={() => setShowEditModal(true)}
                    onPickImage={handlePickImage}
                    colors={colors}
                />

                {settingSections.map((section, idx) => (
                    <View key={idx} style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.subText }]}>{section.title}</Text>
                        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            {section.items.map((item, i) => (
                                <SettingItem
                                    key={item.id}
                                    {...item}
                                    colors={colors}
                                    isLast={i === section.items.length - 1}
                                    onNavigate={() => {
                                        if (item.type === 'nav' && item.screen) {
                                            navigation.navigate(item.screen);
                                        } else if (item.id === '5') {
                                            setShowPassModal(true);
                                        }
                                    }}
                                />
                            ))}
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    style={[styles.logoutBtn, { borderTopColor: colors.border }]}
                    onPress={async () => {
                        try {
                            await AsyncStorage.clear();
                        } catch (_) {}
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'LoginScreen' }],
                        });
                    }}
                >
                    <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={[styles.version, { color: colors.subText }]}>A1 Temple Studio v2.4.0</Text>
                    <Text style={[styles.copyright, { color: colors.subText }]}>© 2026 A1 Architecture Group</Text>
                </View>
            </ScrollView>

            <EditProfileModal 
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                initialName={user.name}
                onSave={handleUpdateName}
                colors={colors}
            />

            <ChangePasswordModal 
                visible={showPassModal}
                onClose={() => setShowPassModal(false)}
                colors={colors}
            />
        </SafeAreaView>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.statusBar} />
            {!isDark ? (
                <ImageBackground
                    source={require('../../assets/marble_bg.png')}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                >
                    <LinearGradient
                        colors={[colors.overlayLight, colors.overlayMid, colors.overlayStrong]}
                        style={StyleSheet.absoluteFill}
                    />
                    {content}
                </ImageBackground>
            ) : (
                content
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    backgroundImage: { flex: 1 },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
    editButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
    editButtonText: { fontSize: 15, fontWeight: '700' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
    
    // PROFILE CARD
    profileCard: { 
        borderRadius: 24, 
        padding: 20, 
        marginBottom: 24,
        borderWidth: 1,
        ...Platform.select({
            ios: { boxShadow: '0px 4px 10px rgba(0,0,0,0.08)' },
            android: { elevation: 3 }
        })
    },
    profileInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    avatarContainer: { 
        width: 70, 
        height: 70, 
        borderRadius: 35, 
        borderWidth: 2, 
        padding: 2,
    },
    avatarPlaceholder: { flex: 1, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    nameSection: { marginLeft: 16 },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    userName: { fontSize: 22, fontWeight: '900', marginRight: 8 },
    proBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    proText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
    userEmail: { fontSize: 13, fontWeight: '600', opacity: 0.8 },
    premiumBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 12, 
        paddingHorizontal: 16, 
        borderRadius: 16 
    },
    premiumText: { flex: 1, marginLeft: 10, fontSize: 13, fontWeight: '700' },

    // SECTIONS
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 4, marginBottom: 12, opacity: 0.7 },
    sectionCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
    settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
    itemLeft: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemTitle: { fontSize: 15, fontWeight: '700' },

    logoutBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 20,
        marginTop: 10,
        marginBottom: 20,
    },
    logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '800', marginLeft: 10 },

    footer: { alignItems: 'center', marginTop: 10, marginBottom: 40 },
    version: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
    copyright: { fontSize: 11, fontWeight: '600' },
});

export default SettingsScreen;
