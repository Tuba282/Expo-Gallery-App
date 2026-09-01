import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useGoogleAuth } from "../../src/hooks/useGoogleAuth";
import { isValidEmail } from "../../src/utils/validation";

export default function SignupScreen() {
  const router = useRouter();
  const { signupWithEmail, isAuthenticated } = useAuth();
  const { signInWithGooglePrompt, isGoogleLoading, googleError } = useGoogleAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    if (isAuthenticated) {
      setTimeout(() => {
        if (mounted) {
          router.replace("/(tabs)");
        }
      }, 0);
    }
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleSignup = async () => {
    setErrorMessage("");

    if (!displayName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (!password || password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    const { error } = await signupWithEmail(
      email.trim(),
      password,
      displayName.trim()
    );
    setIsLoading(false);

    if (error) {
      if (error.includes("email-already-in-use")) {
        setErrorMessage("An account with this email already exists.");
      } else if (error.includes("weak-password")) {
        setErrorMessage("Password is too weak. Please use a stronger password.");
      } else {
        setErrorMessage(error);
      }
    } else {
      Alert.alert("Account Created 🎉", "Welcome to GalleryApp!", [
        {
          text: "Start Exploring",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMessage("");
    await signInWithGooglePrompt();
  };

  const displayError = errorMessage || googleError;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Bar */}
      <View className="px-4 py-3 flex-row justify-between items-center border-b border-slate-100">
        <TouchableOpacity
          onPress={handleGoBack}
          className="w-9 h-9 rounded-full bg-slate-50 items-center justify-center border border-slate-200"
        >
          <Ionicons name="close" size={20} color="#475569" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-slate-900">Create Account</Text>
        <View className="w-9" />

      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 24 }}
      >
        {/* Title */}
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-slate-900 tracking-tight">
            Join Gallery Studio
          </Text>
          <Text className="text-sm text-slate-500 mt-1.5 text-center">
            Showcase your photography to a community of creators.
          </Text>
        </View>

        {/* Error Message */}
        {displayError ? (
          <View className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl mb-4 flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={20} color="#e11d48" />
            <Text className="text-sm text-rose-600 font-semibold flex-1">
              {displayError}
            </Text>
          </View>
        ) : null}

        {/* Name Input */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            Full Name
          </Text>
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
            <Ionicons name="person-outline" size={20} color="#94a3b8" />
            <TextInput
              placeholder="e.g. Elena Vance"
              placeholderTextColor="#94a3b8"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                setErrorMessage("");
              }}
              className="flex-1 ml-3 text-slate-800 text-base py-0"
            />
          </View>
        </View>

        {/* Email Input */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            Email Address
          </Text>
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
            <Ionicons name="mail-outline" size={20} color="#94a3b8" />
            <TextInput
              placeholder="name@example.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrorMessage("");
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              className="flex-1 ml-3 text-slate-800 text-base py-0"
            />
          </View>
        </View>

        {/* Password Input */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            Password (Min 6 chars)
          </Text>
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMessage("");
              }}
              secureTextEntry={!showPassword}
              className="flex-1 ml-3 text-slate-800 text-base py-0"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            Confirm Password
          </Text>
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
            <Ionicons name="shield-checkmark-outline" size={20} color="#94a3b8" />
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrorMessage("");
              }}
              secureTextEntry={!showPassword}
              className="flex-1 ml-3 text-slate-800 text-base py-0"
            />
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          onPress={handleSignup}
          disabled={isLoading || isGoogleLoading}
          activeOpacity={0.85}
          className="w-full bg-indigo-600 py-4 rounded-2xl items-center justify-center shadow-xs"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-base font-bold text-white">Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-slate-200" />
          <Text className="text-xs text-slate-400 font-semibold px-3 uppercase tracking-wider">
            or
          </Text>
          <View className="flex-1 h-px bg-slate-200" />
        </View>

        {/* Google Signup Button */}
        <TouchableOpacity
          onPress={handleGoogleSignup}
          disabled={isLoading || isGoogleLoading}
          activeOpacity={0.85}
          className="w-full bg-white border border-slate-200 py-3.5 rounded-2xl flex-row items-center justify-center gap-2.5 shadow-2xs"
        >
          {isGoogleLoading ? (
            <ActivityIndicator size="small" color="#4f46e5" />
          ) : (
            <>
              <Ionicons name="logo-google" size={19} color="#ea4335" />
              <Text className="text-sm font-bold text-slate-700">
                Sign up with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Navigate to Login */}
        <View className="flex-row justify-center mt-6 pt-4 border-t border-slate-100">
          <Text className="text-sm text-slate-500">
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/auth/login")}>
            <Text className="text-sm font-bold text-indigo-600">
              Log In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
