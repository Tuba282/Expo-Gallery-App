import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";

/**
 * Delete an image document from Firestore after checking owner UID
 * 
 * @param {string} imageId - Document ID in 'images'
 * @param {string} userId - Authenticated user's UID
 * @returns {Promise<{success: boolean, publicId: string | null, deleteToken: string | null, error: string | null}>}
 */
export async function deleteImageDoc(imageId, userId) {
  try {
    if (!imageId || !userId) {
      throw new Error("Image ID and User ID are required.");
    }

    const docRef = doc(db, "images", imageId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: true, publicId: null, deleteToken: null, error: null };
    }

    const data = docSnap.data();
    if (data.userId !== userId) {
      throw new Error("Unauthorized: You can only delete your own images.");
    }

    const publicId = data.publicId || null;
    const deleteToken = data.deleteToken || null;
    await deleteDoc(docRef);

    return { success: true, publicId, deleteToken, error: null };
  } catch (error) {
    return {
      success: false,
      publicId: null,
      deleteToken: null,
      error: error.message || "Failed to delete image document.",
    };
  }
}

