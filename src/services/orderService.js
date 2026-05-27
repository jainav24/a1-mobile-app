/**
 * orderService.js
 * Saves an order document to Firestore /orders collection.
 * Image is stored in AsyncStorage (temp) until Firebase Storage is enabled.
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

export async function placeOrder(orderData) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Fetch user profile for name
    let userName = user.displayName || '';
    try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
            userName = userSnap.data()?.name ||
                userSnap.data()?.displayName ||
                userName;
        }
    } catch (e) {
        console.warn('[OrderService] Could not fetch user name:', e);
    }

    // Generate a local image reference ID
    const imageRefId = `order_img_${user.uid}_${Date.now()}`;

    // Store the base64 image locally (NOT in Firestore)
    try {
        await AsyncStorage.setItem(
            imageRefId,
            orderData.generatedImageBase64 || ''
        );
    } catch (e) {
        console.warn('[OrderService] Could not store image locally:', e);
    }

    // Save order to Firestore WITHOUT the large base64 image
    const docRef = await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        userName: userName,
        userEmail: user.email || '',
        projectId: orderData.projectId || null,
        projectTitle: orderData.projectTitle || 'Untitled Project',
        material: orderData.material || 'Marble',
        imageRefId: imageRefId,       // ← reference only, not the image
        imageUrl: '',               // ← will be filled when Storage enabled
        canvasData: orderData.canvasData || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        isRead: false,
    });

    return docRef.id;
}