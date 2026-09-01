import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import {
  subscribeToPublicImages,
  toggleLikeImageDoc,
} from "../../src/services/firestore/images";
import { INITIAL_GALLERY } from "../../src/store/mockStore";

const { width } = Dimensions.get("window");
const PADDING = 16;
const GAP = 12;
const COLUMN_WIDTH = (width - (PADDING * 2 + GAP)) / 2;

const CATEGORIES = ["All", "Nature", "Urban", "Travel", "Architecture", "Portraits", "Abstract"];

export default function GalleryScreen() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated } = useAuth();

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePhoto, setActivePhoto] = useState(null);

  // 1. Subscribe to Live Firestore Images Stream
  useEffect(() => {
    const unsubscribe = subscribeToPublicImages(
      (liveImages) => {
        if (liveImages && liveImages.length > 0) {
          setImages(liveImages);
        } else {
          // If Firestore collection has no items yet, show curated initial photos
          setImages(INITIAL_GALLERY);
        }
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.warn("Firestore live subscription error:", error);
        // Fallback gracefully to initial showcase
        setImages(INITIAL_GALLERY);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Subscription automatically updates, timeout to reset visual spinner
    setTimeout(() => setRefreshing(false), 800);
  };

  // Toggle Like Handler
  const handleToggleLike = async (item) => {
    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    // Optimistic UI update
    const userId = user.uid;
    const isLiked = Array.isArray(item.likedBy) && item.likedBy.includes(userId);

    setImages((prev) =>
      prev.map((img) => {
        if (img.id === item.id) {
          const currentLikes = img.likesCount || 0;
          const currentLikedBy = Array.isArray(img.likedBy) ? img.likedBy : [];
          return {
            ...img,
            likesCount: isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
            likedBy: isLiked
              ? currentLikedBy.filter((id) => id !== userId)
              : [...currentLikedBy, userId],
          };
        }
        return img;
      })
    );

    // Call live Firestore toggle if it is a real Firestore document
    if (!item.id.startsWith("img-")) {
      await toggleLikeImageDoc({ imageId: item.id, userId });
    }
  };

  // Filter images based on search query & category
  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      const matchCat =
        selectedCategory === "All" || img.category === selectedCategory;
      const captionText = (img.caption || "").toLowerCase();
      const authorText = (img.userDisplayName || "").toLowerCase();
      const categoryText = (img.category || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchSearch =
        captionText.includes(query) ||
        authorText.includes(query) ||
        categoryText.includes(query);
      return matchCat && matchSearch;
    });
  }, [images, selectedCategory, searchQuery]);

  // Helper to accurately calculate dynamic image height based on Cloudinary dimensions
  const getCardHeight = (item) => {
    let hToW = 1.0;
    if (item.width && item.height) {
      hToW = Number(item.height) / Number(item.width);
    } else if (item.aspectRatio) {
      hToW = 1 / Number(item.aspectRatio);
    }
    // Clamp to ensure balanced masonry grid layout (0.65 to 1.45)
    const clampedRatio = Math.max(0.65, Math.min(1.45, hToW));
    return Math.round(COLUMN_WIDTH * clampedRatio);
  };

  // True Masonry 2-Column distribution
  const { leftCol, rightCol } = useMemo(() => {
    const left = [];
    const right = [];
    let leftHeight = 0;
    let rightHeight = 0;

    filteredImages.forEach((item) => {
      const itemHeight = getCardHeight(item) + 75;
      if (leftHeight <= rightHeight) {
        left.push(item);
        leftHeight += itemHeight + GAP;
      } else {
        right.push(item);
        rightHeight += itemHeight + GAP;
      }
    });

    return { leftCol: left, rightCol: right };
  }, [filteredImages]);

  const handleShare = async (photo) => {
    if (photo) {
      try {
        await Share.share({
          message: `Check out "${photo.caption}" on GalleryApp: ${photo.imageUrl}`,
          url: photo.imageUrl,
        });
      } catch (err) {
        console.warn("Share error:", err);
      }
    }
  };

  const renderMasonryCard = (item) => {
    const isLiked =
      user && Array.isArray(item.likedBy) && item.likedBy.includes(user.uid);
    const imageHeight = getCardHeight(item);


    return (
      <View
        key={item.id}
        style={{ width: COLUMN_WIDTH, marginBottom: GAP }}
        className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xs"
      >
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => setActivePhoto(item)}
          className="relative overflow-hidden bg-slate-100 rounded-2xl"
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: "100%", height: imageHeight }}
            resizeMode="cover"
          />

          {/* Category Tag */}
          <View className="absolute top-2 left-2 bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <Text className="text-xs font-semibold text-white">
              {item.category || "Nature"}
            </Text>
          </View>

          {/* Like Button on Image */}
          <TouchableOpacity
            onPress={() => handleToggleLike(item)}
            activeOpacity={0.8}
            className={`absolute bottom-2 right-2 w-8 h-8 rounded-full items-center justify-center backdrop-blur-md ${
              isLiked ? "bg-rose-500" : "bg-black/40"
            }`}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={16}
              color="#ffffff"
            />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Card Content & Metadata */}
        <View className="p-2.5 pt-2">
          <Text
            numberOfLines={2}
            className="text-sm font-semibold text-slate-800 leading-snug"
          >
            {item.caption}
          </Text>

          <View className="flex-row items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
            {/* Author */}
            <View className="flex-row items-center flex-1 mr-1">
              {item.userPhotoURL ? (
                <Image
                  source={{ uri: item.userPhotoURL }}
                  className="w-4 h-4 rounded-full mr-1.5"
                />
              ) : (
                <View className="w-4 h-4 rounded-full bg-slate-200 items-center justify-center mr-1.5">
                  <Ionicons name="person" size={10} color="#64748b" />
                </View>
              )}
              <Text
                numberOfLines={1}
                className="text-xs text-slate-600 font-medium flex-1"
              >
                {item.userDisplayName || "Anonymous"}
              </Text>
            </View>

            {/* Likes Count */}
            <View className="flex-row items-center">
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={13}
                color={isLiked ? "#f43f5e" : "#94a3b8"}
              />
              <Text className="text-xs text-slate-600 ml-1 font-semibold">
                {item.likesCount || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Top Header */}
      <View className="px-4 pt-2 pb-2.5 flex-row justify-between items-center border-b border-slate-100">
        <View>
          <Text className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Live Showcase
          </Text>
          <Text className="text-2xl font-bold text-slate-900 tracking-tight">
            Gallery<Text className="text-indigo-600">App</Text>
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {!isAuthenticated ? (
            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              activeOpacity={0.8}
              className="bg-indigo-600 px-4 py-2 rounded-full"
            >
              <Text className="text-sm font-semibold text-white">Log In</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.8}
              className="flex-row items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full"
            >
              {userProfile?.photoURL || user?.photoURL ? (
                <Image
                  source={{ uri: userProfile?.photoURL || user?.photoURL }}
                  className="w-6 h-6 rounded-full mr-2"
                />
              ) : (
                <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-2">
                  <Text className="text-xs font-bold text-indigo-600">
                    {(userProfile?.displayName || user?.email)?.[0]?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}
              <Text
                numberOfLines={1}
                className="text-sm font-medium text-slate-800 max-w-[100px]"
              >
                {userProfile?.displayName?.split(" ")[0] || user?.email?.split("@")[0]}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Search Bar */}
        <View className="px-4 mt-3">
          <View className="flex-row items-center bg-slate-50 border border-slate-200/90 rounded-2xl px-4 py-3">
            <Ionicons name="search-outline" size={20} color="#94a3b8" />
            <TextInput
              placeholder="Search captions, categories, artists..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-slate-800 text-base py-0"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Chips */}
        <View className="mt-3.5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                  className={`px-4 py-2 rounded-full border ${
                    isSelected
                      ? "bg-slate-900 border-slate-900"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isSelected ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Masonry Image Gallery Section */}
        <View className="px-4 mt-5">
          <View className="flex-row justify-between items-center mb-3.5">
            <Text className="text-base font-bold text-slate-900">
              {selectedCategory === "All"
                ? "Recent Captures"
                : `${selectedCategory} Collection`}
            </Text>
            <Text className="text-sm text-slate-500 font-medium">
              {filteredImages.length} {filteredImages.length === 1 ? "photo" : "photos"}
            </Text>
          </View>

          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color="#4f46e5" />
              <Text className="text-sm text-slate-500 font-medium mt-3">
                Loading live gallery...
              </Text>
            </View>
          ) : filteredImages.length === 0 ? (
            <View className="py-16 items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <View className="w-14 h-14 rounded-full bg-slate-100 items-center justify-center mb-3">
                <Ionicons name="image-outline" size={26} color="#94a3b8" />
              </View>
              <Text className="text-base font-bold text-slate-700">
                No matching photos found
              </Text>
              <Text className="text-sm text-slate-400 mt-1">
                Try adjusting your search query or filter.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="mt-4 bg-white border border-slate-200 px-5 py-2.5 rounded-full shadow-2xs"
              >
                <Text className="text-sm font-bold text-indigo-600">
                  Reset Filters
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* 2-Column Masonry Grid */
            <View className="flex-row justify-between">
              {/* Left Column */}
              <View style={{ width: COLUMN_WIDTH }}>
                {leftCol.map((item) => renderMasonryCard(item))}
              </View>

              {/* Right Column */}
              <View style={{ width: COLUMN_WIDTH }}>
                {rightCol.map((item) => renderMasonryCard(item))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (Upload Photo) */}
      <View className="absolute bottom-6 right-5">
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/upload")}
          activeOpacity={0.85}
          className="flex-row items-center bg-indigo-600 px-5 py-3.5 rounded-full shadow-lg shadow-indigo-600/30 gap-2 border border-indigo-500"
        >
          <Ionicons name="cloud-upload" size={20} color="#ffffff" />
          <Text className="text-sm font-bold text-white tracking-wide">
            Upload
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Image Preview Modal */}
      <Modal
        visible={!!activePhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePhoto(null)}
      >
        {activePhoto && (
          <View className="flex-1 bg-black/90 justify-center p-4">
            <TouchableOpacity
              onPress={() => setActivePhoto(null)}
              className="absolute top-12 right-4 w-10 h-10 rounded-full bg-black/60 items-center justify-center z-10 border border-white/20"
            >
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>

            <View className="bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[85%]">
              <Image
                source={{ uri: activePhoto.imageUrl }}
                style={{
                  width: "100%",
                  height: Math.min(width * 1.1, 400),
                }}
                resizeMode="cover"
              />

              <View className="p-4">
                {/* Author row, Like & Share */}
                <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
                  <View className="flex-row items-center flex-1 mr-2">
                    {activePhoto.userPhotoURL ? (
                      <Image
                        source={{ uri: activePhoto.userPhotoURL }}
                        className="w-10 h-10 rounded-full mr-2.5"
                      />
                    ) : (
                      <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-2.5">
                        <Text className="text-sm font-bold text-indigo-600">
                          {activePhoto.userDisplayName?.[0] || "U"}
                        </Text>
                      </View>
                    )}
                    <View>
                      <Text className="text-sm font-bold text-slate-900">
                        {activePhoto.userDisplayName || "Anonymous"}
                      </Text>
                      <Text className="text-xs text-slate-400">
                        {activePhoto.category || "Photo"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => handleShare(activePhoto)}
                      className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 items-center justify-center"
                    >
                      <Ionicons name="share-outline" size={17} color="#475569" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleToggleLike(activePhoto)}
                      className="flex-row items-center bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-full"
                    >
                      <Ionicons
                        name={
                          user &&
                          Array.isArray(activePhoto.likedBy) &&
                          activePhoto.likedBy.includes(user.uid)
                            ? "heart"
                            : "heart-outline"
                        }
                        size={17}
                        color={
                          user &&
                          Array.isArray(activePhoto.likedBy) &&
                          activePhoto.likedBy.includes(user.uid)
                            ? "#f43f5e"
                            : "#64748b"
                        }
                      />
                      <Text className="text-sm font-bold text-slate-700 ml-1.5">
                        {activePhoto.likesCount || 0}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Caption & Format */}
                <View className="mt-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Caption
                    </Text>
                    {activePhoto.format && (
                      <View className="bg-slate-100 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] font-bold text-slate-600 uppercase">
                          {activePhoto.format}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-base font-medium text-slate-800 mt-1 leading-6">
                    {activePhoto.caption}
                  </Text>
                </View>

                {/* View Full Details Button */}
                <TouchableOpacity
                  onPress={() => {
                    const photoId = activePhoto.id;
                    setActivePhoto(null);
                    router.push(`/image-detail?id=${photoId}`);
                  }}
                  className="mt-3.5 bg-slate-50 border border-slate-200 py-2.5 rounded-xl items-center justify-center flex-row gap-1.5"
                >
                  <Ionicons name="information-circle-outline" size={17} color="#4f46e5" />
                  <Text className="text-xs font-bold text-indigo-600">
                    View Full Details & Resolution
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

    </SafeAreaView>
  );
}
