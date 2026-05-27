/**
 * GeneratedImageModal.js
 * Full-screen modal that shows the AI-generated architectural image.
 *
 * CRITICAL — all image saving is blocked:
 *   • Transparent pointer-intercepting overlay above the image
 *   • accessible={false} on <Image>
 *   • No share / download controls anywhere
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    Dimensions,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';

const MATERIAL_EMOJI = {
    Marble:    '🏛️',
    Granite:   '🪨',
    Rock:      '⛰️',
    Sandstone: '🌅',
    Brick:     '🧱',
    Wood:      '🪵',
    Concrete:  '🏗️',
};

/**
 * GeneratedImageModal
 *
 * Props:
 *   visible         {boolean}
 *   imageUri        {string}   - "data:image/png;base64,..."
 *   material        {string}
 *   canvasSnapshot  {Object}   - raw canvas JSON (not shown to user)
 *   onClose         {() => void}
 *   onOrder         {() => void}
 *   projectTitle    {string}
 */
export default function GeneratedImageModal({
    visible,
    imageUri,
    material,
    onClose,
    onOrder,
    projectTitle,
}) {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            statusBarTranslucent
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={[s.root, { paddingTop: insets.top }]}>
                {/* ── HEADER ── */}
                <View style={s.header}>
                    <View style={s.headerLeft}>
                        <Text style={s.headerTitle}>Your Architectural Vision</Text>
                        {projectTitle ? (
                            <Text style={s.headerSub} numberOfLines={1}>{projectTitle}</Text>
                        ) : null}
                    </View>
                    <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={s.scrollContent}
                >
                    {/* ── IMAGE CONTAINER (protected) ── */}
                    <View style={s.imageContainer}>
                        {imageUri ? (
                            <>
                                {/*
                                 * Image rendered with all saving hooks disabled.
                                 * accessible={false} suppresses OS context menus on iOS.
                                 */}
                                <Image
                                    source={{ uri: imageUri }}
                                    style={s.image}
                                    resizeMode="cover"
                                    accessible={false}
                                    accessibilityElementsHidden
                                    importantForAccessibility="no-hide-descendants"
                                />

                                {/* Watermark overlay */}
                                <View style={s.watermarkContainer} pointerEvents="none">
                                    <Text style={s.watermark}>A1 Design — © Protected</Text>
                                </View>

                                {/*
                                 * Full-size transparent touch-interceptor sits on top.
                                 * pointerEvents="box-only" captures all touches so the
                                 * OS share sheet / long-press menu cannot be triggered.
                                 */}
                                <View style={s.touchBlocker} pointerEvents="box-only" />
                            </>
                        ) : (
                            <View style={[s.image, s.imagePlaceholder]}>
                                <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.2)" />
                                <Text style={s.placeholderTxt}>No image available</Text>
                            </View>
                        )}
                    </View>

                    {/* ── MATERIAL BADGE ── */}
                    <View style={s.materialBadge}>
                        <Text style={s.materialEmoji}>{MATERIAL_EMOJI[material] || '🏛️'}</Text>
                        <View>
                            <Text style={s.materialLabel}>Material</Text>
                            <Text style={s.materialValue}>{material}</Text>
                        </View>
                    </View>

                    <View style={s.divider} />

                    {/* ── ORDER BUTTON ── */}
                    <TouchableOpacity
                        style={s.orderBtn}
                        onPress={onOrder}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="bag-outline" size={20} color="#0A0A1A" />
                        <Text style={s.orderBtnTxt}>ORDER IT NOW</Text>
                    </TouchableOpacity>

                    <Text style={s.orderSubtext}>
                        Our team will contact you within 24 hours
                    </Text>

                    {/* ── CLOSE LINK ── */}
                    <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                        <Text style={s.cancelBtnTxt}>Close Preview</Text>
                    </TouchableOpacity>

                    <View style={{ height: 20 + insets.bottom }} />
                </ScrollView>
            </View>
        </Modal>
    );
}

const IMAGE_H = SW * 0.75; // 4:3 ratio

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#06060F',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        backgroundColor: '#0A0A1F',
    },
    headerLeft:  { flex: 1 },
    headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
    headerSub:   { color: GOLD, fontSize: 11, fontWeight: '600', marginTop: 2, opacity: 0.8 },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },

    scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

    // Image
    imageContainer: {
        width: '100%',
        height: IMAGE_H,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.2)',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    placeholderTxt: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 13,
    },

    // Watermark
    watermarkContainer: {
        position: 'absolute',
        bottom: 12,
        right: 12,
    },
    watermark: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // Touch blocker (prevents OS save/share sheet)
    touchBlocker: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },

    // Material badge
    materialBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 20,
        backgroundColor: 'rgba(212,175,55,0.07)',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.2)',
    },
    materialEmoji: { fontSize: 28 },
    materialLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    materialValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 2 },

    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.07)',
        marginVertical: 22,
    },

    // Order button
    orderBtn: {
        backgroundColor: GOLD,
        borderRadius: 18,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        elevation: 8,
        shadowColor: GOLD,
        shadowOpacity: 0.4,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
    },
    orderBtnTxt: {
        color: '#0A0A1A',
        fontSize: 17,
        fontWeight: '900',
        letterSpacing: 1.2,
    },
    orderSubtext: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 10,
    },

    // Cancel
    cancelBtn: {
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 4,
    },
    cancelBtnTxt: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 13,
        fontWeight: '600',
    },
});
