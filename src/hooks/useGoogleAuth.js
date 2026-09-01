import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

/**
 * Custom Hook for Google Sign-In with Expo AuthSession & Firebase Auth
 */
export function useGoogleAuth() {
  const { loginWithGoogle } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);

  const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
    "229852747774-1cocplb4ll8djpi3k9me658hnmgun62f.apps.googleusercontent.com";

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: webClientId,
    webClientId: webClientId,
    redirectUri: makeRedirectUri(),
    scopes: ["profile", "email"],
    responseType: "id_token",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const idToken =
        response.params?.id_token ||
        response.authentication?.idToken ||
        response.params?.idToken ||
        null;
      const accessToken =
        response.params?.access_token ||
        response.authentication?.accessToken ||
        response.params?.accessToken ||
        null;

      if (idToken || accessToken) {
        setIsGoogleLoading(true);
        loginWithGoogle({ idToken, accessToken })
          .then((res) => {
            if (res?.error) {
              setGoogleError(res.error);
            }
          })
          .catch((err) => {
            setGoogleError(err.message || "Google Sign-In failed.");
          })
          .finally(() => {
            setIsGoogleLoading(false);
          });
      }
    } else if (response?.type === "error") {
      setGoogleError(
        response.error?.message || "Google Sign-In was cancelled or failed."
      );
    }
  }, [response, loginWithGoogle]);

  const signIn = async () => {
    setGoogleError(null);
    if (!webClientId) {
      setGoogleError("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing in .env");
      return;
    }
    try {
      await promptAsync();
    } catch (err) {
      setGoogleError(err.message || "Could not launch Google Sign-In window.");
    }
  };

  return {
    signInWithGooglePrompt: signIn,
    isGoogleLoading,
    googleError,
    disabled: !request,
  };
}
