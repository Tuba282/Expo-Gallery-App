import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

/**
 * Register device for Push Notifications and get Expo Push Token
 * Gracefully handles Expo Go sandbox limitations
 * 
 * @returns {Promise<{token: string | null, isExpoGo: boolean, error: string | null}>}
 */
export async function registerForPushNotificationsAsync() {
  let token = null;
  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  try {
    // Android Channel Configuration
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default Gallery Channel",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4f46e5",
        sound: "default",
      });
    }

    if (!Device.isDevice) {
      return {
        token: null,
        isExpoGo,
        error: "Push notifications require a physical device.",
      };
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return {
        token: null,
        isExpoGo,
        error: "Push notification permissions not granted.",
      };
    }

    // Expo Go in SDK 51+ does not support remote FCM push tokens directly.
    // In Expo Go, local device notifications work seamlessly.
    if (isExpoGo) {
      return {
        token: null,
        isExpoGo: true,
        error: null,
      };
    }

    // Retrieve Expo Project ID (from Constants or env)
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      process.env.EXPO_PUBLIC_PROJECT_ID ||
      undefined;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    token = tokenData.data;

    return { token, isExpoGo: false, error: null };
  } catch (error) {
    // Silently fall back so app remains fully functional in Expo Go
    return {
      token: null,
      isExpoGo,
      error: error.message || "Failed to register for push notifications.",
    };
  }
}
