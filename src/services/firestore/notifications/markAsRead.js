import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";

/**
 * Mark a notification as read
 * 
 * @param {string} notificationId
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export async function markNotificationAsRead(notificationId) {
  try {
    if (!notificationId) throw new Error("Notification ID is required.");

    const docRef = doc(db, "notifications", notificationId);
    await updateDoc(docRef, { read: true });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message || "Failed to update notification." };
  }
}
