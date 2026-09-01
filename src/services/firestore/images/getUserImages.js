import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../config/firebase";

/**
 * Fetch all images owned by a specific user (one-time query)
 * 
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<{images: Array<object>, error: string | null}>}
 */
export async function getUserImages(userId) {
  try {
    if (!userId) {
      return { images: [], error: "User ID is required." };
    }

    const imagesCol = collection(db, "images");
    const q = query(
      imagesCol,
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);

    const images = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });

    return { images, error: null };
  } catch (error) {
    return { images: [], error: error.message || "Failed to fetch user images." };
  }
}

/**
 * Subscribe in real-time to a specific user's own images
 * 
 * @param {string} userId - User's Firebase UID
 * @param {(images: Array<object>) => void} onUpdate
 * @param {(error: Error) => void} onError
 * @returns {import('firebase/firestore').Unsubscribe | null}
 */
export function subscribeToUserImages(userId, onUpdate, onError) {
  if (!userId) return null;

  const imagesCol = collection(db, "images");
  const q = query(
    imagesCol,
    where("userId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const images = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
        });
      onUpdate(images);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

