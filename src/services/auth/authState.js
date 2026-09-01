import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../config/firebase";

/**
 * Subscribe to Firebase Auth state changes
 * 
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {import('firebase/auth').Unsubscribe}
 */
export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current authenticated user (synchronously)
 * 
 * @returns {import('firebase/auth').User | null}
 */
export function getCurrentUser() {
  return auth.currentUser;
}
