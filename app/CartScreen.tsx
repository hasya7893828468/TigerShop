import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ActivityIndicator 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// API URL (Change this based on your server)
const apiUrl = "https://backendforworld.onrender.com/api";

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  img?: string;
}

const CartScreen: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Cart Data from API & Restore from AsyncStorage
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      console.log("📡 Fetching cart for user:", userId);
      const response = await axios.get(`${apiUrl}/cart/${userId}`);

      if (response.data && response.data.items) {
        setCart(response.data.items);
        await AsyncStorage.setItem("cartData", JSON.stringify(response.data.items));
      }
    } catch (error) {
      console.error("❌ Error loading cart data:", error);
      // Try to load from local storage if API fails
      const savedCart = await AsyncStorage.getItem("cartData");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } finally {
      setLoading(false);
    }
  };

  // Add to Cart Function
  const handleAddToCart = async (item: CartItem) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      console.log("📡 Adding to cart:", { userId, productId: item._id, quantity: 1 });

      const response = await axios.post(`${apiUrl}/cart`, {
        userId,
        productId: item._id,
        quantity: 1,
      });

      if (response.data) {
        const updatedCart = response.data.items;
        setCart(updatedCart);
        await AsyncStorage.setItem("cartData", JSON.stringify(updatedCart));
        Alert.alert("✅ Added to Cart", `${item.name} added successfully!`);
      }
    } catch (error) {
      console.error("❌ Error updating cart in backend:", error);
    }
  };

  // Remove from Cart Function
  const handleRemoveFromCart = async (itemId: string) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      console.log("📡 Removing item from cart:", { userId, itemId });

      const response = await axios.delete(`${apiUrl}/cart/${userId}/${itemId}`);

      if (response.data) {
        const updatedCart = cart.filter(item => item._id !== itemId);
        setCart(updatedCart);
        await AsyncStorage.setItem("cartData", JSON.stringify(updatedCart));
        Alert.alert("🗑 Removed from Cart", "Item removed successfully.");
      }
    } catch (error) {
      console.error("❌ Error removing item from cart:", error);
    }
  };

  // Clear Cart Function
  const handleClearCart = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      console.log("📡 Clearing cart for user:", userId);

      await axios.delete(`${apiUrl}/cart/${userId}`);
      setCart([]);
      await AsyncStorage.removeItem("cartData");
      Alert.alert("🗑 Cart Cleared", "All items removed from cart.");
    } catch (error) {
      console.error("❌ Error clearing cart:", error);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : cart.length === 0 ? (
        <Text style={styles.emptyCartText}>🛒 Your cart is empty.</Text>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price} x {item.quantity}</Text>
              <TouchableOpacity onPress={() => handleRemoveFromCart(item._id)} style={styles.removeButton}>
                <Text style={styles.buttonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Clear Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity onPress={handleClearCart} style={styles.clearCartButton}>
          <Text style={styles.buttonText}>Clear Cart</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  emptyCartText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
  cartItem: {
    backgroundColor: "white",
    padding: 10,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemPrice: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  removeButton: {
    backgroundColor: "red",
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
  },
  clearCartButton: {
    backgroundColor: "#ff5722",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default CartScreen;
