import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    Dimensions,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { generateDesignImage } from '../services/imageGenerationService';
import { placeOrder } from '../services/orderService';

const { width: SW } = Dimensions.get('window');
const GOLD = '#D4AF37';
const CARD_W = (SW - 40 - 12) / 2;

const MATERIALS = [
    { id: 'Marble', color: '#F0F0F0', textColor: '#333' },
    { id: 'Granite', color: '#3A3A3A', textColor: '#EEE' },
    { id: 'Rock', color: '#7D6B52', textColor: '#EEE' },
    { id: 'Sandstone', color: '#E8C97A', textColor: '#333' },
    { id: 'Brick', color: '#B5452B', textColor: '#EEE' },
    { id: 'Wood', color: '#8B5E3C', textColor: '#EEE' },
    { id: 'Concrete', color: '#9E9E9E', textColor: '#EEE' },
];

const buildPrompt = (description, material, hasLocationPhoto) => {
    if (hasLocationPhoto) {
        return (
            `You are an expert architectural visualizer. ` +
            `Place a photorealistic ${material} ${description} ` +
            `into this exact location in the photo. ` +
            `Make it look like it was actually built there. ` +
            `Match the lighting, perspective and environment ` +
            `of the photo perfectly. Ultra detailed, 8K quality.`
        );
    }
    return (
        `Create a photorealistic architectural visualization ` +
        `of: ${description}. Material: ${material}. ` +
        `Professional architectural render, perfect lighting, ` +
        `ultra detailed, 8K quality.`
    );
};

