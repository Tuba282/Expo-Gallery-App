import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";

/**
 * Update an existing image document (caption, category, or replaced image URL/Cloudinary metadata)
 * 
 * @param {object} params
 * @param {string} params.imageId - Document ID in 'images'
 * @param {string} params.userId - Authenticated user's UID (for ownership validation)
 * @param {string} [params.caption] - Updated caption
 * @param {string} [params.category] - Updated category
 * @param {string} [params.imageUrl] - Replaced Cloudinary secure_url
 * @param {string} [params.publicId] - Replaced Cloudinary public_id
 * @param {number} [params.width] - Replaced image width
 * @param {number} [params.height] - Replaced image height
 * @param {string} [params.format] - Replaced image format
 * @param {number} [params.aspectRatio] - Replaced aspect ratio
 * @param {number} [params.bytes] - Replaced file size
 * @param {string} [params.deleteToken] - Cloudinary delete token
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export async function updateImageDoc({
  imageId,
  userId,
  caption,
  category,
  imageUrl,
  publicId,
  width,
  height,
  format,
  aspectRatio,
  bytes,
  deleteToken,
}) {
  try {
    if (!imageId || !userId) {
      throw new Error("Image ID and User ID are required.");
    }

    const docRef = doc(db, "images", imageId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Image not found.");
    }

    // Verify ownership
    const data = docSnap.data();
    if (data.userId !== userId) {
      throw new Error("Unauthorized: You can only edit your own images.");
    }

    const updatePayload = {
      updatedAt: serverTimestamp(),
    };

    if (typeof caption === "string") {
      updatePayload.caption = caption.trim();
    }
    if (category) {
      updatePayload.category = category;
    }
    if (imageUrl) {
      updatePayload.imageUrl = imageUrl;
    }
    if (publicId !== undefined) {
      updatePayload.publicId = publicId;
    }
    if (width) {
      updatePayload.width = Number(width);
    }
    if (height) {
      updatePayload.height = Number(height);
    }
    if (format) {
      updatePayload.format = format;
    }
    if (aspectRatio) {
      updatePayload.aspectRatio = Number(aspectRatio);
    }
    if (bytes !== undefined) {
      updatePayload.bytes = bytes;
    }
    if (deleteToken !== undefined) {
      updatePayload.deleteToken = deleteToken;
    }

    await updateDoc(docRef, updatePayload);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message || "Failed to update image." };
  }
}

