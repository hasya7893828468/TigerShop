import React, { useEffect, useState } from "react";
import { 
  View, Text, FlatList, ActivityIndicator, Alert, Image, TouchableOpacity, StyleSheet, Linking 
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CompletedOrders: React.FC = () => {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendorId = async () => {
      const id = await AsyncStorage.getItem("vendorId");
      if (!id) {
        Alert.alert("Error", "Vendor ID not found.");
        setLoading(false);
        return;
      }
      setVendorId(id);
    };
    fetchVendorId();
  }, []);

  useEffect(() => {
    if (!vendorId) return;

    const fetchOrders = async () => {
      try {
        console.log(`Fetching completed orders for vendor: ${vendorId}`);
        const response = await axios.get(`https://backendforworld.onrender.com/api/vendor-cart/${vendorId}`);
        console.log("Fetched completed orders:", response.data);
        
        const completed = response.data.filter((order) => order.status === "Completed");
        setCompletedOrders(completed.reverse());
      } catch (error) {
        console.log("Fetch error:", error.response?.data || error.message);
        Alert.alert("Error", "Failed to fetch completed orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [vendorId]);

  const grandTotal = completedOrders.reduce((sum, order) => {
    return sum + order.cartItems.reduce((orderSum, product) => orderSum + product.price * product.quantity, 0);
  }, 0).toFixed(2);

  if (loading) return <ActivityIndicator size="large" color="#00f" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Completed Orders</Text>
      {completedOrders.length === 0 ? (
        <Text style={styles.noOrders}>No completed orders found</Text>
      ) : (
        <>
          <View style={styles.grandTotalContainer}>
            <Text style={styles.grandTotalText}>💰 Grand Total: ₹{grandTotal}</Text>
          </View>
          <FlatList
            data={completedOrders}
            keyExtractor={(order) => order._id}
            renderItem={({ item }) => {
              const orderTotal = item.cartItems.reduce((sum, product) => sum + product.price * product.quantity, 0).toFixed(2);
              return (
                <View style={styles.orderCard}>
                  <Text style={styles.orderId}>Order ID: {item._id}</Text>
                  <Text style={styles.customer}>📅 Date: {new Date(item.createdAt).toLocaleString()}</Text>
                  <Text style={styles.customer}>👤 Customer: {item.userName || "Unknown User"}</Text>
  {/* Call Button */}
  <TouchableOpacity onPress={() => item.phone && Linking.openURL(`tel:${item.phone}`)}>
    <Text style={[styles.customer, { color: "blue", textDecorationLine: "underline" }]}>
      📞 Call: {item.phone || "No phone provided"}
    </Text>
  </TouchableOpacity>                  <Text style={styles.customer}>🏠 Address: {item.address || "No address provided"}</Text>
                  {item.userLocation?.latitude && item.userLocation?.longitude && (
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(
                          `https://www.google.com/maps/search/?api=1&query=${item.userLocation.latitude},${item.userLocation.longitude}`
                        )
                      }
                      style={styles.mapButton}
                    >
                      <Text style={styles.mapButtonText}>📍 View on Google Maps</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.totalItems}>📦 Total Items: {item.cartItems.length}</Text>
                  <FlatList
                    data={item.cartItems}
                    keyExtractor={(product) => product._id}
                    renderItem={({ item }) => {
                      const imageUrl = item.img.startsWith("http") 
                        ? item.img 
                        : `https://backendforworld.onrender.com/${item.img.replace(/^\/+/, "")}`;

                      const itemTotal = (item.price * item.quantity).toFixed(2);

                      return (
                        <View style={styles.itemRow}>
                          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
                          <View style={styles.itemDetails}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemPrice}>₹{item.price} x {item.quantity}</Text>
                            <Text style={styles.itemTotal}>💰 Item Total: ₹{itemTotal}</Text>
                          </View>
                        </View>
                      );
                    }}
                  />

                  <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>🛍️ Order Total: ₹{orderTotal}</Text>
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  noOrders: { textAlign: "center", color: "gray", marginTop: 20 },
  orderCard: { backgroundColor: "white", padding: 10, marginBottom: 10, borderRadius: 10, elevation: 3 },
  orderId: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
  customer: { color: "gray", fontSize: 14 },
  totalItems: { fontSize: 14, fontWeight: "bold", marginTop: 5 },
  itemRow: { flexDirection: "row", alignItems: "center", marginTop: 5, backgroundColor: "#f1f3f5", padding: 5, borderRadius: 5 },
  image: { width: 50, height: 50, marginRight: 10, borderRadius: 5 },
  itemDetails: { flex: 1 },
  itemName: { fontWeight: "bold" },
  itemPrice: { color: "gray" },
  itemTotal: { fontWeight: "bold", color: "blue" },
  totalContainer: { backgroundColor: "#e9ecef", padding: 5, marginTop: 10, borderRadius: 5 },
  totalText: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  grandTotalContainer: { backgroundColor: "#ffc107", padding: 10, marginBottom: 10, borderRadius: 5, alignItems: "center" },
  grandTotalText: { fontSize: 18, fontWeight: "bold", color: "black" },
  mapButton: { marginTop: 5, backgroundColor: "#007bff", padding: 8, borderRadius: 5, alignItems: "center" },
  mapButtonText: { color: "white", fontSize: 14, fontWeight: "bold" }
});

export default CompletedOrders;
