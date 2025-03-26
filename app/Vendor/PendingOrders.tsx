import React, { useEffect, useState, useCallback } from "react";
import {
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Linking,
  ScrollView,
  RefreshControl
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, FontAwesome, Ionicons, Entypo } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PendingOrders: React.FC = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorLocation, setVendorLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchVendorId = async () => {
      try {
        const id = await AsyncStorage.getItem("vendorId");
        if (!id) throw new Error("Vendor ID not found.");
        setVendorId(id);
        fetchOrders(id);
      } catch (error) {
        Alert.alert("Error", error.message);
        setLoading(false);
      }
    };
    fetchVendorId();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (vendorId) {
      fetchOrders(vendorId).then(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [vendorId]);

  const sendWhatsAppBill = (order) => {
    if (!order.phone) return Alert.alert("Error", "Customer phone number is missing");

    let message = `🧾 *Order Invoice* 🧾\n\n👤 *Customer:* ${order.userName || "Unknown"}\n📞 *Phone:* ${order.phone}\n🏠 *Address:* ${order.address || "No Address Provided"}\n\n📌 *Order Details:*\n`;

    let totalAmount = 0;

    order.cartItems.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;
      message += `\n${index + 1}. *${item.name}* - ₹${item.price} x ${item.quantity} = ₹${itemTotal}`;
    });

    message += `\n\n🛒 *Total Amount:* ₹${totalAmount.toFixed(2)}\n\n✅ *Thank you for ordering with us!*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${order.phone}?text=${encodedMessage}`;

    Linking.openURL(whatsappUrl);
  };

  const fetchOrders = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`https://backendforworld.onrender.com/api/orders/vendor/${id}`); 
      const pending = response.data.filter((order) => order.status === "Pending");
      setPendingOrders(pending);
    } catch (error) {
      console.error("❌ Fetch error:", error);
      Alert.alert("Error", "Failed to fetch pending orders");
    } finally {
      setLoading(false);
    }
  }, []);
  
  const fetchVendorLocation = async () => {
    if (!vendorId) return;

    try {
      const response = await axios.get(`https://backendforworld.onrender.com/api/vendors/vendor-location/${vendorId}`);
      if (response.data.latitude && response.data.longitude) {
        setVendorLocation({
          latitude: response.data.latitude,
          longitude: response.data.longitude,
        });
      }
    } catch (error) {
      console.error("❌ Error fetching vendor location:", error);
    }
  };

  useEffect(() => {
    fetchVendorLocation();
    const interval = setInterval(fetchVendorLocation, 10000);
    return () => clearInterval(interval);
  }, [vendorId]);

  const handleCompleteOrder = useCallback(async (orderId: string) => {
    try {
      await axios.put(`https://backendforworld.onrender.com/api/orders/complete-order/${orderId}`);
      setPendingOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId));
      Alert.alert("Success", "Order marked as completed.");
    } catch (error) {
      console.error("❌ Error completing order:", error);
      Alert.alert("Error", "Failed to complete order.");
    }
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading Orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6C63FF', '#4A42E8']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Pending Orders</Text>
        {vendorLocation && (
          <TouchableOpacity
            onPress={() => Linking.openURL(`https://www.google.com/maps?q=${vendorLocation.latitude},${vendorLocation.longitude}`)}
            style={styles.locationBadge}
          >
            <Ionicons name="location-sharp" size={16} color="white" />
            <Text style={styles.locationText}>Your Location</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {pendingOrders.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.emptyIllustration}>
            <MaterialIcons name="pending-actions" size={80} color="#6C63FF" />
          </View>
          <Text style={styles.emptyTitle}>No Pending Orders</Text>
          <Text style={styles.emptySubtitle}>When you receive new orders, they'll appear here</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <MaterialIcons name="refresh" size={24} color="#6C63FF" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={pendingOrders}
          keyExtractor={(order) => order._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const totalAmount = item.cartItems.reduce((acc, product) => acc + (product.price * product.quantity), 0);
            const orderDate = new Date(item.createdAt);
            const formattedDate = `${orderDate.toLocaleDateString()} at ${orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

            return (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdContainer}>
                    <Text style={styles.orderId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{formattedDate}</Text>
                  </View>
                  <View style={styles.orderStatus}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>PENDING</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.customerInfo}>
                  <View style={styles.customerAvatar}>
                    <FontAwesome name="user" size={20} color="#6C63FF" />
                  </View>
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>{item.userName || "Customer"}</Text>
                    <View style={styles.contactRow}>
                      <TouchableOpacity 
                        style={styles.contactButton} 
                        onPress={() => item.phone && Linking.openURL(`tel:${item.phone}`)}
                      >
                        <Entypo name="phone" size={16} color="#6C63FF" />
                        <Text style={styles.contactText}>{item.phone || "No phone"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.contactButton} 
                        onPress={() => item.phone && Linking.openURL(`sms:${item.phone}`)}
                      >
                        <MaterialIcons name="sms" size={16} color="#6C63FF" />
                        <Text style={styles.contactText}>SMS</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Delivery Address</Text>
                  <Text style={styles.addressText}>{item.address || "No address provided"}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Order Items</Text>
                  {item.cartItems.map((product) => (
                    <View key={product._id} style={styles.productItem}>
                      <Image 
                        source={{ uri: product.img.startsWith("http") ? product.img : `https://backendforworld.onrender.com/${product.img.replace(/^\/+/, "")}` }} 
                        style={styles.productImage} 
                      />
                      <View style={styles.productDetails}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productPrice}>₹{product.price} × {product.quantity}</Text>
                      </View>
                      <Text style={styles.productTotal}>₹{(product.price * product.quantity).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Order Total:</Text>
                  <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
                </View>

                <View style={styles.actionButtons}>
                  {item.userLocation?.latitude && item.userLocation?.longitude && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.locationButton]}
                      onPress={() => Linking.openURL(`https://www.google.com/maps?q=${item.userLocation.latitude},${item.userLocation.longitude}`)}
                    >
                      <Ionicons name="location-sharp" size={18} color="white" />
                      <Text style={styles.actionButtonText}>Customer Location</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.whatsappButton]}
                    onPress={() => sendWhatsAppBill(item)}
                  >
                    <FontAwesome name="whatsapp" size={18} color="white" />
                    <Text style={styles.actionButtonText}>Send Bill</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handleCompleteOrder(item._id)}
                  >
                    <MaterialIcons name="check-circle" size={18} color="white" />
                    <Text style={styles.actionButtonText}>Complete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    color: '#6C63FF',
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 10,
  },
  locationText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIllustration: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 300,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  refreshText: {
    color: '#6C63FF',
    marginLeft: 8,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  orderStatus: {
    justifyContent: 'center',
  },
  statusBadge: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: 'bold',
  },
  customerInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  contactText: {
    color: '#6C63FF',
    marginLeft: 4,
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 12,
    color: '#666',
  },
  productTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  locationButton: {
    backgroundColor: '#FF9800',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
});

export default PendingOrders;