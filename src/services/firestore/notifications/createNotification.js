import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../config/firebase";

/**
 * Record a new notification in Firestore
 * 
 * Schema:
 * notifications/{notificationId}
 *  ├── userId (string) - recipient user UID
 *  ├── title (string)
 *  ├── body (string)
 *  ├── type (string) - 'upload', 'like', 'system', 'update'
 *  ├── data (object) - related entity (e.g. imageId)
 *  ├── read (boolean)
 *  └── createdAt (Timestamp)
 * 
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.title
 * @param {string} params.body
 * @param {string} [params.type]
 * @param {object} [params.data]
 * @returns {Promise<{id: string | null, error: string | null}>}
 */
export async function createNotification({
  userId,
  title,
  body,
  type = "system",
  data = {},
}) {
  try {
    if (!userId || !title) {
      throw new Error("Missing recipient userId or notification title.");
    }

    const notifCol = collection(db, "notifications");
    const docRef = await addDoc(notifCol, {
      userId,
      title: title.trim(),
      body: body.trim(),
      type,
      data,
      read: false,
      createdAt: serverTimestamp(),
    });

    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error: error.message || "Failed to create notification." };
  }
}
