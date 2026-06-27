import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AssetPickerStep from '../components/AssetPickerStep';

const { width: SW } = Dimensions.get('window');
const GOLD = '#D4AF37';
const TOTAL_STEPS = 5;

const DESIGN_TYPES = [
    { id: 'Temple',              emoji: '🛕',  label: 'Temple' },
    { id: 'House Architecture',  emoji: '🏠',  label: 'House Architecture' },
    { id: 'House Interior',      emoji: '🛋️',  label: 'House Interior' },
    { id: 'Commercial Space',    emoji: '🏢',  label: 'Commercial Space' },
    { id: 'Garden & Landscape',  emoji: '🌿',  label: 'Garden & Landscape' },
    { id: 'Custom Design',       emoji: '✏️',  label: 'Custom Design' },
];

// Steps 2–5 correspond to asset categories
const ASSET_STEPS = [
    { step: 2, category: 'Pillar', title: 'Choose Your Pillars', subtitle: 'Select the pillar style for your [designType]', icon: '🏛️' },
    { step: 3, category: 'Base',   title: 'Choose Your Base',    subtitle: 'Select the foundation/base style',               icon: '⬛' },
    { step: 4, category: 'Roof',   title: 'Choose Your Roof',    subtitle: 'Select the roof design',                         icon: '🏠' },
    { step: 5, category: 'Wall',   title: 'Choose Your Walls',   subtitle: 'Select the wall style',                          icon: '🧱' },
];

const INITIAL_STATE = {
    designType: null,
    selectedAssets: { Pillar: null, Base: null, Roof: null, Wall: null },
};

export default function DesignWizardScreen({ navigation }) {
    const [step, setStep] = useState(1);
    const [wizard, setWizard] = useState(INITIAL_STATE);
    const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;

    const goToStep = (n) => {
        setStep(n);
        Animated.timing(progressAnim, {
            toValue: n / TOTAL_STEPS,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const updateWizard = (patch) => setWizard(prev => ({ ...prev, ...patch }));

    // ── Step 1: design type ───────────────────────────────────────────────────
    const handleDesignTypeSelect = (type) => {
        updateWizard({ designType: type });
        setTimeout(() => goToStep(2), 300);
    };

    // ── Asset step helpers ────────────────────────────────────────────────────
    const assetStepIdx = step - 2; // 0-based index into ASSET_STEPS (step 2 → idx 0)
    const currentAssetCfg = step >= 2 && step <= 5 ? ASSET_STEPS[assetStepIdx] : null;

    const handleAssetSelect = (asset) => {
        if (!currentAssetCfg) return;
        updateWizard({
            selectedAssets: { ...wizard.selectedAssets, [currentAssetCfg.category]: asset },
        });
    };

    const handleAssetSkip = (randomAsset) => {
        if (!currentAssetCfg) return;
        updateWizard({
            selectedAssets: { ...wizard.selectedAssets, [currentAssetCfg.category]: randomAsset },
        });
        if (step < 5) {
            goToStep(step + 1);
        } else {
            goToStep(6); // triggers navigation below
        }
    };

    const handleAssetNext = () => {
        if (step < 5) {
            goToStep(step + 1);
        } else {
            goToStep(6); // triggers navigation below
        }
    };

    // ── After step 5 navigate to composite screen ─────────────────────────────
    useEffect(() => {
        if (step === 6) {
            navigation.replace('DesignCompositeScreen', { wizard });
        }
    }, [step]);

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
            {/* Progress bar */}
            <View style={styles.progressTrack}>
                <Animated.View
                    style={[
                        styles.progressFill,
                        {
                            width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]}
                />
            </View>
            <View style={styles.stepCounter}>
                <Text style={styles.stepCounterText}>Step {step} of {TOTAL_STEPS}</Text>
            </View>

            {/* ── STEP 1 ── Design Type ── */}
            {step === 1 && (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
                    <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                    <Text style={styles.stepTitle}>What would you like to create?</Text>
                    <Text style={styles.stepSubtitle}>Choose your project type to get started</Text>
                    <View style={styles.typeGrid}>
                        {DESIGN_TYPES.map((dt) => {
                            const isSelected = wizard.designType === dt.id;
                            return (
                                <TouchableOpacity
                                    key={dt.id}
                                    style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                                    onPress={() => handleDesignTypeSelect(dt.id)}
                                    activeOpacity={0.8}
                                >
                                    {isSelected && (
                                        <View style={styles.typeCheckmark}>
                                            <Ionicons name="checkmark-circle" size={20} color={GOLD} />
                                        </View>
                                    )}
                                    <Text style={styles.typeEmoji}>{dt.emoji}</Text>
                                    <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                                        {dt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            )}

            {/* ── STEPS 2–5 ── Asset Pickers ── */}
            {step >= 2 && step <= 5 && currentAssetCfg && (
                <AssetPickerStep
                    category={currentAssetCfg.category}
                    title={currentAssetCfg.title}
                    subtitle={currentAssetCfg.subtitle}
                    icon={currentAssetCfg.icon}
                    selectedAsset={wizard.selectedAssets[currentAssetCfg.category]}
                    onAssetSelect={handleAssetSelect}
                    locationPhotoBase64={null}
                    designType={wizard.designType}
                    onBack={() => goToStep(step - 1)}
                    onNext={handleAssetNext}
                    onSkip={handleAssetSkip}
                    isLastStep={step === 5}
                    showWhitePreview={true}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#07071A' },

    progressTrack: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.08)',
        width: '100%',
    },
    progressFill: {
        height: '100%',
        backgroundColor: GOLD,
        borderRadius: 2,
    },
    stepCounter: {
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 4,
    },
    stepCounterText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    stepContent: { paddingHorizontal: 20, paddingBottom: 40 },
    headerBackBtn: { marginBottom: 12, padding: 4, alignSelf: 'flex-start' },
    stepTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 8, letterSpacing: 0.3 },
    stepSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 20, marginBottom: 28 },

    // Step 1 — type grid
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
    typeCard: {
        width: (SW - 52) / 2,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingVertical: 28,
        paddingHorizontal: 12,
        alignItems: 'center',
        position: 'relative',
    },
    typeCardSelected: {
        borderColor: GOLD,
        backgroundColor: 'rgba(212,175,55,0.08)',
    },
    typeCheckmark: { position: 'absolute', top: 10, right: 10 },
    typeEmoji: { fontSize: 36, marginBottom: 10 },
    typeLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
    typeLabelSelected: { color: GOLD },
});
