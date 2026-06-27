import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, FlatList,
    Dimensions, StatusBar, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getUserProjects, deleteProject } from '../services/projectService';
import { useSubscription } from '../hooks/useSubscription';
import WhatsAppButton from '../components/WhatsAppButton';

const { width } = Dimensions.get('window');

const SavedProjectsScreen = ({ navigation }) => {
    const { userId } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isPremium, loading: subLoading } = useSubscription();

    useEffect(() => {
        if (!userId) return;
        const unsub = getUserProjects(userId, (data) => {
            setProjects(data);
            setLoading(false);
        });
        return unsub;
    }, [userId]);

    const handleDelete = (project) => {
        Alert.alert(
            'Delete Project',
            `Delete "${project.title}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        try { await deleteProject(project.id); }
                        catch (e) { Alert.alert('Error', 'Could not delete project.'); }
                    },
                },
            ]
        );
    };

    const handleOpen = (project) => {
        navigation.navigate('CanvasScreen', {
            canvasData: project.canvasData,
            existingProjectId: project.id,
            projectTitle: project.title,
        });
    };

    const formatDate = (ts) => {
        if (!ts) return 'Recently';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const renderItem = ({ item }) => (
        <View style={styles.projectCard}>
            <View style={styles.thumbnail}>
                {item.thumbnail
                    ? <Image source={{ uri: item.thumbnail }} style={styles.thumbImg} resizeMode="cover" />
                    : (
                        <View style={styles.thumbPlaceholder}>
                            <Ionicons name="cube-outline" size={36} color="#D4AF37" />
                        </View>
                    )}
            </View>
            <View style={styles.projectInfo}>
                <Text style={styles.projectTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.lastEdited}>Updated {formatDate(item.updatedAt)}</Text>
                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.openBtn} onPress={() => handleOpen(item)}>
                        <Ionicons name="pencil-outline" size={14} color="#FFF" />
                        <Text style={styles.openBtnText}>Open</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                        <Ionicons name="trash-outline" size={16} color="#C42D2D" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Saved Projects</Text>
                    <View style={{ width: 40 }} />
                </View>

                {!subLoading && !isPremium && (
                    <View style={styles.freeBanner}>
                        <Text style={styles.freeBannerText}>You are on the Free Plan — 1 project limit. Upgrade for unlimited projects.</Text>
                        <TouchableOpacity 
                            style={styles.freeBannerBtn} 
                            onPress={() => navigation.navigate('SubscriptionScreen')}
                        >
                            <Text style={styles.freeBannerBtnText}>Upgrade</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#D4AF37" />
                        <Text style={styles.loadingText}>Loading projects...</Text>
                    </View>
                ) : projects.length === 0 ? (
                    <View style={styles.centered}>
                        <Ionicons name="folder-open-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyTitle}>No Projects Yet</Text>
                        <Text style={styles.emptySubtitle}>Start designing to save your work here.</Text>
                        <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('CanvasScreen')}>
                            <Text style={styles.newBtnText}>+ New Project</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={projects}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CanvasScreen')}>
                    <LinearGradient colors={['#D4AF37', '#C9A227']} style={styles.fabGradient}>
                        <Ionicons name="add" size={32} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
                <WhatsAppButton />
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F5F0' },
    header: {
        height: 60, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingHorizontal: 20,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE',
    },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
    freeBanner: {
        backgroundColor: '#FFF3CD',
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#FFEEBA'
    },
    freeBannerText: { flex: 1, fontSize: 13, color: '#856404', marginRight: 10 },
    freeBannerBtn: {
        backgroundColor: '#D4AF37',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8
    },
    freeBannerBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    listContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 16 },
    projectCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', borderRadius: 20, padding: 14,
        marginBottom: 14, elevation: 3,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    },
    thumbnail: { width: 90, height: 90, borderRadius: 14, overflow: 'hidden', marginRight: 14 },
    thumbImg: { width: '100%', height: '100%' },
    thumbPlaceholder: {
        width: '100%', height: '100%',
        backgroundColor: '#F1F1F1', justifyContent: 'center', alignItems: 'center',
    },
    projectInfo: { flex: 1 },
    projectTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
    lastEdited: { fontSize: 12, color: '#888', marginBottom: 10 },
    cardActions: { flexDirection: 'row', alignItems: 'center' },
    openBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#D4AF37', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 6, marginRight: 10,
    },
    openBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 4 },
    deleteBtn: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: 'rgba(196,45,45,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    loadingText: { marginTop: 12, color: '#888', fontSize: 14 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8, marginBottom: 24 },
    newBtn: {
        backgroundColor: '#D4AF37', borderRadius: 16,
        paddingHorizontal: 28, paddingVertical: 12,
    },
    newBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
    fab: {
        position: 'absolute', bottom: 30, right: 24,
        width: 60, height: 60, borderRadius: 30, elevation: 6,
    },
    fabGradient: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});

export default SavedProjectsScreen;
