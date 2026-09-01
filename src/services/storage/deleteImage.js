import { ref, deleteObject } from "firebase/storage";
import { storage } from "../../config/firebase";

/**
 * Delete an image binary file from Firebase Storage
 * 
 * @param {string} storagePath - Relative storage path (e.g. 'images/{userId}/{filename}')
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export async function deleteImageFromStorage(storagePath) {
  try {
    if (!storagePath) {
      return { success: true, error: null };
    }

    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    return { success: true, error: null };
  } catch (error) {
    // If the file was already deleted or doesn't exist, treat as success
    if (error.code === "storage/object-not-found") {
      return { success: true, error: null };
    }
    return {
      success: false,
      error: error.message || "Failed to delete image file from storage.",
    };
  }
}
