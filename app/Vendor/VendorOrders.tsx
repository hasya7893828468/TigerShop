import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OrderItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  img: string;
}

interface Order {
  _id: string;
  createdAt: string;
  status: string;
  userName: string;
  phone: string;
  address: string;
  userLocation?: { latitude: number; longitude: number };
  cartItems: OrderItem[];
}

interface Props {
  vendorLocation: { latitude: number; longitude: number } | null;
}

const VendorOrders: React.FC<Props> = ({ vendorLocation }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendorId = async () => {
      const id = await AsyncStorage.getItem("vendorId");
      setVendorId(id);
    };
    fetchVendorId();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!vendorId) return;

      try {
        const response = await axios.get(`https://backendforworld.onrender.com/api/vendor-cart/${vendorId}`);
        console.log("📦 Orders with Customer Details:", response.data);

        const sortedOrders = response.data.sort((a: Order, b: Order) =>
          a.status === "Pending" && b.status === "Completed" ? -1 : 1
        );

        setOrders(sortedOrders);
      } catch (error) {
        console.error("❌ Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [vendorId]);

  const handleCompleteDelivery = useCallback(async (orderId: string) => {
    try {
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order._id === orderId ? { ...order, status: "Completed" } : order))
      );

      await axios.post("https://backendforworld.onrender.com/api/vendor-cart/complete-order", { orderId });
      console.log("✅ Order Successfully Completed");
    } catch (error) {
      console.error("❌ Error completing order:", error);
    }
  }, []);

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f5f5f5" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 16 }}>
        Vendor Dashboard
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : orders.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#888" }}>No orders placed yet</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(order) => order._id}
          renderItem={({ item: order }) => (
            <View style={{ backgroundColor: "white", padding: 16, marginBottom: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center" }}>Order ID: {order._id}</Text>
              <Text style={{ textAlign: "center", color: "#555", marginBottom: 8 }}>
                📅 {new Date(order.createdAt).toLocaleString()}
              </Text>
              <Text style={{ fontWeight: "600" }}>Ordered by: {order.userName || "Unknown User"}</Text>

              <View style={{ backgroundColor: "#f0f0f0", padding: 8, borderRadius: 6, marginBottom: 8 }}>
                <Text>📞 Phone: {order.phone || "N/A"}</Text>
                <Text>🏠 Address: {order.address || "N/A"}</Text>
              </View>

              {order.cartItems.map((item) => (
                <View key={item._id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Image source={{ uri: `http://192.168.243.2:5001${item.img}` }} style={{ width: 50, height: 50, borderRadius: 6 }} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text>{item.name}</Text>
                    <Text>₹{item.price} x {item.quantity}</Text>
                  </View>
                  <Text style={{ fontWeight: "bold", color: "#28a745" }}>₹{item.totalPrice}</Text>
                </View>
              ))}

              <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "center", marginVertical: 8 }}>
                🛍️ Total: ₹{order.cartItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
              </Text>

              {vendorLocation && order.userLocation && (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps/dir/?api=1&origin=${vendorLocation.latitude},${vendorLocation.longitude}&destination=${order.userLocation.latitude},${order.userLocation.longitude}`
                    )
                  }
                  style={{ backgroundColor: "#28a745", padding: 10, borderRadius: 6, marginTop: 8 }}
                >
                  <Text style={{ textAlign: "center", color: "white" }}>🚗 Get Directions</Text>
                </TouchableOpacity>
              )}

              {order.status === "Pending" && (
                <TouchableOpacity onPress={() => handleCompleteDelivery(order._id)} style={{ backgroundColor: "#007BFF", padding: 10, borderRadius: 6, marginTop: 8 }}>
                  <Text style={{ textAlign: "center", color: "white" }}>✅ Complete Order</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

export default VendorOrders;
