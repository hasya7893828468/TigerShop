import React from "react";
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OrderItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  img?: string;
}

interface Order {
  _id: string;
  createdAt: string;
  userName: string;
  status: string;
  cartItems: OrderItem[];
  grandTotal?: number;
}

interface OrderListProps {
  orders: Order[];
}

const OrderList: React.FC<OrderListProps> = ({ orders = [] }) => {
  const router = useRouter();

  const getImageUrl = (img?: string) => {
    if (!img) return "https://via.placeholder.com/150";
    if (img.startsWith("http")) return img;
    return `https://backendforworld.onrender.com${img.startsWith("/") ? img : `/${img}`}`;
  };

  if (!Array.isArray(orders)) {
    console.error("❌ Invalid orders:", orders);
    return <Text style={styles.errorText}>Error loading orders.</Text>;
  }

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <TouchableOpacity
      onPress={async () => {
        try {
          await AsyncStorage.setItem(
            "selectedProduct",
            JSON.stringify({
              _id: item._id,
              name: item.name,
              price: item.price,
              img: item.img,
            })
          );
          router.push("/Card");
        } catch (error) {
          console.error("❌ Error saving product:", error);
        }
      }}
    >
      <View style={styles.itemContainer}>
        <Image
          source={{ uri: getImageUrl(item.img) }}
          style={styles.itemImage}
          onError={(e) => console.log("Failed to load image:", e.nativeEvent.error)}
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹{item.price} x {item.quantity}</Text>
        </View>
        <Text style={styles.totalPrice}>₹{item.totalPrice}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderContainer}>
      <Text style={styles.orderTitle}>📦 Order ID: {item._id}</Text>
      <Text style={styles.orderDate}>
        📅 {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Date Unavailable"}
      </Text>
      <Text style={styles.userName}>👤 {item.userName || "Guest User"}</Text>

      <FlatList
        data={item.cartItems}
        keyExtractor={(item) => item._id || Math.random().toString()}
        renderItem={renderOrderItem}
        ListEmptyComponent={<Text style={styles.noItems}>No items in this order.</Text>}
      />

      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>
          🛍️ Total:{" "}
          <Text style={styles.totalAmount}>
            ₹{item.grandTotal ? item.grandTotal.toFixed(2) : 
              item.cartItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
          </Text>
        </Text>
      </View>

      <Text style={[styles.status, item.status === "Completed" ? styles.completed : styles.pending]}>
        Status: {item.status}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item._id || Math.random().toString()}
      renderItem={renderOrder}
      ListEmptyComponent={<Text style={styles.noOrders}>No orders found.</Text>}
    />
  );
};

const styles = StyleSheet.create({
  errorText: { textAlign: "center", color: "red", marginBottom: 10 },
  orderContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  orderTitle: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 5 },
  orderDate: { fontSize: 12, textAlign: "center", color: "#666" },
  userName: { fontSize: 14, textAlign: "center", fontWeight: "bold", color: "#333", marginTop: 5 },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 10,
    borderRadius: 5,
    marginTop: 8,
  },
  itemImage: { width: 50, height: 50, borderRadius: 5 },
  itemDetails: { flex: 1, marginLeft: 10 },
  itemName: { fontSize: 14, fontWeight: "bold" },
  itemPrice: { fontSize: 12, color: "#666" },
  totalPrice: { fontSize: 14, fontWeight: "bold", color: "green" },
  totalContainer: { backgroundColor: "#eee", padding: 10, marginTop: 10, borderRadius: 5 },
  totalText: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  totalAmount: { color: "green" },
  status: { textAlign: "center", fontWeight: "bold", marginTop: 8, padding: 5, borderRadius: 5 },
  completed: { color: "green", backgroundColor: "#e6f9e6" },
  pending: { color: "orange", backgroundColor: "#fff3cd" },
  noItems: { textAlign: "center", color: "#888", marginTop: 10 },
  noOrders: { textAlign: "center", color: "#555", marginTop: 20 },
});

export default OrderList;