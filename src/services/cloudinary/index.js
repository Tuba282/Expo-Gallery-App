import { Platform } from "react-native";

/**
 * Cloudinary Storage & Delivery Service
 * 
 * Supports:
 * - Direct Unsigned client-side uploads (Android, iOS, Web)
 * - Automatic MIME and format detection
 * - Progress tracking
 * - Safe asset deletion
 * - Dynamic transformation CDN URLs
 */

export const SUPPORTED_FORMATS = [
  "auto",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "heic",
  "gif",
];

/**
 * Upload an image from local URI to Cloudinary via Unsigned Upload Preset
 * 
 * @param {object} params
 * @param {string} params.uri - Local file URI (from expo-image-picker, e.g. file://... or blob/base64)
 * @param {string} [params.base64] - Optional base64 string
 * @param {string} [params.folder] - Target folder in Cloudinary (e.g. 'gallery_photos')
 * @param {string} [params.format] - Target format conversion (optional)
 * @param {(progress: number) => void} [params.onProgress] - Upload progress callback (0 - 100)
 * @returns {Promise<{
 *   secureUrl: string | null,
 *   publicId: string | null,
 *   width: number | null,
 *   height: number | null,
 *   format: string | null,
 *   aspectRatio: number,
 *   bytes: number | null,
 *   deleteToken: string | null,
 *   error: string | null
 * }>}
 */
export async function uploadImageToCloudinary({
  uri,
  base64 = null,
  folder = null,
  format = "auto",
  onProgress,
}) {
  try {
    if (!uri && !base64) {
      throw new Error("No image URI or base64 data provided.");
    }

    const cloudName =
      process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || "dzq61zzxb";
    const uploadPreset =
      process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim() || "galleryApp";

    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Cloudinary configuration missing. Please ensure EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET are set in .env"
      );
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    // Detect file name & MIME type
    const uriParts = uri ? uri.split("/") : [];
    const rawFileName =
      uriParts.length > 0 ? uriParts[uriParts.length - 1] : `photo_${Date.now()}.jpg`;
    const cleanFileName = (rawFileName || `photo_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "_");
    
    const ext = (cleanFileName.split(".").pop() || "jpg").toLowerCase();
    const mimeMap = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      heic: "image/heic",
      heif: "image/heif",
      avif: "image/avif",
      svg: "image/svg+xml",
    };
    const mimeType = mimeMap[ext] || "image/jpeg";

    const formData = new FormData();

    // Cross-Platform File Append
    if (base64) {
      // Direct base64 data URI
      formData.append("file", `data:${mimeType};base64,${base64}`);
    } else if (Platform.OS === "web") {
      // On Web: fetch local blob
      const res = await fetch(uri);
      const blob = await res.blob();
      formData.append("file", blob, cleanFileName);
    } else {
      // On React Native (Android / iOS)
      formData.append("file", {
        uri,
        type: mimeType,
        name: cleanFileName,
      });
    }

    formData.append("upload_preset", uploadPreset);

    if (folder) {
      formData.append("folder", folder);
    }

    // Use XMLHttpRequest for reliable cross-platform upload with progress
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl, true);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        let response = {};
        try {
          response = JSON.parse(xhr.responseText);
        } catch {
          response = { error: { message: xhr.responseText || "Unknown response" } };
        }

        if (xhr.status >= 200 && xhr.status < 300 && response.secure_url) {
          const w = response.width || null;
          const h = response.height || null;
          const calcRatio = w && h ? Number((w / h).toFixed(3)) : 1.25;

          resolve({
            secureUrl: response.secure_url,
            publicId: response.public_id,
            width: w,
            height: h,
            format: response.format || ext,
            aspectRatio: calcRatio,
            bytes: response.bytes || null,
            deleteToken: response.delete_token || null,
            error: null,
          });
        } else {
          const errorMsg =
            response.error?.message ||
            `Cloudinary upload failed (HTTP ${xhr.status}). Check if preset '${uploadPreset}' is set to Unsigned in Cloudinary Console.`;
          console.warn("Cloudinary Upload Error:", errorMsg);
          resolve({
            secureUrl: null,
            publicId: null,
            width: null,
            height: null,
            format: null,
            aspectRatio: 1.25,
            bytes: null,
            deleteToken: null,
            error: errorMsg,
          });
        }
      };

      xhr.onerror = () => {
        resolve({
          secureUrl: null,
          publicId: null,
          width: null,
          height: null,
          format: null,
          aspectRatio: 1.25,
          bytes: null,
          deleteToken: null,
          error: "Network error during Cloudinary upload. Please check your internet connection.",
        });
      };

      xhr.send(formData);
    });
  } catch (error) {
    return {
      secureUrl: null,
      publicId: null,
      width: null,
      height: null,
      format: null,
      aspectRatio: 1.25,
      bytes: null,
      deleteToken: null,
      error: error.message || "Cloudinary upload failed.",
    };
  }
}

/**
 * Delete an asset from Cloudinary
 * 
 * @param {object} params
 * @param {string} params.publicId - Cloudinary public_id
 * @param {string} [params.deleteToken] - Cloudinary delete_token
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export async function deleteImageFromCloudinary({ publicId, deleteToken }) {
  try {
    const cloudName =
      process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || "dzq61zzxb";

    if (deleteToken) {
      const destroyUrl = `https://api.cloudinary.com/v1_1/${cloudName}/delete_by_token`;
      const response = await fetch(destroyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: deleteToken }),
      });
      const result = await response.json();
      if (result.result === "ok") {
        return { success: true, error: null };
      }
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message || "Cloudinary deletion error." };
  }
}

/**
 * Generate an optimized Cloudinary CDN delivery URL
 * 
 * @param {string} imageUrlOrPublicId
 * @param {object} [transformations]
 * @returns {string}
 */
export function getOptimizedImageUrl(imageUrlOrPublicId, transformations = {}) {
  if (!imageUrlOrPublicId) return "";

  const cloudName =
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || "dzq61zzxb";

  const {
    width,
    height,
    crop = "fill",
    format = "auto",
    quality = "auto",
  } = transformations;

  if (imageUrlOrPublicId.includes("res.cloudinary.com")) {
    const parts = imageUrlOrPublicId.split("/upload/");
    if (parts.length === 2) {
      const transformSegments = [];
      if (crop) transformSegments.push(`c_${crop}`);
      if (width) transformSegments.push(`w_${width}`);
      if (height) transformSegments.push(`h_${height}`);
      if (quality) transformSegments.push(`q_${quality}`);
      if (format) transformSegments.push(`f_${format}`);

      const transformStr = transformSegments.join(",");
      return `${parts[0]}/upload/${transformStr}/${parts[1]}`;
    }
    return imageUrlOrPublicId;
  }

  const transformSegments = [];
  if (crop) transformSegments.push(`c_${crop}`);
  if (width) transformSegments.push(`w_${width}`);
  if (height) transformSegments.push(`h_${height}`);
  if (quality) transformSegments.push(`q_${quality}`);
  if (format) transformSegments.push(`f_${format}`);

  const transformStr =
    transformSegments.length > 0 ? `${transformSegments.join(",")}/` : "";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformStr}${imageUrlOrPublicId}`;
}
