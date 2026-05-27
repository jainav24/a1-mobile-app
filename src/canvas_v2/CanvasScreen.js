import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, Alert, Modal, Animated as RNAnimated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCanvas, snapPoint } from './hooks/useCanvas';
import { Grid, RenderShapes, DraftShape, AssetGhost, SnapIndicator } from './CanvasEngine';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import Svg, { G } from 'react-native-svg';
import * as Crypto from 'expo-crypto';
import { saveProject } from '../services/projectService';
import { auth, db } from '../../lib/firebase';
import { useSubscription } from '../hooks/useSubscription';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import MaterialSelector from '../components/MaterialSelector';
import GeneratedImageModal from '../components/GeneratedImageModal';
import { generateArchitecturalPrompt } from '../services/canvasToPrompt';
import { generateDesignImage } from '../services/imageGenerationService';
import { placeOrder } from '../services/orderService';
import A1DesignScreen from '../screens/A1DesignScreen';

const { width: SW, height: SH } = Dimensions.get('window');
const SPRING = { damping: 22, stiffness: 180, mass: 0.8 };
const GOLD = '#D4AF37';

// ─── Clamp helper (worklet) ───────────────────────────────────────────────────
function clamp(val, min, max) { 'worklet'; return Math.min(Math.max(val, min), max); }

const hitTest = (raw, shapes) => {
    return [...shapes].reverse().find(s => {
        if (s.type === 'asset') {
            const sc = s.scale || 1;
            const w = (s.width || 80) * sc / 2;
            const h = (s.height || 80) * sc / 2;
            return Math.abs(raw.x - s.x) < w + 10 && Math.abs(raw.y - s.y) < h + 10;
        } else if (s.type === 'rect') {
            const x1 = Math.min(s.x1, s.x2); const x2 = Math.max(s.x1, s.x2);
            const y1 = Math.min(s.y1, s.y2); const y2 = Math.max(s.y1, s.y2);
            return raw.x >= x1 && raw.x <= x2 && raw.y >= y1 && raw.y <= y2;
        } else if (s.type === 'circle') {
            const r = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
            return Math.hypot(raw.x - s.x1, raw.y - s.y1) <= r;
        } else if (s.type === 'line') {
            const len2 = Math.pow(s.x2 - s.x1, 2) + Math.pow(s.y2 - s.y1, 2);
            if (len2 === 0) return Math.hypot(raw.x - s.x1, raw.y - s.y1) < 20;
            const t = Math.max(0, Math.min(1, ((raw.x - s.x1) * (s.x2 - s.x1) + (raw.y - s.y1) * (s.y2 - s.y1)) / len2));
            const pX = s.x1 + t * (s.x2 - s.x1);
            const pY = s.y1 + t * (s.y2 - s.y1);
            return Math.hypot(raw.x - pX, raw.y - pY) < 20;
        }
        return false;
    });
};

