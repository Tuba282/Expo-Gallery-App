import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../config/firebase";

/**
 * Fetch all public gallery images (one-time query)
 * 
 * @param {number} [maxCount=50]
 * @returns {Promise<{images: Array<object>, error: string | null}>}
 */
export async function getPublicImages(maxCount = 50) {
  try {
    const imagesCol = collection(db, "images");
    const q = query(imagesCol, orderBy("createdAt", "desc"), limit(maxCount));
    const snapshot = await getDocs(q);

    const images = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { images, error: null };
  } catch (error) {
    return { images: [], error: error.message || "Failed to fetch public images." };
  }
}

/**
 * Subscribe in real-time to public gallery images
 * 
 * @param {(images: Array<object>) => void} onUpdate
 * @param {(error: Error) => void} onError
 * @param {number} [maxCount=50]
 * @returns {import('firebase/firestore').Unsubscribe}
 */
export function subscribeToPublicImages(onUpdate, onError, maxCount = 50) {
  const imagesCol = collection(db, "images");
  const q = query(imagesCol, orderBy("createdAt", "desc"), limit(maxCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const images = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      onUpdate(images);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}
