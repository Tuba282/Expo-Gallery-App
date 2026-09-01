import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../config/firebase";

/**
 * Update existing user profile document in Firestore
 * 
 * @param {string} userId - User's Firebase UID
 * @param {object} updates - Fields to update (e.g. displayName, photoURL, pushToken)
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export async function updateUserProfile(userId, updates) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message || "Failed to update user profile." };
  }
}
