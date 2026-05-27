import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getProjectById, deleteProject } from '../services/projectService';

const ProjectDetailScreen = ({ route, navigation }) => {
    const { projectId, project: passedProject } = route.params || {};
    const [project, setProject] = useState(passedProject || null);
    const [loading, setLoading] = useState(!passedProject);

    useEffect(() => {
        if (!passedProject && projectId) {
            getProjectById(projectId).then((data) => { setProject(data); setLoading(false); }).catch(() => setLoading(false));
        }
    }, [projectId]);

    const fmt = (ts) => { if (!ts) return 'Unknown'; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };

    const handleOpen = () => navigation.navigate('CanvasScreen', { canvasData: project.canvasData, existingProjectId: project.id, projectTitle: project.title });

    const handleDelete = () => Alert.alert('Delete Project', `Delete "${project?.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteProject(project.id); navigation.goBack(); } catch { Alert.alert('Error', 'Could not delete.'); } } },
    ]);

    if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#D4AF37" /></View>;
    if (!project) return <View style={s.centered}><Text style={{ color: '#888' }}>Project not found.</Text></View>;

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" />
            <View style={s.hero}>
                {project.thumbnail ? <Image source={{ uri: project.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <LinearGradient colors={['#1a1a2e', '#0A0A1A']} style={StyleSheet.absoluteFill} />}
                <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                <SafeAreaView>
                    <View style={s.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Ionicons name="chevron-back" size={28} color="#FFF" /></TouchableOpacity>
                        <Text style={s.headerTitle}>Project Details</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </View>
            <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 50 }}>
                <Text style={s.title}>{project.title}</Text>
                <Text style={s.meta}>Created: {fmt(project.createdAt)}</Text>
                <Text style={s.meta}>Updated: {fmt(project.updatedAt)}</Text>
                <Text style={s.meta}>Elements: {project.canvasData?.elements?.length ?? 0}</Text>
                <TouchableOpacity style={s.openBtn} onPress={handleOpen}>
                    <Ionicons name="brush-outline" size={18} color="#0A0A1A" />
                    <Text style={s.openBtnText}>Open in Canvas</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.delBtn} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={18} color="#C42D2D" />
                    <Text style={s.delBtnText}>Delete Project</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F5F0' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    hero: { height: 200, position: 'relative' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
    back: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
    body: { flex: 1, padding: 24 },
    title: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 12 },
    meta: { fontSize: 13, color: '#666', marginBottom: 6 },
    openBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D4AF37', borderRadius: 16, paddingVertical: 15, marginTop: 28, marginBottom: 12 },
    openBtnText: { fontSize: 15, fontWeight: '800', color: '#0A0A1A', marginLeft: 8 },
    delBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(196,45,45,0.3)', borderRadius: 16, paddingVertical: 13 },
    delBtnText: { fontSize: 14, fontWeight: '700', color: '#C42D2D', marginLeft: 8 },
});

export default ProjectDetailScreen;
