import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";

/**
 * Sign out the currently authenticated user
 * 
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message || "Failed to log out." };
  }
}
