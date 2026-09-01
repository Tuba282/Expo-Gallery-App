import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { subscribeToUserImages, deleteImageDoc } from "../../src/services/firestore/images";
import { createNotification } from "../../src/services/firestore/notifications";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "../../src/services/cloudinary";
import { pickImageFromLibrary } from "../../src/utils/imagePicker";

const { width } = Dimensions.get("window");
const GRID_WIDTH = (width - 44) / 2;

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    userProfile,
    isAuthenticated,
    logout,
    updateUserProfile,
  } = useAuth();

  const [userImages, setUserImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);

  // Edit Profile modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhotoURL, setEditPhotoURL] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // 1. Subscribe to Real-Time User Uploads from Firestore
  useEffect(() => {
    if (!user) {
      setUserImages([]);
      setLoadingImages(false);
      return;
    }

    setLoadingImages(true);
    const unsubscribe = subscribeToUserImages(
      user.uid,
      (images) => {
        setUserImages(images || []);
        setLoadingImages(false);
      },
      (error) => {
        console.warn("User images subscription error:", error);
        setUserImages([]);
        setLoadingImages(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handleOpenEditProfile = () => {
    setEditName(userProfile?.displayName || user?.displayName || "");
    setEditBio(userProfile?.bio || "");
    setEditPhotoURL(userProfile?.photoURL || user?.photoURL || "");
    setIsEditProfileOpen(true);
  };

  const [editPhotoBase64, setEditPhotoBase64] = useState(null);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Name Required", "Display name cannot be empty.");
      return;
    }

    setIsSavingProfile(true);
    try {
      let finalPhotoURL = editPhotoURL;
      let newPhotoPublicId = userProfile?.photoPublicId || null;

      // If user selected a new local image file for avatar, upload it to Cloudinary
      if (editPhotoURL && (editPhotoURL.startsWith("file://") || editPhotoBase64)) {
        const { secureUrl, publicId, error: uploadError } = await uploadImageToCloudinary({
          uri: editPhotoURL,
          base64: editPhotoBase64,
          format: "webp",
        });

        if (!uploadError && secureUrl) {
          finalPhotoURL = secureUrl;
          newPhotoPublicId = publicId;

          // Remove old avatar if it existed
          if (userProfile?.photoPublicId) {
            await deleteImageFromCloudinary({ publicId: userProfile.photoPublicId });
          }
        }
      }

      await updateUserProfile({
        displayName: editName.trim(),
        bio: editBio.trim(),
        photoURL: finalPhotoURL,
        photoPublicId: newPhotoPublicId,
      });

      setIsSavingProfile(false);
      setIsEditProfileOpen(false);
      Alert.alert("Profile Updated", "Your profile details have been saved.");
    } catch (error) {
      setIsSavingProfile(false);
      Alert.alert("Update Failed", error.message || "Could not save profile.");
    }
  };

  const handlePickAvatar = async () => {
    const { uri, base64, cancelled } = await pickImageFromLibrary({
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!cancelled && uri) {
      setEditPhotoURL(uri);
      setEditPhotoBase64(base64 || null);
    }
  };


  const handleDeleteImage = (item) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to permanently delete this photo? This will remove it from the Cloudinary gallery and database.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { success, publicId, deleteToken, error } = await deleteImageDoc(
                item.id,
                user.uid
              );
              if (error) throw new Error(error);

              // Clean up Cloudinary asset
              const targetPublicId = publicId || item.publicId || item.storagePath;
              if (targetPublicId || deleteToken || item.deleteToken) {
                await deleteImageFromCloudinary({
                  publicId: targetPublicId,
                  deleteToken: deleteToken || item.deleteToken,
                });
              }

              // Create notification log
              await createNotification({
                userId: user.uid,
                title: "Photo Deleted",
                body: `Photo "${(item.caption || "").slice(0, 30)}" was removed from your gallery.`,
                type: "delete",
              });
            } catch (err) {
              Alert.alert("Delete Error", err.message || "Failed to delete photo.");
            }
          },
        },
      ]
    );
  };


  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  // If user is unauthenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6" edges={["top"]}>
        <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
          <Ionicons name="person-outline" size={32} color="#64748b" />
        </View>
        <Text className="text-2xl font-bold text-slate-900 text-center">
          Join the Gallery Studio
        </Text>
        <Text className="text-base text-slate-500 text-center mt-2.5 leading-6 max-w-xs">
          Sign in to view your profile, organize uploads, perform CRUD actions, and connect with creative photographers.
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          activeOpacity={0.85}
          className="w-full bg-indigo-600 py-4 rounded-2xl items-center mt-6 shadow-sm"
        >
          <Text className="text-base font-bold text-white">Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/auth/signup")}
          activeOpacity={0.85}
          className="w-full bg-slate-50 border border-slate-200 py-4 rounded-2xl items-center mt-3"
        >
          <Text className="text-base font-bold text-slate-700">Create Account</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const displayName =
    userProfile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Creative";
  const avatarUrl = userProfile?.photoURL || user?.photoURL;
  const totalLikes = userImages.reduce((sum, img) => sum + (img.likesCount || 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-slate-100 flex-row justify-between items-center">
        <Text className="text-xl font-bold text-slate-900">My Studio</Text>
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center gap-1.5 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full"
        >
          <Ionicons name="log-out-outline" size={16} color="#64748b" />
          <Text className="text-xs font-bold text-slate-600">Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Card */}
        <View className="p-4 border-b border-slate-100 bg-white">
          <View className="flex-row items-start justify-between">
            <View className="relative">
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-20 h-20 rounded-full border-2 border-indigo-100 bg-slate-100"
                />
              ) : (
                <View className="w-20 h-20 rounded-full bg-indigo-50 border-2 border-indigo-100 items-center justify-center">
                  <Text className="text-2xl font-bold text-indigo-600">
                    {displayName[0]?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={handleOpenEditProfile}
              activeOpacity={0.8}
              className="bg-white border border-slate-200 px-4 py-2 rounded-full flex-row items-center gap-1.5 shadow-2xs"
            >
              <Ionicons name="create-outline" size={16} color="#334155" />
              <Text className="text-xs font-bold text-slate-700">
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name & Bio */}
          <View className="mt-3.5">
            <Text className="text-xl font-bold text-slate-900">
              {displayName}
            </Text>
            <Text className="text-xs text-slate-400 font-medium mt-0.5">
              {user?.email}
            </Text>
            {userProfile?.bio ? (
              <Text className="text-sm text-slate-600 mt-2 leading-5">
                {userProfile.bio}
              </Text>
            ) : null}
          </View>

          {/* User Statistics Row */}
          <View className="flex-row mt-4 pt-3.5 border-t border-slate-100 justify-around">
            <View className="items-center">
              <Text className="text-lg font-bold text-slate-900">
                {userImages.length}
              </Text>
              <Text className="text-xs text-slate-400 font-medium">
                Uploads
              </Text>
            </View>

            <View className="items-center">
              <Text className="text-lg font-bold text-indigo-600">
                {totalLikes}
              </Text>
              <Text className="text-xs text-slate-400 font-medium">
                Total Likes
              </Text>
            </View>

            <View className="items-center">
              <Text className="text-lg font-bold text-emerald-600">Active</Text>
              <Text className="text-xs text-slate-400 font-medium">
                Status
              </Text>
            </View>
          </View>
        </View>

        {/* Section: My Uploaded Images (CRUD Actions) */}
        <View className="p-4">
          <View className="flex-row justify-between items-center mb-3.5">
            <Text className="text-base font-bold text-slate-900">
              My Uploaded Photos ({userImages.length})
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/upload")}
              className="flex-row items-center gap-1.5"
            >
              <Ionicons name="add-circle" size={18} color="#4f46e5" />
              <Text className="text-xs font-bold text-indigo-600">
                New Photo
              </Text>
            </TouchableOpacity>
          </View>

          {loadingImages ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="small" color="#4f46e5" />
              <Text className="text-xs text-slate-400 mt-2">Loading your photos...</Text>
            </View>
          ) : userImages.length === 0 ? (
            <View className="py-14 items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <View className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center mb-2">
                <Ionicons name="images-outline" size={24} color="#94a3b8" />
              </View>
              <Text className="text-sm font-bold text-slate-700">
                No uploads yet
              </Text>
              <Text className="text-xs text-slate-400 text-center mt-1">
                Share your first photo to start your gallery.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/upload")}
                className="mt-3.5 bg-indigo-600 px-4 py-2 rounded-full"
              >
                <Text className="text-xs font-bold text-white">
                  Upload Photo
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* 2-Column Grid for User's Own Images */
            <View className="flex-row flex-wrap justify-between gap-y-3.5">
              {userImages.map((item) => (
                <View
                  key={item.id}
                  style={{ width: GRID_WIDTH }}
                  className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs"
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: "100%", height: 135 }}
                    resizeMode="cover"
                  />

                  {/* Caption & CRUD Toolbar */}
                  <View className="p-3">
                    <Text
                      numberOfLines={1}
                      className="text-sm font-bold text-slate-800"
                    >
                      {item.caption}
                    </Text>

                    <Text className="text-xs text-slate-400 mt-0.5">
                      {item.category || "General"} • {item.likesCount || 0} likes
                    </Text>

                    {/* CRUD Action Buttons */}
                    <View className="flex-row gap-2 mt-3 pt-2.5 border-t border-slate-100">
                      {/* Edit Button */}
                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: "/edit-image",
                            params: {
                              imageId: item.id,
                              caption: item.caption,
                              imageUrl: item.imageUrl,
                              publicId: item.publicId || "",
                              format: item.format || "jpg",
                              width: item.width || "",
                              height: item.height || "",
                              deleteToken: item.deleteToken || "",
                              category: item.category || "Nature",
                            },
                          })
                        }

                        activeOpacity={0.8}
                        className="flex-1 bg-slate-50 border border-slate-200 py-2 rounded-xl flex-row items-center justify-center gap-1.5"
                      >
                        <Ionicons name="create-outline" size={14} color="#475569" />
                        <Text className="text-xs font-bold text-slate-700">
                          Edit
                        </Text>
                      </TouchableOpacity>

                      {/* Delete Button */}
                      <TouchableOpacity
                        onPress={() => handleDeleteImage(item)}
                        activeOpacity={0.8}
                        className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/60 items-center justify-center"
                      >
                        <Ionicons name="trash-outline" size={16} color="#e11d48" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditProfileOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditProfileOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-4 py-3 border-b border-slate-100 flex-row justify-between items-center">
            <TouchableOpacity onPress={() => setIsEditProfileOpen(false)}>
              <Text className="text-sm font-semibold text-slate-500">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-base font-bold text-slate-900">Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? (
                <ActivityIndicator size="small" color="#4f46e5" />
              ) : (
                <Text className="text-sm font-bold text-indigo-600">Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            {/* Avatar Editor */}
            <View className="items-center my-4">
              <View className="relative">
                {editPhotoURL ? (
                  <Image
                    source={{ uri: editPhotoURL }}
                    className="w-24 h-24 rounded-full border-2 border-indigo-200"
                  />
                ) : (
                  <View className="w-24 h-24 rounded-full bg-slate-100 items-center justify-center border-2 border-slate-200">
                    <Ionicons name="person" size={40} color="#94a3b8" />
                  </View>
                )}
                <TouchableOpacity
                  onPress={handlePickAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 items-center justify-center border-2 border-white shadow-xs"
                >
                  <Ionicons name="camera" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-indigo-600 font-semibold mt-2">
                Change Profile Photo
              </Text>
            </View>

            {/* Display Name Input */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Display Name
              </Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Your full name"
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-base"
              />
            </View>

            {/* Bio Input */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Bio / Tagline
              </Text>
              <TextInput
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell other creatives about yourself..."
                multiline
                numberOfLines={3}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 text-base h-28"
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
