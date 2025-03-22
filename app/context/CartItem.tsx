import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Plus, Minus, X } from "lucide-react-native";
import { useAppContext } from "../context/AppContext";

interface CartItemProps {
  item: {
    _id: string;
    name: string;
    price: number;
    img?: string;
    quantity: number;
  };
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { cart, setCart, removeFromCart } = useAppContext();

  const increaseQuantity = () => {
    setCart((prevCart) =>
      prevCart.map((cartItem) =>
        cartItem._id === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      )
    );
  };

  const decreaseQuantity = () => {
    setCart((prevCart) =>
      prevCart.map((cartItem) =>
        cartItem._id === item._id
          ? { ...cartItem, quantity: Math.max(1, cartItem.quantity - 1) }
          : cartItem
      )
    );
  };

  return (
    <View style={styles.container}>
      {/* Product Image */}
      <Image
  source={{
    uri: `https://backendforworld.onrender.com/${item.img?.replace(/^\/+/, "") || "placeholder.png"}`,
  }}
  style={styles.image}
  resizeMode="cover"
  onError={(e) => console.error("❌ Cart Image Load Error:", e.nativeEvent.error)}
/>

      {/* Product Details */}
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.price}>Price: ₹{item.price}</Text>
        <Text style={styles.total}>
          Total: ₹{(item.price * item.quantity).toFixed(2)}
        </Text>

        {/* Quantity Controls */}
        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={decreaseQuantity} style={styles.button}>
            <Minus size={14} color="black" />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity onPress={increaseQuantity} style={styles.button}>
            <Plus size={14} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Remove Item Button */}
      <TouchableOpacity onPress={() => removeFromCart(item._id)} style={styles.removeButton}>
        <X size={20} color="red" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#ddd",
  },
  details: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  price: {
    fontSize: 12,
    color: "#666",
  },
  total: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  button: {
    backgroundColor: "#ddd",
    padding: 6,
    borderRadius: 5,
  },
  quantity: {
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: "bold",
  },
  removeButton: {
    padding: 5,
  },
});

export default CartItem;
