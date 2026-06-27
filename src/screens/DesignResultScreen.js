/**
 * DesignResultScreen.js
 *
 * Handles:
 *   Section 1 — Environment photo upload (camera / gallery / skip)
 *   Section 2 — Generate Final Visualization button (Gemini call)
 *   Section 3 — Protected final image + Order button
 */

import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Image, Alert, Dimensions, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { placeOrder } from '../services/orderService';
import { generateDesignImage } from '../services/imageGenerationService';
import { auth } from '../../lib/firebase';

const { width: SW } = Dimensions.get('window');
const GOLD = '#D4AF37';

export default function DesignResultScreen({ navigation, route }) {
    const {
        wizardState = {},
        material = 'Marble',
        compositeUri = null,
        generatedViewsImageUri = null,
        designType = 'Design',
    } = route.params || {};

    const assets = wizardState.selectedAssets || {};

    // Section 1 — photo state
    const [locationPhotoBase64, setLocationPhotoBase64] = useState(null);
    const [locationPhotoUri, setLocationPhotoUri] = useState(null);
    const [skipped, setSkipped] = useState(false);

    // Section 2 — generation state
    const [finalImageUri, setFinalImageUri] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Order state
    const [isOrdering, setIsOrdering] = useState(false);

    const showGenerateButton = locationPhotoBase64 !== null || skipped;

    // ── Image picker ────────────────────────────────────────────────────────────
    const pickImage = async (fromCamera) => {
        try {
            let status;
            if (fromCamera) {
                ({ status } = await ImagePicker.requestCameraPermissionsAsync());
            } else {
                ({ status } = await ImagePicker.requestMediaLibraryPermissionsAsync());
            }
            if (status !== 'granted') {
                Alert.alert(
                    `${fromCamera ? 'Camera' : 'Gallery'} Permission Required`,
                    'Please enable access in your phone Settings app.',
                    [{ text: 'OK' }]
                );
                return;
            }
            const opts = {
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.6,
                base64: true,
                exif: false,
            };
            const result = fromCamera
                ? await ImagePicker.launchCameraAsync(opts)
                : await ImagePicker.launchImageLibraryAsync(opts);
            if (!result.canceled && result.assets?.[0]) {
                setLocationPhotoBase64(result.assets[0].base64 || null);
                setLocationPhotoUri(result.assets[0].uri || null);
                setSkipped(false);
                setFinalImageUri(null); // reset if they change photo
            }
        } catch (e) {
            console.error('[DesignResult] Image picker error:', e);
            Alert.alert('Error', 'Could not open image picker. Please try again.');
        }
    };

    const handleSkip = () => {
        setLocationPhotoBase64(null);
        setLocationPhotoUri(null);
        setSkipped(true);
        setFinalImageUri(null);
    };

    // ── Build prompt ────────────────────────────────────────────────────────────
    const buildPrompt = () => {
        const componentList = Object.entries(assets)
            .filter(([, v]) => v)
            .map(([cat, asset]) => `${cat}: ${asset.name}`)
            .join(', ') || `${designType} components`;

        if (locationPhotoBase64) {
            return (
                `You are an expert architectural visualizer. ` +
                `I have designed a ${designType} with these components: ${componentList}. ` +
                `Material: ${material}. ` +
                `Please place this ${designType} design realistically into the provided location photo. ` +
                `The design should look like it was actually built in this exact environment. ` +
                `Match the lighting, shadows, and perspective of the photo perfectly. ` +
                `Make it photorealistic, ultra detailed, professional architectural visualization.`
            );
        } else {
            return (
                `Create a photorealistic render of a ${designType} with these components: ${componentList}. ` +
                `Material: ${material}. ` +
                `Show it in a beautiful natural outdoor setting with perfect lighting. ` +
                `Ultra detailed, 8K quality, professional architectural photography style.`
            );
        }
    };

    // ── Generate final visualization ────────────────────────────────────────────
    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const prompt = buildPrompt();
            const imageUri = await generateDesignImage(
                prompt,
                locationPhotoBase64 || null
            );
            if (imageUri) {
                setFinalImageUri(imageUri);
            } else {
                Alert.alert('Generation Failed', 'Could not generate the visualization. Please try again.');
            }
        } catch (e) {
            console.error('[DesignResult] Generation error:', e);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Order ───────────────────────────────────────────────────────────────────
    const handleOrder = () => {
        Alert.alert(
            'Place Order?',
            `Our architects will review your design and contact you at ${auth.currentUser?.email || 'your email'} within 24 hours.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes, Place Order', onPress: confirmOrder },
            ]
        );
    };

    const confirmOrder = async () => {
        setIsOrdering(true);
        try {
            const selectedAssetsList = Object.entries(assets)
                .filter(([, v]) => v)
                .map(([category, asset]) => ({
                    category,
                    assetName: asset.name,
                    assetThumbnailUrl: asset.thumbnailUrl || asset.fileUrl || '',
                }));

            const orderId = await placeOrder({
                projectTitle: `${designType} Design`,
                material,
                designType,
                dimensions: wizardState.dimensions || null,
                selectedAssets: selectedAssetsList,
                locationPhotoBase64: locationPhotoBase64 || null,
                compositeImageBase64: compositeUri || null,
                generatedImageBase64: finalImageUri || null,
                threeViewImageBase64: generatedViewsImageUri || null,
                canvasData: null,
            });

            navigation.navigate('OrderConfirmationScreen', {
                material,
                projectTitle: `${designType} Design`,
                userEmail: auth.currentUser?.email || '',
                orderId,
            });
        } catch (e) {
            console.error('[DesignResult] Order error:', e);
            Alert.alert('Error', 'Failed to place order. Please try again.');
        } finally {
            setIsOrdering(false);
        }
    };

    // ── RENDER ──────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Place in Your Location 📍</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* ── SECTION 1 — ENVIRONMENT PHOTO ── */}
                <Text style={styles.sectionTitle}>Your Location Photo</Text>
                <Text style={styles.sectionSubtitle}>
                    Upload a photo of where you want your{' '}
                    <Text style={{ color: GOLD }}>{designType}</Text> to be built
                </Text>

                <View style={styles.uploadBox}>
                    {locationPhotoUri ? (
                        <>
                            <Image
                                source={{ uri: locationPhotoUri }}
                                style={StyleSheet.absoluteFill}
                                resizeMode="cover"
                            />
                            <TouchableOpacity
                                style={styles.changePhotoBtn}
                                onPress={() => pickImage(false)}
                            >
                                <Text style={styles.changePhotoText}>Change Photo</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <Ionicons name="location" size={48} color={GOLD} />
                            <Text style={styles.uploadText}>Upload Your Location Photo</Text>
                            <Text style={styles.uploadSubtext}>
                                A photo of your plot, garden, room, or any space where you want this design built
                            </Text>
                            <View style={styles.uploadBtns}>
                                <TouchableOpacity style={styles.uploadActionBtn} onPress={() => pickImage(true)}>
                                    <Text style={styles.uploadActionText}>📷 Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.uploadActionBtn} onPress={() => pickImage(false)}>
                                    <Text style={styles.uploadActionText}>🖼️ Gallery</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                                <Text style={styles.skipText}>Skip — generate without location</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ── SECTION 2 — GENERATE FINAL IMAGE ── */}
                {showGenerateButton && !finalImageUri && (
                    <TouchableOpacity
                        style={[styles.goldBtn, isGenerating && { opacity: 0.6 }]}
                        onPress={handleGenerate}
                        disabled={isGenerating}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="sparkles" size={18} color="#0A0A1A" />
                        <Text style={styles.goldBtnText}>✨ Generate Final Visualization</Text>
                    </TouchableOpacity>
                )}

                {/* ── SECTION 3 — FINAL IMAGE + ORDER ── */}
                {finalImageUri && (
                    <>
                        {/* Protected image */}
                        <View style={styles.imageWrapper}>
                            <View
                                style={styles.imageContainer}
                                accessible={false}
                                accessibilityElementsHidden
                                importantForAccessibility="no-hide-descendants"
                            >
                                <Image
                                    source={{ uri: finalImageUri }}
                                    style={styles.generatedImage}
                                    resizeMode="cover"
                                    onError={() => {}}
                                />
                                {/* Touch blocker */}
                                <View style={StyleSheet.absoluteFill} pointerEvents="box-only" />
                                {/* Watermark */}
                                <View style={styles.watermarkContainer} pointerEvents="none">
                                    <Text style={styles.watermark}>A1 Design © Protected</Text>
                                </View>
                            </View>
                        </View>

                        {/* Design summary card */}
                        <View style={styles.detailsCard}>
                            <View style={styles.badgeRow}>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{designType}</Text>
                                </View>
                                <View style={[styles.badge, styles.badgeMaterial]}>
                                    <Text style={styles.badgeText}>{material}</Text>
                                </View>
                            </View>

                            {Object.entries(assets).some(([, v]) => v) && (
                                <View style={styles.componentsSection}>
                                    <Text style={styles.componentsLabel}>Components</Text>
                                    {Object.entries(assets)
                                        .filter(([, v]) => v)
                                        .map(([category, asset]) => (
                                            <View key={category} style={styles.componentRow}>
                                                <Text style={styles.componentCat}>{category}</Text>
                                                <Text style={styles.componentName}>{asset.name}</Text>
                                            </View>
                                        ))}
                                </View>
                            )}
                        </View>

                        {/* Order button */}
                        <TouchableOpacity
                            style={[styles.orderBtn, isOrdering && { opacity: 0.6 }]}
                            onPress={handleOrder}
                            disabled={isOrdering}
                            activeOpacity={0.85}
                        >
                            {isOrdering ? (
                                <ActivityIndicator size="small" color="#0A0A1A" />
                            ) : (
                                <>
                                    <Ionicons name="cart-outline" size={20} color="#0A0A1A" />
                                    <Text style={styles.orderBtnText}>🛒 ORDER THIS DESIGN</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.orderHint}>
                            Our architects will contact you within 24 hours
                        </Text>
                    </>
                )}

                {/* Try different options */}
                <TouchableOpacity
                    style={styles.regenBtn}
                    onPress={() => navigation.navigate('DesignWizardScreen')}
                >
                    <Text style={styles.regenText}>Try Different Options</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Generating overlay */}
            <Modal visible={isGenerating} transparent animationType="fade">
                <View style={styles.genOverlay}>
                    <ActivityIndicator size="large" color={GOLD} />
                    <Text style={styles.genTitle}>Placing your design in the location...</Text>
                    <Text style={styles.genSubtitle}>This may take 20–40 seconds</Text>
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
    headerTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', flex: 1, textAlign: 'center' },
    scrollContent: { padding: 20, paddingBottom: 60 },

    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 6 },
    sectionSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 19, marginBottom: 16 },

    // ── Upload box ─────────────────────────────────────────────────────────────
    uploadBox: {
        width: '100%',
        height: 220,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(212,175,55,0.3)',
        borderStyle: 'dashed',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadPlaceholder: { alignItems: 'center', paddingHorizontal: 24, width: '100%' },
    uploadText: { color: '#FFF', fontWeight: '700', fontSize: 15, marginTop: 14, textAlign: 'center' },
    uploadSubtext: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 18,
        marginBottom: 18,
    },
    uploadBtns: { flexDirection: 'row', gap: 12 },
    uploadActionBtn: {
        backgroundColor: 'rgba(212,175,55,0.15)',
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.3)',
    },
    uploadActionText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
    changePhotoBtn: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 10,
    },
    changePhotoText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
    skipBtn: { marginTop: 14, paddingVertical: 8 },
    skipText: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },

    // ── Gold button ────────────────────────────────────────────────────────────
    goldBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: GOLD,
        borderRadius: 16,
        height: 56,
        marginBottom: 20,
    },
    goldBtnText: { fontSize: 15, fontWeight: '900', color: '#0A0A1A' },

    // ── Protected image ────────────────────────────────────────────────────────
    imageWrapper: { marginBottom: 20 },
    imageContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#1A1A2E',
        position: 'relative',
    },
    generatedImage: { width: '100%', height: '100%' },
    watermarkContainer: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    watermark: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },

    // ── Details card ───────────────────────────────────────────────────────────
    detailsCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
    badge: {
        backgroundColor: 'rgba(212,175,55,0.15)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.3)',
    },
    badgeMaterial: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderColor: 'rgba(255,255,255,0.15)',
    },
    badgeText: { color: GOLD, fontSize: 11, fontWeight: '800' },
    componentsSection: { marginTop: 4 },
    componentsLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    componentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    componentCat: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' },
    componentName: { color: '#FFF', fontSize: 12, fontWeight: '700' },

    // ── Order button ───────────────────────────────────────────────────────────
    orderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: GOLD,
        borderRadius: 16,
        height: 58,
        marginBottom: 10,
    },
    orderBtnText: { fontSize: 15, fontWeight: '900', color: '#0A0A1A', letterSpacing: 0.5 },
    orderHint: { color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', marginBottom: 28 },

    // ── Try different ──────────────────────────────────────────────────────────
    regenBtn: { alignItems: 'center', paddingVertical: 12 },
    regenText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 13,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },

    // ── Generating overlay ─────────────────────────────────────────────────────
    genOverlay: {
        flex: 1,
        backgroundColor: 'rgba(5,5,15,0.97)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        paddingHorizontal: 32,
    },
    genTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 8, textAlign: 'center' },
    genSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
});
