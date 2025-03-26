import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Linking,
  ScrollView,
  RefreshControl
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, FontAwesome, Ionicons, Entypo } from '@expo/vector-icons';

const CompletedOrders: React.FC = () => {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchOrders = async () => {
    if (!vendorId) return;
    
    try {
      setRefreshing(true);
      const response = await axios.get(`https://backendforworld.onrender.com/api/vendor-cart/${vendorId}`);
      const completed = response.data.filter((order) => order.status === "Completed");
      setCompletedOrders(completed.reverse());
    } catch (error) {
      console.log("Fetch error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to fetch completed orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [vendorId]);

  const onRefresh = () => {
    fetchOrders();
  };

  const grandTotal = completedOrders.reduce((sum, order) => {
    return sum + order.cartItems.reduce((orderSum, product) => orderSum + product.price * product.quantity, 0);
  }, 0).toFixed(2);

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Completed Orders</Text>
      </View>

      {completedOrders.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.emptyIllustration}>
            <MaterialIcons name="check-circle" size={80} color="#6C63FF" />
          </View>
          <Text style={styles.emptyTitle}>No Completed Orders</Text>
          <Text style={styles.emptySubtitle}>When you complete orders, they'll appear here</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <MaterialIcons name="refresh" size={24} color="#6C63FF" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={completedOrders}
          keyExtractor={(order) => order._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.grandTotalContainer}>
              <FontAwesome name="money" size={20} color="white" />
              <Text style={styles.grandTotalText}>Grand Total: ₹{grandTotal}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const orderTotal = item.cartItems.reduce((sum, product) => sum + product.price * product.quantity, 0).toFixed(2);
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
                      <Text style={styles.statusText}>COMPLETED</Text>
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
                    </View>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Delivery Address</Text>
                  <Text style={styles.addressText}>{item.address || "No address provided"}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Order Items ({item.cartItems.length})</Text>
                  {item.cartItems.map((product) => {
                    const imageUrl = product.img.startsWith("http") 
                      ? product.img 
                      : `https://backendforworld.onrender.com/${product.img.replace(/^\/+/, "")}`;
                    
                    return (
                      <View key={product._id} style={styles.productItem}>
                        <Image source={{ uri: imageUrl }} style={styles.productImage} />
                        <View style={styles.productDetails}>
                          <Text style={styles.productName}>{product.name}</Text>
                          <Text style={styles.productPrice}>₹{product.price} × {product.quantity}</Text>
                        </View>
                        <Text style={styles.productTotal}>₹{(product.price * product.quantity).toFixed(2)}</Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Order Total:</Text>
                  <Text style={styles.totalAmount}>₹{orderTotal}</Text>
                </View>

                {item.userLocation?.latitude && item.userLocation?.longitude && (
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.userLocation.latitude},${item.userLocation.longitude}`)}
                  >
                    <Ionicons name="location-sharp" size={18} color="white" />
                    <Text style={styles.mapButtonText}>View Customer Location</Text>
                  </TouchableOpacity>
                )}
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
    backgroundColor: '#6C63FF',
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
  grandTotalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginBottom: 16,
  },
  grandTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
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
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    color: '#4CAF50',
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
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  mapButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CompletedOrders;