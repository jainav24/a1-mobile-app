/**
 * OrdersScreen.js
 * Lists all orders placed by the current user, ordered by newest first.
 * Pulls live data from Firestore /orders collection.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

const GOLD = '#D4AF37';

const STATUS_CONFIG = {
    pending:   { label: 'Pending',   color: '#F5A623', bg: 'rgba(245,166,35,0.12)'  },
    reviewed:  { label: 'Reviewed',  color: '#4A90D9', bg: 'rgba(74,144,217,0.12)'  },
    completed: { label: 'Completed', color: '#27AE60', bg: 'rgba(39,174,96,0.12)'   },
    cancelled: { label: 'Cancelled', color: '#E74C3C', bg: 'rgba(231,76,60,0.12)'   },
};

const MATERIAL_EMOJI = {
    Marble:    '🏛️',
    Granite:   '🪨',
    Rock:      '⛰️',
    Sandstone: '🌅',
    Brick:     '🧱',
    Wood:      '🪵',
    Concrete:  '🏗️',
};

function formatDate(timestamp) {
    if (!timestamp) return '—';
    const d = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function OrderCard({ item }) {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const emoji  = MATERIAL_EMOJI[item.material] || '🏛️';

    return (
        <View style={s.card}>
            {/* Top row */}
            <View style={s.cardTop}>
                <View style={s.cardIconWrap}>
                    <Text style={s.cardEmoji}>{emoji}</Text>
                </View>
                <View style={s.cardTopText}>
                    <Text style={s.cardTitle} numberOfLines={1}>
                        {item.projectTitle || 'Untitled Project'}
                    </Text>
                    <Text style={s.cardMaterial}>{item.material}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
                    <View style={[s.statusDot, { backgroundColor: status.color }]} />
                    <Text style={[s.statusLabel, { color: status.color }]}>{status.label}</Text>
                </View>
            </View>

            {/* Divider */}
            <View style={s.cardDivider} />

            {/* Bottom row */}
            <View style={s.cardBottom}>
                <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.3)" />
                <Text style={s.cardDate}>{formatDate(item.createdAt)}</Text>
            </View>
        </View>
    );
}

export default function OrdersScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [orders, setOrders]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const subscribeToOrders = useCallback(() => {
        const user = auth.currentUser;
        if (!user) {
            setOrders([]);
            setLoading(false);
            return () => {};
        }

        const q = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setOrders(docs);
                setLoading(false);
                setRefreshing(false);
            },
            (err) => {
                console.error('[OrdersScreen] Firestore error:', err);
                setLoading(false);
                setRefreshing(false);
            }
        );

        return unsub;
    }, []);

    useEffect(() => {
        const unsub = subscribeToOrders();
        return () => unsub && unsub();
    }, [subscribeToOrders]);

    const onRefresh = () => {
        setRefreshing(true);
        // Re-subscribe is not needed since onSnapshot is live;
        // just toggle refreshing off quickly for UX.
        setTimeout(() => setRefreshing(false), 800);
    };

    const renderEmpty = () => (
        <View style={s.emptyWrap}>
            <Ionicons name="receipt-outline" size={56} color="rgba(212,175,55,0.25)" />
            <Text style={s.emptyTitle}>No Orders Yet</Text>
            <Text style={s.emptyDesc}>
                Generate an image on the canvas and tap "Order It Now" to place your first order.
            </Text>
        </View>
    );

    return (
        <View style={[s.root, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity
                    style={s.backBtn}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={20} color="#FFF" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>My Orders</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* List */}
            {loading ? (
                <View style={s.loadingWrap}>
                    <ActivityIndicator size="large" color={GOLD} />
                    <Text style={s.loadingTxt}>Loading orders…</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <OrderCard item={item} />}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={s.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={GOLD}
                            colors={[GOLD]}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#06060F',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        backgroundColor: '#0A0A1F',
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.2,
    },

    listContent: {
        padding: 16,
        gap: 12,
        flexGrow: 1,
    },

    // Order card
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(212,175,55,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.18)',
    },
    cardEmoji:    { fontSize: 22 },
    cardTopText:  { flex: 1 },
    cardTitle:    { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    cardMaterial: { color: GOLD, fontSize: 11, fontWeight: '600', marginTop: 2 },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusDot:   { width: 6, height: 6, borderRadius: 3 },
    statusLabel: { fontSize: 11, fontWeight: '700' },

    cardDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 12,
    },
    cardBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    cardDate: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 11,
        fontWeight: '600',
    },

    // Empty state
    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyTitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 20,
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyDesc: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Loading
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
    },
    loadingTxt: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 13,
    },
});
