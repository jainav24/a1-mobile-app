import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
    Dimensions,
    StatusBar,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const TemplatesScreen = ({ navigation }) => {
    const templates = [
        { id: '1', name: 'Ayodhya Classical', category: 'Nagara Style', image: require('../../assets/temple_hero.png') },
        { id: '2', name: 'Dravidian Grandeur', category: 'South Indian', image: require('../../assets/temple_hero.png') },
        { id: '3', name: 'Vedic Meditation Hall', category: 'Modern Spiritual', image: require('../../assets/temple_hero.png') },
        { id: '4', name: 'Golden Pavilion', category: 'Zen Garden', image: require('../../assets/temple_hero.png') },
        { id: '5', name: 'Royal Pillar Hall', category: 'Palatial', image: require('../../assets/temple_hero.png') },
        { id: '6', name: 'Lotus Sanctuary', category: 'Floral Motif', image: require('../../assets/temple_hero.png') },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ImageBackground
                source={require('../../assets/marble_bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.9)']}
                    style={StyleSheet.absoluteFill}
                />

                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Temple Templates</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <Text style={styles.subtitle}>Select a base for your next masterpiece</Text>

                        <View style={styles.grid}>
                            {templates.map((template) => (
                                <TouchableOpacity
                                    key={template.id}
                                    style={styles.templateCard}
                                    onPress={() => navigation.navigate('ProjectDetailScreen', { project: template })}
                                >
                                    <View style={styles.imageWrapper}>
                                        <Image source={template.image} style={styles.templateImage} />
                                        <LinearGradient
                                            colors={['transparent', 'rgba(0,0,0,0.6)']}
                                            style={styles.imageOverlay}
                                        />
                                        <View style={styles.categoryBadge}>
                                            <Text style={styles.categoryText}>{template.category}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.templateName}>{template.name}</Text>
                                        <TouchableOpacity style={styles.useBtn}>
                                            <Text style={styles.useBtnText}>Use Template</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F5F0' },
    backgroundImage: { flex: 1 },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#1a1a1a' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
    subtitle: { fontSize: 15, color: '#777', marginBottom: 24, fontWeight: '500' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    templateCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
        elevation: 4,
    },
    imageWrapper: { height: 140, width: '100%' },
    templateImage: { width: '100%', height: '100%' },
    imageOverlay: { ...StyleSheet.absoluteFillObject },
    categoryBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: { fontSize: 10, fontWeight: '800', color: '#D4AF37' },
    cardInfo: { padding: 12 },
    templateName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 10 },
    useBtn: {
        backgroundColor: '#EDEDED',
        paddingVertical: 8,
        borderRadius: 14,
        alignItems: 'center',
    },
    useBtnText: { fontSize: 11, fontWeight: '800', color: '#333' },
});

export default TemplatesScreen;
