# 📸 Expo Gallery App

A modern, high-performance, and feature-rich Mobile Gallery Application built with **Expo SDK 54**, **React Native**, **Firebase (Auth & Firestore)**, **Cloudinary CDN**, and styled with **NativeWind (Tailwind CSS)**.

---

## 🚀 Tech Stack & Integrations

- **Framework**: [Expo](https://expo.dev/) (SDK 54) & [React Native 0.81](https://reactnative.dev/)
- **Navigation**: [Expo Router v6](https://docs.expo.dev/router/introduction/) (File-based Routing & Bottom Tabs)
- **Backend & Database**: [Firebase Auth](https://firebase.google.com/docs/auth) & [Cloud Firestore](https://firebase.google.com/docs/firestore) (Real-time data synchronization)
- **Media Storage & CDN**: [Cloudinary](https://cloudinary.com/) (Direct Unsigned Preset Uploads, Multi-format Optimization)
- **Styling**: [NativeWind (Tailwind CSS)](https://www.nativewind.dev/)
- **Hardware & Device APIs**: `expo-image-picker`, `expo-notifications`, `expo-image`, `expo-haptics`

---

## 📱 Application Screens & Descriptions

Here is the visual showcase and detailed functional breakdown of all screens in the application, using the captured screen assets from the `assets/Screens/` directory.

---

### 1. 🚀 Splash / App Loading Screen
**Image Asset:** `assets/Screens/loading.jpeg`

<div align="center">
  <img src="assets/Screens/loading.jpeg" alt="Loading Splash Screen" width="280" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
</div>

#### 📝 Short Description:
- **Urdu**: App start hone par yeh initial splash/loading screen show hoti hai jisme app ke assets, Google Fonts aur Firebase authentication session check kiya jata hai.
- **English**: The initial launch and splash screen displayed while Expo initializes, preloads essential assets and fonts, and verifies the user's persistent authentication state.

#### ⚙️ Main Actions & Features:
- Seamless splash screen display with branding icon (`expo-splash-screen`).
- Background verification of Firebase Auth session from device storage.
- Automatic routing transition to either the Main Gallery Feed or Login screen.

---

### 2. 🔐 Login & Account Access Screen
**File Route:** `app/auth/login.jsx`  
**Image Asset:** `assets/Screens/login.jpeg`

<div align="center">
  <img src="assets/Screens/login.jpeg" alt="Login Screen" width="280" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
</div>

#### 📝 Short Description:
- **Urdu**: Yeh screen existing users ko apne account mein login karne ki sahulat deti hai. Isme Email/Password login, 1-Tap Google Sign-In, aur bina account banaye "Browse as Guest" ka option shamil hai.
- **English**: The authentication gateway for registered users to log into their photography accounts using Email & Password or 1-tap Google Sign-In, along with a guest browsing option.

#### ⚙️ Main Actions & Features:
- **Email & Password Authentication**: Validates inputs with instant client-side feedback.
- **Password Visibility Toggle**: Interactive eye icon to show/hide password text.
- **Google Sign-In**: Quick 1-tap authentication via `@react-native-google-signin/google-signin` & `expo-auth-session`.
- **Browse as Guest**: Allows immediate access to browse gallery photos without immediate account creation.
- **Navigation Links**: Quick switcher to Create Account (Sign Up) screen.

---

### 3. 📝 Create Account / Sign Up Screen
**File Route:** `app/auth/signup.jsx`  
**Image Asset:** `assets/Screens/signup.jpeg`

<div align="center">
  <img src="assets/Screens/signup.jpeg" alt="Sign Up Screen" width="280" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
</div>

#### 📝 Short Description:
- **Urdu**: Naye users is screen par apna Full Name, Email aur Password darj kar ke naya account bana sakte hain. Password matching check hone ke baad Firebase Auth aur Firestore par user profile create hoti hai.
- **English**: New user onboarding screen where photographers register by entering their full name, email, and password, automatically initializing their synchronized profile on Cloud Firestore.

#### ⚙️ Main Actions & Features:
- **Comprehensive Form Validation**: Full name verification, valid email check, and password confirmation match (minimum 6 characters).
- **Firestore Profile Creation**: Automatically creates user document (`users/{uid}`) in Firestore with default metadata.
- **Google Sign-up Alternative**: Instant account creation using Google OAuth.
- **Interactive Alerts**: Visual feedback and smooth redirection to the main application upon successful signup.

---

### 4. 📤 Upload Photo & Camera Screen
**File Route:** `app/(tabs)/upload.jsx`  
**Image Asset:** `assets/Screens/upload.jpeg`

<div align="center">
  <img src="assets/Screens/upload.jpeg" alt="Upload Screen" width="280" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
</div>

#### 📝 Short Description:
- **Urdu**: Is screen se users apni mobile gallery se photo choose kar sakte hain ya direct camera se nayi photo capture kar sakte hain. Category select karne, Cloudinary format chunne aur caption likhne ke baad photo seedha Cloudinary CDN aur Firestore par upload ho jati hai.
- **English**: Allows creators to pick photos from their device library or capture them directly with the camera, select categories, choose Cloudinary image format optimization, write captions, and publish directly to Cloudinary & Firestore.

#### ⚙️ Main Actions & Features:
- **Media Picker & Camera**: Integrated with `expo-image-picker` with camera/storage permission handling.
- **Category Selection**: Multi-category chips (*Urban, Travel, Architecture, Portraits, Abstract, Nature*).
- **Cloudinary Format Optimizer**: Select optimal output format (*Auto Optimal, WEBP Modern, JPG/JPEG, PNG Lossless, AVIF, HEIC*).
- **Direct CDN Upload**: Uploads directly to Cloudinary using unsigned upload preset with real-time loading feedback.
- **Firestore Database Record**: Stores photo dimensions, aspect ratio, secure URL, user details, and timestamp.
- **Instant Notification**: Triggers native device push notification upon successful publishing.

---

### 5. 👤 User Profile & Studio Management Screen
**File Route:** `app/(tabs)/profile.jsx`  
**Image Asset:** `assets/Screens/userProfile.jpeg`

<div align="center">
  <img src="assets/Screens/userProfile.jpeg" alt="User Profile Screen" width="280" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
</div>

#### 📝 Short Description:
- **Urdu**: User ka personal "My Studio" dashboard jahan user avatar, naam, email aur statistics (Uploads, Total Likes, Status) nazar aate hain. Yahan se user apni profile update kar sakta hai aur apni uploaded photos ko Edit ya Delete kar sakta hai.
- **English**: The creator's personal "My Studio" dashboard displaying avatar initials, profile information, live statistics (Total Uploads, Total Likes, Active Status), and a grid of all uploaded photos with Edit and Delete capabilities.

#### ⚙️ Main Actions & Features:
- **Live User Uploads Grid**: Real-time Firestore subscription displaying only the active user's published photos.
- **Photo Actions**: Dedicated **Edit** button to update captions/photos and **Delete** button with instant Cloudinary + Firestore cleanup.
- **Edit Profile Modal**: Modify display name, biography, and update avatar picture (uploaded to Cloudinary).
- **Creator Metrics**: Displays total photos uploaded, received like counts, and account status.
- **Secure Log Out**: One-tap sign-out with cache reset.

---

### 6. 🔔 In-App Activity & Notifications Screen (Foreground)
**File Route:** `app/(tabs)/notifications.jsx`  
**Image Asset:** `assets/Screens/foregroundNotification.jpeg`

<div align="center">
  <img src="assets/Screens/foregroundNotification.jpeg" alt="Foreground Activity Screen" width="280" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
</div>

#### 📝 Short Description:
- **Urdu**: App ke andar ka real-time notification center jahan upload updates, photo likes aur alerts show hote hain. Isme "Mark all read", unread badges, filter tabs ("All", "Unread") aur relative time (jaise "Just now", "5m ago") shamil hain.
- **English**: Real-time in-app notification center that tracks and organizes all user alerts (successful photo uploads, likes, system updates) with unread status indicators, filter tabs, and direct photo navigation.

#### ⚙️ Main Actions & Features:
- **Real-Time Notification Feed**: Subscribes to user-specific Firestore notifications stream.
- **Filter Tabs**: Toggle between *All* and *Unread* notifications.
- **Mark All as Read**: Single-tap action to mark all unread notifications as read.
- **Relative Timestamps**: Humanized timing labels (*"Just now"*, *"5m ago"*, *"Yesterday"*).
- **Direct Interaction**: Tap notification to directly open and view the associated published photo.

---

### 7. 📱 System Push Notification (Background / Device Tray)
**Image Asset:** `assets/Screens/backgroundNotification.jpeg`

<div align="center">
  <img src="assets/Screens/backgroundNotification.jpeg" alt="Background Notification Shade" width="280" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
</div>

#### 📝 Short Description:
- **Urdu**: Yeh screen Android / iOS device ke system notification shade mein aane wali native background push notification ko dikhati hai. Jab photo publish hoti hai to app background mein hone par bhi user ko device level alert milta hai.
- **English**: Demonstrates native operating system background push notification displayed on the device notification shade, delivered via `expo-notifications` whenever photos are published or account activities occur.

#### ⚙️ Main Actions & Features:
- **Native OS Integration**: Powered by `expo-notifications` for seamless device-level notifications.
- **Background Delivery**: Notifies the user even when the app is in the background or device is locked.
- **Rich Notification Banner**: Shows the app icon, title (*"Photo Published ✅"*), caption subtitle, and delivery timestamp.

---

## 📂 Project Directory Structure

```bash
Expo-Gallery-App/
├── app/                      # Expo Router File-Based Routing
│   ├── (tabs)/               # Bottom Tab Navigator
│   │   ├── _layout.jsx       # Tabs configuration & icon styling
│   │   ├── index.jsx         # 🖼️ Gallery Feed (Home)
│   │   ├── upload.jsx        # 📤 Upload Screen
│   │   ├── notifications.jsx # 🔔 Activity & Notifications
│   │   └── profile.jsx       # 👤 User Profile (My Studio)
│   ├── auth/                 # Authentication Flow
│   │   ├── login.jsx         # 🔐 Account Access (Login)
│   │   └── signup.jsx        # 📝 Create Account (Sign Up)
│   ├── _layout.jsx           # Root Layout & Global Context Providers
│   ├── edit-image.jsx        # ✏️ Edit Photo Screen
│   └── image-detail.jsx      # 🔍 Photo Detail Screen
│
├── assets/                   # Static Assets & Screenshots
│   ├── Screens/              # 📸 Real App Screenshots
│   │   ├── loading.jpeg      # Splash / Loading Screen
│   │   ├── login.jpeg        # Login Screen
│   │   ├── signup.jpeg       # Sign Up Screen
│   │   ├── upload.jpeg       # Upload & Camera Screen
│   │   ├── userProfile.jpeg  # User Profile Screen
│   │   ├── foregroundNotification.jpeg  # In-App Notifications Screen
│   │   └── backgroundNotification.jpeg  # System Push Notification Tray
│   └── images/               # App icons & branding assets
│
├── src/                      # Source Code & Business Logic
│   ├── config/               # Firebase & Cloudinary configurations
│   ├── context/              # AuthContext & global state
│   ├── hooks/                # Custom React hooks (useGoogleAuth)
│   ├── services/             # Cloudinary, Firestore, & Notification APIs
│   ├── store/                # Initial Mock data & Fallbacks
│   └── utils/                # Image picker helpers & form validation
│
├── app.json                  # Expo Application Configuration
├── tailwind.config.js        # NativeWind / Tailwind CSS config
├── package.json              # Project dependencies & scripts
└── README.md                 # Project Documentation
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for emulator) / Xcode (for iOS) or Expo Go App on a physical device

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Tuba282/Expo-Gallery-App.git

# Navigate into the project folder
cd Expo-Gallery-App

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory with your credentials:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

### 4. Running the App
```bash
# Start the Expo development server
npx expo start

# Run on Android emulator / connected device
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Run in Web browser
npm run web
```

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
