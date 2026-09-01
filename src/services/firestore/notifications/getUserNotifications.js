import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../config/firebase";

/**
 * Fetch notifications for a user (one-time)
 * 
 * @param {string} userId - User's Firebase UID
 * @param {number} [maxCount=30]
 * @returns {Promise<{notifications: Array<object>, error: string | null}>}
 */
export async function getUserNotifications(userId, maxCount = 30) {
  try {
    if (!userId) return { notifications: [], error: "User ID required." };

    const notifCol = collection(db, "notifications");
    const q = query(
      notifCol,
      where("userId", "==", userId),
      limit(maxCount)
    );
    const snapshot = await getDocs(q);

    const notifications = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });

    return { notifications, error: null };
  } catch (error) {
    return {
      notifications: [],
      error: error.message || "Failed to fetch notifications.",
    };
  }
}

/**
 * Subscribe in real-time to a user's notifications
 * 
 * @param {string} userId
 * @param {(notifications: Array<object>) => void} onUpdate
 * @param {(error: Error) => void} onError
 * @param {number} [maxCount=30]
 * @returns {import('firebase/firestore').Unsubscribe | null}
 */
export function subscribeToUserNotifications(
  userId,
  onUpdate,
  onError,
  maxCount = 30
) {
  if (!userId) return null;

  const notifCol = collection(db, "notifications");
  const q = query(
    notifCol,
    where("userId", "==", userId),
    limit(maxCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
        });
      onUpdate(notifications);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

