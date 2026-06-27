/**
 * orderService.js
 * Saves an order document to Firestore /orders collection.
 * Generated image base64 is stored in AsyncStorage (temp) until Firebase Storage is enabled.
 * locationPhotoBase64 and compositeImageBase64 are saved to Firestore only if under 500 KB.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

// 500 KB threshold in base64 chars (~3/4 of byte size)
const SIZE_LIMIT = 500_000;

function safeTruncate(val, label) {
    if (!val) return null;
    if (val.length > SIZE_LIMIT) {
        console.warn(`[OrderService] ${label} too large (${val.length} chars). Saving placeholder.`);
        return 'TOO_LARGE';
    }
    return val;
}

export async function placeOrder(orderData) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // ── Fetch user profile for name ───────────────────────────────────────────
    let userName = user.displayName || '';
    try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
            userName =
                userSnap.data()?.name ||
                userSnap.data()?.displayName ||
                userName;
        }
    } catch (e) {
        console.warn('[OrderService] Could not fetch user name:', e);
    }

    // ── Store generated image locally (NOT in Firestore) ─────────────────────
    const imageRefId = `order_img_${user.uid}_${Date.now()}`;
    try {
        await AsyncStorage.setItem(imageRefId, orderData.generatedImageBase64 || '');
    } catch (e) {
        console.warn('[OrderService] Could not store generated image locally:', e);
    }

    // ── Safely handle large image fields ─────────────────────────────────────
    const locationPhotoBase64   = safeTruncate(orderData.locationPhotoBase64,   'locationPhotoBase64');
    const compositeImageBase64  = safeTruncate(orderData.compositeImageBase64,  'compositeImageBase64');
    const threeViewImageBase64  = safeTruncate(orderData.threeViewImageBase64,  'threeViewImageBase64');

    // ── Convert canvasScreenshotUri → base64 if provided ─────────────────────
    let canvasScreenshotBase64 = null;
    if (orderData.canvasScreenshotUri) {
        try {
            const response = await fetch(orderData.canvasScreenshotUri);
            const blob = await response.blob();
            canvasScreenshotBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result?.split(',')[1] || null);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn('[OrderService] Could not convert canvas screenshot:', e);
        }
    }

    // ── Build selectedAssets array ────────────────────────────────────────────
    // Accept either an array (wizard flow) or an object (canvas flow, legacy)
    let selectedAssets = [];
    if (Array.isArray(orderData.selectedAssets)) {
        selectedAssets = orderData.selectedAssets;
    } else if (orderData.selectedAssets && typeof orderData.selectedAssets === 'object') {
        selectedAssets = Object.entries(orderData.selectedAssets)
            .filter(([, v]) => v)
            .map(([category, asset]) => ({
                category,
                assetName: asset.name || '',
                assetThumbnailUrl: asset.thumbnailUrl || asset.fileUrl || '',
            }));
    }

    // ── Save to Firestore ─────────────────────────────────────────────────────
    const docRef = await addDoc(collection(db, 'orders'), {
        // Identity
        userId:    user.uid,
        userName:  userName,
        userEmail: user.email || '',

        // Project info
        projectId:    orderData.projectId    || null,
        projectTitle: orderData.projectTitle || 'Untitled Project',
        designType:   orderData.designType   || null,
        material:     orderData.material     || 'Marble',

        // Dimensions
        dimensions: orderData.dimensions || null,

        // Assets
        selectedAssets: selectedAssets,
        canvasData:     orderData.canvasData || null,

        // Images
        imageRefId:             imageRefId,
        imageUrl:               '',          // filled when Storage is enabled
        locationPhotoBase64:    locationPhotoBase64,
        compositeImageBase64:   compositeImageBase64,
        threeViewImageBase64:   threeViewImageBase64,
        canvasScreenshotBase64: canvasScreenshotBase64,

        // Misc
        textDescription: orderData.textDescription || '',
        status:          'pending',
        createdAt:       serverTimestamp(),
        isRead:          false,
    });

    return docRef.id;
}