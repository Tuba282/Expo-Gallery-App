import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { updateImageDoc, deleteImageDoc } from "../src/services/firestore/images";
import { createNotification } from "../src/services/firestore/notifications";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "../src/services/cloudinary";
import { pickImageFromLibrary, takePhotoWithCamera } from "../src/utils/imagePicker";

export default function EditImageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    imageId,
    caption: initialCaption,
    imageUrl: initialImageUrl,
    publicId: initialPublicId,
    format: initialFormat,
    category: initialCategory,
    deleteToken: initialDeleteToken,
  } = params;

  const { user } = useAuth();

  const [caption, setCaption] = useState(initialCaption || "");
  const [imageUrl, setImageUrl] = useState(initialImageUrl || "");
  const [imageBase64, setImageBase64] = useState(null);
  const [publicId, setPublicId] = useState(initialPublicId || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReplaceFromLibrary = async () => {
    const { uri, base64, cancelled } = await pickImageFromLibrary({
      aspect: [4, 3],
      quality: 0.9,
    });
    if (!cancelled && uri) {
      setImageUrl(uri);
      setImageBase64(base64 || null);
    }
  };

  const handleReplaceFromCamera = async () => {
    const { uri, base64, cancelled } = await takePhotoWithCamera({
      aspect: [4, 3],
      quality: 0.9,
    });
    if (!cancelled && uri) {
      setImageUrl(uri);
      setImageBase64(base64 || null);
    }
  };

  const handleSave = async () => {
    if (!caption.trim()) {
      Alert.alert("Caption Required", "Please enter a valid caption.");
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = imageUrl;
      let finalPublicId = publicId;
      let width = null;
      let height = null;
      let format = initialFormat || "jpg";
      let aspectRatio = null;
      let bytes = null;
      let deleteToken = null;

      // If user replaced the image with a new local file URI
      if (imageUrl && (imageUrl.startsWith("file://") || imageBase64) && user) {
        // Upload new image to Cloudinary
        const uploadRes = await uploadImageToCloudinary({
          uri: imageUrl,
          base64: imageBase64,
          format: "auto",
        });


        if (uploadRes.error || !uploadRes.secureUrl) {
          throw new Error(uploadRes.error || "Failed to upload replaced image to Cloudinary.");
        }

        // Clean up old Cloudinary asset if existed
        if (initialPublicId || initialDeleteToken) {
          await deleteImageFromCloudinary({
            publicId: initialPublicId,
            deleteToken: initialDeleteToken,
          });
        }

        finalImageUrl = uploadRes.secureUrl;
        finalPublicId = uploadRes.publicId;
        width = uploadRes.width;
        height = uploadRes.height;
        format = uploadRes.format;
        aspectRatio = uploadRes.aspectRatio;
        bytes = uploadRes.bytes;
        deleteToken = uploadRes.deleteToken;

        setPublicId(uploadRes.publicId);
      }

      // Update Firestore document
      const { error: updateError } = await updateImageDoc({
        imageId,
        userId: user?.uid,
        caption: caption.trim(),
        imageUrl: finalImageUrl,
        publicId: finalPublicId,
        width,
        height,
        format,
        aspectRatio,
        bytes,
        deleteToken,
        category: initialCategory || "Nature",
      });

      if (updateError) throw new Error(updateError);

      if (user) {
        await createNotification({
          userId: user.uid,
          title: "Photo Updated",
          body: `Changes to "${caption.trim().slice(0, 30)}" were saved.`,
          type: "update",
          data: { imageId },
        });
      }

      setIsSaving(false);
      Alert.alert("Changes Saved", "Your image has been updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      setIsSaving(false);
      Alert.alert("Save Error", error.message || "Failed to update image.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to permanently delete this photo? This will delete the image from Cloudinary and remove it from the gallery.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { success, publicId: deletedPublicId, deleteToken, error } =
                await deleteImageDoc(imageId, user?.uid);

              if (error) throw new Error(error);

              // Clean up Cloudinary asset
              const targetPublicId = deletedPublicId || publicId || initialPublicId;
              if (targetPublicId || deleteToken || initialDeleteToken) {
                await deleteImageFromCloudinary({
                  publicId: targetPublicId,
                  deleteToken: deleteToken || initialDeleteToken,
                });
              }

              if (user) {
                await createNotification({
                  userId: user.uid,
                  title: "Photo Deleted",
                  body: `Photo "${caption.slice(0, 30)}" was removed from your gallery.`,
                  type: "delete",
                });
              }

              setIsDeleting(false);
              router.back();
            } catch (err) {
              setIsDeleting(false);
              Alert.alert("Delete Error", err.message || "Could not delete photo.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">

      {/* Header */}
      <View className="px-4 py-3 border-b border-slate-100 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-1.5"
        >
          <Ionicons name="close" size={22} color="#64748b" />
          <Text className="text-sm font-semibold text-slate-600">Cancel</Text>
        </TouchableOpacity>

        <Text className="text-base font-bold text-slate-900">Edit Photo</Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || isDeleting}
          className="bg-indigo-600 px-4 py-2 rounded-full"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-sm font-bold text-white">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 p-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Photo Preview & Replace */}
        <View className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 relative">
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: 250 }}
            resizeMode="cover"
          />

          {/* Quick Replace Overlay Buttons */}
          <View className="absolute bottom-3 right-3 flex-row gap-2">
            <TouchableOpacity
              onPress={handleReplaceFromLibrary}
              className="bg-black/65 backdrop-blur-md px-4 py-2 rounded-full flex-row items-center gap-1.5"
            >
              <Ionicons name="images-outline" size={15} color="#ffffff" />
              <Text className="text-xs font-semibold text-white">Replace</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleReplaceFromCamera}
              className="bg-black/65 backdrop-blur-md w-9 h-9 rounded-full items-center justify-center"
            >
              <Ionicons name="camera-outline" size={17} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Caption Editor */}
        <View className="mt-5">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Caption
            </Text>
            <Text className="text-xs text-slate-400 font-medium">
              {caption.length}/300
            </Text>
          </View>

          <TextInput
            multiline
            numberOfLines={4}
            maxLength={300}
            value={caption}
            onChangeText={setCaption}
            placeholder="Edit your caption..."
            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 text-base h-32"
            textAlignVertical="top"
          />
        </View>

        {/* Danger Zone: Delete Button */}
        <View className="mt-8 pt-6 border-t border-slate-100">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Danger Zone
          </Text>
          <TouchableOpacity
            onPress={handleDelete}
            disabled={isDeleting || isSaving}
            activeOpacity={0.85}
            className="w-full bg-rose-50 border border-rose-200 py-4 rounded-2xl flex-row items-center justify-center gap-2"
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#e11d48" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#e11d48" />
                <Text className="text-sm font-bold text-rose-600">
                  Delete This Photo
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
