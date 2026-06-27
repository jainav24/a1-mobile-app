import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const STORAGE_KEY = '@a1_canvas_v2_project';
const MAX_HISTORY = 50;
export const SNAP_SIZE = 25;

export const snapToGrid = (val) => Math.round(val / SNAP_SIZE) * SNAP_SIZE;
export const snapPoint = (x, y, enabled = true) => {
    if (!enabled) return { x, y };
    return { x: snapToGrid(x), y: snapToGrid(y) };
};



export const useCanvas = () => {
    const [shapes, setShapes] = useState([]);
    const [projectName, setProjectName] = useState('Untitled Temple');
    const [activeTool, setActiveTool] = useState('select');
    const [selectedShapeId, setSelectedShapeId] = useState(null);
    const [selectedAssetType, setSelectedAssetType] = useState(null);
    const [isAssetPanelOpen, setAssetPanelOpen] = useState(false);
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [dimensions, setDimensions] = useState({ length: '', width: '', height: '', unit: 'feet' });
    const [locationPhotoBase64, setLocationPhotoBase64] = useState(null);

    // ─── Undo / Redo ─────────────────────────────────────────────────────
    const historyRef = useRef([]);
    const redoRef = useRef([]);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const isUndoRedoRef = useRef(false);
    const shapesRef = useRef([]);

    const syncFlags = () => {
        setCanUndo(historyRef.current.length > 0);
        setCanRedo(redoRef.current.length > 0);
    };

    const pushToHistory = useCallback((prevShapes) => {
        const updated = [...historyRef.current, prevShapes];
        historyRef.current = updated.length > MAX_HISTORY
            ? updated.slice(updated.length - MAX_HISTORY)
            : updated;
        redoRef.current = [];
        syncFlags();
    }, []);

    const undo = useCallback(() => {
        if (historyRef.current.length === 0) return;
        isUndoRedoRef.current = true;
        const newHistory = [...historyRef.current];
        const prevState = newHistory.pop();
        redoRef.current = [...redoRef.current, shapesRef.current];
        historyRef.current = newHistory;
        setShapes(prevState);
        shapesRef.current = prevState;
        setSelectedShapeId(null);
        syncFlags();
        setTimeout(() => { isUndoRedoRef.current = false; }, 0);
    }, []);

    const redo = useCallback(() => {
        if (redoRef.current.length === 0) return;
        isUndoRedoRef.current = true;
        const newRedo = [...redoRef.current];
        const nextState = newRedo.pop();
        historyRef.current = [...historyRef.current, shapesRef.current];
        redoRef.current = newRedo;
        setShapes(nextState);
        shapesRef.current = nextState;
        setSelectedShapeId(null);
        syncFlags();
        setTimeout(() => { isUndoRedoRef.current = false; }, 0);
    }, []);

    // ─── Persistence (local) ─────────────────────────────────────────────
    const saveLocal = useCallback(async (currentShapes, name) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                projectName: name, shapes: currentShapes, timestamp: Date.now(),
            }));
            return true;
        } catch (e) { console.error('Save failed', e); return false; }
    }, []);

    const loadLocal = useCallback(async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed.shapes) { setShapes(parsed.shapes); shapesRef.current = parsed.shapes; }
            if (parsed.projectName) setProjectName(parsed.projectName);
        } catch (e) { console.error('Load failed', e); }
    }, []);

    useEffect(() => { loadLocal(); }, [loadLocal]);

    // ─── Shape Operations ─────────────────────────────────────────────────
    const addShape = useCallback((shape) => {
        setShapes(prev => {
            if (!isUndoRedoRef.current) pushToHistory(prev);
            const next = [...prev, shape];
            shapesRef.current = next;
            return next;
        });
    }, [pushToHistory]);

    const updateShape = useCallback((id, updates, isTransient = false) => {
        setShapes(prev => {
            if (!isUndoRedoRef.current && !isTransient) pushToHistory(prev);
            const next = prev.map(s => s.id === id ? { ...s, ...updates } : s);
            shapesRef.current = next;
            return next;
        });
    }, [pushToHistory]);

    const deleteShape = useCallback((id) => {
        setShapes(prev => {
            if (!isUndoRedoRef.current) pushToHistory(prev);
            const next = prev.filter(s => s.id !== id);
            shapesRef.current = next;
            return next;
        });
        setSelectedShapeId(null);
    }, [pushToHistory]);

    const clearCanvas = useCallback(() => {
        setShapes(prev => {
            pushToHistory(prev);
            shapesRef.current = [];
            return [];
        });
        setSelectedShapeId(null);
    }, [pushToHistory]);

    const commitHistory = useCallback(() => {
        pushToHistory(shapesRef.current);
    }, [pushToHistory]);

    const selectAsset = useCallback((asset) => {
        setSelectedAssetType(asset);
        setActiveTool('asset');
        setAssetPanelOpen(false);
    }, []);

    const addAssetElement = useCallback((asset, centerX = 0, centerY = 0) => {
        const newShape = {
            id: Crypto.randomUUID(),
            type: 'asset',
            assetId: asset.id,
            assetName: asset.name,
            fileUrl: asset.fileUrl,
            thumbnailUrl: asset.thumbnailUrl,
            category: asset.category,
            x: centerX,
            y: centerY,
            width: asset.width || 80,
            height: asset.height || 80,
            rotation: 0,
            scale: 1,
            layer: shapesRef.current.length,
        };
        addShape(newShape);
        setSelectedShapeId(newShape.id);
        setActiveTool('select');
    }, [addShape]);


    // ─── Canvas State Serialization ───────────────────────────────────────
    const getCanvasState = useCallback(() => {
        const elements = shapesRef.current.map((s, index) => {
            const base = {
                id: s.id,
                layer: index,
                strokeColor: s.strokeColor || '#FFFFFF',
                fillColor: s.fillColor || 'rgba(255,255,255,0.04)',
                strokeWidth: s.strokeWidth || 1.5,
            };
            if (s.type === 'asset') {
                return {
                    ...base,
                    type: 'asset',
                    assetId: s.assetId,
                    assetName: s.assetName,
                    fileUrl: s.fileUrl,
                    thumbnailUrl: s.thumbnailUrl,
                    category: s.category,
                    position: { x: s.x || 0, y: s.y || 0 },
                    width: s.width || 80,
                    height: s.height || 80,
                    rotation: s.rotation || 0,
                    scale: s.scale || 1,
                };
            }
            if (s.type === 'line') {
                return {
                    ...base,
                    type: 'shape',
                    shapeType: 'line',
                    position: { x: s.x1 || 0, y: s.y1 || 0 },
                    startPoint: { x: s.x1 || 0, y: s.y1 || 0 },
                    endPoint: { x: s.x2 || 0, y: s.y2 || 0 },
                    rotation: 0,
                    scale: 1,
                };
            }
            if (s.type === 'rect') {
                const w = Math.abs((s.x2 || 0) - (s.x1 || 0));
                const h = Math.abs((s.y2 || 0) - (s.y1 || 0));
                return {
                    ...base,
                    type: 'shape',
                    shapeType: 'rectangle',
                    position: { x: Math.min(s.x1 || 0, s.x2 || 0), y: Math.min(s.y1 || 0, s.y2 || 0) },
                    width: w,
                    height: h,
                    rotation: 0,
                    scale: 1,
                };
            }
            if (s.type === 'circle') {
                return {
                    ...base,
                    type: 'shape',
                    shapeType: 'circle',
                    position: { x: s.x1 || 0, y: s.y1 || 0 },
                    rotation: 0,
                    scale: 1,
                };
            }
            return { ...base, ...s };
        });

        return {
            zoom: 1,
            panOffset: { x: 0, y: 0 },
            gridVisible: true,
            snapEnabled,
            dimensions,
            locationPhotoBase64,
            elements,
        };
    }, [snapEnabled, dimensions, locationPhotoBase64]);

    const restoreCanvasState = useCallback((canvasData) => {
        if (!canvasData) return;
        if (canvasData.snapEnabled !== undefined) setSnapEnabled(canvasData.snapEnabled);
        if (canvasData.dimensions) setDimensions(canvasData.dimensions);
        if (canvasData.locationPhotoBase64 !== undefined) setLocationPhotoBase64(canvasData.locationPhotoBase64);

        const restored = (canvasData.elements || []).map((el) => {
            if (el.type === 'asset') {
                return {
                    id: el.id,
                    type: 'asset',
                    assetId: el.assetId,
                    assetName: el.assetName,
                    fileUrl: el.fileUrl,
                    thumbnailUrl: el.thumbnailUrl,
                    category: el.category,
                    x: el.position?.x || 0,
                    y: el.position?.y || 0,
                    width: el.width || 80,
                    height: el.height || 80,
                    rotation: el.rotation || 0,
                    scale: el.scale || 1,
                };
            }
            if (el.shapeType === 'line') {
                return {
                    id: el.id,
                    type: 'line',
                    x1: el.startPoint?.x || 0,
                    y1: el.startPoint?.y || 0,
                    x2: el.endPoint?.x || 0,
                    y2: el.endPoint?.y || 0,
                };
            }
            if (el.shapeType === 'rectangle') {
                return {
                    id: el.id,
                    type: 'rect',
                    x1: el.position?.x || 0,
                    y1: el.position?.y || 0,
                    x2: (el.position?.x || 0) + (el.width || 0),
                    y2: (el.position?.y || 0) + (el.height || 0),
                };
            }
            if (el.shapeType === 'circle') {
                return {
                    id: el.id,
                    type: 'circle',
                    x1: el.position?.x || 0,
                    y1: el.position?.y || 0,
                    x2: (el.position?.x || 0) + 50,
                    y2: (el.position?.y || 0) + 50,
                };
            }
            return el;
        });

        historyRef.current = [];
        redoRef.current = [];
        setShapes(restored);
        shapesRef.current = restored;
        setSelectedShapeId(null);
        syncFlags();
    }, []);

    return {
        shapes, setShapes,
        projectName, setProjectName,
        activeTool, setActiveTool,
        selectedShapeId, setSelectedShapeId,
        selectedAssetType, setSelectedAssetType,
        isAssetPanelOpen, setAssetPanelOpen,
        selectAsset,
        snapEnabled, setSnapEnabled,
        dimensions, setDimensions,
        locationPhotoBase64, setLocationPhotoBase64,
        addShape, updateShape, deleteShape, clearCanvas,
        saveProject: saveLocal, undo, redo, canUndo, canRedo,
        commitHistory,
        getCanvasState, restoreCanvasState, addAssetElement,
    };
};
