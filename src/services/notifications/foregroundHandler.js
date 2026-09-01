import * as Notifications from "expo-notifications";

/**
 * Configure global handler for foreground notifications
 * Defines how notifications behave when the app is actively running in the foreground
 */
export function setupForegroundNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Subscribe to incoming notifications while the app is in the foreground
 * 
 * @param {(notification: Notifications.Notification) => void} callback
 * @returns {Notifications.Subscription}
 */
export function addForegroundNotificationListener(callback) {
  return Notifications.addNotificationReceivedListener((notification) => {
    if (callback) {
      callback(notification);
    }
  });
}
