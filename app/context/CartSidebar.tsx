import React, { useState } from "react";
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput, Modal, 
  ActivityIndicator
} from "react-native";
import { X, Plus, Minus, Trash2 } from "lucide-react-native";
import { useAppContext } from "../context/AppContext";
import { useRouter } from "expo-router";

interface CartSidebarProps {
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ onClose }) => {
  const { cart = [], updateCartQuantity, removeFromCart, handleOrderNow } = useAppContext(); 
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();
  const [orderModalVisible, setOrderModalVisible] = useState(false); // ✅ Order confirmation modal
  const [loading, setLoading] = useState(false); // ✅ Added loading state


  const totalPrice = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  const handleQuantityChange = (id: string, value: string) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity) && quantity > 0) {
      updateCartQuantity(id, quantity);
    }
  };

  const handleDecrement = (id: string, quantity: number) => {
    if (quantity === 1) {
      setSelectedItem(cart.find(item => item._id === id) || null);
      // setModalVisible(true);
    } else {
      updateCartQuantity(id, quantity - 1);
    }
  };

  const handleDeletePress = (id: string, name: string) => {
    setSelectedItem({ id, name });
    setModalVisible(true);
  };

  const confirmRemoveItem = () => {
    if (selectedItem) {
      removeFromCart(selectedItem.id);
    }
    setModalVisible(false);
    setSelectedItem(null);
  };

  const confirmOrder = async () => {
    setLoading(true); // ✅ Show spinner
    setOrderModalVisible(false);
    
    try {
      await handleOrderNow();
      router.push('/comp/MyOrders');
    } finally {
      setLoading(false); // ✅ Hide spinner
    }
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.overlayBackground} onPress={onClose} />
      
      <View style={styles.cartSidebar}>
        <TouchableOpacity style={styles.close} onPress={onClose}>
          <X size={28} color="black" />
        </TouchableOpacity>

        <Text style={styles.title}>Your Cart</Text>

        <ScrollView style={styles.cartContent}>
          {cart.length > 0 ? (
            cart.map((item) => (
              <View key={item._id} style={styles.cartItem}>
                <Image 
                  source={{ uri: item.img.startsWith("http") ? item.img : `https://backendforworld.onrender.com/${item.img.replace(/^\/+/, "")}` }}
                  style={styles.productImage}
                  resizeMode="contain"
                />

                <View style={styles.productDetails}>
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.controls}>
                    <TouchableOpacity style={styles.button} onPress={() => handleDecrement(item._id, item.quantity)}>
                      <Minus size={16} color="white" />
                    </TouchableOpacity>
                    <TextInput 
                      style={styles.quantityInput} 
                      keyboardType="numeric" 
                      value={String(item.quantity || 0)} 
                      onChangeText={(value) => handleQuantityChange(item._id, value)}
                    />
                    <TouchableOpacity style={styles.button} onPress={() => updateCartQuantity(item._id, item.quantity + 1)}>
                      <Plus size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.productPrice}>₹{(item.price * (item.quantity || 1)).toFixed(2)}</Text>
                <TouchableOpacity style={styles.removeButton} onPress={() => handleDeletePress(item._id, item.name)}>
                  <Trash2 size={18} color="white" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyCart}>Your cart is empty</Text>
          )}
        </ScrollView>

        {cart.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.totalText}>🪙 <Text style={styles.totalAmount}>₹{totalPrice.toFixed(2)}</Text></Text>
            <TouchableOpacity 
  style={[styles.orderButton, loading && styles.disabledButton]}  
  onPress={() => setOrderModalVisible(true)}
  disabled={loading}
>
  {loading ? <ActivityIndicator color="white" /> : <Text style={styles.orderButtonText}>Order Now</Text>}
</TouchableOpacity>

          </View>
        )}
      </View>
      <Modal visible={orderModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Order</Text>
            <Text style={styles.modalText}>Are you sure you want to place this order?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setOrderModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={confirmOrder}>
                <Text style={styles.confirmButtonText}>Yes, Place Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Remove {selectedItem?.name}?</Text>
            <Text style={styles.modalText}>Are you sure you want to remove this item from your cart?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>No, Keep It</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={confirmRemoveItem}>
                <Text style={styles.confirmButtonText}>Yes, Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};



const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  overlayBackground: { ...StyleSheet.absoluteFillObject },
  cartSidebar: { width: "100%", height: "80%", backgroundColor: "#fff", borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingBottom: 20 },
  close: { padding: 15, alignSelf: "flex-end" },
  title: { fontSize: 22, fontWeight: "bold", paddingHorizontal: 20, marginBottom: 10 },
  cartContent: { flex: 1, paddingHorizontal: 20 },
  cartItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f8f8f8", borderRadius: 8, padding: 10, marginBottom: 10 },
  productImage: { width: 50, height: 50 },
    disabledButton: { backgroundColor: "#a5a5a5" }, // ✅ Disabled state styling

  productDetails: { flex: 1 },
  productName: { fontSize: 16, fontWeight: "bold" },
  productPrice: { fontSize: 16, fontWeight: "bold", color: "green", marginLeft: "auto" },
  controls: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  button: { backgroundColor: "#023e8a", padding: 5, borderRadius: 5, margin: 5 },
  removeButton: { backgroundColor: "#d32f2f", padding: 5, borderRadius: 5, marginLeft: 10 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderTopWidth: 1, borderColor: "#ddd", backgroundColor: "#fff" },
  totalText: { fontSize: 28, fontWeight: "bold" },
  totalAmount: { color: "green" },
  orderButton: { backgroundColor: "#023e8a", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  orderButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  quantityInput: { width: 40, textAlign: "center", borderBottomWidth: 1, borderColor: "#ccc", marginHorizontal: 10 },



  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" },
  modalContainer: { width: 300, backgroundColor: "white", padding: 20, borderRadius: 8, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalText: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  modalActions: { flexDirection: "row", gap: 10 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5 },
  cancelButton: { backgroundColor: "#ddd" },
  confirmButton: { backgroundColor: "#d32f2f" },
  cancelButtonText: { color: "#000" },
  confirmButtonText: { color: "#fff" }
});

export default CartSidebar;
