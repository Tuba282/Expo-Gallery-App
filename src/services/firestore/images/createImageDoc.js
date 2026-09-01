import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../config/firebase";

/**
 * Create a new image document in Firestore with Cloudinary metadata
 * 
 * Schema:
 * images/{imageId}
 *  ├── userId (string)
 *  ├── userDisplayName (string)
 *  ├── userPhotoURL (string | null)
 *  ├── imageUrl (string) - Cloudinary secure_url
 *  ├── publicId (string) - Cloudinary public_id
 *  ├── caption (string)
 *  ├── category (string)
 *  ├── width (number)
 *  ├── height (number)
 *  ├── format (string) - 'jpg', 'png', 'webp', 'avif', 'heic', etc.
 *  ├── aspectRatio (number) - width / height
 *  ├── bytes (number | null)
 *  ├── deleteToken (string | null)
 *  ├── likesCount (number)
 *  ├── likedBy (array of userIds)
 *  ├── createdAt (Timestamp)
 *  └── updatedAt (Timestamp)
 * 
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.imageUrl - Cloudinary secure_url
 * @param {string} params.publicId - Cloudinary public_id
 * @param {string} [params.caption]
 * @param {string} [params.category]
 * @param {number} [params.width]
 * @param {number} [params.height]
 * @param {string} [params.format]
 * @param {number} [params.aspectRatio]
 * @param {number} [params.bytes]
 * @param {string} [params.deleteToken]
 * @param {string} [params.userDisplayName]
 * @param {string} [params.userPhotoURL]
 * @returns {Promise<{id: string | null, error: string | null}>}
 */
export async function createImageDoc({
  userId,
  imageUrl,
  publicId = "",
  caption = "",
  category = "Nature",
  width = null,
  height = null,
  format = "jpg",
  aspectRatio = 1.25,
  bytes = null,
  deleteToken = null,
  userDisplayName = "Anonymous",
  userPhotoURL = null,
}) {
  try {
    if (!userId || !imageUrl) {
      throw new Error("Missing required image metadata (userId or imageUrl).");
    }

    const imagesCol = collection(db, "images");
    const docRef = await addDoc(imagesCol, {
      userId,
      userDisplayName,
      userPhotoURL,
      imageUrl,
      publicId: publicId || "",
      caption: caption.trim(),
      category: category || "Nature",
      width: width ? Number(width) : null,
      height: height ? Number(height) : null,
      format: format || "jpg",
      aspectRatio: Number(aspectRatio) || 1.25,
      bytes: bytes ? Number(bytes) : null,
      deleteToken: deleteToken || null,
      likesCount: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error: error.message || "Failed to create image document." };
  }
}

