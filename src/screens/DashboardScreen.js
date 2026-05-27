import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, FlatList, Image, ImageBackground, Modal, Platform, Pressable, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getResponsiveValues } from '../utils/responsive';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useSubscription } from '../hooks/useSubscription';

// ─── Mock AI Temple image generator ──────────────────────────────────────────
// Returns 2 "enhanced temple design" results. Swap for real API (Imagen/DALL-E)
const MOCK_TEMPLE_RESULTS = [
    {
        id: '1',
        title: 'Classical Nagara Style',
        subtitle: 'Shikhara tower · Mandapa hall · Gopuram gate',
        // Using a reliable temple image placeholder
        uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Brihadeeswarar_Temple_Thanjavur.jpg/800px-Brihadeeswarar_Temple_Thanjavur.jpg',
        style: 'Nagara',
        accent: '#D4AF37',
    },
    {
        id: '2',
        title: 'Dravidian Gopuram Style',
        subtitle: 'Vimana tower · Inner courtyard · Stone columns',
        uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Meenakshi_Amman_Temple_-_Madurai.jpg/800px-Meenakshi_Amman_Temple_-_Madurai.jpg',
        style: 'Dravidian',
        accent: '#A29BFE',
    },
];

const generateTempleDesigns = async (canvasData) => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 2800));
    // Return mock results (replace with real API call)
    return MOCK_TEMPLE_RESULTS;
};

// ─── AI Generator Card ───────────────────────────────────────────────────────

