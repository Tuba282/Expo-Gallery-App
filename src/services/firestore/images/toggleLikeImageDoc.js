import {
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../../../config/firebase";

/**
 * Toggle like/unlike on an image document in Firestore
 * 
 * @param {object} params
 * @param {string} params.imageId
 * @param {string} params.userId
 * @returns {Promise<{isLiked: boolean, likesCount: number, error: string | null}>}
 */
export async function toggleLikeImageDoc({ imageId, userId }) {
  try {
    if (!imageId || !userId) {
      throw new Error("Image ID and User ID are required to toggle like.");
    }

    const docRef = doc(db, "images", imageId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Image not found.");
    }

    const data = docSnap.data();
    const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
    const currentlyLiked = likedBy.includes(userId);

    if (currentlyLiked) {
      // Unlike: remove userId from array and decrement counter
      await updateDoc(docRef, {
        likedBy: arrayRemove(userId),
        likesCount: increment(-1),
      });
      return {
        isLiked: false,
        likesCount: Math.max(0, (data.likesCount || 1) - 1),
        error: null,
      };
    } else {
      // Like: add userId to array and increment counter
      await updateDoc(docRef, {
        likedBy: arrayUnion(userId),
        likesCount: increment(1),
      });
      return {
        isLiked: true,
        likesCount: (data.likesCount || 0) + 1,
        error: null,
      };
    }
  } catch (error) {
    return {
      isLiked: false,
      likesCount: 0,
      error: error.message || "Failed to toggle like.",
    };
  }
}
