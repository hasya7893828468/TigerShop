import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://backendforworld.onrender.com/api/auth/login";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert("⚠️ Missing Input", "Email and password are required.");
    }

    setLoading(true);

    try {
      console.log("📡 Sending login request...");

      const response = await axios.post(API_URL, { email, password });

      console.log("✅ Response Data:", response.data);

      if (response.data.success && response.data.token) {
        await AsyncStorage.multiRemove(["authToken", "userId", "userData"]);
      
        const user = {
          id: response.data.user.id || response.data.user._id,
          name: response.data.user.name,
          email: response.data.user.email,
          phone: response.data.user.phone || "", // Store phone number
          address: response.data.user.address || "", // Store address
        };
      
        // Save data to AsyncStorage
        await AsyncStorage.setItem("authToken", response.data.token);
        await AsyncStorage.setItem("userId", user.id);
        await AsyncStorage.setItem("userData", JSON.stringify(user));
      
        Alert.alert("✅ Success", "Login successful!");
        setTimeout(() => router.replace("/Main"), 500);
      } else {
        Alert.alert("❌ Error", response.data.message || "Invalid credentials");
      }
      
    } catch (error) {
      console.error("❌ Login Error:", error);

      let errorMessage = "Something went wrong.";
      if (error.response) {
        console.log("🛑 Server Response:", error.response.data);
        errorMessage = error.response.data.message || `Error ${error.response.status}`;
      } else if (error.request) {
        console.log("📡 No response from server.");
        errorMessage = "Server unreachable. Check your network.";
      } else {
        console.log("⚠️ Unexpected error:", error.message);
      }

      Alert.alert("⚠️ Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.loginButton, loading && { opacity: 0.5 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Logging in..." : "Login"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.vendorButton}
        onPress={() => router.push("/Vendor/VendorLogin")}
      >
        <Text style={styles.buttonText}>Vendor Login</Text>
      </TouchableOpacity>

      <Text style={styles.text}>
        Don't have an account?{" "}
        <Text style={styles.link} onPress={() => router.push("/SignUp")}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f4f4f4",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#161616",
  },
  subtitle: {
    fontSize: 16,
    color: "#525252",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: "#0f62fe",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  vendorButton: {
    backgroundColor: "#393939",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
    color: "#161616",
  },
  link: {
    color: "#0f62fe",
    fontWeight: "bold",
  },
});
