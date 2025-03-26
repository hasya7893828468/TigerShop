import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import LoginScreen from "./LoginScreen";
import MainScreen from "./Main"; // Change this to your actual main screen component

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userData");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          router.replace("/Main");
        } else {
          router.replace("/LoginScreen");
        }
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;

  return user ? <MainScreen user={user} /> : <LoginScreen />;
}