const AiGeneratorCard = ({ colors }) => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [fullscreenImg, setFullscreenImg] = useState(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: false }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
            ])
        ).start();
        Animated.loop(
            Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, useNativeDriver: false })
        ).start();
    };

    const stopPulse = () => {
        pulseAnim.stopAnimation();
        shimmerAnim.stopAnimation();
        pulseAnim.setValue(1);
        shimmerAnim.setValue(0);
    };

    const handleGenerate = useCallback(async () => {
        setLoading(true);
        setResults(null);
        startPulse();
        try {
            const canvasData = {};
            const generated = await generateTempleDesigns(canvasData);
            setResults(generated);
        } catch (e) {
            Alert.alert('Generation Failed', e.message ?? 'Please try again.');
        } finally {
            setLoading(false);
            stopPulse();
        }
    }, []);

    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    return (
        <View style={[styles.aiCard, { backgroundColor: colors.card, borderColor: 'rgba(212,175,55,0.2)' }]}>
            {/* Card Header */}
            <LinearGradient
                colors={['rgba(212,175,55,0.12)', 'rgba(162,155,254,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiCardHeader}
            >
                {/* Shimmer line during loading */}
                {loading && (
                    <Animated.View style={[
                        styles.shimmerLine,
                        { transform: [{ translateX: shimmerTranslate }] }
                    ]} />
                )}
                <View style={styles.aiCardTop}>
                    <View style={styles.aiIconWrap}>
                        <Animated.View style={{ transform: [{ scale: loading ? pulseAnim : 1 }] }}>
                            <Ionicons name="sparkles" size={26} color="#D4AF37" />
                        </Animated.View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.aiCardTitle, { color: colors.text }]}>
                            ✨ AI Temple Generator
                        </Text>
                        <Text style={[styles.aiCardSub, { color: colors.subText }]}>
                            Transform your sketch into a stunning temple design
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.generateBtn, loading && styles.generateBtnLoading]}
                    onPress={handleGenerate}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <>
                            <ActivityIndicator size="small" color="#0A0A1A" />
                            <Text style={styles.generateBtnText}>Enhancing your temple design...</Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="color-wand" size={16} color="#0A0A1A" />
                            <Text style={styles.generateBtnText}>Generate Design</Text>
                            <Ionicons name="arrow-forward" size={14} color="#0A0A1A" />
                        </>
                    )}
                </TouchableOpacity>
            </LinearGradient>

            {/* Results Grid */}
            {results && (
                <View style={styles.aiResults}>
                    <Text style={[styles.aiResultsLabel, { color: colors.subText }]}>
                        2 designs generated • tap to view
                    </Text>
                    <View style={styles.aiResultsGrid}>
                        {results.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.aiResultCard}
                                onPress={() => setFullscreenImg(item)}
                                activeOpacity={0.92}
                            >
                                <Image
                                    source={{ uri: item.uri }}
                                    style={styles.aiResultImg}
                                    resizeMode="cover"
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.78)']}
                                    style={styles.aiResultOverlay}
                                >
                                    <View style={[styles.aiStyleBadge, { borderColor: item.accent }]}>
                                        <Text style={[styles.aiStyleBadgeText, { color: item.accent }]}>
                                            {item.style}
                                        </Text>
                                    </View>
                                    <Text style={styles.aiResultTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.aiResultSub} numberOfLines={1}>{item.subtitle}</Text>
                                </LinearGradient>

                                {/* Action icons */}
                                <View style={styles.aiResultActions}>
                                    <TouchableOpacity
                                        style={styles.aiActionIcon}
                                        onPress={() => Alert.alert('Saved', `"${item.title}" saved to collection.`)}
                                    >
                                        <Ionicons name="bookmark-outline" size={14} color="#FFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.aiActionIcon}
                                        onPress={() => Alert.alert('Download', 'Image saved to gallery.')}
                                    >
                                        <Ionicons name="download-outline" size={14} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Fullscreen Modal */}
            <Modal
                visible={!!fullscreenImg}
                transparent
                animationType="fade"
                onRequestClose={() => setFullscreenImg(null)}
            >
                <View style={styles.fsModal}>
                    <TouchableOpacity
                        style={styles.fsClose}
                        onPress={() => setFullscreenImg(null)}
                    >
                        <Ionicons name="close-circle" size={36} color="#FFF" />
                    </TouchableOpacity>
                    {fullscreenImg && (
                        <>
                            <Image
                                source={{ uri: fullscreenImg.uri }}
                                style={styles.fsImage}
                                resizeMode="contain"
                            />
                            <View style={styles.fsInfo}>
                                <Text style={styles.fsTitle}>{fullscreenImg.title}</Text>
                                <Text style={styles.fsSub}>{fullscreenImg.subtitle}</Text>
                                <TouchableOpacity
                                    style={styles.fsDownload}
                                    onPress={() => Alert.alert('Download', 'Image saved to gallery.')}
                                >
                                    <Ionicons name="download-outline" size={18} color="#0A0A1A" />
                                    <Text style={styles.fsDownloadText}>Save to Gallery</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </Modal>
        </View>
    );
};

// ─── Dashboard Screen ─────────────────────────────────────────────────────────

