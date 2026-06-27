import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Image, Alert, Dimensions, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import { useSubscription } from '../hooks/useSubscription';
import { generateDesignImage } from '../services/imageGenerationService';
import { auth } from '../../lib/firebase';

const { width: SW } = Dimensions.get('window');
const GOLD = '#D4AF37';

const MATERIALS = [
    { id: 'Marble',    color: '#F0F0F0', textColor: '#333', emoji: '🪨' },
    { id: 'Granite',   color: '#3A3A3A', textColor: '#EEE', emoji: '⬛' },
    { id: 'Rock',      color: '#7D6B52', textColor: '#EEE', emoji: '🪨' },
    { id: 'Sandstone', color: '#E8C97A', textColor: '#333', emoji: '🟡' },
    { id: 'Brick',     color: '#B5452B', textColor: '#EEE', emoji: '🧱' },
    { id: 'Wood',      color: '#8B5E3C', textColor: '#EEE', emoji: '🪵' },
    { id: 'Concrete',  color: '#9E9E9E', textColor: '#EEE', emoji: '🔘' },
];

export default function DesignSummaryScreen({ navigation, route }) {
    const { wizard: initialWizard } = route.params || {};
    const [wizard, setWizard] = useState(initialWizard || {});
    const [selectedMaterial, setSelectedMaterial] = useState(wizard.material || 'Marble');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const compositeRef = useRef(null);
    const { isPremium } = useSubscription();

    // Capture composite preview on mount
    useEffect(() => {
        const timer = setTimeout(captureComposite, 800);
        return () => clearTimeout(timer);
    }, []);

    const captureComposite = async () => {
        setIsCapturing(true);
        try {
            if (!compositeRef.current) return;
            const uri = await captureRef(compositeRef, { format: 'jpg', quality: 0.7 });
            setWizard(prev => ({ ...prev, compositeImageBase64: uri }));
        } catch (e) {
            console.warn('[DesignSummary] Composite capture failed:', e);
        } finally {
            setIsCapturing(false);
        }
    };

    const buildPrompt = () => {
        const d = wizard.dimensions || {};
        const assets = wizard.selectedAssets || {};
        const assetNames = Object.entries(assets)
            .filter(([, v]) => v)
            .map(([cat, asset]) => `${cat}: ${asset.name}`)
            .join(', ');
        const dimStr = `${d.length || '?'}×${d.width || '?'}×${d.height || '?'} ${d.unit || 'feet'}`;
        const locationPart = wizard.locationPhotoBase64
            ? `Place this design into the provided location photo realistically, matching the lighting and environment. Make it look like it was actually built there.`
            : `Create a standalone professional architectural render.`;

        return (
            `Create a photorealistic architectural visualization of a ${wizard.designType || 'structure'} with the following specifications:\n` +
            `- Material: ${selectedMaterial}\n` +
            `- Dimensions: ${dimStr}\n` +
            (assetNames ? `- Style components: ${assetNames}\n` : '') +
            `${locationPart}\n` +
            `Ultra detailed, 8K quality, professional architectural photography.`
        );
    };

    const handleGenerate = async () => {
        if (!isPremium) {
            Alert.alert(
                '✨ Premium Feature',
                'AI Image Generation is a Premium feature. Upgrade to unlock it.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Upgrade', onPress: () => navigation.navigate('SubscriptionScreen') },
                ]
            );
            return;
        }

        setIsGenerating(true);
        try {
            const prompt = buildPrompt();
            const imageUri = await generateDesignImage(prompt, wizard.locationPhotoBase64 || null);
            if (imageUri) {
                navigation.navigate('DesignResultScreen', {
                    wizard: { ...wizard, material: selectedMaterial },
                    generatedImageUri: imageUri,
                });
            } else {
                Alert.alert('Generation Failed', 'Could not generate image. Please try again.');
            }
        } catch (e) {
            console.error('[DesignSummary] Generation error:', e);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const assets = wizard.selectedAssets || {};
    const dims = wizard.dimensions || {};
    const unitSuffix = dims.unit === 'feet' ? 'ft' : 'm';
    const hasDims = dims.length || dims.width || dims.height;

    return (
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Design Summary</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* ── COMPOSITE PREVIEW ── */}
                <Text style={styles.sectionTitle}>Your Design Preview 🎨</Text>
                <Text style={styles.sectionSubtitle}>Here's how your design looks at your location</Text>

                {/* 300px fixed-height composite container */}
                <View
                    ref={compositeRef}
                    style={styles.compositeBox}
                    collapsable={false}
                >
                    {/* LAYER 1 — Background */}
                    {wizard.locationPhotoBase64 ? (
                        <Image
                            source={{ uri: `data:image/jpeg;base64,${wizard.locationPhotoBase64}` }}
                            style={StyleSheet.absoluteFill}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#E8E4DC' }]} />
                    )}

                    {/* LAYER 2 — BASE: full width, bottom 22% height, stretch */}
                    {(assets.Base?.fileUrl || assets.Base?.thumbnailUrl) ? (
                        <Image
                            source={{ uri: assets.Base.fileUrl || assets.Base.thumbnailUrl }}
                            style={styles.overlayBase}
                            resizeMode="stretch"
                        />
                    ) : null}

                    {/* LAYER 3 — WALL: left & right, 15% wide, 55% tall, sits on base */}
                    {(assets.Wall?.fileUrl || assets.Wall?.thumbnailUrl) ? (
                        <>
                            <Image
                                source={{ uri: assets.Wall.fileUrl || assets.Wall.thumbnailUrl }}
                                style={styles.overlayWallLeft}
                                resizeMode="stretch"
                            />
                            <Image
                                source={{ uri: assets.Wall.fileUrl || assets.Wall.thumbnailUrl }}
                                style={styles.overlayWallRight}
                                resizeMode="stretch"
                            />
                        </>
                    ) : null}

                    {/* LAYER 4 — PILLAR: left & right corners, 12% wide, 50% tall, contain */}
                    {(assets.Pillar?.fileUrl || assets.Pillar?.thumbnailUrl) ? (
                        <>
                            <Image
                                source={{ uri: assets.Pillar.fileUrl || assets.Pillar.thumbnailUrl }}
                                style={styles.overlayPillarLeft}
                                resizeMode="contain"
                            />
                            <Image
                                source={{ uri: assets.Pillar.fileUrl || assets.Pillar.thumbnailUrl }}
                                style={styles.overlayPillarRight}
                                resizeMode="contain"
                            />
                        </>
                    ) : null}

                    {/* LAYER 5 — ROOF: top, 90% wide, 35% tall, stretch */}
                    {(assets.Roof?.fileUrl || assets.Roof?.thumbnailUrl) ? (
                        <Image
                            source={{ uri: assets.Roof.fileUrl || assets.Roof.thumbnailUrl }}
                            style={styles.overlayRoof}
                            resizeMode="stretch"
                        />
                    ) : null}

                    {/* LAYER 6 — WATERMARK */}
                    <View style={styles.compositeWatermark} pointerEvents="none">
                        <Text style={styles.compositeWatermarkText}>A1 Design © Preview</Text>
                    </View>

                    {/* Empty state — no photo and no assets */}
                    {!wizard.locationPhotoBase64 && !Object.values(assets).some(Boolean) && (
                        <View style={styles.compositePlaceholder}>
                            <Text style={styles.compositePlaceholderText}>
                                Select assets to preview your design
                            </Text>
                        </View>
                    )}

                    {/* Capture loading overlay */}
                    {isCapturing && (
                        <View style={styles.captureOverlay}>
                            <ActivityIndicator size="small" color={GOLD} />
                        </View>
                    )}
                </View>

                {/* ── DESIGN SUMMARY ── */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Design Details</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Type</Text>
                        <Text style={styles.summaryVal}>{wizard.designType || '—'}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Dimensions</Text>
                        <Text style={styles.summaryVal}>
                            {hasDims
                                ? `${dims.length || '—'}${unitSuffix} × ${dims.width || '—'}${unitSuffix} × ${dims.height || '—'}${unitSuffix}`
                                : 'Not specified'}
                        </Text>
                    </View>
                    {['Pillar', 'Base', 'Roof', 'Wall'].map(cat => (
                        <View key={cat} style={styles.summaryRow}>
                            <Text style={styles.summaryKey}>{cat}</Text>
                            <Text style={[styles.summaryVal, !assets[cat] && styles.summaryValGray]}>
                                {assets[cat]?.name || 'Auto-selected'}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* ── MATERIAL SELECTION ── */}
                <Text style={styles.sectionTitle}>Choose Your Material ✨</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.materialScroll}>
                    {MATERIALS.map((mat) => {
                        const isSel = selectedMaterial === mat.id;
                        return (
                            <TouchableOpacity
                                key={mat.id}
                                style={[
                                    styles.materialCard,
                                    { backgroundColor: mat.color },
                                    isSel && styles.materialCardSelected,
                                ]}
                                onPress={() => setSelectedMaterial(mat.id)}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.materialEmoji}>{mat.emoji}</Text>
                                <Text style={[styles.materialName, { color: mat.textColor }]}>{mat.id}</Text>
                                {isSel && <View style={styles.materialCheck}><Ionicons name="checkmark-circle" size={16} color={GOLD} /></View>}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* ── GENERATE ── */}
                <TouchableOpacity
                    style={[styles.generateBtn, isGenerating && { opacity: 0.7 }]}
                    onPress={handleGenerate}
                    disabled={isGenerating}
                    activeOpacity={0.85}
                >
                    <Ionicons name="sparkles" size={20} color="#0A0A1A" />
                    <Text style={styles.generateBtnText}>✨ Generate Final Design</Text>
                </TouchableOpacity>
                <Text style={styles.generateHint}>
                    AI will render your design realistically in your location
                </Text>
            </ScrollView>

            {/* Generating overlay */}
            <Modal visible={isGenerating} transparent animationType="fade">
                <View style={styles.genOverlay}>
                    <ActivityIndicator size="large" color={GOLD} />
                    <Text style={styles.genTitle}>Creating your vision...</Text>
                    <Text style={styles.genSubtitle}>This may take 15–30 seconds</Text>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#07071A' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.07)',
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
    scrollContent: { padding: 20, paddingBottom: 50 },

    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 6 },
    sectionSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 18 },

    // Composite preview — 300px container
    // Heights expressed as px (22% of 300 = 66, 55% = 165, 50% = 150, 35% = 105)
    // Widths expressed as % strings for flexibility
    COMPOSITE_H: 300,
    compositeBox: {
        width: SW - 32,
        height: 300,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#E8E4DC',
        marginBottom: 24,
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.2)',
        alignSelf: 'center',
    },
    // Layer 2 — Base: full width, bottom 22% (66px)
    overlayBase: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: 66,
        backgroundColor: 'transparent',
    },
    // Layer 3 — Walls: 15% wide, 55% tall (165px), bottom 22% (66px)
    overlayWallLeft: {
        position: 'absolute',
        left: 0,
        bottom: 66,
        width: '15%',
        height: 165,
        backgroundColor: 'transparent',
    },
    overlayWallRight: {
        position: 'absolute',
        right: 0,
        bottom: 66,
        width: '15%',
        height: 165,
        backgroundColor: 'transparent',
    },
    // Layer 4 — Pillars: left 8%, right 8%, 12% wide, 50% tall (150px), bottom 22% (66px)
    overlayPillarLeft: {
        position: 'absolute',
        left: '8%',
        bottom: 66,
        width: '12%',
        height: 150,
        backgroundColor: 'transparent',
    },
    overlayPillarRight: {
        position: 'absolute',
        right: '8%',
        bottom: 66,
        width: '12%',
        height: 150,
        backgroundColor: 'transparent',
    },
    // Layer 5 — Roof: top, 5% from each side, 35% tall (105px)
    overlayRoof: {
        position: 'absolute',
        top: 0,
        left: '5%',
        right: '5%',
        width: '90%',
        height: 105,
        backgroundColor: 'transparent',
    },
    // Layer 6 — Watermark
    compositeWatermark: {
        position: 'absolute',
        bottom: 8,
        right: 10,
    },
    compositeWatermarkText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 9,
        fontWeight: '600',
    },
    // Empty state
    compositePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    compositePlaceholderText: { color: 'rgba(80,70,50,0.5)', fontSize: 13, textAlign: 'center' },
    // Capture overlay
    captureOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Summary card
    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    summaryTitle: { fontSize: 14, fontWeight: '800', color: GOLD, marginBottom: 12, letterSpacing: 0.5 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    summaryKey: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600' },
    summaryVal: { color: '#FFF', fontSize: 12, fontWeight: '700', maxWidth: '55%', textAlign: 'right' },
    summaryValGray: { color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' },

    // Material
    materialScroll: { marginBottom: 28 },
    materialCard: {
        width: 90, height: 90, borderRadius: 16, marginRight: 10,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'transparent',
        position: 'relative',
    },
    materialCardSelected: { borderColor: GOLD },
    materialEmoji: { fontSize: 22, marginBottom: 4 },
    materialName: { fontSize: 11, fontWeight: '800' },
    materialCheck: { position: 'absolute', top: 6, right: 6 },

    // Generate
    generateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: GOLD,
        borderRadius: 16,
        height: 58,
        marginBottom: 10,
    },
    generateBtnText: { fontSize: 16, fontWeight: '900', color: '#0A0A1A' },
    generateHint: { color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', marginBottom: 8 },

    // Generating overlay
    genOverlay: {
        flex: 1,
        backgroundColor: 'rgba(5,5,15,0.97)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    genTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 8 },
    genSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
});
