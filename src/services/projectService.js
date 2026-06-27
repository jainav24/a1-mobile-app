import { Alert } from 'react-native';
import {
  doc, setDoc, getDoc, deleteDoc,
  collection, query, where, orderBy, onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

/**
 * Save or update a project in Firestore.
 * thumbnailUri is intentionally ignored (Storage not enabled).
 */
export const saveProject = async (projectId, title, canvasState) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const id = projectId || `${uid}_${Date.now()}`;
  const ref = doc(db, 'projects', id);

  let finalCanvasState = { ...canvasState };
  
  // Size check to avoid Firestore 1MB document limit
  const stateString = JSON.stringify(finalCanvasState);
  if (stateString.length > 900000) {
    if (finalCanvasState.locationPhotoBase64) {
      finalCanvasState.locationPhotoBase64 = null;
      Alert.alert(
        "Size Limit Exceeded",
        "The project is too large due to the location photo. The photo has been removed from this save to fit within storage limits."
      );
    }
  }

  await setDoc(
    ref,
    {
      projectId: id,
      userId: uid,
      title: title || 'Untitled',
      thumbnail: null,           // Storage not enabled yet
      canvasData: finalCanvasState,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(), // merge:true prevents overwrite on update
    },
    { merge: true }
  );
  return id;
};

/**
 * Real-time listener for all projects owned by uid.
 * Returns unsubscribe function.
 */
export const getUserProjects = (uid, callback) => {
  const q = query(
    collection(db, 'projects'),
    where('userId', '==', uid),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(projects);
  });
};

/**
 * Fetch a single project by ID.
 */
export const getProjectById = async (projectId) => {
  const snap = await getDoc(doc(db, 'projects', projectId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

/**
 * Delete a project document (thumbnail deletion skipped — Storage disabled).
 */
export const deleteProject = async (projectId) => {
  await deleteDoc(doc(db, 'projects', projectId));
};
