import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";

/**
 * Request media library permissions and pick an image from device gallery
 * 
 * @param {object} [customOptions]
 * @returns {Promise<{uri: string | null, cancelled: boolean, error: string | null}>}
 */
export async function pickImageFromLibrary(customOptions = {}) {
  try {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to upload images."
        );
        return { uri: null, cancelled: true, error: "Permission denied." };
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
      base64: true,
      ...customOptions,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { uri: null, base64: null, cancelled: true, error: null };
    }

    return {
      uri: result.assets[0].uri,
      base64: result.assets[0].base64 || null,
      cancelled: false,
      error: null,
    };
  } catch (error) {
    return {
      uri: null,
      base64: null,
      cancelled: false,
      error: error.message || "Failed to pick image from library.",
    };
  }
}

/**
 * Request camera permissions and capture a new photo with camera
 * 
 * @param {object} [customOptions]
 * @returns {Promise<{uri: string | null, base64: string | null, cancelled: boolean, error: string | null}>}
 */
export async function takePhotoWithCamera(customOptions = {}) {
  try {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera permissions to take photos."
        );
        return { uri: null, base64: null, cancelled: true, error: "Permission denied." };
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
      base64: true,
      ...customOptions,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { uri: null, base64: null, cancelled: true, error: null };
    }

    return {
      uri: result.assets[0].uri,
      base64: result.assets[0].base64 || null,
      cancelled: false,
      error: null,
    };
  } catch (error) {
    return {
      uri: null,
      base64: null,
      cancelled: false,
      error: error.message || "Failed to take photo with camera.",
    };
  }
}

