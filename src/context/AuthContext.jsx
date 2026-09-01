import React, { createContext, useContext, useState, useEffect } from "react";
import {
  subscribeToAuthState,
  signupWithEmail,
  loginWithEmail,
  signInWithGoogle,
  logoutUser,
  sendPasswordReset,
} from "../services/auth";
import { getUserProfile } from "../services/firestore/users/getUserProfile";
import { updateUserProfile as updateUserProfileDoc } from "../services/firestore/users/updateUserProfile";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Subscribe to Firebase Auth state
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch extended user profile from Firestore
        const { profile } = await getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    const result = await loginWithEmail(email, password);
    if (result.error) {
      setAuthError(result.error);
    }
    return result;
  };

  const signup = async (email, password, displayName) => {
    setAuthError(null);
    const result = await signupWithEmail(email, password, displayName);
    if (result.error) {
      setAuthError(result.error);
    }
    return result;
  };

  const loginWithGoogleIdToken = async (idToken) => {
    setAuthError(null);
    const result = await signInWithGoogle(idToken);
    if (result.error) {
      setAuthError(result.error);
    }
    return result;
  };

  const logout = async () => {
    setAuthError(null);
    return await logoutUser();
  };

  const resetPassword = async (email) => {
    setAuthError(null);
    return await sendPasswordReset(email);
  };

  const handleUpdateUserProfile = async (profileData) => {
    if (!user) return { error: "No user logged in." };
    const result = await updateUserProfileDoc(user.uid, profileData);
    if (!result.error) {
      setUserProfile((prev) => ({ ...prev, ...profileData }));
    }
    return result;
  };

  const value = {
    user,
    userProfile,
    isAuthenticated: !!user,
    loading,
    authError,
    setAuthError,
    login,
    loginWithEmail: login,
    signup,
    signupWithEmail: signup,
    loginWithGoogle: loginWithGoogleIdToken,
    logout,
    resetPassword,
    updateUserProfile: handleUpdateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