const TextToImageScreen = ({ navigation }) => {
    const [locationPhoto, setLocationPhoto] = useState(null);
    const [description, setDescription] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState('Marble');
    const [isGenerating, setIsGenerating] = useState(false);
    const [descriptionError, setDescriptionError] = useState(false);

    const [generatedImageUri, setGeneratedImageUri] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isGenerating) {
            progressAnim.setValue(0);
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(progressAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
                Animated.timing(progressAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [isGenerating, progressAnim]);

    useEffect(() => {
        if (!orderSuccess) return;
        const timer = setTimeout(() => navigation.goBack(), 3000);
        return () => clearTimeout(timer);
    }, [orderSuccess, navigation]);

    const pickImage = async (fromCamera) => {
        try {
            const options = {
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.5,
                base64: true,
                exif: false,
            };

            let result;

            if (fromCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Camera Permission Required',
                        'Please enable camera access in your phone Settings app under Expo Go permissions.',
                        [{ text: 'OK' }]
                    );
                    return;
                }
                result = await ImagePicker.launchCameraAsync(options);
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Gallery Permission Required',
                        'Please enable photo library access in your phone Settings app under Expo Go permissions.',
                        [{ text: 'OK' }]
                    );
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync(options);
            }

            if (!result.canceled && result.assets?.[0]?.base64) {
                setLocationPhoto(result.assets[0].base64);
            }

        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Could not open image picker. Please try again.');
        }
    };

    const handleGenerate = async () => {
        const trimmed = description.trim();
        if (trimmed.length < 20) {
            setDescriptionError(true);
            return;
        }
        setDescriptionError(false);
        setIsGenerating(true);

        try {
            const prompt = buildPrompt(trimmed, selectedMaterial, !!locationPhoto);
            const resultUri = await generateDesignImage(prompt, locationPhoto);

            if (resultUri) {
                setGeneratedImageUri(resultUri);
                setShowResult(true);
            } else {
                Alert.alert('Generation Failed', 'Could not generate image. Please try again.');
            }
        } catch (error) {
            console.error('Generate error:', error);
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOrderNow = () => {
        Alert.alert(
            'Place Order?',
            'Our team will review your design and contact you within 24 hours.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Place Order',
                    onPress: async () => {
                        try {
                            await placeOrder({
                                projectTitle: `AI Design: ${selectedMaterial}`,
                                material: selectedMaterial,
                                generatedImageBase64: generatedImageUri,
                                canvasData: null,
                                locationPhotoBase64: locationPhoto,
                                textDescription: description.trim(),
                                dimensions: null,
                            });
                            setOrderSuccess(true);
                        } catch (e) {
                            console.error(e);
                            Alert.alert('Error', 'Failed to place order. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const handleGenerateAgain = () => {
        setGeneratedImageUri(null);
        setShowResult(false);
        setOrderSuccess(false);
    };

    const handleBackToForm = () => {
        setShowResult(false);
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['20%', '100%'],
    });

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Design Generator</Text>
                <View style={styles.headerSpacer} />
            </View>

            {orderSuccess ? (
                <View style={styles.successContainer}>
                    <Ionicons name="checkmark-circle" size={64} color={GOLD} />
                    <Text style={styles.successTitle}>Order Placed!</Text>
                    <Text style={styles.successText}>
                        Our team will contact you within 24 hours.
                    </Text>
                    <Text style={styles.successSubtext}>Returning to dashboard...</Text>
                </View>
            ) : showResult ? (
                <ScrollView contentContainerStyle={styles.resultContent}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: generatedImageUri }}
                            style={styles.resultImage}
                            resizeMode="cover"
                            accessible={false}
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                        />
                        <View style={styles.watermarkContainer} pointerEvents="none">
                            <Text style={styles.watermark}>A1 Design © Protected</Text>
                        </View>
                        <View style={styles.touchBlocker} pointerEvents="box-only" />
                    </View>

                    <TouchableOpacity style={styles.orderBtn} onPress={handleOrderNow}>
                        <Text style={styles.orderBtnText}>ORDER IT NOW</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryBtn} onPress={handleGenerateAgain}>
                        <Ionicons name="sparkles" size={16} color={GOLD} />
                        <Text style={styles.secondaryBtnText}>Generate Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.tertiaryBtn} onPress={handleBackToForm}>
                        <Text style={styles.tertiaryBtnText}>Back to Form</Text>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* STEP 1 */}
                    <Text style={styles.stepLabel}>STEP 1 — Upload Your Location</Text>
                    <Text style={styles.instruction}>
                        Take a photo of where you want your design built. The AI will place your
                        design into this exact location.
                    </Text>

                    <View style={styles.photoUploadBox}>
                        {locationPhoto ? (
                            <>
                                <Image
                                    source={{ uri: `data:image/jpeg;base64,${locationPhoto}` }}
                                    style={styles.uploadedImg}
                                    resizeMode="cover"
                                />
                                <View style={styles.changePhotoOverlay}>
                                    <TouchableOpacity
                                        style={styles.changePhotoBtn}
                                        onPress={() => pickImage(false)}
                                    >
                                        <Text style={styles.changePhotoText}>Change Photo</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Ionicons name="camera-outline" size={36} color={GOLD} />
                                <Text style={styles.uploadText}>Tap to add location photo</Text>
                                <View style={styles.uploadActions}>
                                    <TouchableOpacity
                                        style={styles.uploadActionBtn}
                                        onPress={() => pickImage(true)}
                                    >
                                        <Ionicons name="camera" size={18} color="#FFF" />
                                        <Text style={styles.uploadActionText}>Camera</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.uploadActionBtn}
                                        onPress={() => pickImage(false)}
                                    >
                                        <Ionicons name="images-outline" size={18} color="#FFF" />
                                        <Text style={styles.uploadActionText}>Gallery</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.uploadSubtext}>or choose from gallery</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.optionalLabel}>Optional — but gives much better results</Text>

                    {/* STEP 2 */}
                    <Text style={[styles.stepLabel, styles.stepMargin]}>STEP 2 — Describe Your Design</Text>
                    <Text style={styles.instruction}>
                        Describe what you want to build in detail. The more detail you give, the
                        better the result.
                    </Text>
                    <TextInput
                        style={[styles.textArea, descriptionError && styles.textAreaError]}
                        placeholder={
                            'A traditional Rajasthani mandir with carved marble pillars, a gold dome, intricate jali work on the walls, facing east, approximately 30 feet wide...'
                        }
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        multiline
                        numberOfLines={6}
                        value={description}
                        onChangeText={(text) => {
                            if (text.length <= 500) {
                                setDescription(text);
                                if (descriptionError && text.trim().length >= 20) {
                                    setDescriptionError(false);
                                }
                            }
                        }}
                        textAlignVertical="top"
                    />
                    <Text style={[styles.charCounter, descriptionError && styles.charCounterError]}>
                        {description.length} / 500
                        {descriptionError ? '  •  Minimum 20 characters required' : ''}
                    </Text>

                    {/* STEP 3 */}
                    <Text style={[styles.stepLabel, styles.stepMargin]}>STEP 3 — Choose Material</Text>
                    <View style={styles.materialGrid}>
                        {MATERIALS.map((mat) => {
                            const isSelected = selectedMaterial === mat.id;
                            return (
                                <TouchableOpacity
                                    key={mat.id}
                                    style={[
                                        styles.materialCard,
                                        { backgroundColor: mat.color },
                                        isSelected && styles.materialCardSelected,
                                    ]}
                                    onPress={() => setSelectedMaterial(mat.id)}
                                    activeOpacity={0.85}
                                >
                                    <Text style={[styles.materialName, { color: mat.textColor }]}>
                                        {mat.id}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* STEP 4 */}
                    <Text style={[styles.stepLabel, styles.stepMargin]}>STEP 4 — Generate</Text>

                    {isGenerating ? (
                        <View style={styles.loadingBox}>
                            <Text style={styles.loadingText}>Creating your design...</Text>
                            <View style={styles.progressTrack}>
                                <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
                            </View>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
                                <Text style={styles.generateBtnText}>✨ Generate My Design</Text>
                            </TouchableOpacity>
                            <Text style={styles.generateHint}>
                                Takes 15-30 seconds • Powered by Gemini AI
                            </Text>
                        </>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A1F' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        height: 56,
        backgroundColor: '#0A0A1F',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
    headerSpacer: { width: 40 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    stepLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: GOLD,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    stepMargin: { marginTop: 28 },
    instruction: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.65)',
        lineHeight: 21,
        marginBottom: 14,
    },
    photoUploadBox: {
        width: '100%',
        height: 200,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(212,175,55,0.35)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    uploadedImg: { width: '100%', height: '100%' },
    changePhotoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingVertical: 10,
        alignItems: 'center',
    },
    changePhotoBtn: { paddingHorizontal: 16, paddingVertical: 4 },
    changePhotoText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
    uploadPlaceholder: { alignItems: 'center', paddingHorizontal: 20 },
    uploadText: { marginTop: 10, color: '#FFF', fontWeight: '600', fontSize: 14 },
    uploadSubtext: { marginTop: 8, color: 'rgba(255,255,255,0.4)', fontSize: 12 },
    uploadActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
    uploadActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(212,175,55,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.3)',
    },
    uploadActionText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
    optionalLabel: {
        marginTop: 8,
        fontSize: 12,
        color: 'rgba(255,255,255,0.35)',
        fontStyle: 'italic',
    },
    textArea: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        minHeight: 140,
        color: '#FFF',
    },
    textAreaError: { borderColor: '#FF5252', borderWidth: 2 },
    charCounter: {
        marginTop: 6,
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'right',
    },
    charCounterError: { color: '#FF5252' },
    materialGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    materialCard: {
        width: CARD_W,
        height: 72,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    materialCardSelected: { borderColor: GOLD },
    materialName: { fontSize: 15, fontWeight: '800' },
    generateBtn: {
        backgroundColor: GOLD,
        borderRadius: 14,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    generateBtnText: { color: '#0A0A1A', fontSize: 16, fontWeight: '900' },
    generateHint: {
        marginTop: 10,
        textAlign: 'center',
        fontSize: 12,
        color: 'rgba(255,255,255,0.35)',
    },
    loadingBox: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 20,
        alignItems: 'center',
    },
    loadingText: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 16 },
    progressTrack: {
        width: '100%',
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: { height: '100%', backgroundColor: GOLD, borderRadius: 2 },
    resultContent: { padding: 20, paddingBottom: 40 },
    imageContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.04)',
        position: 'relative',
    },
    resultImage: { width: '100%', height: '100%' },
    watermarkContainer: {
        position: 'absolute',
        bottom: 12,
        right: 12,
    },
    watermark: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    touchBlocker: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    orderBtn: {
        marginTop: 20,
        backgroundColor: GOLD,
        borderRadius: 14,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderBtnText: { color: '#0A0A1A', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
    secondaryBtn: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 14,
        height: 48,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.4)',
    },
    secondaryBtnText: { color: GOLD, fontSize: 14, fontWeight: '700' },
    tertiaryBtn: {
        marginTop: 10,
        alignItems: 'center',
        paddingVertical: 12,
    },
    tertiaryBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600' },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    successTitle: {
        marginTop: 20,
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
    },
    successText: {
        marginTop: 10,
        fontSize: 15,
        color: 'rgba(255,255,255,0.65)',
        textAlign: 'center',
        lineHeight: 22,
    },
    successSubtext: {
        marginTop: 16,
        fontSize: 13,
        color: 'rgba(255,255,255,0.35)',
    },
});

export default TextToImageScreen;
