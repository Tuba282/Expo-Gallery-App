import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../../config/firebase";
import { createUserProfile } from "../firestore/users/createUserProfile";

/**
 * Sign in with Google Credential using ID token or Access token from OAuth
 * 
 * @param {string | {idToken?: string, accessToken?: string, id_token?: string, access_token?: string}} tokenOrObj
 * @returns {Promise<{user: import('firebase/auth').User | null, error: string | null}>}
 */
export async function signInWithGoogle(tokenOrObj) {
  try {
    let idToken = null;
    let accessToken = null;

    if (typeof tokenOrObj === "string") {
      idToken = tokenOrObj;
    } else if (typeof tokenOrObj === "object" && tokenOrObj !== null) {
      idToken = tokenOrObj.idToken || tokenOrObj.id_token || null;
      accessToken = tokenOrObj.accessToken || tokenOrObj.access_token || null;
    }

    if (!idToken && !accessToken) {
      throw new Error("No valid Google authentication token received.");
    }

    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    // Create or sync user profile in Firestore
    await createUserProfile(user.uid, {
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || "User",
      photoURL: user.photoURL || null,
    });

    return { user, error: null };
  } catch (error) {
    return {
      user: null,
      error: error.message || "Google Sign-In failed.",
    };
  }
}
