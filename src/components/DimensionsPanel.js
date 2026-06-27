import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#D4AF37';
const COLLAPSED_HEIGHT = 48;
const EXPANDED_HEIGHT = 180;

const DimensionsPanel = ({ dimensions, onDimensionsChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const heightAnim = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;

    useEffect(() => {
        Animated.timing(heightAnim, {
            toValue: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
            duration: 280,
            useNativeDriver: false,
        }).start();
    }, [isExpanded, heightAnim]);

    const handleChange = (field, value) => {
        const cleanVal = value.replace(/[^0-9.]/g, '');
        onDimensionsChange({ ...dimensions, [field]: cleanVal });
    };

    const setUnit = (newUnit) => {
        if (newUnit === dimensions.unit) return;
        const factor = newUnit === 'meters' ? 0.3048 : 3.28084;
        onDimensionsChange({
            unit: newUnit,
            length: dimensions.length ? (parseFloat(dimensions.length) * factor).toFixed(2).replace(/\.00$/, '') : '',
            width: dimensions.width ? (parseFloat(dimensions.width) * factor).toFixed(2).replace(/\.00$/, '') : '',
            height: dimensions.height ? (parseFloat(dimensions.height) * factor).toFixed(2).replace(/\.00$/, '') : '',
        });
    };

    const unitSuffix = dimensions.unit === 'feet' ? 'ft' : 'm';
    const hasDimensions = dimensions.length || dimensions.width || dimensions.height;

    const summaryText = hasDimensions
        ? `${dimensions.length || '—'}${unitSuffix} × ${dimensions.width || '—'}${unitSuffix} × ${dimensions.height || '—'}${unitSuffix}`
        : 'Tap to set dimensions';

    return (
        <Animated.View style={[styles.container, { height: heightAnim }]}>
            {/* ── COLLAPSED HEADER BAR ── */}
            <TouchableOpacity
                style={styles.header}
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.8}
            >
                <View style={styles.headerLeft}>
                    <Ionicons name="resize-outline" size={16} color={GOLD} />
                    <Text style={styles.headerTitle}>Project Dimensions</Text>
                </View>

                <Text style={[styles.headerSummary, hasDimensions ? styles.summaryGold : styles.summaryGray]}>
                    {summaryText}
                </Text>

                <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-up'}
                    size={16}
                    color="rgba(255,255,255,0.5)"
                />
            </TouchableOpacity>

            {/* ── EXPANDED CONTENT ── */}
            <View style={styles.expandedContent}>
                {/* Row 2: Inputs */}
                <View style={styles.inputsRow}>
                    {['length', 'width', 'height'].map((field) => (
                        <View key={field} style={styles.inputGroup}>
                            <Text style={styles.label}>
                                {field.charAt(0).toUpperCase() + field.slice(1)}
                            </Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={String(dimensions[field] || '')}
                                    onChangeText={(v) => handleChange(field, v)}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="rgba(255,255,255,0.25)"
                                />
                                <Text style={styles.unitSuffix}>{unitSuffix}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Row 3: Unit toggle */}
                <View style={styles.unitRow}>
                    <Text style={styles.unitLabel}>Unit:</Text>
                    <TouchableOpacity
                        style={[styles.unitBtn, dimensions.unit === 'feet' && styles.unitBtnActive]}
                        onPress={() => setUnit('feet')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.unitBtnText, dimensions.unit === 'feet' && styles.unitBtnTextActive]}>
                            Feet
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.unitBtn, dimensions.unit === 'meters' && styles.unitBtnActive]}
                        onPress={() => setUnit('meters')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.unitBtnText, dimensions.unit === 'meters' && styles.unitBtnTextActive]}>
                            Meters
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#0A0A1F',
        borderTopWidth: 1,
        borderTopColor: 'rgba(212,175,55,0.25)',
        overflow: 'hidden',
    },
    header: {
        height: COLLAPSED_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    headerSummary: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
    },
    summaryGold: {
        color: GOLD,
    },
    summaryGray: {
        color: 'rgba(255,255,255,0.35)',
    },
    expandedContent: {
        paddingHorizontal: 14,
        paddingTop: 4,
        paddingBottom: 12,
    },
    inputsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    inputGroup: {
        flex: 1,
    },
    label: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.3)',
        borderRadius: 8,
        height: 40,
        paddingHorizontal: 10,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        padding: 0,
    },
    unitSuffix: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    unitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
    },
    unitLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: '600',
        marginRight: 2,
    },
    unitBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.3)',
        backgroundColor: 'transparent',
    },
    unitBtnActive: {
        backgroundColor: 'rgba(212,175,55,0.2)',
        borderColor: GOLD,
    },
    unitBtnText: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 11,
        fontWeight: '700',
    },
    unitBtnTextActive: {
        color: GOLD,
    },
});

export default DimensionsPanel;
