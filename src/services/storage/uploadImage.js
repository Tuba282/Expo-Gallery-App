import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebase";

/**
 * Upload an image from a local URI to Firebase Storage
 * 
 * Flow:
 * local URI -> fetch(uri) -> Blob -> Firebase Storage -> downloadURL
 * 
 * @param {object} params
 * @param {string} params.uri - Local file URI from expo-image-picker
 * @param {string} params.userId - User's Firebase UID
 * @param {(progress: number) => void} [params.onProgress] - Optional progress callback (0 - 100)
 * @returns {Promise<{downloadUrl: string | null, storagePath: string | null, error: string | null}>}
 */
export async function uploadImageToStorage({ uri, userId, onProgress }) {
  let blob = null;
  try {
    if (!uri || !userId) {
      throw new Error("Local image URI and User ID are required.");
    }

    // Step 1: Convert local URI into a Blob using fetch
    const response = await fetch(uri);
    blob = await response.blob();

    // Step 2: Generate unique storage path
    const timestamp = Date.now();
    const filename = uri.split("/").pop() || `photo_${timestamp}.jpg`;
    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `images/${userId}/${timestamp}_${cleanFilename}`;
    const storageRef = ref(storage, storagePath);

    // Step 3: Upload Blob to Firebase Storage
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: blob.type || "image/jpeg",
    });

    return new Promise((resolve) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          if (snapshot.totalBytes > 0 && onProgress) {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(Math.round(progress));
          }
        },
        (uploadError) => {
          // Cleanup blob
          if (blob && typeof blob.close === "function") {
            blob.close();
          }
          resolve({
            downloadUrl: null,
            storagePath: null,
            error: uploadError.message || "Failed to upload image.",
          });
        },
        async () => {
          try {
            // Step 4: Retrieve public download URL
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (blob && typeof blob.close === "function") {
              blob.close();
            }
            resolve({
              downloadUrl,
              storagePath,
              error: null,
            });
          } catch (urlError) {
            resolve({
              downloadUrl: null,
              storagePath: null,
              error: urlError.message || "Failed to get download URL.",
            });
          }
        }
      );
    });
  } catch (error) {
    if (blob && typeof blob.close === "function") {
      blob.close();
    }
    return {
      downloadUrl: null,
      storagePath: null,
      error: error.message || "Image upload failed.",
    };
  }
}
