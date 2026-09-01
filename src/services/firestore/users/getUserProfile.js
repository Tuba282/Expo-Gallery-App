import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";

/**
 * Fetch a user profile by UID
 * 
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<{profile: object | null, error: string | null}>}
 */
export async function getUserProfile(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return { profile: snap.data(), error: null };
    }
    return { profile: null, error: "User profile not found." };
  } catch (error) {
    return { profile: null, error: error.message || "Failed to fetch user profile." };
  }
}