const DashboardScreen = ({ navigation }) => {
    const { theme, colors, toggleTheme } = useTheme();
    const { currentUser } = useAuth();
    const isDark = theme === 'dark';
    const { width, height } = useWindowDimensions();
    const { moderateScale, isTablet } = getResponsiveValues(width, height);
    const [userData, setUserData] = useState(null);
    const [projectCount, setProjectCount] = useState(0);
    const { isPremium, loading: subLoading } = useSubscription();
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const fabScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!currentUser) return;
        getDoc(doc(db, 'users', currentUser.uid)).then((snap) => { if (snap.exists()) setUserData(snap.data()); });
        getCountFromServer(query(collection(db, 'projects'), where('userId', '==', currentUser.uid)))
            .then((snap) => setProjectCount(snap.data().count)).catch(() => {});
    }, [currentUser]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: false,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 7,
                useNativeDriver: false,
            }),
            Animated.loop(
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: false,
                })
            )
        ]).start();
    }, []);

    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    const designTools = [
        { id: '1', title: 'A1 Design Engine', icon: 'color-palette', color: '#D4AF37', tint: 'rgba(212, 175, 55, 0.1)', screen: 'CanvasScreen' },
        { id: '2', title: 'My Collection', icon: 'folder-open-outline', color: '#4A90E2', tint: 'rgba(74, 144, 226, 0.1)', screen: 'SavedProjectsScreen' },
        { id: '3', title: '3D Walkthrough', icon: 'cube-outline', color: '#50C878', tint: 'rgba(80, 200, 120, 0.1)', screen: 'WalkthroughScreen' },
        { id: '4', title: 'Temple Assets', icon: 'apps-outline', color: '#E0115F', tint: 'rgba(224, 17, 95, 0.1)', screen: 'CanvasScreen' },
    ];

    const recentProjects = [
        { id: '1', title: 'Somnath Temple Revamp', time: '2h ago', progress: 0.85, icon: 'business' },
        { id: '2', title: 'Modern Civic Asharam', time: 'Yesterday', progress: 0.45, icon: 'construct' },
        { id: '3', title: 'Stone Carving Detail B', time: '3 days ago', progress: 1.0, icon: 'star' },
    ];

    const ListHeader = () => (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* HERO CREATION CARD */}
            <TouchableOpacity activeOpacity={0.96} style={styles.heroCardContainer}>
                <View style={styles.heroShadowLayer} />
                <ImageBackground
                    source={require('../../assets/temple_hero.png')}
                    style={styles.heroImage}
                    imageStyle={{ borderRadius: 24 }}
                >
                    <View style={styles.heroImageBlur} />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroOverlay}
                    >
                        <View style={styles.heroContent}>
                            <Text style={styles.heroHeading}>Create Your Next Temple Design</Text>
                            <Text style={styles.heroSubheading}>Design layouts, domes and carvings with precision</Text>

                            <View style={styles.heroButtons}>
                                <TouchableOpacity
                                    style={styles.primaryHeroBtn}
                                    onPress={() => navigation.navigate('CanvasScreen')}
                                >
                                    <View style={[styles.btnGradient, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.primaryHeroBtnText}>New Project</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.secondaryHeroBtn}
                                    onPress={() => navigation.navigate('SavedProjectsScreen')}
                                >
                                    <Text style={styles.secondaryHeroBtnText}>Open Recent</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </TouchableOpacity>

            {/* SMART DESIGN TOOLS */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Smart Design Tools</Text>
            <View style={[styles.toolsGrid, isTablet && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
                {designTools.map((tool) => (
                    <Pressable
                        key={tool.id}
                        style={({ pressed }) => [
                            styles.toolCard,
                            { 
                                backgroundColor: colors.card, 
                                borderColor: colors.border, 
                                borderWidth: 1,
                                width: isTablet ? '23%' : '48%'
                            },
                            pressed && { transform: [{ scale: 0.97 }] }
                        ]}
                        onPress={() => navigation.navigate(tool.screen)}
                    >
                        <View style={[styles.toolIconWrapper, { backgroundColor: tool.tint }]}>
                            <Ionicons name={tool.icon} size={moderateScale(24)} color={tool.color} />
                        </View>
                        <Text style={[styles.toolLabel, { color: colors.text }]}>{tool.title}</Text>
                    </Pressable>
                ))}
            </View>

            {/* ✨ AI TEMPLE GENERATOR ──────────────────────────────── */}
            <AiGeneratorCard colors={colors} />

            {/* RECENT DESIGNS HEADER */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Recent Designs</Text>
                <TouchableOpacity
                    style={styles.viewAllBtn}
                    onPress={() => navigation.navigate('SavedProjectsScreen')}
                >
                    <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderRecentItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.fullWidthCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ProjectDetailScreen', { project: item })}
        >
            <View style={[styles.recentIconBox, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name={item.icon || 'cube-outline'} size={24} color={colors.primary} />
            </View>
            <View style={styles.recentInfo}>
                <View style={styles.recentHeaderRow}>
                    <Text style={[styles.fullProjectTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.projectTimeText, { color: colors.subText }]}>{item.time}</Text>
                </View>
                <View style={styles.progressBarWrapper}>
                    <View style={[styles.progressBarBgFull, { backgroundColor: colors.border + '30' }]}>
                        <LinearGradient
                            colors={[colors.primary, '#F3E5AB']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressBarFill, { width: `${item.progress * 100}%` }]}
                        />
                    </View>
                    <Text style={[styles.progressPct, { color: colors.primary }]}>{Math.round(item.progress * 100)}%</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const ListFooter = () => (
        <View style={{ marginTop: 20 }}>
            {/* SUBSCRIPTION STATUS CARD */}
            <LinearGradient
                colors={isPremium ? ['#D4AF37', '#B8860B'] : [colors.card, colors.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.insightsBanner, !isPremium && { borderWidth: 1, borderColor: colors.border }]}
            >
                <Animated.View style={[styles.shimmerLine, { transform: [{ translateX: shimmerTranslate }] }]} />
                <View style={styles.insightsIconWrapper}>
                    <Ionicons name={isPremium ? "star" : "ribbon-outline"} size={24} color={isPremium ? "#FFF" : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    {isPremium ? (
                        <>
                            <Text style={[styles.insightsText, { color: '#FFF' }]}>Premium Member ✦</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>Unlimited projects unlocked</Text>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.insightsText, { color: colors.text }]}>Free Plan</Text>
                            <Text style={{ color: colors.subText, fontSize: 12, marginTop: 4 }}>Projects: {projectCount}/1 used</Text>
                        </>
                    )}
                </View>
                {!isPremium && (
                    <TouchableOpacity
                        style={styles.upgradeBtn}
                        onPress={() => navigation.navigate('SubscriptionScreen')}
                    >
                        <Text style={styles.upgradeBtnText}>Upgrade</Text>
                    </TouchableOpacity>
                )}
            </LinearGradient>
            <View style={{ height: 160 }} />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.statusBar} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* PREMIUM HEADER */}
                <View style={[styles.header, { backgroundColor: isDark ? colors.card : 'rgba(255,255,255,0.95)', borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                    <View style={styles.headerContent}>
                        <Ionicons name="business" size={24} color={colors.primary} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>A1 Studio</Text>
                            {userData && <Text style={{ fontSize: 12, color: colors.subText, fontWeight: '500' }}>Hi, {userData.name || 'Designer'} 👋</Text>}
                        </View>
                        <View style={styles.headerRight}>
                            {isPremium && (
                                <View style={{ backgroundColor: '#D4AF3718', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginRight: 10 }}>
                                    <Text style={{ color: '#D4AF37', fontSize: 10, fontWeight: '800' }}>PRO</Text>
                                </View>
                            )}
                            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('NotificationScreen')}>
                                <Ionicons name="notifications-outline" size={22} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.profileAvatar} onPress={() => navigation.navigate('ProfileScreen')}>
                                <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {!isDark && (
                        <LinearGradient
                            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.8)']}
                            style={StyleSheet.absoluteFill}
                        />
                    )}
                </View>

                <FlatList
                    data={recentProjects}
                    renderItem={renderRecentItem}
                    keyExtractor={item => item.id}
                    ListHeaderComponent={ListHeader}
                    ListFooterComponent={ListFooter}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                />

                {/* FAB */}
                <View style={styles.fabContainer}>
                    <View style={[styles.fabShadow, { backgroundColor: colors.primary }]} />
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => navigation.navigate('CanvasScreen')}
                        onPressIn={() => {
                            Animated.spring(fabScale, {
                                toValue: 0.9,
                                useNativeDriver: false,
                            }).start();
                        }}
                        onPressOut={() => {
                            Animated.spring(fabScale, {
                                toValue: 1,
                                friction: 4,
                                tension: 40,
                                useNativeDriver: false,
                            }).start();
                        }}
                    >
                        <Animated.View style={[styles.fab, { backgroundColor: colors.primary, transform: [{ scale: fabScale }] }]}>
                            <Ionicons name="add" size={32} color="#FFF" />
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* BOTTOM NAVIGATION */}
                <View style={styles.bottomNavContainer}>
                    <View style={[styles.bottomNav, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {!isDark && (
                            <LinearGradient
                                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                                style={StyleSheet.absoluteFill}
                            />
                        )}
                        <TouchableOpacity style={styles.navItem}>
                            <Ionicons name="home" size={22} color={colors.primary} />
                            <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.navItem}
                            onPress={() => navigation.navigate('CanvasScreen')}
                        >
                            <Ionicons name="brush-outline" size={22} color={colors.subText} />
                        </TouchableOpacity>

                        <View style={{ width: 68 }} />

                        <TouchableOpacity
                            style={styles.navItem}
                            onPress={() => navigation.navigate('CanvasScreen')}
                        >
                            <Ionicons name="images-outline" size={22} color={colors.subText} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.navItem}
                            onPress={() => navigation.navigate('SettingsScreen')}
                        >
                            <Ionicons name="person-outline" size={22} color={colors.subText} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.navCenterItem}
                        onPress={() => navigation.navigate('A1BotScreen')}
                    >
                        <Ionicons name="sparkles" size={24} color={colors.subText} style={{ opacity: 0.6 }} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        height: 70,
        zIndex: 10,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        borderBottomWidth: 1,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 2,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { marginRight: 18 },
    profileAvatar: {
        width: 34, height: 34, borderRadius: 17, padding: 2,
        borderWidth: 1.5, borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    avatarCircle: { flex: 1, borderRadius: 15 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 24 },

    // Hero
    heroCardContainer: {
        height: 200, width: '100%', borderRadius: 24, marginBottom: 30,
        position: 'relative', overflow: 'hidden', elevation: 4,
        boxShadow: '0px 8px 16px rgba(0,0,0,0.08)',
    },
    heroShadowLayer: {},
    heroImage: { flex: 1 },
    heroImageBlur: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
    heroOverlay: { flex: 1, padding: 24, justifyContent: 'center' },
    heroContent: { flex: 1, justifyContent: 'center' },
    heroHeading: {
        fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 8,
        textShadow: '0px 2px 4px rgba(0,0,0,0.3)',
    },
    heroSubheading: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 20, fontWeight: '600' },
    heroButtons: { flexDirection: 'row' },
    primaryHeroBtn: { borderRadius: 22, overflow: 'hidden', marginRight: 12 },
    btnGradient: { paddingHorizontal: 24, paddingVertical: 12 },
    primaryHeroBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    secondaryHeroBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 22, paddingVertical: 11,
        borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    secondaryHeroBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

    // Tools grid
    sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, letterSpacing: 0.5 },
    toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
    toolCard: {
        width: '48%', paddingVertical: 24, paddingHorizontal: 16,
        borderRadius: 20, marginBottom: 16, alignItems: 'center', justifyContent: 'center',
        boxShadow: '0px 4px 12px rgba(0,0,0,0.03)', elevation: 2,
    },
    toolIconWrapper: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    toolLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

    // ── AI Generator Card ────────────────────────────────────────────────────
    aiCard: {
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 28,
        overflow: 'hidden',
        boxShadow: '0px 6px 20px rgba(212,175,55,0.08)',
        elevation: 6,
    },
    aiCardHeader: {
        padding: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    shimmerLine: {
        position: 'absolute',
        top: -50,
        left: 0,
        width: 80,
        height: 200,
        backgroundColor: 'rgba(255,255,255,0.15)',
        transform: [{ rotate: '20deg' }],
        zIndex: 0,
    },
    aiCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 14 },
    aiIconWrap: {
        width: 52, height: 52, borderRadius: 16,
        backgroundColor: 'rgba(212,175,55,0.12)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
    },
    aiCardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4, letterSpacing: 0.3 },
    aiCardSub: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
    generateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#D4AF37',
        boxShadow: '0px 4px 10px rgba(212,175,55,0.35)',
        elevation: 4,
    },
    generateBtnLoading: { backgroundColor: 'rgba(212,175,55,0.7)' },
    generateBtnText: { fontSize: 15, fontWeight: '800', color: '#0A0A1A', letterSpacing: 0.3 },

    // Results
    aiResults: { paddingHorizontal: 16, paddingBottom: 16 },
    aiResultsLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 12, letterSpacing: 0.5 },
    aiResultsGrid: { flexDirection: 'row', gap: 12 },
    aiResultCard: {
        flex: 1,
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0px 0px 10px rgba(0,0,0,0.15)',
        elevation: 4,
    },
    aiResultImg: { width: '100%', height: '100%' },
    aiResultOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        padding: 10,
    },
    aiStyleBadge: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginBottom: 5,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    aiStyleBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    aiResultTitle: { fontSize: 12, fontWeight: '800', color: '#FFF', marginBottom: 2 },
    aiResultSub: { fontSize: 9.5, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
    aiResultActions: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'column',
        gap: 6,
    },
    aiActionIcon: {
        width: 30, height: 30, borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
    },

    // Fullscreen Modal
    fsModal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fsClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
    fsImage: { width: width - 40, height: width - 40, borderRadius: 16 },
    fsInfo: { alignItems: 'center', paddingTop: 20, paddingHorizontal: 30 },
    fsTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 6, textAlign: 'center' },
    fsSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 20, textAlign: 'center' },
    fsDownload: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 32,
        backgroundColor: '#D4AF37',
        borderRadius: 16,
    },
    fsDownloadText: { fontSize: 15, fontWeight: '800', color: '#0A0A1A' },

    // Recent section header
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center' },
    viewAllText: { fontSize: 14, fontWeight: '800', marginRight: 4 },

    // Recent item
    fullWidthCard: {
        width: '100%', padding: 16, borderRadius: 16, marginBottom: 16,
        flexDirection: 'row', alignItems: 'center', borderWidth: 1,
        boxShadow: '0px 2px 8px rgba(0,0,0,0.02)', elevation: 1,
    },
    recentIconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    recentInfo: { flex: 1 },
    recentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    fullProjectTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
    projectTimeText: { fontSize: 12, fontWeight: '600', marginLeft: 10 },
    progressBarWrapper: { flexDirection: 'row', alignItems: 'center' },
    progressBarBgFull: { height: 4, borderRadius: 2, flex: 1, overflow: 'hidden', marginRight: 12 },
    progressBarFill: { height: '100%', borderRadius: 3 },
    progressPct: { fontSize: 11, fontWeight: '700', width: 32 },

    // Insights banner
    insightsBanner: {
        width: '100%', borderRadius: 24, padding: 20,
        flexDirection: 'row', alignItems: 'center',
        boxShadow: '0px 6px 15px rgba(0,0,0,0.1)', elevation: 6,
        overflow: 'hidden',
    },
    insightsIconWrapper: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center', alignItems: 'center', marginRight: 16,
    },
    insightsText: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
    upgradeBtn: { backgroundColor: '#C62828', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginLeft: 12 },
    upgradeBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900' },

    // FAB
    fabContainer: { position: 'absolute', bottom: 114, left: '50%', transform: [{ translateX: -30 }], zIndex: 100 },
    fabShadow: { position: 'absolute', bottom: -4, width: 60, height: 60, borderRadius: 30, opacity: 0.3 },
    fab: {
        width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center',
        elevation: 6, boxShadow: '0px 4px 10px rgba(0,0,0,0.15)',
    },

    // Nav
    bottomNavContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, zIndex: 50 },
    bottomNav: {
        flexDirection: 'row', height: 68, borderRadius: 34, alignItems: 'center',
        justifyContent: 'space-around', paddingHorizontal: 12, overflow: 'hidden', borderWidth: 1,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.05)', elevation: 4,
    },
    navItem: { alignItems: 'center', justifyContent: 'center', height: '100%', width: 50 },
    activeIndicator: { position: 'absolute', bottom: 12, width: 5, height: 5, borderRadius: 2.5 },
    navCenterItem: { position: 'absolute', left: '50%', marginLeft: -15, top: 24 },
});

export default DashboardScreen;
