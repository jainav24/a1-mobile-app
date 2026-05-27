import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const Toolbar = ({ onAction, canUndo, canRedo, onUndo, onRedo, selectedId }) => {
    const { colors } = useTheme();

    const tools = [
        { id: 'select', icon: 'cursor-default-outline', library: MaterialCommunityIcons, label: 'Select' },
        { id: 'pillar', icon: 'pillar', library: MaterialCommunityIcons, label: 'Pillar' },
        { id: 'chaat', icon: 'home-outline', library: Ionicons, label: 'Dome' },
        { id: 'bottom', icon: 'layers-outline', library: Ionicons, label: 'Base' },
        { id: 'rect', icon: 'square-outline', library: Ionicons, label: 'Rect' },
        { id: 'circle', icon: 'ellipse-outline', library: Ionicons, label: 'Circle' },
        { id: 'line', icon: 'remove-outline', library: Ionicons, label: 'Line' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {tools.map((tool) => (
                    <TouchableOpacity
                        key={tool.id}
                        style={styles.toolBtn}
                        onPress={() => onAction(tool.id)}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: colors.inputBg }]}>
                            <tool.library name={tool.icon} size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.toolText, { color: colors.text }]}>{tool.label}</Text>
                    </TouchableOpacity>
                ))}

                <View style={styles.divider} />

                <TouchableOpacity
                    style={[styles.toolBtn, !canUndo && styles.disabled]}
                    onPress={onUndo}
                    disabled={!canUndo}
                >
                    <View style={[styles.iconCircle, { backgroundColor: colors.inputBg }]}>
                        <Ionicons name="arrow-undo-outline" size={22} color={canUndo ? colors.text : colors.textMuted} />
                    </View>
                    <Text style={[styles.toolText, { color: colors.text }]}>Undo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.toolBtn, !canRedo && styles.disabled]}
                    onPress={onRedo}
                    disabled={!canRedo}
                >
                    <View style={[styles.iconCircle, { backgroundColor: colors.inputBg }]}>
                        <Ionicons name="arrow-redo-outline" size={22} color={canRedo ? colors.text : colors.textMuted} />
                    </View>
                    <Text style={[styles.toolText, { color: colors.text }]}>Redo</Text>
                </TouchableOpacity>

                {selectedId && (
                    <TouchableOpacity
                        style={styles.toolBtn}
                        onPress={() => onAction('delete')}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                        </View>
                        <Text style={[styles.toolText, { color: '#FF3B30' }]}>Delete</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        borderRadius: 25,
        paddingVertical: 15,
        boxShadow: '0px 10px 20px rgba(0,0,0,0.1)',
        elevation: 10,
    },
    scroll: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    toolBtn: {
        alignItems: 'center',
        marginRight: 20,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    toolText: {
        fontSize: 10,
        fontWeight: '700',
    },
    divider: {
        width: 1,
        height: 35,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginHorizontal: 10,
        marginRight: 20,
    },
    disabled: {
        opacity: 0.4,
    },
});

export default Toolbar;
