import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { uploadImageToCloudinary, SUPPORTED_FORMATS } from "../../src/services/cloudinary";
import { createImageDoc } from "../../src/services/firestore/images";
import { createNotification } from "../../src/services/firestore/notifications";
import { sendPushNotification } from "../../src/services/notifications";
import { pickImageFromLibrary, takePhotoWithCamera } from "../../src/utils/imagePicker";

const CATEGORIES = ["Nature", "Urban", "Travel", "Architecture", "Portraits", "Abstract"];
const FORMAT_OPTIONS = [
  { label: "Auto (Optimal)", value: "auto" },
  { label: "WEBP (Modern)", value: "webp" },
  { label: "JPG / JPEG", value: "jpg" },
  { label: "PNG (Lossless)", value: "png" },
  { label: "AVIF (Next-Gen)", value: "avif" },
  { label: "HEIC (Apple)", value: "heic" },
  { label: "GIF (Anim)", value: "gif" },
];

export default function UploadScreen() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated } = useAuth();

  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(1.25);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("Nature");
  const [selectedFormat, setSelectedFormat] = useState("auto");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePickLibrary = async () => {
    const { uri, base64, cancelled, error } = await pickImageFromLibrary({
      aspect: [4, 3],
      quality: 0.9,
    });
    if (error) {
      Alert.alert("Permission Notice", error);
    } else if (!cancelled && uri) {
      setSelectedImageUri(uri);
      setSelectedImageBase64(base64 || null);
      setAspectRatio(1.25);
    }
  };

  const handleCaptureCamera = async () => {
    const { uri, base64, cancelled, error } = await takePhotoWithCamera({
      aspect: [4, 3],
      quality: 0.9,
    });
    if (error) {
      Alert.alert("Permission Notice", error);
    } else if (!cancelled && uri) {
      setSelectedImageUri(uri);
      setSelectedImageBase64(base64 || null);
      setAspectRatio(1.25);
    }
  };

  const handlePublish = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert("Authentication Required", "Please log in to upload photos.", [
        { text: "Log In", onPress: () => router.push("/auth/login") },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }

    if (!selectedImageUri) {
      Alert.alert("Photo Required", "Please select or take a photo first.");
      return;
    }
    if (!caption.trim()) {
      Alert.alert("Caption Required", "Please write a short caption for your photo.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);

    try {
      // Step 1: Upload image file directly to Cloudinary (Unsigned Preset)
      const {
        secureUrl,
        publicId,
        width,
        height,
        format,
        aspectRatio: calcRatio,
        bytes,
        deleteToken,
        error: cloudinaryError,
      } = await uploadImageToCloudinary({
        uri: selectedImageUri,
        base64: selectedImageBase64,
        format: selectedFormat,
        onProgress: (progress) => {
          setUploadProgress(Math.max(10, Math.min(95, progress)));
        },
      });

      if (cloudinaryError || !secureUrl) {
        throw new Error(cloudinaryError || "Failed to upload image to Cloudinary.");
      }


      setUploadProgress(95);

      // Step 2: Save Image metadata & Cloudinary secure_url to Firestore
      const { id: docId, error: firestoreError } = await createImageDoc({
        userId: user.uid,
        userDisplayName:
          userProfile?.displayName || user.displayName || user.email?.split("@")[0] || "Photographer",
        userPhotoURL: userProfile?.photoURL || user.photoURL || null,
        imageUrl: secureUrl,
        publicId: publicId || "",
        caption: caption.trim(),
        category,
        width,
        height,
        format: format || selectedFormat || "jpg",
        aspectRatio: calcRatio || aspectRatio || 1.25,
        bytes,
        deleteToken,
      });

      if (firestoreError) {
        throw new Error(firestoreError || "Failed to save image in Firestore.");
      }

      // Step 3: Record notification in Firestore
      const shortCaption = caption.trim().length > 40
        ? caption.trim().slice(0, 40) + "..."
        : caption.trim();

      await createNotification({
        userId: user.uid,
        title: "Photo Published ✅",
        body: `"${shortCaption}" is live in the gallery.`,
        type: "upload",
        data: { imageId: docId },
      });

      // Step 4: Send push notification to uploader's device (if token available)
      const pushToken = userProfile?.pushToken || null;
      if (pushToken) {
        await sendPushNotification({
          expoPushToken: pushToken,
          title: "Photo Published ✅",
          body: `"${shortCaption}" is live in the gallery.`,
          data: { imageId: docId, screen: "image-detail" },
        });
      }

      setUploadProgress(100);
      setIsUploading(false);
      setSelectedImageUri(null);
      setSelectedImageBase64(null);
      setCaption("");
      setUploadProgress(0);

      Alert.alert(
        "Upload Complete! 🎉",
        "Your photo has been published to the gallery. Check Activity tab for updates.",
        [
          {
            text: "View Gallery",
            onPress: () => router.push("/(tabs)"),
          },
          {
            text: "Upload Another",
            style: "cancel",
          },
        ]
      );
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      Alert.alert("Upload Failed", error.message || "An unexpected error occurred.");
    }
  };


  // If user is not authenticated, show friendly sign-in prompt
  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6" edges={["top"]}>
        <View className="w-16 h-16 rounded-full bg-indigo-50 items-center justify-center mb-4">
          <Ionicons name="lock-closed-outline" size={32} color="#4f46e5" />
        </View>
        <Text className="text-2xl font-bold text-slate-900 text-center">
          Sign In to Share Photos
        </Text>
        <Text className="text-base text-slate-500 text-center mt-2.5 leading-6 max-w-xs">
          Authenticated members can upload photos, write captions, manage their gallery, and receive activity updates.
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          activeOpacity={0.85}
          className="w-full bg-indigo-600 py-4 rounded-2xl items-center mt-6 shadow-sm"
        >
          <Text className="text-base font-bold text-white">Log In to Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/auth/signup")}
          activeOpacity={0.7}
          className="mt-3.5 py-2"
        >
          <Text className="text-sm font-semibold text-slate-600">
            Don&apos;t have an account? <Text className="text-indigo-600 font-bold">Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-slate-100 flex-row justify-between items-center">
        <Text className="text-xl font-bold text-slate-900">Upload Photo</Text>
        {selectedImageUri && (
          <TouchableOpacity
            onPress={() => {
              setSelectedImageUri(null);
              setCaption("");
            }}
          >
            <Text className="text-sm font-semibold text-rose-500">Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Photo Selection Box */}
        {!selectedImageUri ? (
          <View className="border-2 border-dashed border-slate-200 rounded-3xl p-8 items-center justify-center bg-slate-50/70">
            <View className="w-16 h-16 rounded-2xl bg-indigo-50 items-center justify-center mb-3">
              <Ionicons name="cloud-upload-outline" size={32} color="#4f46e5" />
            </View>
            <Text className="text-base font-bold text-slate-800">
              Select a Photo to Upload
            </Text>
            <Text className="text-sm text-slate-400 text-center mt-1.5 max-w-[260px]">
              Upload directly to Firebase Storage & Firestore gallery.
            </Text>

            <View className="flex-row gap-3 mt-6 w-full">
              <TouchableOpacity
                onPress={handlePickLibrary}
                activeOpacity={0.85}
                className="flex-1 bg-white border border-slate-200 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-2xs"
              >
                <Ionicons name="images-outline" size={20} color="#334155" />
                <Text className="text-sm font-semibold text-slate-700">Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCaptureCamera}
                activeOpacity={0.85}
                className="flex-1 bg-white border border-slate-200 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-2xs"
              >
                <Ionicons name="camera-outline" size={20} color="#334155" />
                <Text className="text-sm font-semibold text-slate-700">Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Image Preview & Change actions */
          <View className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 relative">
            <Image
              source={{ uri: selectedImageUri }}
              style={{ width: "100%", height: 260 }}
              resizeMode="cover"
            />
            <View className="absolute top-3 right-3 flex-row gap-2">
              <TouchableOpacity
                onPress={handlePickLibrary}
                className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-full flex-row items-center gap-1.5"
              >
                <Ionicons name="sync-outline" size={15} color="#ffffff" />
                <Text className="text-xs font-semibold text-white">Change</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedImageUri(null)}
                className="bg-black/60 backdrop-blur-md w-8 h-8 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Category Picker */}
        <View className="mt-5">
          <Text className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
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

        {/* Format Selector */}
        <View className="mt-5">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Output Format (Cloudinary)
            </Text>
            <Text className="text-xs text-indigo-600 font-semibold">
              {selectedFormat.toUpperCase()}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {FORMAT_OPTIONS.map((fmt) => {
              const isSelected = selectedFormat === fmt.value;
              return (
                <TouchableOpacity
                  key={fmt.value}
                  onPress={() => setSelectedFormat(fmt.value)}
                  className={`px-3.5 py-2 rounded-xl border ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? "text-white" : "text-slate-700"
                    }`}
                  >
                    {fmt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Caption Input */}
        <View className="mt-5">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Photo Caption
            </Text>
            <Text className="text-xs text-slate-400 font-medium">
              {caption.length}/300
            </Text>
          </View>
          <TextInput
            multiline
            numberOfLines={4}
            maxLength={300}
            placeholder="Write a descriptive caption, story, or location..."
            placeholderTextColor="#94a3b8"
            value={caption}
            onChangeText={setCaption}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 text-base h-32"
            textAlignVertical="top"
          />
        </View>

        {/* Upload Progress Bar if active */}
        {isUploading && (
          <View className="mt-4 p-4 bg-indigo-50/80 rounded-2xl border border-indigo-100">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-bold text-indigo-900">
                Uploading to Cloudinary CDN & Firestore...
              </Text>
              <Text className="text-sm font-bold text-indigo-600">
                {uploadProgress}%
              </Text>
            </View>
            <View className="w-full h-2.5 bg-indigo-200 rounded-full overflow-hidden">
              <View
                style={{ width: `${uploadProgress}%` }}
                className="h-full bg-indigo-600 rounded-full"
              />
            </View>
          </View>
        )}


        {/* Submit Publish Button */}
        <TouchableOpacity
          onPress={handlePublish}
          disabled={isUploading || !selectedImageUri}
          activeOpacity={0.85}
          className={`w-full py-4 rounded-2xl items-center justify-center mt-6 flex-row gap-2 shadow-xs ${
            isUploading || !selectedImageUri
              ? "bg-slate-200"
              : "bg-indigo-600 shadow-indigo-600/20"
          }`}
        >
          {isUploading ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text className="text-base font-bold text-white ml-2">
                Uploading... {uploadProgress}%
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="cloud-upload"
                size={20}
                color={selectedImageUri ? "#ffffff" : "#94a3b8"}
              />
              <Text
                className={`text-base font-bold ${
                  selectedImageUri ? "text-white" : "text-slate-400"
                }`}
              >
                Publish to Gallery
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
