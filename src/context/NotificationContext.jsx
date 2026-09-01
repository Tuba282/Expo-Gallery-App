import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { router } from "expo-router";
import {
  setupForegroundNotificationHandler,
  addForegroundNotificationListener,
  addBackgroundNotificationResponseListener,
  registerForPushNotificationsAsync,
  getLastNotificationResponse,
} from "../services/notifications";
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
} from "../services/firestore/notifications";
import { updateUserProfile } from "../services/firestore/users/updateUserProfile";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

// Set foreground behavior globally (must be called before any listener)
setupForegroundNotificationHandler();

/**
 * Navigate based on notification payload data
 * @param {object} data - notification payload (data field)
 */
function navigateFromPayload(data) {
  if (!data) return;
  try {
    if (data.imageId) {
      router.push({
        pathname: "/image-detail",
        params: { imageId: data.imageId },
      });
    } else if (data.screen === "notifications") {
      router.push("/(tabs)/notifications");
    }
  } catch (_e) {
    // Navigation may fail if not yet mounted — silently ignore
  }
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();

  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [lastNotification, setLastNotification] = useState(null);

  const notificationListener = useRef(null);
  const responseListener = useRef(null);
  const coldStartHandled = useRef(false);

  // ─── Step 1: Register for push notifications on mount ─────────────────────
  useEffect(() => {
    registerForPushNotificationsAsync().then(({ token }) => {
      if (token) setExpoPushToken(token);
    });

    // Foreground notification received
    notificationListener.current = addForegroundNotificationListener(
      (notification) => {
        setLastNotification(notification);
      }
    );

    // Background / notification tap response
    responseListener.current = addBackgroundNotificationResponseListener(
      (response) => {
        const data = response?.notification?.request?.content?.data || {};
        navigateFromPayload(data);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // ─── Step 2: Cold-start — app opened via notification tap ─────────────────
  useEffect(() => {
    if (coldStartHandled.current) return;

    getLastNotificationResponse().then((response) => {
      if (response) {
        coldStartHandled.current = true;
        const data = response?.notification?.request?.content?.data || {};
        // Defer navigation until navigation stack is ready
        const timer = setTimeout(() => {
          navigateFromPayload(data);
        }, 500);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  // ─── Step 3: Save push token to Firestore user profile ────────────────────
  useEffect(() => {
    if (user?.uid && expoPushToken) {
      updateUserProfile(user.uid, { pushToken: expoPushToken });
    }
  }, [user?.uid, expoPushToken]);

  // ─── Step 4: Real-time Firestore notifications stream ─────────────────────
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToUserNotifications(
      user.uid,
      (list) => setNotifications(list),
      (error) => console.warn("Notification stream error:", error)
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  const markRead = useCallback(async (notificationId) => {
    return await markNotificationAsRead(notificationId);
  }, []);

  const clearLastNotification = useCallback(() => {
    setLastNotification(null);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = {
    expoPushToken,
    notifications,
    lastNotification,
    unreadCount,
    markRead,
    clearLastNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
