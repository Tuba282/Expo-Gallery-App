import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../config/firebase";

/**
 * Create or sync user profile in Firestore
 * 
 * @param {string} userId - User's Firebase UID
 * @param {object} profileData - { email, displayName, photoURL }
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export async function createUserProfile(userId, profileData) {
  try {
    const userRef = doc(db, "users", userId);
    const payload = {
      uid: userId,
      email: profileData.email || "",
      displayName: profileData.displayName || "",
      photoURL: profileData.photoURL || null,
      pushToken: profileData.pushToken || null,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    if (profileData.photoPublicId !== undefined) {
      payload.photoPublicId = profileData.photoPublicId;
    }
    await setDoc(userRef, payload, { merge: true });

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message || "Failed to create user profile." };
  }
}
