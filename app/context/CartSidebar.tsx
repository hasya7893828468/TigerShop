import React, { useState } from "react";
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput, Modal, 
  ActivityIndicator, Dimensions, Animated, Easing
} from "react-native";
import { X, Plus, Minus, Trash2, ChevronRight } from "lucide-react-native";
import { useAppContext } from "../context/AppContext";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface CartSidebarProps {
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ onClose }) => {
  const { cart = [], updateCartQuantity, removeFromCart, handleOrderNow } = useAppContext(); 
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(width));

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, []);

  const totalPrice = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  const handleQuantityChange = (id: string, value: string) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity)) {
      updateCartQuantity(id, Math.max(1, quantity));
    }
  };

  const handleDecrement = (id: string, quantity: number) => {
    if (quantity === 1) {
      const item = cart.find(item => item._id === id);
      if (item) {
        setSelectedItem({ id, name: item.name });
        setModalVisible(true);
      }
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
    setLoading(true);
    setOrderModalVisible(false);
    
    try {
      await handleOrderNow();
      router.push('/comp/MyOrders');
    } finally {
      setLoading(false);
    }
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 300,
      easing: Easing.in(Easing.exp),
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.overlayBackground} 
        onPress={closeSidebar}
        activeOpacity={1}
      />
      
      <Animated.View 
        style={[
          styles.cartSidebar,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your Cart</Text>
          <TouchableOpacity style={styles.close} onPress={closeSidebar}>
            <X size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image 
              // source={require('../assets/empty-cart.png')} 
              style={styles.emptyImage}
            />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>Add some delicious items to get started</Text>
            <TouchableOpacity 
              style={styles.continueShoppingButton}
              onPress={closeSidebar}
            >
              <Text style={styles.continueShoppingText}>Continue Shopping</Text>
              <ChevronRight size={18} color="#023e8a" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView 
              style={styles.cartContent}
              showsVerticalScrollIndicator={false}
            >
              {cart.map((item) => (
                <View key={item._id} style={styles.cartItem}>
                  <Image 
                    source={{ 
                      uri: item.img.startsWith("http") 
                        ? item.img 
                        : `https://backendforworld.onrender.com/${item.img.replace(/^\/+/, "")}` 
                    }}
                    style={styles.productImage}
                    resizeMode="contain"
                  />

                  <View style={styles.productDetails}>
                    <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.productPrice}>₹{item.price.toFixed(2)}</Text>
                    
                    <View style={styles.controls}>
                      <TouchableOpacity 
                        style={styles.quantityButton} 
                        onPress={() => handleDecrement(item._id, item.quantity)}
                      >
                        <Minus size={16} color="#023e8a" />
                      </TouchableOpacity>
                      
                      <TextInput 
                        style={styles.quantityInput} 
                        keyboardType="numeric" 
                        value={String(item.quantity || 1)} 
                        onChangeText={(value) => handleQuantityChange(item._id, value)}
                      />
                      
                      <TouchableOpacity 
                        style={styles.quantityButton} 
                        onPress={() => updateCartQuantity(item._id, item.quantity + 1)}
                      >
                        <Plus size={16} color="#023e8a" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.itemTotalContainer}>
                    <Text style={styles.itemTotalPrice}>₹{(item.price * (item.quantity || 1)).toFixed(2)}</Text>
                    <TouchableOpacity 
                      style={styles.removeButton} 
                      onPress={() => handleDeletePress(item._id, item.name)}
                    >
                      <Trash2 size={18} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalAmount}>₹{totalPrice.toFixed(2)}</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.orderButton, loading && styles.disabledButton]}  
                onPress={() => setOrderModalVisible(true)}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#023e8a', '#0077b6']}
                  style={styles.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.orderButtonText}>Proceed to Checkout</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>

      {/* Remove Item Confirmation Modal */}
      <Modal 
        visible={modalVisible} 
        transparent 
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Remove {selectedItem?.name}?</Text>
            <Text style={styles.modalText}>Are you sure you want to remove this item from your cart?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmRemoveItem}
              >
                <Text style={styles.confirmButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Order Confirmation Modal */}
      <Modal 
        visible={orderModalVisible} 
        transparent 
        animationType="fade"
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Order</Text>
            <Text style={styles.modalText}>Are you sure you want to place this order for ₹{totalPrice.toFixed(2)}?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setOrderModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmOrder}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  cartSidebar: {
    width: "100%",
    height: "85%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  close: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  continueShoppingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#023e8a',
  },
  continueShoppingText: {
    color: '#023e8a',
    fontWeight: '600',
    marginRight: 8,
  },
  cartContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#28a745",
    marginBottom: 8,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quantityInput: {
    width: 40,
    height: 52,
    textAlign: "center",
    fontSize: 16,
    marginHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  itemTotalContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  removeButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#ffeeee',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    color: '#666',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  orderButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContainer: {
    width: width - 40,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    color: '#666',
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  confirmButton: {
    backgroundColor: "#d32f2f",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: '600',
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: '600',
  },
});

export default CartSidebar;