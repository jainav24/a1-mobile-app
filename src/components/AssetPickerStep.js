import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image,
    FlatList, ActivityIndicator, Dimensions, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useSubscription } from '../hooks/useSubscription';

const { width: SW } = Dimensions.get('window');
const GOLD = '#D4AF37';
const CARD_W = (SW - 48 - 12) / 2;

const AssetPickerStep = ({
    category,
    title,
    subtitle,
    icon,
    selectedAsset,
    onAssetSelect,
    locationPhotoBase64,
    designType,
    onBack,
    onNext,
    onSkip,
    isLastStep = false,
    showWhitePreview = false,
}) => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isPremium } = useSubscription();

    useEffect(() => {
        fetchAssets();
    }, [category]);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'assets'),
                where('isActive', '==', true),
                where('category', '==', category)
            );
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAssets(list);
        } catch (e) {
            console.warn('[AssetPickerStep] Firestore fetch error:', e);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        // Pick a random asset if available, else null
        if (assets.length > 0) {
            const random = assets[Math.floor(Math.random() * assets.length)];
            onSkip(random);
        } else {
            onSkip(null);
        }
    };

    const handleConfirm = () => {
        if (!selectedAsset && assets.length > 0) {
            // Auto-pick random if nothing selected
            const random = assets[Math.floor(Math.random() * assets.length)];
            onAssetSelect(random);
            setTimeout(() => onNext(), 100);
        } else {
            onNext();
        }
    };

    const renderAssetCard = ({ item }) => {
        const isSelected = selectedAsset?.id === item.id;
        const isPrem = item.isPremium && !isPremium;
        return (
            <TouchableOpacity
                style={[styles.assetCard, isSelected && styles.assetCardSelected]}
                onPress={() => onAssetSelect(isSelected ? null : item)}
                activeOpacity={0.8}
            >
                {/* Thumbnail */}
                <View style={styles.thumbWrap}>
                    <Image
                        source={{ uri: item.thumbnailUrl || item.fileUrl }}
                        style={styles.thumb}
                        resizeMode="contain"
                        defaultSource={require('../../assets/images/icon.png')}
                    />
                    {isPrem && (
                        <View style={styles.premiumOverlay}>
                            <Ionicons name="lock-closed" size={18} color={GOLD} />
                        </View>
                    )}
                    {isSelected && (
                        <View style={styles.checkOverlay}>
                            <Ionicons name="checkmark-circle" size={22} color={GOLD} />
                        </View>
                    )}
                </View>
                <Text style={[styles.assetName, isSelected && styles.assetNameSelected]} numberOfLines={2}>
                    {item.name}
                </Text>
                {isPrem && <Text style={styles.premiumBadge}>✦ Premium</Text>}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Step header */}
                <View style={styles.stepHeader}>
                    <Text style={styles.stepIcon}>{icon}</Text>
                    <Text style={styles.stepTitle}>{title}</Text>
                    <Text style={styles.stepSubtitle}>
                        {subtitle.replace('[designType]', designType || 'design')}
                    </Text>
                </View>

                {/* Asset grid */}
                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={GOLD} />
                        <Text style={styles.loadingText}>Loading {category} assets...</Text>
                    </View>
                ) : assets.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Ionicons name="images-outline" size={40} color="rgba(255,255,255,0.2)" />
                        <Text style={styles.emptyText}>No {category} assets available yet</Text>
                        <Text style={styles.emptySubtext}>You can still continue to the next step</Text>
                    </View>
                ) : (
                    <FlatList
                        data={assets}
                        renderItem={renderAssetCard}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        scrollEnabled={false}
                        contentContainerStyle={styles.grid}
                    />
                )}

                {/* Live Preview */}
                <View style={styles.previewSection}>
                    <Text style={styles.previewLabel}>
                        {showWhitePreview ? 'Asset Preview' : (locationPhotoBase64 ? '👁️ Preview at your location' : 'Asset Preview')}
                    </Text>

                    {showWhitePreview ? (
                        /* ── WHITE PREVIEW (wizard flow) ── */
                        <View style={styles.whitePreviewBox}>
                            {selectedAsset ? (
                                <Image
                                    source={{ uri: selectedAsset.thumbnailUrl || selectedAsset.fileUrl }}
                                    style={styles.whitePreviewImage}
                                    resizeMode="contain"
                                    onError={() => {}}
                                />
                            ) : (
                                <View style={styles.whitePreviewPlaceholder}>
                                    <Ionicons name="image-outline" size={32} color="rgba(180,160,100,0.4)" />
                                    <Text style={styles.whitePreviewPlaceholderText}>
                                        Tap an asset to preview
                                    </Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        /* ── ORIGINAL PREVIEW (other flows) ── */
                        <View style={styles.previewBox}>
                            {locationPhotoBase64 && (
                                <Image
                                    source={{ uri: `data:image/jpeg;base64,${locationPhotoBase64}` }}
                                    style={StyleSheet.absoluteFill}
                                    resizeMode="cover"
                                />
                            )}
                            {!locationPhotoBase64 && (
                                <View style={styles.previewBg} />
                            )}
                            {selectedAsset ? (
                                <Image
                                    source={{ uri: selectedAsset.fileUrl }}
                                    style={styles.previewAsset}
                                    resizeMode="contain"
                                    onError={() => {}}
                                />
                            ) : (
                                <View style={styles.previewPlaceholder}>
                                    <Text style={styles.previewPlaceholderText}>
                                        Tap an asset above to preview it here
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Selected label (white preview only) */}
                    {showWhitePreview && selectedAsset && (
                        <Text style={styles.whitePreviewLabel}>
                            Selected: {selectedAsset.name}
                        </Text>
                    )}
                </View>
            </ScrollView>

            {/* Bottom bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                    <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                    <Text style={styles.skipBtnText}>Skip</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.nextBtn} onPress={handleConfirm}>
                    <Text style={styles.nextBtnText}>
                        {isLastStep ? 'Finish →' : 'Confirm & Next →'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 20 },
    stepHeader: { alignItems: 'center', paddingTop: 8, paddingBottom: 20, paddingHorizontal: 20 },
    stepIcon: { fontSize: 40, marginBottom: 10 },
    stepTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 6 },
    stepSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 19 },

    loadingBox: { alignItems: 'center', paddingVertical: 40 },
    loadingText: { color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 13 },
    emptyBox: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 14, fontWeight: '600' },
    emptySubtext: { color: 'rgba(255,255,255,0.3)', marginTop: 4, fontSize: 12 },

    grid: { paddingHorizontal: 16 },
    row: { justifyContent: 'space-between', marginBottom: 12 },
    assetCard: {
        width: CARD_W,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
    },
    assetCardSelected: {
        borderColor: GOLD,
        backgroundColor: 'rgba(212,175,55,0.08)',
    },
    thumbWrap: {
        width: CARD_W - 24,
        height: CARD_W - 24,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.04)',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumb: { width: '100%', height: '100%' },
    premiumOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkOverlay: {
        position: 'absolute',
        top: 6,
        right: 6,
    },
    assetName: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 15,
    },
    assetNameSelected: { color: GOLD },
    premiumBadge: { color: GOLD, fontSize: 9, fontWeight: '800', marginTop: 2 },

    previewSection: { marginHorizontal: 16, marginTop: 8 },
    previewLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    // Original dark preview (non-wizard flows)
    previewBox: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1A1A2E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.2)',
    },
    previewBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1A1A2E' },
    previewAsset: {
        width: '40%',
        height: '70%',
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
    },
    previewPlaceholder: { alignItems: 'center', paddingHorizontal: 30 },
    previewPlaceholderText: {
        color: 'rgba(255,255,255,0.25)',
        fontSize: 13,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // White preview (wizard flow)
    whitePreviewBox: {
        width: '100%',
        height: 180,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderStyle: 'solid',
        borderColor: 'rgba(212,175,55,0.25)',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
        overflow: 'hidden',
    },
    whitePreviewImage: {
        width: '100%',
        height: '100%',
    },
    whitePreviewPlaceholder: {
        alignItems: 'center',
        paddingHorizontal: 30,
        gap: 10,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: 'rgba(212,175,55,0.35)',
        borderRadius: 12,
        width: '85%',
        paddingVertical: 28,
    },
    whitePreviewPlaceholderText: {
        color: 'rgba(180,160,100,0.7)',
        fontSize: 13,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    whitePreviewLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 8,
    },

    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#0A0A1F',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.07)',
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 4 },
    backBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
    skipBtn: { paddingVertical: 8, paddingHorizontal: 12 },
    skipBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' },
    nextBtn: {
        backgroundColor: GOLD,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 12,
    },
    nextBtnText: { color: '#0A0A1A', fontWeight: '800', fontSize: 13 },
});

export default AssetPickerStep;
