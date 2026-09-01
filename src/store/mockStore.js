import React, { createContext, useContext, useState } from "react";

// Curated high-resolution sample photos with diverse natural aspect ratios (masonry-friendly)
export const INITIAL_GALLERY = [
  {
    id: "img-1",
    userId: "user-123",
    userDisplayName: "Elena Vance",
    userPhotoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
    caption: "Misty sunrise over the alpine mountain range and evergreen valleys.",
    category: "Nature",
    aspectRatio: 1.45, // Tall vertical portrait
    likesCount: 342,
    createdAt: "2 hours ago",
  },
  {
    id: "img-2",
    userId: "user-456",
    userDisplayName: "Kenji Sato",
    userPhotoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80",
    caption: "Neon reflection in downtown Tokyo streets on a rainy midnight.",
    category: "Urban",
    aspectRatio: 0.85, // Wide horizontal
    likesCount: 890,
    createdAt: "5 hours ago",
  },
  {
    id: "img-3",
    userId: "user-123", // Owned by mock current user
    userDisplayName: "Elena Vance",
    userPhotoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80",
    caption: "Golden sand dunes sculpted by desert winds in the morning light.",
    category: "Travel",
    aspectRatio: 1.2,
    likesCount: 521,
    createdAt: "1 day ago",
  },
  {
    id: "img-4",
    userId: "user-789",
    userDisplayName: "Sarah Jenkins",
    userPhotoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
    caption: "Symmetrical glass facade reflecting architectural geometry.",
    category: "Architecture",
    aspectRatio: 1.0, // Square
    likesCount: 419,
    createdAt: "2 days ago",
  },
  {
    id: "img-5",
    userId: "user-123", // Owned by mock current user
    userDisplayName: "Elena Vance",
    userPhotoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    caption: "Turquoise ocean waves crashing softly on tropical white sand.",
    category: "Nature",
    aspectRatio: 1.35,
    likesCount: 760,
    createdAt: "3 days ago",
  },
  {
    id: "img-6",
    userId: "user-333",
    userDisplayName: "Chloe Dubois",
    userPhotoURL: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    caption: "Natural studio portrait focusing on delicate expressions and shadows.",
    category: "Portraits",
    aspectRatio: 1.5, // Tall vertical portrait
    likesCount: 624,
    createdAt: "4 days ago",
  },
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Image Uploaded",
    body: "Your photo 'Misty Alpine Peaks' has been uploaded to the public gallery.",
    type: "upload",
    read: false,
    createdAt: "10m ago",
  },
  {
    id: "notif-2",
    title: "New Like Received",
    body: "Kenji Sato liked your photo 'Serene Golden Dunes'.",
    type: "like",
    read: false,
    createdAt: "1h ago",
  },
  {
    id: "notif-3",
    title: "Caption Updated",
    body: "You updated the caption for 'Emerald Coast Wave'.",
    type: "update",
    read: true,
    createdAt: "1d ago",
  },
  {
    id: "notif-4",
    title: "Welcome to GalleryApp",
    body: "Explore stunning public photos or upload your own creative captures.",
    type: "system",
    read: true,
    createdAt: "3d ago",
  },
];

const MockStoreContext = createContext(null);

export function MockStoreProvider({ children }) {
  // Mock current user (default: authenticated as Elena Vance for seamless UI testing)
  const [currentUser, setCurrentUser] = useState({
    uid: "user-123",
    email: "elena.vance@example.com",
    displayName: "Elena Vance",
    photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    bio: "Visual artist & travel photographer capturing natural light and minimalist landscapes.",
    totalUploads: 3,
    totalLikes: 1623,
  });

  const [images, setImages] = useState(INITIAL_GALLERY);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [likedMap, setLikedMap] = useState({});

  // 1. Authentication actions
  const loginUser = (email, displayName = "Demo User") => {
    setCurrentUser({
      uid: "user-123",
      email,
      displayName,
      photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      bio: "Visual artist & travel photographer.",
      totalUploads: 3,
      totalLikes: 1623,
    });
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  const updateProfileInfo = (updatedFields) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  // 2. Image CRUD actions
  const addImage = ({ imageUrl, caption, category = "Nature", aspectRatio = 1.2 }) => {
    const newImage = {
      id: `img-${Date.now()}`,
      userId: currentUser?.uid || "guest",
      userDisplayName: currentUser?.displayName || "Anonymous",
      userPhotoURL: currentUser?.photoURL || null,
      imageUrl,
      caption: caption || "No caption provided",
      category,
      aspectRatio,
      likesCount: 0,
      createdAt: "Just now",
    };

    setImages((prev) => [newImage, ...prev]);

    // Add upload notification
    addNotification({
      title: "Image Uploaded",
      body: `"${caption?.slice(0, 30) || "Your photo"}" was added to your gallery.`,
      type: "upload",
    });

    return newImage;
  };

  const updateImage = (imageId, { caption, imageUrl }) => {
    setImages((prev) =>
      prev.map((item) => {
        if (item.id === imageId) {
          return {
            ...item,
            ...(caption !== undefined && { caption }),
            ...(imageUrl && { imageUrl }),
            updatedAt: "Just now",
          };
        }
        return item;
      })
    );

    addNotification({
      title: "Image Updated",
      body: "Your image details have been successfully updated.",
      type: "update",
    });
  };

  const deleteImage = (imageId) => {
    setImages((prev) => prev.filter((item) => item.id !== imageId));

    addNotification({
      title: "Image Deleted",
      body: "The selected image was removed from the gallery.",
      type: "delete",
    });
  };

  const toggleLikeImage = (imageId) => {
    setLikedMap((prev) => {
      const isLiked = !prev[imageId];
      setImages((curr) =>
        curr.map((img) =>
          img.id === imageId
            ? { ...img, likesCount: img.likesCount + (isLiked ? 1 : -1) }
            : img
        )
      );
      return { ...prev, [imageId]: isLiked };
    });
  };

  // 3. Notification actions
  const addNotification = ({ title, body, type = "system" }) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      body,
      type,
      read: false,
      createdAt: "Just now",
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Filter images for current user
  const userImages = currentUser
    ? images.filter((img) => img.userId === currentUser.uid)
    : [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    loginUser,
    logoutUser,
    updateProfileInfo,
    images,
    userImages,
    addImage,
    updateImage,
    deleteImage,
    toggleLikeImage,
    likedMap,
    notifications,
    unreadCount,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearAllNotifications,
  };

  return (
    <MockStoreContext.Provider value={value}>
      {children}
    </MockStoreContext.Provider>
  );
}

export function useMockStore() {
  const context = useContext(MockStoreContext);
  if (!context) {
    throw new Error("useMockStore must be used within a MockStoreProvider");
  }
  return context;
}