export default function CanvasScreen({ navigation, route }) {
    const canvas = useCanvas();
    const [projectId, setProjectId] = useState(route?.params?.existingProjectId || null);
    const [projectTitle, setProjectTitle] = useState(route?.params?.projectTitle || 'Untitled Temple');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { isPremium, loading: subLoading, canCreateProject } = useSubscription();

    // ── Asset Library Modal ──────────────────────────────────────────────────
    const [showAssetLibrary, setShowAssetLibrary] = useState(false);

    // ── AI Image Generation state ────────────────────────────────────────────
    const [showMaterialSelector, setShowMaterialSelector] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageUri, setGeneratedImageUri] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState('Marble');
    const pulseAnim = useRef(new RNAnimated.Value(1)).current;

    // Pulsing animation for the loading overlay
    useEffect(() => {
        if (!isGenerating) return;
        const pulse = RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
                RNAnimated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [isGenerating, pulseAnim]);

    // Check project creation limit on mount if this is a new project
    useEffect(() => {
        const checkLimit = async () => {
            if (projectId || subLoading || !auth.currentUser) return;
            try {
                const projectsRef = collection(db, 'projects');
                const q = query(projectsRef, where('userId', '==', auth.currentUser.uid));
                const snapshot = await getCountFromServer(q);
                const count = snapshot.data().count;
                if (!canCreateProject(count)) {
                    Alert.alert(
                        'Free Plan Limit Reached',
                        'You can only create 1 project on the Free Plan. Upgrade to Premium for unlimited projects.',
                        [
                            { text: 'Cancel', onPress: () => navigation.goBack(), style: 'cancel' },
                            { text: 'Upgrade to Premium', onPress: () => {
                                navigation.goBack();
                                navigation.navigate('SubscriptionScreen');
                            }}
                        ],
                        { cancelable: false }
                    );
                }
            } catch (error) {
                console.error('Error checking project count:', error);
            }
        };
        checkLimit();
    }, [projectId, subLoading, canCreateProject, navigation]);

    // Restore canvas from route params on mount
    useEffect(() => {
        if (route?.params?.canvasData) {
            canvas.restoreCanvasState(route.params.canvasData);
        }
    }, []);

    // Mark dirty on any shape change
    useEffect(() => { setHasUnsavedChanges(true); }, [canvas.shapes]);

    // Auto-save every 30s
    useEffect(() => {
        const interval = setInterval(async () => {
            if (!hasUnsavedChanges || !auth.currentUser) return;
            try {
                const state = canvas.getCanvasState();
                const id = await saveProject(projectId, projectTitle, state);
                if (id && !projectId) setProjectId(id);
                setHasUnsavedChanges(false);
            } catch (e) { console.warn('Auto-save failed', e); }
        }, 30000);
        return () => clearInterval(interval);
    }, [hasUnsavedChanges, projectId, projectTitle, canvas]);

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const state = canvas.getCanvasState();
            const id = await saveProject(projectId, projectTitle, state);
            setProjectId(id);
            setHasUnsavedChanges(false);
            Alert.alert('✓ Project Saved!', 'Your canvas has been saved to the cloud.');
        } catch (e) {
            Alert.alert('Save Failed', auth.currentUser ? e.message : 'Please log in to save projects.');
        } finally { setIsSaving(false); }
    };

    // ── Generate Image handlers ───────────────────────────────────────────────
    const handleGenerateImageTap = useCallback(() => {
        if (canvas.shapes.length === 0) return;
        if (!isPremium) {
            Alert.alert(
                '✨ Premium Feature',
                'Image Generation is a Premium Feature. Upgrade to unlock stunning AI renders of your designs.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Upgrade', onPress: () => navigation.navigate('SubscriptionScreen') },
                ]
            );
            return;
        }
        setShowMaterialSelector(true);
    }, [canvas.shapes.length, isPremium, navigation]);

    const handleMaterialGenerate = useCallback(async (material) => {
        setSelectedMaterial(material);
        setShowMaterialSelector(false);
        setIsGenerating(true);
        try {
            const canvasState = canvas.getCanvasState();
            const prompt = generateArchitecturalPrompt(canvasState, material);
            const imageUri = await generateDesignImage(prompt);
            setIsGenerating(false);
            if (imageUri) {
                setGeneratedImageUri(imageUri);
                setShowImageModal(true);
            } else {
                Alert.alert('Generation Failed', 'Could not generate the image. Please check your API key and try again.');
            }
        } catch (err) {
            setIsGenerating(false);
            Alert.alert('Generation Failed', 'Please try again.');
        }
    }, [canvas]);

    const handleOrderNow = useCallback(() => {
        Alert.alert(
            'Place Order?',
            'Our team will review your design and contact you within 24 hours.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Place Order',
                    onPress: async () => {
                        try {
                            const canvasState = canvas.getCanvasState();
                            const orderId = await placeOrder({
                                projectId, projectTitle, material: selectedMaterial,
                                generatedImageBase64: generatedImageUri, canvasData: canvasState,
                            });
                            const userEmail = auth.currentUser?.email || '';
                            Alert.alert('🎉 Order Placed!', `We'll contact you at ${userEmail} within 24 hours.`);
                            setShowImageModal(false);
                            setGeneratedImageUri(null);
                            navigation.navigate('OrderConfirmationScreen', {
                                material: selectedMaterial, projectTitle, userEmail, orderId,
                            });
                        } catch (err) {
                            Alert.alert('Error', 'Failed to place order. Please try again.');
                        }
                    },
                },
            ]
        );
    }, [canvas, projectId, projectTitle, selectedMaterial, generatedImageUri, navigation]);

    // ── Camera shared values (worklet-safe) ──────────────────────────────────
    const scale      = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTX    = useSharedValue(0);
    const savedTY    = useSharedValue(0);
    const isPinching = useSharedValue(false);
    const canvasW    = useSharedValue(SW);
    const canvasH    = useSharedValue(SH - 60);
    const isPanningCanvas = useSharedValue(false);

    // For render (JSX) — mirrors the shared values
    const [canvasSize, setCanvasSize] = useState({ w: SW, h: SH - 60 });

    // ── Drawing state ─────────────────────────────────────────────────────────
    const [draftStart,   setDraftStart]   = useState(null);
    const [draftCurrent, setDraftCurrent] = useState(null);
    const [snapPos,      setSnapPos]      = useState(null);
    const [interMode,    setInterMode]    = useState(null);
    const [zoomPct,      setZoomPct]      = useState(100);

    const draftStartRef   = useRef(null);
    const draftCurrentRef = useRef(null);
    const interStartRef   = useRef(null);
    const initShapeRef    = useRef(null);
    const canvasRef       = useRef(canvas);
    canvasRef.current = canvas;

    // ── Coord conversion (worklet) ────────────────────────────────────────────
    const toCanvas = (sx, sy) => {
        'worklet';
        return {
            x: (sx - translateX.value - canvasW.value / 2) / scale.value,
            y: (sy - translateY.value - canvasH.value / 2) / scale.value,
        };
    };

    // ── JS-thread handlers ────────────────────────────────────────────────────
    const onTap = useCallback((raw) => {
        const c = canvasRef.current;
        if (!c) return;
        if (c.activeTool === 'select') {
            const hit = hitTest(raw, c.shapes);
            c.setSelectedShapeId(hit ? hit.id : null);
        }
    }, []);

    const onDrawStart = useCallback((raw) => {
        const c = canvasRef.current;
        if (!c) return;
        if (c.activeTool === 'select') {
            const hit = hitTest(raw, c.shapes);
            if (hit) {
                isPanningCanvas.value = false;
                c.setSelectedShapeId(hit.id);
                setInterMode('move');
                interStartRef.current = raw;
                initShapeRef.current = { ...hit };
            } else {
                isPanningCanvas.value = true;
                c.setSelectedShapeId(null);
                setInterMode('pan_canvas');
                interStartRef.current = raw;
            }
            return;
        }
        isPanningCanvas.value = false;
        const coords = snapPoint(raw.x, raw.y, c.snapEnabled);
        setInterMode('draw');
        setDraftStart(coords);
        setDraftCurrent(coords);
        setSnapPos(coords);
        draftStartRef.current = coords;
        draftCurrentRef.current = coords;
    }, []);

    const onDrawUpdate = useCallback((raw) => {
        const c = canvasRef.current;
        if (!c || !interMode) return;
        if (interMode === 'draw') {
            const coords = snapPoint(raw.x, raw.y, c.snapEnabled);
            setDraftCurrent(coords);
            setSnapPos(coords);
            draftCurrentRef.current = coords;
        } else if (interMode === 'move' && c.selectedShapeId && initShapeRef.current) {
            const dx = raw.x - interStartRef.current.x;
            const dy = raw.y - interStartRef.current.y;
            const ini = initShapeRef.current;
            if (ini.type === 'asset') {
                c.updateShape(c.selectedShapeId, { x: ini.x + dx, y: ini.y + dy }, true);
            } else {
                c.updateShape(c.selectedShapeId, {
                    x1: ini.x1 + dx, y1: ini.y1 + dy,
                    x2: ini.x2 + dx, y2: ini.y2 + dy,
                }, true);
            }
        }
    }, [interMode]);

    const onDrawEnd = useCallback(() => {
        const c = canvasRef.current;
        if (!c) return;
        if (interMode === 'draw') {
            const start = draftStartRef.current;
            const end   = draftCurrentRef.current;
            if (start && end) {
                const dist = Math.hypot(end.x - start.x, end.y - start.y);
                if (dist > 4) {
                    c.addShape({ id: Crypto.randomUUID(), type: c.activeTool, x1: start.x, y1: start.y, x2: end.x, y2: end.y });
                }
            }
        } else if (interMode === 'move') {
            c.commitHistory();
        }
        isPanningCanvas.value = false;
        setInterMode(null);
        setDraftStart(null);
        setDraftCurrent(null);
        setSnapPos(null);
        draftStartRef.current = null;
        draftCurrentRef.current = null;
    }, [interMode]);

    const updateZoomPct = useCallback((s) => { setZoomPct(Math.round(s * 100)); }, []);

    // ── Gestures ──────────────────────────────────────────────────────────────
    const pinch = Gesture.Pinch()
        .onStart(() => { isPinching.value = true; })
        .onUpdate(e => {
            scale.value = clamp(savedScale.value * e.scale, 0.2, 6);
            runOnJS(updateZoomPct)(scale.value);
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            isPinching.value = false;
        });

    const pan2 = Gesture.Pan()
        .minPointers(2).maxPointers(5)
        .onUpdate(e => {
            translateX.value = savedTX.value + e.translationX;
            translateY.value = savedTY.value + e.translationY;
        })
        .onEnd(() => {
            savedTX.value = translateX.value;
            savedTY.value = translateY.value;
        });

    const tap = Gesture.Tap()
        .maxDuration(280)
        .onEnd(e => {
            if (isPinching.value) return;
            const coords = toCanvas(e.x, e.y);
            runOnJS(onTap)({ ...coords, sx: e.x, sy: e.y });
        });

    const draw = Gesture.Pan()
        .maxPointers(1).minDistance(3)
        .onStart(e => {
            if (isPinching.value) return;
            const coords = toCanvas(e.x, e.y);
            runOnJS(onDrawStart)({ ...coords, sx: e.x, sy: e.y });
        })
        .onUpdate(e => {
            if (isPinching.value) return;
            if (isPanningCanvas.value) {
                translateX.value = savedTX.value + e.translationX;
                translateY.value = savedTY.value + e.translationY;
            } else {
                const coords = toCanvas(e.x, e.y);
                runOnJS(onDrawUpdate)({ ...coords, sx: e.x, sy: e.y });
            }
        })
        .onEnd(() => {
            if (isPanningCanvas.value) {
                savedTX.value = translateX.value;
                savedTY.value = translateY.value;
            }
            runOnJS(onDrawEnd)();
        });

    const composed = Gesture.Simultaneous(
        Gesture.Simultaneous(pinch, pan2),
        Gesture.Race(draw, tap),
    );

    // ── Animated styles ───────────────────────────────────────────────────────
    const canvasAnim = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    // ── Helpers ───────────────────────────────────────────────────────────────
    const zoomBy = useCallback((factor) => {
        const next = clamp(savedScale.value * factor, 0.2, 6);
        scale.value = withSpring(next, SPRING);
        savedScale.value = next;
        setZoomPct(Math.round(next * 100));
    }, [scale, savedScale]);

    const resetCamera = useCallback(() => {
        scale.value = withSpring(1, SPRING);
        translateX.value = withSpring(0, SPRING);
        translateY.value = withSpring(0, SPRING);
        savedScale.value = 1; savedTX.value = 0; savedTY.value = 0;
        setZoomPct(100);
    }, [scale, translateX, translateY, savedScale, savedTX, savedTY]);

    const rotateSelected = useCallback((deg) => {
        if (!canvas.selectedShapeId) return;
        const shape = canvas.shapes.find(s => s.id === canvas.selectedShapeId);
        if (shape?.type === 'asset') {
            canvas.updateShape(canvas.selectedShapeId, {
                rotation: ((shape.rotation || 0) + deg + 360) % 360,
            });
            canvas.commitHistory();
        }
    }, [canvas]);

    // ── Handle asset placed from library ─────────────────────────────────────
    const handleAssetSelect = useCallback((asset) => {
        // Center of current canvas view in canvas coordinates
        const cx = -translateX.value / scale.value;
        const cy = -translateY.value / scale.value;
        canvas.addAssetElement(asset, cx, cy);
    }, [canvas, translateX, translateY, scale]);

    const selectedShape = canvas.shapes.find(s => s.id === canvas.selectedShapeId);
    const isAssetSelected = selectedShape?.type === 'asset';

    const tools = [
        { key: 'select', icon: 'navigate-outline' },
        { key: 'line',   icon: 'remove-outline'   },
        { key: 'rect',   icon: 'square-outline'   },
        { key: 'circle', icon: 'ellipse-outline'  },
        { key: 'asset',  icon: 'images-outline'   },
    ];

    return (
        <SafeAreaView style={s.root}>
            {/* ── TOP BAR ── */}
            <View style={s.topBar}>
                <View style={s.topLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
                        <Ionicons name="arrow-back" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <TextInput
                        style={s.projName}
                        value={canvas.projectName}
                        onChangeText={canvas.setProjectName}
                        placeholder="Project Name"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                    />
                </View>
                <View style={s.topRight}>
                    <TouchableOpacity onPress={() => canvas.setSnapEnabled(v => !v)} style={[s.iconBtn, canvas.snapEnabled && s.activeIconBtn]}>
                        <Ionicons name="magnet-outline" size={18} color={canvas.snapEnabled ? GOLD : 'rgba(255,255,255,0.5)'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={canvas.undo} disabled={!canvas.canUndo} style={[s.iconBtn, !canvas.canUndo && s.dimmed]}>
                        <Ionicons name="arrow-undo-outline" size={18} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={canvas.redo} disabled={!canvas.canRedo} style={[s.iconBtn, !canvas.canRedo && s.dimmed]}>
                        <Ionicons name="arrow-redo-outline" size={18} color="#FFF" />
                    </TouchableOpacity>
                    {canvas.shapes.length > 0 && (
                        <TouchableOpacity onPress={handleGenerateImageTap} style={s.generateBtn}>
                            <Ionicons name="sparkles" size={14} color="#0A0A1A" />
                            <Text style={s.generateBtnTxt}>Generate</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleSave} disabled={isSaving} style={[s.saveBtn, isSaving && { opacity: 0.6 }]}>
                        <Ionicons name="cloud-upload-outline" size={15} color="#0A0A1A" />
                        <Text style={s.saveTxt}>{isSaving ? 'Saving...' : 'Save'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── CANVAS ── */}
            <View
                style={s.canvasWrap}
                onLayout={e => {
                    const { width, height } = e.nativeEvent.layout;
                    canvasW.value = width;
                    canvasH.value = height;
                    setCanvasSize({ w: width, h: height });
                }}
            >
                <GestureDetector gesture={composed}>
                    <View style={StyleSheet.absoluteFill}>
                        <Animated.View style={[s.canvasInner, canvasAnim]}>
                            <Grid center={{ x: canvasSize.w * 2, y: canvasSize.h * 2 }} />
                            <View style={s.svgLayer} pointerEvents="none">
                                <Svg width="100%" height="100%">
                                    <G transform={`translate(${canvasSize.w * 2},${canvasSize.h * 2})`}>
                                        <RenderShapes
                                            shapes={canvas.shapes}
                                            selectedShapeId={canvas.selectedShapeId}
                                        />
                                        <DraftShape type={canvas.activeTool} startPoint={draftStart} currentPoint={draftCurrent} />
                                        {canvas.snapEnabled && snapPos && interMode === 'draw' && <SnapIndicator position={snapPos} />}
                                    </G>
                                </Svg>
                            </View>
                        </Animated.View>
                    </View>
                </GestureDetector>

                {/* ── RIGHT TOOLBAR ── */}
                <View style={s.toolbar}>
                    {tools.map(t => (
                        <TouchableOpacity
                            key={t.key}
                            style={[s.toolBtn, canvas.activeTool === t.key && s.toolBtnActive]}
                            onPress={() => {
                                if (t.key === 'asset') {
                                    setShowAssetLibrary(true);
                                } else {
                                    canvas.setActiveTool(t.key);
                                    canvas.setSelectedAssetType(null);
                                }
                            }}
                        >
                            <Ionicons name={t.icon} size={22} color={canvas.activeTool === t.key ? GOLD : 'rgba(255,255,255,0.65)'} />
                            {canvas.activeTool === t.key && <View style={s.toolDot} />}
                        </TouchableOpacity>
                    ))}
                    <View style={s.toolSep} />
                    {/* Rotate (asset only) */}
                    {isAssetSelected && <>
                        <TouchableOpacity style={s.toolBtn} onPress={() => rotateSelected(-15)}>
                            <Ionicons name="arrow-undo-circle-outline" size={22} color="rgba(255,255,255,0.65)" />
                        </TouchableOpacity>
                        <TouchableOpacity style={s.toolBtn} onPress={() => rotateSelected(15)}>
                            <Ionicons name="arrow-redo-circle-outline" size={22} color="rgba(255,255,255,0.65)" />
                        </TouchableOpacity>
                        <View style={s.toolSep} />
                    </>}
                    <TouchableOpacity
                        style={[s.toolBtn, !canvas.selectedShapeId && s.dimmed]}
                        disabled={!canvas.selectedShapeId}
                        onPress={() => canvas.selectedShapeId && canvas.deleteShape(canvas.selectedShapeId)}
                    >
                        <Ionicons name="trash-outline" size={20} color={canvas.selectedShapeId ? '#FF5252' : 'rgba(255,255,255,0.2)'} />
                    </TouchableOpacity>
                </View>

                {/* ── HUD ── */}
                <View style={s.hud}>
                    <Text style={s.hudTool}>{canvas.activeTool.toUpperCase()}</Text>
                    <Text style={s.hudInfo}>{canvas.shapes.length} elements  ·  {zoomPct}%</Text>
                </View>

                {/* ── ZOOM CONTROLS ── */}
                <View style={s.zoomCtrl}>
                    <TouchableOpacity style={s.zoomBtn} onPress={() => zoomBy(1.25)}>
                        <Ionicons name="add" size={18} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.zoomBtn} onPress={resetCamera}>
                        <Text style={s.zoomReset}>1:1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.zoomBtn} onPress={() => zoomBy(0.8)}>
                        <Ionicons name="remove" size={18} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── ASSET LIBRARY MODAL ── */}
            <A1DesignScreen
                isVisible={showAssetLibrary}
                onClose={() => setShowAssetLibrary(false)}
                onAssetSelect={handleAssetSelect}
            />

            {/* ── MATERIAL SELECTOR ── */}
            <MaterialSelector
                visible={showMaterialSelector}
                onClose={() => setShowMaterialSelector(false)}
                onGenerate={handleMaterialGenerate}
            />

            {/* ── GENERATING OVERLAY ── */}
            <Modal visible={isGenerating} transparent animationType="fade" statusBarTranslucent>
                <View style={s.genOverlay}>
                    <RNAnimated.View style={[s.genLogoWrap, { transform: [{ scale: pulseAnim }] }]}>
                        <Ionicons name="sparkles" size={48} color={GOLD} />
                    </RNAnimated.View>
                    <Text style={s.genTitle}>Creating your architectural vision…</Text>
                    <Text style={s.genSubtitle}>This may take 15–30 seconds</Text>
                    <View style={s.genProgressTrack}>
                        <RNAnimated.View style={[s.genProgressBar, {
                            opacity: pulseAnim.interpolate({ inputRange: [1, 1.15], outputRange: [0.5, 1] })
                        }]} />
                    </View>
                </View>
            </Modal>

            {/* ── GENERATED IMAGE MODAL ── */}
            <GeneratedImageModal
                visible={showImageModal}
                imageUri={generatedImageUri}
                material={selectedMaterial}
                canvasSnapshot={canvas.getCanvasState()}
                projectTitle={projectTitle}
                onClose={() => {
                    setShowImageModal(false);
                    setGeneratedImageUri(null);
                }}
                onOrder={handleOrderNow}
            />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#05050A' },

    // Top bar
    topBar: {
        height: 56, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingHorizontal: 12,
        backgroundColor: '#0A0A1F',
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    topLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    topRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    iconBtn:  { padding: 8, borderRadius: 10 },
    activeIconBtn: { backgroundColor: 'rgba(212,175,55,0.12)' },
    projName: { color: '#FFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.4, maxWidth: 140 },
    saveBtn:  {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: GOLD, paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 10, marginLeft: 6,
    },
    saveTxt:  { color: '#0A0A1A', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
    generateBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: GOLD, paddingHorizontal: 10, paddingVertical: 8,
        borderRadius: 10, marginLeft: 2,
    },
    generateBtnTxt: { color: '#0A0A1A', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 },

    // Generating overlay
    genOverlay: {
        flex: 1, backgroundColor: 'rgba(5,5,15,0.96)',
        alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
    },
    genLogoWrap: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(212,175,55,0.12)',
        borderWidth: 2, borderColor: 'rgba(212,175,55,0.3)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 32,
    },
    genTitle: {
        color: '#FFFFFF', fontSize: 20, fontWeight: '800',
        textAlign: 'center', letterSpacing: 0.2, marginBottom: 10,
    },
    genSubtitle: {
        color: 'rgba(255,255,255,0.4)', fontSize: 13,
        textAlign: 'center', marginBottom: 36,
    },
    genProgressTrack: {
        width: '80%', height: 4, backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 2, overflow: 'hidden',
    },
    genProgressBar: {
        width: '100%', height: '100%',
        backgroundColor: GOLD, borderRadius: 2,
    },
    dimmed: { opacity: 0.25 },

    // Canvas
    canvasWrap:  { flex: 1, overflow: 'hidden', backgroundColor: '#F8F6F1' },
    canvasInner: { position: 'absolute', top: '-150%', left: '-150%', width: '400%', height: '400%', backgroundColor: '#F8F6F1' },
    svgLayer:    { ...StyleSheet.absoluteFillObject },

    // Toolbar
    toolbar: {
        position: 'absolute', right: 12, top: '50%', marginTop: -160,
        backgroundColor: 'rgba(14,14,28,0.94)',
        borderRadius: 22, padding: 6, gap: 2,
        borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)',
        elevation: 12,
    },
    toolBtn:       { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    toolBtnActive: { backgroundColor: 'rgba(212,175,55,0.14)' },
    toolDot:       { position: 'absolute', right: 3, width: 3, height: 10, borderRadius: 2, backgroundColor: GOLD },
    toolSep:       { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 6, marginHorizontal: 8 },

    // HUD
    hud: {
        position: 'absolute', top: 14, left: 14,
        backgroundColor: 'rgba(10,10,25,0.82)',
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
    },
    hudTool: { color: GOLD, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    hudInfo: { color: 'rgba(255,255,255,0.35)', fontSize: 9, marginTop: 2 },

    // Zoom controls
    zoomCtrl: {
        position: 'absolute', bottom: 24, right: 14,
        backgroundColor: 'rgba(14,14,28,0.94)',
        borderRadius: 16, padding: 4, gap: 2,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        elevation: 8,
    },
    zoomBtn:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    zoomReset: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '800' },
});
