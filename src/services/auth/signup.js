import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../config/firebase";
import { createUserProfile } from "../firestore/users/createUserProfile";

/**
 * Register a new user with Email & Password
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password (min 6 chars)
 * @param {string} displayName - Optional user's full name
 * @returns {Promise<{user: import('firebase/auth').User | null, error: string | null}>}
 */
export async function signupWithEmail(email, password, displayName = "") {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    const user = userCredential.user;

    // Update display name in Firebase Auth if provided
    if (displayName.trim()) {
      await updateProfile(user, {
        displayName: displayName.trim(),
      });
    }

    // Create user document in Firestore
    await createUserProfile(user.uid, {
      email: user.email,
      displayName: displayName.trim() || user.email.split("@")[0],
      photoURL: user.photoURL || null,
    });

    return { user, error: null };
  } catch (error) {
    let errorMessage = "Registration failed. Please try again.";
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email address is already registered.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Please enter a valid email address.";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password should be at least 6 characters.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { user: null, error: errorMessage };
  }
}
