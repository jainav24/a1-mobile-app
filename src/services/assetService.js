import {
  collection, query, where, onSnapshot, getDocs,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

/**
 * Real-time listener for all active 2D assets.
 * Returns unsubscribe function.
 */
export const getActiveAssets = (callback) => {
  const q = query(
    collection(db, 'assets'), 
    where('isActive', '==', true),
    where('type', '==', '2D')
  );
  return onSnapshot(q, (snap) => {
    const assets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(assets);
  }, (error) => {
    console.error("Error fetching assets: ", error);
    callback([]);
  });
};

/**
 * One-time fetch of active 2D assets filtered by category.
 */
export const getAssetsByCategory = async (category) => {
  try {
    const q = query(
      collection(db, 'assets'),
      where('isActive', '==', true),
      where('type', '==', '2D'),
      where('category', '==', category)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching assets by category: ", error);
    return [];
  }
};
