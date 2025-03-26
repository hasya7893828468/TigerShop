import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location"; // ✅ Import Location API
import { useRouter } from "expo-router";

const VendorLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ✅ Handle Login
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("⚠️ Error", "Email and password are required!");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post("https://backendforworld.onrender.com/api/vendors/login", {
        email,
        password,
      });

      console.log("🔍 Login Response:", response.data);

      if (response.data.token && response.data.vendorId) {
        await AsyncStorage.setItem("vendorToken", response.data.token);
        await AsyncStorage.setItem("vendorId", response.data.vendorId);
        await AsyncStorage.setItem("vendorName", response.data.vendorName || "");

        console.log("✅ Vendor ID Stored:", response.data.vendorId);

        // ✅ Fetch & Update Vendor Location
        await updateVendorLocation(response.data.vendorId);

        Alert.alert("✅ Login Successful", "Welcome to Vendor Dashboard");
        router.push("/Vendor/VendorDashboard");
      } else {
        Alert.alert("❌ Login Failed", "Invalid credentials.");
      }
    } catch (error) {
      console.error("❌ Login error:", error.response?.data || error.message);
      Alert.alert("Login Failed", error.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Function to Fetch & Update Vendor Location
  const updateVendorLocation = async (vendorId: string) => {
    try {
      // ✅ Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("❌ Location permission denied");
        return;
      }

      // ✅ Get current location
      const location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      console.log("📍 Vendor Current Location:", { latitude, longitude });

      // ✅ Send location to backend
      await axios.post("https://backendforworld.onrender.com/api/vendors/update-location", {
        vendorId,
        latitude,
        longitude,
      });

      console.log("✅ Vendor Location Updated Successfully!");
    } catch (error) {
      console.error("❌ Error updating vendor location:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendor Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity onPress={handleLogin} style={styles.button} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/Vendor/VendorSignUp")}>
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/LoginScreen")}>
        <Text style={styles.linkText}>User Login</Text>
      </TouchableOpacity>
    </View>
  );
};

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  button: {
    width: "100%",
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 5,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    color: "#007BFF",
    marginTop: 15,
    fontSize: 16,
  },
});

export default VendorLogin;
