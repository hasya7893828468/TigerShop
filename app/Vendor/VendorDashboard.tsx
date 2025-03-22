import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const VendorDashboard: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendor Dashboard</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>  router.push('/Vendor/PendingOrders')}
      >
        <Text style={styles.buttonText}>View Pending Orders</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#28a745" }]}
        onPress={() =>  router.push('/Vendor/CompletedOrders')}
      >
        <Text style={styles.buttonText}>View Completed Orders</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: "80%",
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

export default VendorDashboard;
