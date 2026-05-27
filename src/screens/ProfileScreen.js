import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, Image, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../hooks/useSubscription';

const ProfileScreen = ({ navigation }) => {
    const { currentUser, logout } = useAuth();
    const { theme, colors } = useTheme();
    const isDark = theme === 'dark';
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isPremium, loading: subLoading } = useSubscription();
    const [editVisible, setEditVisible] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        getDoc(doc(db, 'users', currentUser.uid)).then((snap) => {
            if (snap.exists()) setUserData(snap.data());
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [currentUser]);

    const handleSaveName = async () => {
        if (!newName.trim()) return;
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), { name: newName.trim() });
            setUserData(prev => ({ ...prev, name: newName.trim() }));
            setEditVisible(false);
        } catch { Alert.alert('Error', 'Could not update name.'); }
    };

    const handleLogout = () => Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); navigation.replace('LoginScreen'); } },
    ]);

    const fmt = (ts) => { if (!ts) return 'Member'; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }); };

    const menuItems = [
        { id: '1', title: 'My Subscription', icon: 'ribbon-outline', color: '#D4AF37', screen: 'SubscriptionScreen' },
        { id: '2', title: 'Saved Projects', icon: 'folder-open-outline', color: '#4A90E2', screen: 'SavedProjectsScreen' },
        { id: '3', title: 'App Settings', icon: 'settings-outline', color: '#888', screen: 'SettingsScreen' },
        { id: '4', title: 'Terms of Service', icon: 'document-text-outline', color: '#888', screen: 'TermsScreen' },
        { id: '5', title: 'Privacy Policy', icon: 'shield-checkmark-outline', color: '#888', screen: 'PrivacyScreen' },
    ];

    if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color="#D4AF37" /></View>;

    return (
        <View style={[s.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.statusBar} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Ionicons name="chevron-back" size={28} color={colors.text} /></TouchableOpacity>
                    <Text style={[s.headerTitle, { color: colors.text }]}>Profile</Text>
                    <TouchableOpacity onPress={handleLogout} style={s.logoutIconBtn}><Ionicons name="log-out-outline" size={24} color="#C42D2D" /></TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                    <View style={[s.profileCard, { backgroundColor: colors.card }]}>
                        <View style={s.avatarCircle}><Ionicons name="person" size={50} color={isDark ? '#555' : '#DDD'} /></View>
                        <Text style={[s.userName, { color: colors.text }]}>{userData?.name || currentUser?.email}</Text>
                        <Text style={[s.userEmail, { color: colors.subText }]}>{currentUser?.email}</Text>
                        
                        {isPremium ? (
                            <LinearGradient colors={['#D4AF37', '#F3E5AB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.planBadge}>
                                <Ionicons name="star" size={12} color="#FFF" />
                                <Text style={[s.planText, { color: '#FFF' }]}>Premium Member ✦</Text>
                            </LinearGradient>
                        ) : (
                            <View style={[s.planBadge, { backgroundColor: '#E0E0E0' }]}>
                                <Text style={[s.planText, { color: '#666' }]}>Free Plan</Text>
                            </View>
                        )}
                        
                        <Text style={[s.memberSince, { color: colors.subText }]}>Member since {fmt(userData?.createdAt)}</Text>
                        
                        {!isPremium && !subLoading && (
                            <TouchableOpacity style={s.upgradeBtn} onPress={() => navigation.navigate('SubscriptionScreen')}>
                                <Text style={s.upgradeBtnText}>Upgrade to Premium</Text>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity style={s.editBtn} onPress={() => { setNewName(userData?.name || ''); setEditVisible(true); }}>
                            <Ionicons name="pencil-outline" size={14} color="#D4AF37" />
                            <Text style={s.editBtnText}>Edit Name</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[s.menuContainer, { backgroundColor: colors.card }]}>
                        {menuItems.map((item) => (
                            <TouchableOpacity key={item.id} style={s.menuItem} onPress={() => item.screen && navigation.navigate(item.screen)}>
                                <View style={[s.menuIcon, { backgroundColor: item.color + '18' }]}><Ionicons name={item.icon} size={20} color={item.color} /></View>
                                <Text style={[s.menuTitle, { color: colors.text }]}>{item.title}</Text>
                                <Ionicons name="chevron-forward" size={18} color={colors.subText} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={s.signOutBtn} onPress={handleLogout}>
                        <Text style={s.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>

            <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
                <View style={s.modalBg}>
                    <View style={[s.modalCard, { backgroundColor: colors.card }]}>
                        <Text style={[s.modalTitle, { color: colors.text }]}>Edit Name</Text>
                        <TextInput style={[s.modalInput, { color: colors.text, borderColor: colors.border }]} value={newName} onChangeText={setNewName} placeholder="Full Name" placeholderTextColor={colors.subText} />
                        <View style={s.modalActions}>
                            <TouchableOpacity onPress={() => setEditVisible(false)} style={s.cancelBtn}><Text style={{ color: colors.subText, fontWeight: '600' }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveName} style={s.saveBtn}><Text style={{ color: '#FFF', fontWeight: '700' }}>Save</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1 },
    header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '600' },
    logoutIconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
    scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
    profileCard: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, elevation: 3 },
    avatarCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(212,175,55,0.3)', backgroundColor: '#F0F0F0', marginBottom: 12 },
    userName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
    userEmail: { fontSize: 13, marginBottom: 12 },
    planBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 8 },
    planText: { color: '#FFF', fontSize: 11, fontWeight: '800', marginLeft: 6 },
    memberSince: { fontSize: 12, marginBottom: 14 },
    upgradeBtn: { backgroundColor: '#D4AF37', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 14 },
    upgradeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
    editBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)' },
    editBtnText: { color: '#D4AF37', fontWeight: '700', marginLeft: 6, fontSize: 13 },
    menuContainer: { borderRadius: 20, padding: 8, marginBottom: 16, elevation: 2 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14 },
    menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    menuTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
    signOutBtn: { backgroundColor: 'rgba(196,45,45,0.08)', height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
    signOutText: { color: '#C42D2D', fontSize: 16, fontWeight: '800' },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalCard: { width: '85%', borderRadius: 20, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    modalInput: { borderWidth: 1.5, borderRadius: 12, height: 50, paddingHorizontal: 14, fontSize: 15, marginBottom: 20 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
    saveBtn: { backgroundColor: '#D4AF37', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
});

export default ProfileScreen;
