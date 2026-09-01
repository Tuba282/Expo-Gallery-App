import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/config/firebase";
import { useAuth } from "../src/context/AuthContext";
import { toggleLikeImageDoc } from "../src/services/firestore/images";

const { width } = Dimensions.get("window");

export default function ImageDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const { user, isAuthenticated } = useAuth();

  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPhoto() {
      if (!id) return;
      try {
        const docRef = doc(db, "images", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPhoto({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.warn("Could not fetch photo from Firestore:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPhoto();
  }, [id]);

  const isLiked =
    user && photo && Array.isArray(photo.likedBy) && photo.likedBy.includes(user.uid);

  const handleToggleLike = async () => {
    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }
    if (!photo) return;

    const userId = user.uid;
    const currentlyLiked =
      Array.isArray(photo.likedBy) && photo.likedBy.includes(userId);

    // Optimistic UI update
    setPhoto((prev) => {
      if (!prev) return prev;
      const currentLikes = prev.likesCount || 0;
      const currentLikedBy = Array.isArray(prev.likedBy) ? prev.likedBy : [];
      return {
        ...prev,
        likesCount: currentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
        likedBy: currentlyLiked
          ? currentLikedBy.filter((uid) => uid !== userId)
          : [...currentLikedBy, userId],
      };
    });

    await toggleLikeImageDoc({ imageId: photo.id, userId });
  };

  const handleShare = async () => {
    if (photo) {
      try {
        await Share.share({
          message: `Check out "${photo.caption}" on GalleryApp: ${photo.imageUrl}`,
          url: photo.imageUrl,
        });
      } catch (err) {
        console.warn("Error sharing:", err);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-sm text-slate-400 mt-3 font-medium">Loading details...</Text>
      </SafeAreaView>
    );
  }

  if (!photo) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <Text className="text-base font-bold text-slate-700">Photo not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-indigo-600 px-5 py-2.5 rounded-full"
        >
          <Text className="text-sm font-semibold text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Header */}
      <View className="px-4 py-3 flex-row justify-between items-center border-b border-slate-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-slate-50 items-center justify-center border border-slate-200"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </TouchableOpacity>

        <Text className="text-base font-bold text-slate-900">Photo Details</Text>

        <TouchableOpacity
          onPress={handleShare}
          className="w-9 h-9 rounded-full bg-slate-50 items-center justify-center border border-slate-200"
        >
          <Ionicons name="share-outline" size={19} color="#334155" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Main Photo */}
        <View className="bg-slate-900 overflow-hidden relative">
          <Image
            source={{ uri: photo.imageUrl }}
            style={{ width: width, height: width * (Number(photo.aspectRatio) || 1.1) }}
            resizeMode="cover"
          />

          <View className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full">
            <Text className="text-xs font-semibold text-white">
              {photo.category || "Nature"}
            </Text>
          </View>
        </View>

        {/* Content & Author */}
        <View className="p-4">
          <View className="flex-row items-center justify-between pb-4 border-b border-slate-100">
            {/* Author */}
            <View className="flex-row items-center flex-1 mr-2">
              {photo.userPhotoURL ? (
                <Image
                  source={{ uri: photo.userPhotoURL }}
                  className="w-11 h-11 rounded-full mr-3 border border-slate-200"
                />
              ) : (
                <View className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-100 items-center justify-center mr-3">
                  <Ionicons name="person" size={20} color="#4f46e5" />
                </View>
              )}
              <View>
                <Text className="text-base font-bold text-slate-900">
                  {photo.userDisplayName || "Anonymous"}
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  {photo.category || "Photo"}
                </Text>
              </View>
            </View>

            {/* Like Button */}
            <TouchableOpacity
              onPress={handleToggleLike}
              activeOpacity={0.8}
              className={`flex-row items-center px-4 py-2 rounded-full border ${
                isLiked
                  ? "bg-rose-50 border-rose-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={18}
                color={isLiked ? "#e11d48" : "#64748b"}
              />
              <Text
                className={`text-sm font-bold ml-1.5 ${
                  isLiked ? "text-rose-600" : "text-slate-700"
                }`}
              >
                {photo.likesCount || 0}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Caption */}
          <View className="mt-4">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Description
            </Text>
            <Text className="text-base font-medium text-slate-800 leading-6">
              {photo.caption}
            </Text>
          </View>

          {/* Technical Metadata & Cloudinary Info */}
          <View className="mt-6 pt-4 border-t border-slate-100">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Image Information (Cloudinary)
            </Text>

            <View className="flex-row flex-wrap gap-2.5">
              {/* Format Badge */}
              <View className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl flex-row items-center gap-1.5">
                <Ionicons name="document-text-outline" size={15} color="#4f46e5" />
                <Text className="text-xs text-slate-500 font-medium">Format:</Text>
                <Text className="text-xs font-bold text-slate-800 uppercase">
                  {photo.format || "JPG"}
                </Text>
              </View>

              {/* Dimensions Badge */}
              {photo.width && photo.height ? (
                <View className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl flex-row items-center gap-1.5">
                  <Ionicons name="resize-outline" size={15} color="#4f46e5" />
                  <Text className="text-xs text-slate-500 font-medium">Resolution:</Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {photo.width} × {photo.height}
                  </Text>
                </View>
              ) : null}

              {/* Aspect Ratio Badge */}
              <View className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl flex-row items-center gap-1.5">
                <Ionicons name="crop-outline" size={15} color="#4f46e5" />
                <Text className="text-xs text-slate-500 font-medium">Aspect Ratio:</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {photo.aspectRatio ? `${photo.aspectRatio}:1` : "1.25:1"}
                </Text>
              </View>

              {/* File Size Badge if available */}
              {photo.bytes ? (
                <View className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl flex-row items-center gap-1.5">
                  <Ionicons name="server-outline" size={15} color="#4f46e5" />
                  <Text className="text-xs text-slate-500 font-medium">Size:</Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {(photo.bytes / 1024).toFixed(0)} KB
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

