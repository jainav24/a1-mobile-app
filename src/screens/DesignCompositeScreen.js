/**
 * DesignCompositeScreen.js
 *
 * Three sequential sections:
 *   A — Composition Preview (layered asset composite on white bg, captured via captureRef)
 *   B — AI 3-View Generation (material selector → Gemini call → protected image)
 *   C — Navigate to DesignResultScreen with all data
 */

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

export default function DesignCompositeScreen({ navigation, route }) {
    const { wizard: initialWizard } = route.params || {};
    const wizard = initialWizard || {};
    const assets = wizard.selectedAssets || {};
    const designType = wizard.designType || 'Structure';

    // Section B state
    const [showGenerateSection, setShowGenerateSection] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState('Marble');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedViewsImageUri, setGeneratedViewsImageUri] = useState(null);

    // Composite capture
    const [compositeUri, setCompositeUri] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const compositeRef = useRef(null);

    const { isPremium } = useSubscription();

    // Capture composite after 800ms on mount
    useEffect(() => {
        const timer = setTimeout(captureComposite, 800);
        return () => clearTimeout(timer);
    }, []);

    const captureComposite = async () => {
        setIsCapturing(true);
        try {
            if (!compositeRef.current) return;
            const uri = await captureRef(compositeRef, { format: 'jpg', quality: 0.8 });
            setCompositeUri(uri);
        } catch (e) {
            console.warn('[DesignComposite] Composite capture failed:', e);
        } finally {
            setIsCapturing(false);
        }
    };

    // Build asset name list for prompts
    const assetNameList = () => {
        return Object.entries(assets)
            .filter(([, v]) => v)
            .map(([cat, asset]) => `${cat}: ${asset.name}`)
            .join(', ');
    };

    // Section B — Generate 3-view renders
    const handle3ViewGenerate = async () => {
        if (!isPremium) {
            Alert.alert(
                '✨ Premium Feature',
                'AI 3-View Generation is a Premium feature. Upgrade to unlock it.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Upgrade', onPress: () => navigation.navigate('SubscriptionScreen') },
                ]
            );
            return;
        }

        setIsGenerating(true);
        try {
            const components = assetNameList();
            const prompt =
                `Create a professional architectural visualization sheet showing a ${designType} ` +
                `structure with these components: ${components || designType + ' components'}. ` +
                `Material: ${selectedMaterial}. ` +
                `Show THREE views side by side on a clean white background: ` +
                `Left view: FRONT ELEVATION (facing forward) ` +
                `Center view: SIDE ELEVATION (45 degree angle) ` +
                `Right view: TOP VIEW / PLAN VIEW ` +
                `Each view clearly labeled. ` +
                `Clean white background, professional architectural drawing style, ultra detailed.`;

            const imageUri = await generateDesignImage(prompt, null);
            if (imageUri) {
                setGeneratedViewsImageUri(imageUri);
            } else {
                Alert.alert('Generation Failed', 'Could not generate renders. Please try again.');
            }
        } catch (e) {
            console.error('[DesignComposite] 3-view generation error:', e);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Section C — Navigate to DesignResultScreen
    const handlePlaceInLocation = () => {
        navigation.navigate('DesignResultScreen', {
            wizardState: wizard,
            material: selectedMaterial,
            compositeUri: compositeUri || null,
            generatedViewsImageUri: generatedViewsImageUri || null,
            designType,
        });
    };

    // Image uri helper
    const assetUri = (asset) => asset?.thumbnailUrl || asset?.fileUrl || null;

    return (
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Design Composite</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* ══════════════════════════════════════════════
                    SECTION A — COMPOSITION PREVIEW
                ══════════════════════════════════════════════ */}
                <Text style={styles.sectionTitle}>Your Design Composition 🏛️</Text>
                <Text style={styles.sectionSubtitle}>
                    Here's how your selected elements come together
                </Text>

                {/* Composite container — white bg, captured by captureRef */}
                <View
                    ref={compositeRef}
                    style={styles.compositeBox}
                    collapsable={false}
                >
                    {/* White background */}
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />

                    {/* ROOF layer — top 10, centered, 80% wide, 30% tall */}
                    {assetUri(assets.Roof) ? (
                        <Image
                            source={{ uri: assetUri(assets.Roof) }}
                            style={styles.layerRoof}
                            resizeMode="contain"
                            onError={() => {}}
                        />
                    ) : null}

                    {/* LEFT PILLAR */}
                    {assetUri(assets.Pillar) ? (
                        <Image
                            source={{ uri: assetUri(assets.Pillar) }}
                            style={styles.layerPillarLeft}
                            resizeMode="contain"
                            onError={() => {}}
                        />
                    ) : null}

                    {/* RIGHT PILLAR */}
                    {assetUri(assets.Pillar) ? (
                        <Image
                            source={{ uri: assetUri(assets.Pillar) }}
                            style={styles.layerPillarRight}
                            resizeMode="contain"
                            onError={() => {}}
                        />
                    ) : null}

                    {/* LEFT WALL */}
                    {assetUri(assets.Wall) ? (
                        <Image
                            source={{ uri: assetUri(assets.Wall) }}
                            style={styles.layerWallLeft}
                            resizeMode="stretch"
                            onError={() => {}}
                        />
                    ) : null}

                    {/* RIGHT WALL */}
                    {assetUri(assets.Wall) ? (
                        <Image
                            source={{ uri: assetUri(assets.Wall) }}
                            style={styles.layerWallRight}
                            resizeMode="stretch"
                            onError={() => {}}
                        />
                    ) : null}

                    {/* BASE layer — full width, bottom 22% */}
                    {assetUri(assets.Base) ? (
                        <Image
                            source={{ uri: assetUri(assets.Base) }}
                            style={styles.layerBase}
                            resizeMode="stretch"
                            onError={() => {}}
                        />
                    ) : null}

                    {/* Empty state */}
                    {!Object.values(assets).some(Boolean) && (
                        <View style={styles.compositePlaceholder}>
                            <Ionicons name="construct-outline" size={36} color="rgba(180,160,100,0.4)" />
                            <Text style={styles.compositePlaceholderText}>
                                No assets selected
                            </Text>
                        </View>
                    )}

                    {/* Watermark */}
                    <View style={styles.compositeWatermark} pointerEvents="none">
                        <Text style={styles.compositeWatermarkText}>A1 Design © Preview</Text>
                    </View>

                    {/* Capture loading */}
                    {isCapturing && (
                        <View style={styles.captureOverlay}>
                            <ActivityIndicator size="small" color={GOLD} />
                        </View>
                    )}
                </View>

                {/* Design summary below composite */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Design Details</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Type</Text>
                        <Text style={styles.summaryVal}>{designType}</Text>
                    </View>
                    {['Pillar', 'Base', 'Roof', 'Wall'].map(cat => (
                        <View key={cat} style={styles.summaryRow}>
                            <Text style={styles.summaryKey}>{cat}</Text>
                            <Text style={[styles.summaryVal, !assets[cat] && styles.summaryValGray]}>
                                {assets[cat]?.name || 'Not selected'}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* CTA to section B */}
                {!showGenerateSection && (
                    <TouchableOpacity
                        style={styles.goldBtn}
                        onPress={() => setShowGenerateSection(true)}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="sparkles" size={18} color="#0A0A1A" />
                        <Text style={styles.goldBtnText}>Looks good? Generate renders →</Text>
                    </TouchableOpacity>
                )}

                {/* ══════════════════════════════════════════════
                    SECTION B — AI 3-VIEW GENERATION
                ══════════════════════════════════════════════ */}
                {showGenerateSection && (
                    <View>
                        <View style={styles.sectionDivider} />
                        <Text style={styles.sectionTitle}>Choose Material ✨</Text>
                        <Text style={styles.sectionSubtitle}>
                            Select the material for your 3-view architectural render
                        </Text>

                        {/* Material selector — horizontal scroll */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.materialScroll}
                            contentContainerStyle={styles.materialScrollContent}
                        >
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
                                        <Text style={[styles.materialName, { color: mat.textColor }]}>
                                            {mat.id}
                                        </Text>
                                        {isSel && (
                                            <View style={styles.materialCheck}>
                                                <Ionicons name="checkmark-circle" size={16} color={GOLD} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Generate button */}
                        {!generatedViewsImageUri && (
                            <TouchableOpacity
                                style={[styles.goldBtn, isGenerating && { opacity: 0.6 }]}
                                onPress={handle3ViewGenerate}
                                disabled={isGenerating}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="cube-outline" size={18} color="#0A0A1A" />
                                <Text style={styles.goldBtnText}>Generate 3 Views</Text>
                            </TouchableOpacity>
                        )}

                        {/* 3-view image result */}
                        {generatedViewsImageUri && (
                            <View style={styles.generatedImageWrapper}>
                                {/* Touch blocker + image */}
                                <View
                                    style={styles.generatedImageContainer}
                                    accessible={false}
                                    accessibilityElementsHidden
                                    importantForAccessibility="no-hide-descendants"
                                >
                                    <Image
                                        source={{ uri: generatedViewsImageUri }}
                                        style={styles.generatedImage}
                                        resizeMode="contain"
                                        onError={() => {}}
                                    />
                                    {/* Transparent overlay blocking touch/save */}
                                    <View style={StyleSheet.absoluteFill} pointerEvents="box-only" />
                                    {/* Watermark */}
                                    <View style={styles.watermarkContainer} pointerEvents="none">
                                        <Text style={styles.watermark}>A1 Design © Protected</Text>
                                    </View>
                                </View>

                                {/* Section C CTA */}
                                <Text style={styles.happyText}>
                                    Happy with this design?{'\n'}Now place it in your location →
                                </Text>
                                <TouchableOpacity
                                    style={styles.goldBtn}
                                    onPress={handlePlaceInLocation}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name="location-outline" size={18} color="#0A0A1A" />
                                    <Text style={styles.goldBtnText}>Place in My Location →</Text>
                                </TouchableOpacity>

                                {/* Regenerate with different material */}
                                <TouchableOpacity
                                    style={styles.regenBtn}
                                    onPress={() => setGeneratedViewsImageUri(null)}
                                >
                                    <Text style={styles.regenText}>Regenerate with different material</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

            </ScrollView>

            {/* Generating overlay */}
            <Modal visible={isGenerating} transparent animationType="fade">
                <View style={styles.genOverlay}>
                    <ActivityIndicator size="large" color={GOLD} />
                    <Text style={styles.genTitle}>Generating 3 views...</Text>
                    <Text style={styles.genSubtitle}>Creating front, side & top elevations</Text>
                    <Text style={styles.genSubtitle}>This may take 20–40 seconds</Text>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const COMPOSITE_H = 320;
const COMPOSITE_W = SW - 32;

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
    scrollContent: { padding: 20, paddingBottom: 60 },

    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 6 },
    sectionSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 18 },
    sectionDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.07)',
        marginVertical: 28,
    },

    // ── Composite box ──────────────────────────────────────────────────────────
    compositeBox: {
        width: COMPOSITE_W,
        height: COMPOSITE_H,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        marginBottom: 20,
        alignSelf: 'center',
        position: 'relative',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 4,
    },

    // Asset layers (all absolute, transparent bg)
    layerRoof: {
        position: 'absolute',
        top: 10,
        left: '10%',
        width: '80%',
        height: '30%',
        backgroundColor: 'transparent',
    },
    layerPillarLeft: {
        position: 'absolute',
        left: '8%',
        bottom: '20%',
        width: '12%',
        height: '48%',
        backgroundColor: 'transparent',
    },
    layerPillarRight: {
        position: 'absolute',
        right: '8%',
        bottom: '20%',
        width: '12%',
        height: '48%',
        backgroundColor: 'transparent',
    },
    layerWallLeft: {
        position: 'absolute',
        left: 0,
        bottom: '20%',
        width: '10%',
        height: '50%',
        backgroundColor: 'transparent',
    },
    layerWallRight: {
        position: 'absolute',
        right: 0,
        bottom: '20%',
        width: '10%',
        height: '50%',
        backgroundColor: 'transparent',
    },
    layerBase: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '22%',
        backgroundColor: 'transparent',
    },

    // Empty state inside composite
    compositePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    compositePlaceholderText: {
        color: 'rgba(180,160,100,0.5)',
        fontSize: 13,
        textAlign: 'center',
    },

    // Watermark
    compositeWatermark: {
        position: 'absolute',
        bottom: 8,
        right: 10,
    },
    compositeWatermarkText: {
        color: 'rgba(150,130,80,0.6)',
        fontSize: 9,
        fontWeight: '600',
    },

    // Capture overlay
    captureOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Summary card ───────────────────────────────────────────────────────────
    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    summaryTitle: { fontSize: 13, fontWeight: '800', color: GOLD, marginBottom: 12, letterSpacing: 0.5 },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    summaryKey: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600' },
    summaryVal: { color: '#FFF', fontSize: 12, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
    summaryValGray: { color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' },

    // ── Gold CTA button ────────────────────────────────────────────────────────
    goldBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: GOLD,
        borderRadius: 16,
        height: 56,
        marginBottom: 12,
    },
    goldBtnText: { fontSize: 15, fontWeight: '900', color: '#0A0A1A' },

    // ── Material selector ──────────────────────────────────────────────────────
    materialScroll: { marginBottom: 20 },
    materialScrollContent: { paddingRight: 8 },
    materialCard: {
        width: 88,
        height: 88,
        borderRadius: 16,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    materialCardSelected: { borderColor: GOLD },
    materialEmoji: { fontSize: 22, marginBottom: 4 },
    materialName: { fontSize: 11, fontWeight: '800' },
    materialCheck: { position: 'absolute', top: 6, right: 6 },

    // ── Generated 3-view image ─────────────────────────────────────────────────
    generatedImageWrapper: { marginTop: 8 },
    generatedImageContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1A1A2E',
        position: 'relative',
        marginBottom: 16,
    },
    generatedImage: { width: '100%', height: '100%' },
    watermarkContainer: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    watermark: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },

    happyText: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },

    regenBtn: { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
    regenText: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },

    // ── Generating overlay ─────────────────────────────────────────────────────
    genOverlay: {
        flex: 1,
        backgroundColor: 'rgba(5,5,15,0.97)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
    },
    genTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 8 },
    genSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
});
