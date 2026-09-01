import * as Notifications from "expo-notifications";

/**
 * Send an Expo Push Notification or local notification banner
 * 
 * In Expo Go / Simulator: Schedules an immediate local notification banner
 * In Development Build / Production APK: Sends remote push via Expo Push Service + local banner
 * 
 * @param {object} params
 * @param {string} [params.expoPushToken] - Target device Expo Push Token
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification message body
 * @param {object} [params.data] - Custom payload (e.g. { imageId, screen })
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export async function sendPushNotification({
  expoPushToken,
  title,
  body,
  data = {},
}) {
  try {
    const cleanTitle = title?.trim() || "Notification";
    const cleanBody = body?.trim() || "";

    // Always trigger an immediate local notification banner on the device
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: cleanTitle,
          body: cleanBody,
          data,
          sound: "default",
        },
        trigger: null, // triggers immediately
      });
    } catch (localErr) {
      console.warn("Local notification banner notice:", localErr?.message);
    }

    // If a remote Expo Push Token is available (Dev Client or Production Build), send via Expo Push API
    if (expoPushToken) {
      const message = {
        to: expoPushToken,
        sound: "default",
        title: cleanTitle,
        body: cleanBody,
        data,
      };

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      return { success: true, data: result, error: null };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to send notification.",
    };
  }
}
