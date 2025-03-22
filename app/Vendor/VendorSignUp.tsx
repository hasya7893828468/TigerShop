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

const VendorSignUp: React.FC = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ✅ Handle Vendor Signup
  const handleSignup = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      Alert.alert("⚠️ Error", "All fields are required!");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post("https://backendforworld.onrender.com/api/vendors/register", form, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("✅ Signup Response:", response.data);

      Alert.alert("✅ Signup Successful", "You can now log in!");
      
      // ✅ Store vendor details locally
      await AsyncStorage.setItem("vendorEmail", form.email);
      await AsyncStorage.setItem("vendorName", form.name);

      // ✅ Fetch & Update Vendor Location
      await updateVendorLocation(response.data.vendorId);

      router.push("/Vendor/VendorLogin"); // ✅ Redirect to Login
    } catch (error) {
      console.error("❌ Signup error:", error.response?.data || error.message);
      Alert.alert("Signup Failed", error.response?.data?.error || "Error registering vendor");
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
      <Text style={styles.title}>Vendor Signup</Text>

      <TextInput
        placeholder="Name"
        value={form.name}
        onChangeText={(value) => setForm({ ...form, name: value })}
        style={styles.input}
      />

      <TextInput
        placeholder="Email"
        value={form.email}
        onChangeText={(value) => setForm({ ...form, email: value })}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={form.password}
        onChangeText={(value) => setForm({ ...form, password: value })}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity onPress={handleSignup} style={styles.button} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/Vendor/VendorLogin")}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
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

export default VendorSignUp;
