import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const ProfileCard = ({ name, email, profileImage, onEdit, onPickImage, colors }) => {
    return (
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.profileInfo}>
                <TouchableOpacity 
                    style={[styles.avatarContainer, { borderColor: colors.primary }]}
                    onPress={onPickImage}
                    activeOpacity={0.8}
                >
                    {profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.inputBg }]}>
                            <Ionicons name="person" size={40} color={colors.textMuted} />
                        </View>
                    )}
                    <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                        <Ionicons name="camera" size={12} color="#FFF" />
                    </View>
                </TouchableOpacity>

                <View style={styles.nameSection}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                            {name || 'User'}
                        </Text>
                        <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.proText}>A1 PRO</Text>
                        </View>
                    </View>
                    <Text style={[styles.userEmail, { color: colors.subText }]} numberOfLines={1}>
                        {email}
                    </Text>
                    <TouchableOpacity style={styles.editLabel} onPress={onEdit}>
                        <Text style={[styles.editText, { color: colors.primary }]}>Edit Name</Text>
                        <Ionicons name="pencil" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.premiumBtn, { backgroundColor: colors.primary + '15' }]}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons name="star-circle" size={20} color={colors.primary} />
                <Text style={[styles.premiumText, { color: colors.primary }]}>Manage Subscription</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
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
        width: 76, 
        height: 76, 
        borderRadius: 38, 
        borderWidth: 2, 
        padding: 2,
        position: 'relative',
    },
    avatarImage: { width: '100%', height: '100%', borderRadius: 36 },
    avatarPlaceholder: { flex: 1, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
    cameraBadge: { 
        position: 'absolute', 
        bottom: 0, 
        right: 0, 
        width: 24, 
        height: 24, 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    nameSection: { marginLeft: 16, flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    userName: { fontSize: 20, fontWeight: '900', marginRight: 8, maxWidth: '65%' },
    proBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    proText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
    userEmail: { fontSize: 13, fontWeight: '600', opacity: 0.7, marginBottom: 6 },
    editLabel: { flexDirection: 'row', alignItems: 'center' },
    editText: { fontSize: 13, fontWeight: '700' },
    premiumBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 12, 
        paddingHorizontal: 16, 
        borderRadius: 16 
    },
    premiumText: { flex: 1, marginLeft: 10, fontSize: 13, fontWeight: '700' },
});

export default ProfileCard;
