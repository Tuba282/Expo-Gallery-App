import * as Notifications from "expo-notifications";

/**
 * Subscribe to user interaction / tap responses on notifications
 * (Works when app is opened from background or closed state by tapping a notification)
 * 
 * @param {(response: Notifications.NotificationResponse) => void} callback
 * @returns {Notifications.Subscription}
 */
export function addBackgroundNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    if (callback) {
      callback(response);
    }
  });
}

/**
 * Get the notification response that launched the app if launched via notification tap
 * 
 * @returns {Promise<Notifications.NotificationResponse | null>}
 */
export async function getLastNotificationResponse() {
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch {
    return null;
  }
}
