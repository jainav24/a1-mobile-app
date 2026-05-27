import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const dummyNotifications = [
    {
        id: '1',
        icon: 'sparkles',
        title: 'AI Layout Ready',
        description: 'Your AI-generated temple layout for "Grand Shiva Temple" is ready to view.',
        time: '2 min ago',
    },
    {
        id: '2',
        icon: 'cloud-done',
        title: 'Project Synced',
        description: 'Your project "Modern Vedic Hall" has been synced to the cloud successfully.',
        time: '1 hour ago',
    },
    {
        id: '3',
        icon: 'ribbon',
        title: 'Subscription Renewed',
        description: 'Your A1 Pro subscription has been renewed for another month.',
        time: '3 hours ago',
    },
    {
        id: '4',
        icon: 'download',
        title: 'Export Complete',
        description: 'Your design export for "Zen Meditation Pavilion" is ready for download.',
        time: 'Yesterday',
    },
    {
        id: '5',
        icon: 'people',
        title: 'Team Invite',
        description: 'You have been invited to collaborate on "Heritage Restoration" project.',
        time: '2 days ago',
    },
];

const NotificationScreen = ({ navigation }) => {
    const { colors } = useTheme();

    const renderNotification = ({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.inputBg }]}>
                <Ionicons name={item.icon} size={20} color="#D4AF37" />
            </View>
            <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={[styles.cardTime, { color: colors.textMuted }]}>{item.time}</Text>
                </View>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                </Text>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No new notifications</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                You're all caught up! Check back later.
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.statusBar} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
                    <View style={{ width: 40 }} />
                </View>

                <FlatList
                    data={dummyNotifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNotification}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                />
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
    listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 16,
        boxShadow: '0px 4px 10px rgba(0,0,0,0.06)',
        elevation: 3,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    cardContent: { flex: 1 },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
    cardTime: { fontSize: 11, fontWeight: '600' },
    cardDesc: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 120,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 6 },
    emptySubtitle: { fontSize: 14, fontWeight: '500' },
});

export default NotificationScreen;
