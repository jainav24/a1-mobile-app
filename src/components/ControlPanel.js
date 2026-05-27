import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import CustomSlider from './CustomSlider';

// Conditionally import Slider to prevent web bundling issues
let Slider;
if (Platform.OS !== 'web') {
    try {
        Slider = require('@react-native-community/slider').default;
    } catch (e) {
        console.warn('Slider not available, falling back to CustomSlider');
    }
}

const ControlPanel = ({ selectedElement, onUpdate }) => {
    const { colors } = useTheme();

    if (!selectedElement) return null;

    const renderSlider = () => {
        const sliderProps = {
            minimumValue: 0.2,
            maximumValue: 3,
            value: selectedElement.scale || 1,
            onValueChange: (val) => onUpdate(selectedElement.id, { scale: val }),
            thumbTintColor: colors.primary,
        };

        if (Platform.OS !== 'web' && Slider) {
            return (
                <Slider
                    {...sliderProps}
                    style={styles.slider}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.border}
                />
            );
        }

        // Fallback or Web version
        return <CustomSlider {...sliderProps} />;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Properties</Text>
                <Text style={[styles.type, { color: colors.primary }]}>
                    {selectedElement.type.toUpperCase()}
                </Text>
            </View>

            <View style={styles.row}>
                <Text style={[styles.label, { color: colors.subText }]}>Scale</Text>
                {renderSlider()}
                <Text style={[styles.value, { color: colors.text }]}>
                    {Math.round((selectedElement.scale || 1) * 100)}%
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 100,
        right: 20,
        width: 200,
        borderRadius: 20,
        padding: 15,
        boxShadow: '0px 5px 10px rgba(0,0,0,0.1)',
        elevation: 5,
        zIndex: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 14,
        fontWeight: '800',
    },
    type: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    row: {
        gap: 8,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
    },
    slider: {
        width: '100%',
        height: 30,
    },
    value: {
        fontSize: 12,
        fontWeight: '800',
        textAlign: 'right',
    },
});

export default ControlPanel;
