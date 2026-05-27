import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, Modal,
    FlatList, ActivityIndicator, Alert, Image,
    Animated, Dimensions, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getActiveAssets } from '../services/assetService';
import { useSubscription } from '../hooks/useSubscription';

const { width: SW, height: SH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_W = (SW - 32 - CARD_GAP) / 2;

const AssetCard = React.memo(({ item, isPremium, onPress }) => {
    const isLocked = item.isPremium && !isPremium;
    const imgUrl = item.thumbnailUrl || item.fileUrl;

    return (
        <TouchableOpacity style={s.assetCard} onPress={() => onPress(item)} activeOpacity={0.7}>
            <View style={s.assetPreview}>
                {imgUrl ? (
                    <Image
                        source={{ uri: imgUrl }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="contain"
                    />
                ) : (
                    <Ionicons name="image-outline" size={36} color="#D4AF37" />
                )}
                {item.isPremium && (
                    <View style={s.premiumBadge}>
                        <Ionicons
                            name={isLocked ? 'lock-closed' : 'star'}
                            size={9}
                            color="#FFF"
                        />
                        <Text style={s.premiumText}>PRO</Text>
                    </View>
                )}
                {isLocked && <View style={s.lockOverlay}><Ionicons name="lock-closed" size={28} color="rgba(212,175,55,0.8)" /></View>}
            </View>
            <Text style={s.assetName} numberOfLines={1}>{item.name}</Text>
            <Text style={s.assetCat} numberOfLines={1}>{item.category}</Text>
        </TouchableOpacity>
    );
});

const A1DesignScreen = ({ isVisible, onClose, onAssetSelect }) => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('All');
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isPremium } = useSubscription();

    const slideAnim = useRef(new Animated.Value(SH)).current;

    useEffect(() => {
        if (isVisible) {
            setLoading(true);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 160,
                mass: 0.8,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SH,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible]);

    useEffect(() => {
        if (!isVisible) return;
        const unsub = getActiveAssets((data) => {
            setAssets(data);
            setLoading(false);
        });
        return unsub;
    }, [isVisible]);

    const categories = useMemo(
        () => ['All', ...new Set(assets.map(a => a.category).filter(Boolean))],
        [assets]
    );

    const filtered = useMemo(
        () => activeTab === 'All' ? assets : assets.filter(a => a.category === activeTab),
        [assets, activeTab]
    );

    const handleAssetPress = useCallback((asset) => {
        if (asset.isPremium && !isPremium) {
            Alert.alert(
                '✨ Premium Asset',
                'This asset requires a Premium plan. Upgrade to unlock all premium assets.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Upgrade to Premium', onPress: onClose },
                ]
            );
            return;
        }
        onAssetSelect(asset);
        onClose();
    }, [isPremium, onAssetSelect, onClose]);

    const renderItem = useCallback(({ item }) => (
        <AssetCard item={item} isPremium={isPremium} onPress={handleAssetPress} />
    ), [isPremium, handleAssetPress]);

    const keyExtractor = useCallback((item) => item.id, []);

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            {/* Dimmed backdrop */}
            <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

            <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
                {/* Handle bar */}
                <View style={s.handleWrap}>
                    <View style={s.handle} />
                </View>

                {/* Header */}
                <View style={s.header}>
                    <View>
                        <Text style={s.headerTitle}>Asset Library</Text>
                        <Text style={s.headerSub}>Tap an asset to place it on canvas</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                        <Ionicons name="close" size={20} color="#888" />
                    </TouchableOpacity>
                </View>

                {/* Category Tabs */}
                <View style={s.tabsWrap}>
                    <FlatList
                        horizontal
                        data={categories}
                        keyExtractor={(c) => c}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={s.tabsScroll}
                        renderItem={({ item: cat }) => (
                            <TouchableOpacity
                                style={[s.tab, activeTab === cat && s.activeTab]}
                                onPress={() => setActiveTab(cat)}
                            >
                                <Text style={[s.tabText, activeTab === cat && s.activeTabText]}>{cat}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* Content */}
                {loading ? (
                    <View style={s.centered}>
                        <ActivityIndicator size="large" color="#D4AF37" />
                        <Text style={s.loadingText}>Loading assets…</Text>
                    </View>
                ) : filtered.length === 0 ? (
                    <View style={s.centered}>
                        <Ionicons name="images-outline" size={52} color="#CCC" />
                        <Text style={s.emptyTitle}>No assets available yet.</Text>
                        <Text style={s.emptyText}>Check back soon.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filtered}
                        keyExtractor={keyExtractor}
                        numColumns={2}
                        contentContainerStyle={s.grid}
                        showsVerticalScrollIndicator={false}
                        renderItem={renderItem}
                        columnWrapperStyle={s.row}
                        removeClippedSubviews
                    />
                )}
            </Animated.View>
        </Modal>
    );
};

const s = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SH * 0.72,
        backgroundColor: '#F7F5F0',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 20,
    },
    handleWrap: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 4,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1a1a1a',
        letterSpacing: 0.2,
    },
    headerSub: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabsWrap: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.04)',
    },
    tabsScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
    },
    activeTab: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
    },
    activeTabText: {
        color: '#FFF',
    },
    grid: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 40,
    },
    row: {
        gap: CARD_GAP,
        marginBottom: CARD_GAP,
    },
    assetCard: {
        width: CARD_W,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    assetPreview: {
        height: 100,
        borderRadius: 12,
        backgroundColor: '#F5F3EE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    premiumBadge: {
        position: 'absolute',
        top: 7,
        right: 7,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D4AF37',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    premiumText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
        marginLeft: 3,
    },
    assetName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    assetCat: {
        fontSize: 10,
        color: '#888',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        color: '#888',
        fontSize: 13,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginTop: 14,
    },
    emptyText: {
        fontSize: 13,
        color: '#888',
        marginTop: 4,
    },
});

export default A1DesignScreen;
