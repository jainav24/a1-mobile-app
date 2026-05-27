/**
 * MaterialSelector.js
 * Bottom-sheet modal for choosing a construction material
 * before generating an architectural image.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SW } = Dimensions.get('window');
const GOLD = '#D4AF37';

const MATERIALS = [
    {
        id: 'Marble',
        emoji: '🏛️',
        label: 'Marble',
        gradient: ['#F0F0F0', '#C8C8C8'],
        textColor: '#333',
        desc: 'White & grey veining',
    },
    {
        id: 'Granite',
        emoji: '🪨',
        label: 'Granite',
        gradient: ['#3A3A3A', '#1A1A1A'],
        textColor: '#EEE',
        desc: 'Dark speckled stone',
    },
    {
        id: 'Rock',
        emoji: '⛰️',
        label: 'Rock',
        gradient: ['#7D6B52', '#5C4F3A'],
        textColor: '#EEE',
        desc: 'Natural rough-cut',
    },
    {
        id: 'Sandstone',
        emoji: '🌅',
        label: 'Sandstone',
        gradient: ['#E8C97A', '#C9A44E'],
        textColor: '#333',
        desc: 'Warm golden beige',
    },
    {
        id: 'Brick',
        emoji: '🧱',
        label: 'Brick',
        gradient: ['#B5452B', '#8B2E18'],
        textColor: '#EEE',
        desc: 'Red-brown fired clay',
    },
    {
        id: 'Wood',
        emoji: '🪵',
        label: 'Wood',
        gradient: ['#8B5E3C', '#5C3A1E'],
        textColor: '#EEE',
        desc: 'Rich dark teak grain',
    },
    {
        id: 'Concrete',
        emoji: '🏗️',
        label: 'Concrete',
        gradient: ['#9E9E9E', '#6B6B6B'],
        textColor: '#EEE',
        desc: 'Smooth exposed finish',
    },
];

/**
 * MaterialSelector
 *
 * Props:
 *   visible       {boolean}
 *   onClose       {() => void}
 *   onGenerate    {(material: string) => void}
 */
export default function MaterialSelector({ visible, onClose, onGenerate }) {
    const [selected, setSelected] = useState('Marble');

    const handleGenerate = () => {
        onGenerate(selected);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={s.backdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

                <View style={s.sheet}>
                    {/* Drag handle */}
                    <View style={s.handle} />

                    {/* Header */}
                    <Text style={s.title}>Choose Material</Text>
                    <Text style={s.subtitle}>
                        Select the material for your architectural render
                    </Text>

                    {/* Material grid */}
                    <ScrollView
                        contentContainerStyle={s.grid}
                        showsVerticalScrollIndicator={false}
                    >
                        {MATERIALS.map(mat => {
                            const isActive = selected === mat.id;
                            return (
                                <TouchableOpacity
                                    key={mat.id}
                                    style={[
                                        s.card,
                                        { backgroundColor: mat.gradient[0] },
                                        isActive && s.cardSelected,
                                    ]}
                                    onPress={() => setSelected(mat.id)}
                                    activeOpacity={0.82}
                                >
                                    {/* Gold check badge */}
                                    {isActive && (
                                        <View style={s.checkBadge}>
                                            <Ionicons name="checkmark" size={11} color="#0A0A1A" />
                                        </View>
                                    )}

                                    <Text style={s.cardEmoji}>{mat.emoji}</Text>
                                    <Text style={[s.cardLabel, { color: mat.textColor }]}>
                                        {mat.label}
                                    </Text>
                                    <Text
                                        style={[
                                            s.cardDesc,
                                            { color: mat.textColor, opacity: 0.65 },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {mat.desc}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Selected material banner */}
                    <View style={s.selectedBanner}>
                        <Text style={s.selectedBannerTxt}>
                            Selected: <Text style={{ color: GOLD, fontWeight: '800' }}>{selected}</Text>
                        </Text>
                    </View>

                    {/* Generate button */}
                    <TouchableOpacity
                        style={s.generateBtn}
                        onPress={handleGenerate}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="sparkles" size={18} color="#0A0A1A" />
                        <Text style={s.generateBtnTxt}>Generate Image</Text>
                    </TouchableOpacity>

                    {/* Cancel */}
                    <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                        <Text style={s.cancelBtnTxt}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const CARD_W = (SW - 48 - 12) / 2; // 2 columns with gap

const s = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#0D0D22',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingBottom: 34,
        borderTopWidth: 1,
        borderColor: 'rgba(212,175,55,0.25)',
        maxHeight: '90%',
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
        paddingBottom: 8,
    },
    card: {
        width: CARD_W,
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
    },
    cardSelected: {
        borderColor: GOLD,
        shadowColor: GOLD,
        shadowOpacity: 0.5,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 8,
    },
    checkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: GOLD,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardEmoji: { fontSize: 28, marginBottom: 6 },
    cardLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
    cardDesc:  { fontSize: 10, fontWeight: '600', marginTop: 3, textAlign: 'center' },

    selectedBanner: {
        marginTop: 16,
        backgroundColor: 'rgba(212,175,55,0.08)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.2)',
        alignItems: 'center',
    },
    selectedBannerTxt: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '600',
    },
    generateBtn: {
        marginTop: 14,
        backgroundColor: GOLD,
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        elevation: 6,
    },
    generateBtnTxt: {
        color: '#0A0A1A',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.4,
    },
    cancelBtn: {
        marginTop: 10,
        alignItems: 'center',
        paddingVertical: 12,
    },
    cancelBtnTxt: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontWeight: '600',
    },
});
