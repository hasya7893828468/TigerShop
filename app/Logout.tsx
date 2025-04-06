import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function LogoutScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Only remove user session-related data
      await AsyncStorage.multiRemove(["authToken", "userId", "userData"]);
  
      Alert.alert("✅ Logged out", "You have been successfully logged out.");
      router.replace("/LoginScreen");
    } catch (error) {
      console.error("❌ Error during logout:", error);
    }
  };
  

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>Are you sure you want to log out?</Text>
      <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: "#d32f2f", padding: 10, borderRadius: 5 }}>
        <Text style={{ color: "#fff", fontSize: 16 }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
