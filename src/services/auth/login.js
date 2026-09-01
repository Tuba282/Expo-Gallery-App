import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";

/**
 * Sign in an existing user with Email & Password
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<{user: import('firebase/auth').User | null, error: string | null}>}
 */
export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    return { user: userCredential.user, error: null };
  } catch (error) {
    let errorMessage = "Invalid login credentials. Please try again.";
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {
      errorMessage = "Invalid email or password.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Please enter a valid email address.";
    } else if (error.code === "auth/user-disabled") {
      errorMessage = "This user account has been disabled.";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { user: null, error: errorMessage };
  }
}
