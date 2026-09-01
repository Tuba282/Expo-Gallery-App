import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebase";

/**
 * Send password reset email to user
 * 
 * @param {string} email - User's email address
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export async function sendPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true, error: null };
  } catch (error) {
    let errorMessage = "Failed to send password reset email.";
    if (error.code === "auth/user-not-found") {
      errorMessage = "No account found with this email.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Please enter a valid email address.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
