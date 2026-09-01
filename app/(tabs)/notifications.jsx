import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
} from "../../src/services/firestore/notifications";

/**
 * Returns a human-friendly relative timestamp string
 * e.g. "Just now", "5 min ago", "2 hours ago", "Yesterday", "Aug 27"
 */
function formatRelativeTime(createdAt) {
  if (!createdAt) return "Just now";

  let date;
  if (typeof createdAt.toDate === "function") {
    date = createdAt.toDate();
  } else if (createdAt.seconds) {
    date = new Date(createdAt.seconds * 1000);
  } else {
    return "Just now";
  }

  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getNotificationIcon(type) {
  switch (type) {
    case "upload":
      return { name: "cloud-upload", bg: "bg-emerald-50", color: "#059669" };
    case "like":
      return { name: "heart", bg: "bg-rose-50", color: "#e11d48" };
    case "update":
      return { name: "create", bg: "bg-amber-50", color: "#d97706" };
    case "delete":
      return { name: "trash", bg: "bg-red-50", color: "#dc2626" };
    case "system":
      return { name: "information-circle", bg: "bg-blue-50", color: "#2563eb" };
    default:
      return { name: "notifications", bg: "bg-indigo-50", color: "#4f46e5" };
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserNotifications(
      user.uid,
      (items) => {
        setNotifications(items || []);
        setLoading(false);
      },
      (error) => {
        console.warn("Notifications subscription error:", error);
        setNotifications([]);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === "unread") return !item.read;
    return true;
  });

  const handleNotificationPress = useCallback(async (item) => {
    // Mark as read
    if (!item.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
      await markNotificationAsRead(item.id);
    }

    // Navigate to relevant screen based on payload
    const imageId = item.data?.imageId;
    if (imageId) {
      router.push({ pathname: "/image-detail", params: { imageId } });
    }
  }, [router]);

  const handleMarkAllRead = useCallback(async () => {
    const unreadItems = notifications.filter((n) => !n.read);
    if (unreadItems.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await Promise.all(unreadItems.map((n) => markNotificationAsRead(n.id)));
  }, [notifications]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6" edges={["top"]}>
        <View className="w-16 h-16 rounded-full bg-indigo-50 items-center justify-center mb-4">
          <Ionicons name="notifications-outline" size={32} color="#4f46e5" />
        </View>
        <Text className="text-2xl font-bold text-slate-900 text-center">
          Activity Center
        </Text>
        <Text className="text-base text-slate-500 text-center mt-2.5 leading-6 max-w-xs">
          Sign in to receive live notifications when you upload photos, receive likes, or perform gallery edits.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          className="mt-6 bg-indigo-600 px-8 py-3.5 rounded-2xl"
        >
          <Text className="text-base font-bold text-white">Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-slate-100 flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-bold text-slate-900">Activity</Text>
          {unreadCount > 0 && (
            <View className="bg-indigo-600 px-2.5 py-0.5 rounded-full">
              <Text className="text-xs font-bold text-white">
                {unreadCount} new
              </Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text className="text-sm font-semibold text-indigo-600">
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View className="px-4 py-3 flex-row gap-2 border-b border-slate-50">
        <TouchableOpacity
          onPress={() => setActiveFilter("all")}
          className={`px-4 py-1.5 rounded-full ${
            activeFilter === "all" ? "bg-slate-900" : "bg-slate-100"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              activeFilter === "all" ? "text-white" : "text-slate-600"
            }`}
          >
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveFilter("unread")}
          className={`px-4 py-1.5 rounded-full ${
            activeFilter === "unread" ? "bg-slate-900" : "bg-slate-100"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              activeFilter === "unread" ? "text-white" : "text-slate-600"
            }`}
          >
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="small" color="#4f46e5" />
            <Text className="text-xs text-slate-400 mt-2">Loading activity...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View className="py-24 items-center justify-center">
            <View className="w-20 h-20 rounded-full bg-slate-50 items-center justify-center mb-4">
              <Ionicons
                name="notifications-off-outline"
                size={34}
                color="#cbd5e1"
              />
            </View>
            <Text className="text-base font-bold text-slate-700">
              {activeFilter === "unread" ? "No unread notifications" : "No activity yet"}
            </Text>
            <Text className="text-sm text-slate-400 mt-1.5 text-center max-w-[240px] leading-5">
              {activeFilter === "unread"
                ? "You're all caught up!"
                : "You'll be notified when you upload, update, or receive likes on your photos."}
            </Text>
          </View>
        ) : (
          filteredNotifications.map((item) => {
            const iconConfig = getNotificationIcon(item.type);
            const hasImageLink = !!item.data?.imageId;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.75}
                onPress={() => handleNotificationPress(item)}
                className={`p-4 rounded-2xl mb-3 flex-row items-start border ${
                  !item.read
                    ? "bg-indigo-50/40 border-indigo-100"
                    : "bg-white border-slate-100"
                }`}
              >
                {/* Icon Badge */}
                <View
                  className={`w-10 h-10 rounded-xl ${iconConfig.bg} items-center justify-center mr-3 mt-0.5 flex-shrink-0`}
                >
                  <Ionicons
                    name={iconConfig.name}
                    size={19}
                    color={iconConfig.color}
                  />
                </View>

                {/* Content */}
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center justify-between mb-0.5">
                    <Text className="text-sm font-bold text-slate-900 flex-1 mr-2" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-xs text-slate-400 flex-shrink-0">
                      {formatRelativeTime(item.createdAt)}
                    </Text>
                  </View>
                  <Text className="text-sm text-slate-600 leading-5" numberOfLines={2}>
                    {item.body}
                  </Text>
                  {hasImageLink && (
                    <Text className="text-xs text-indigo-500 font-semibold mt-1.5">
                      Tap to view photo →
                    </Text>
                  )}
                </View>

                {/* Unread dot */}
                {!item.read && (
                  <View className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
