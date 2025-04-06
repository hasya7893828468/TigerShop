import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { Trash2, UploadCloud, PlusCircle, ChevronDown, ChevronUp } from "lucide-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface Product {
  _id: string;
  name: string;
  img: string;
  price: string;
  vendorId: string;
  category: string;
  description: string;
  Dprice?: string;
  Off?: string;
}

const VendorProductManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({
    name: "",
    img: "",
    price: "",
    Dprice: "",
    Off: "",
    category: "",
    description: "",
  });
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("https://backendforworld.onrender.com/api/vendorproducts");
        setProducts(res.data);
      } catch (error) {
        console.error("Error fetching products:", error);
        Alert.alert("Error", "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleChange = (name: string, value: string) => {
    setNewProduct((prev) => ({ ...prev, [name]: value }));

    if (name === "Dprice") {
      const originalPrice = parseFloat(newProduct.price);
      const discountedPrice = parseFloat(value);
      if (!isNaN(originalPrice) && !isNaN(discountedPrice) && originalPrice > 0 && discountedPrice > 0) {
        const discount = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
        setNewProduct((prev) => ({ ...prev, Off: discount.toString() }));
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setNewProduct((prev) => ({ ...prev, img: result.assets[0].uri }));
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.img || !newProduct.price || !newProduct.category || !newProduct.description) {
      Alert.alert("Warning", "Please fill all required fields!");
      return;
    }

    const formData = new FormData();
    formData.append("name", newProduct.name);
    formData.append("price", newProduct.price);
    formData.append("category", newProduct.category);
    formData.append("description", newProduct.description);
    if (newProduct.Dprice) formData.append("Dprice", newProduct.Dprice);
    if (newProduct.Off) formData.append("Off", newProduct.Off);

    formData.append("img", {
      uri: newProduct.img,
      type: "image/jpeg",
      name: newProduct.img.split("/").pop(),
    });

    try {
      setLoading(true);
      const res = await axios.post("https://backendforworld.onrender.com/api/vendorproducts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProducts([...products, res.data.product]);
      setNewProduct({
        name: "",
        img: "",
        price: "",
        Dprice: "",
        Off: "",
        category: "",
        description: "",
      });
      setIsFormExpanded(false);
      Alert.alert("Success", "Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Error", "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await axios.delete(`https://backendforworld.onrender.com/api/vendorproducts/${id}`);
            setProducts(products.filter((product) => product._id !== id));
          } catch (error) {
            console.error("Error deleting product:", error);
            Alert.alert("Error", "Failed to delete product");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const toggleForm = () => {
    setIsFormExpanded(!isFormExpanded);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.headerText}>🛍️ Vendor Product Manager</Text>

        {/* Add Product Form */}
        <View style={styles.formContainer}>
          <TouchableOpacity onPress={toggleForm} style={styles.toggleFormButton}>
            <Text style={styles.toggleFormText}>{isFormExpanded ? "Hide Form" : "Add New Product"}</Text>
            {isFormExpanded ? <ChevronUp size={20} color="#6C63FF" /> : <ChevronDown size={20} color="#6C63FF" />}
          </TouchableOpacity>

          {isFormExpanded && (
            <View style={styles.formContent}>
              <TextInput
                placeholder="Product Name*"
                placeholderTextColor="#999"
                value={newProduct.name}
                onChangeText={(text) => handleChange("name", text)}
                style={styles.input}
              />
              <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
                {newProduct.img ? (
                  <Image source={{ uri: newProduct.img }} style={styles.selectedImage} />
                ) : (
                  <>
                    <UploadCloud size={24} color="#6C63FF" />
                    <Text style={styles.imagePickerText}>Select Product Image*</Text>
                  </>
                )}
              </TouchableOpacity>

              <TextInput
                placeholder="Price (₹)*"
                placeholderTextColor="#999"
                value={newProduct.price}
                keyboardType="numeric"
                onChangeText={(text) => handleChange("price", text)}
                style={styles.input}
              />

              <TextInput
                placeholder="Category*"
                placeholderTextColor="#999"
                value={newProduct.category}
                onChangeText={(text) => handleChange("category", text)}
                style={styles.input}
              />

              <TextInput
                placeholder="Description*"
                placeholderTextColor="#999"
                value={newProduct.description}
                onChangeText={(text) => handleChange("description", text)}
                style={styles.input}
              />

              <TextInput
                placeholder="Discounted Price (₹)"
                placeholderTextColor="#999"
                value={newProduct.Dprice}
                keyboardType="numeric"
                onChangeText={(text) => handleChange("Dprice", text)}
                style={styles.input}
              />

              {newProduct.Off && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{newProduct.Off}% OFF</Text>
                </View>
              )}

              <TouchableOpacity onPress={handleAddProduct} style={styles.addButton} disabled={loading}>
                <PlusCircle size={24} color="white" />
                <Text style={styles.addButtonText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Product List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found. Add your first product!</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.productCard}>
                <Image
                  source={{
                    uri: item.img.startsWith("http")
                      ? item.img
                      : `https://backendforworld.onrender.com${item.img.startsWith("/") ? item.img : "/" + item.img}`,
                  }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productCategory}>{item.category}</Text>
                  <Text style={styles.productDescription}>{item.description}</Text>
                  <Text style={styles.productPrice}>₹{item.price}</Text>
                  {item.Dprice && (
                    <Text style={styles.discountedPrice}>₹{item.Dprice} ({item.Off}% OFF)</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleDeleteProduct(item._id)} style={styles.deleteButton}>
                  <Trash2 size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f8f9fa",
      padding: 16,
    },
    headerText: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      color: "#333",
      marginBottom: 20,
    },
    formContainer: {
      backgroundColor: "#fff",
      borderRadius: 12,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    toggleFormButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
    },
    toggleFormText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#6C63FF",
    },
    formContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: "#eee",
    },
    input: {
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
      backgroundColor: "#f9f9f9",
    },
    imagePickerButton: {
      height: 120,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
      backgroundColor: "#f9f9f9",
      overflow: "hidden",
    },
    selectedImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    imagePickerText: {
      marginTop: 8,
      color: "#6C63FF",
      fontWeight: "500",
    },
    discountBadge: {
      alignSelf: "flex-start",
      backgroundColor: "#FFEB3B",
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      marginBottom: 12,
    },
    discountText: {
      color: "#FF9800",
      fontWeight: "bold",
      fontSize: 14,
    },
    addButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#6C63FF",
      padding: 14,
      borderRadius: 8,
    },
    addButtonText: {
      color: "white",
      fontWeight: "600",
      marginLeft: 8,
      fontSize: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      color: "#666",
      textAlign: "center",
    },
    listContent: {
      paddingBottom: 20,
    },
    drinkCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    drinkImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
    },
    drinkInfo: {
      flex: 1,
    },
    drinkName: {
      fontSize: 16,
      fontWeight: "600",
      color: "#333",
      marginBottom: 4,
    },
    priceContainer: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
    },
    originalPrice: {
      fontSize: 14,
      color: "#999",
      textDecorationLine: "line-through",
      marginRight: 8,
    },
    discountedPrice: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#6C63FF",
      marginRight: 8,
    },
    regularPrice: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#6C63FF",
    },
    drinkDiscountBadge: {
      backgroundColor: "#E8F5E9",
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 4,
    },
    drinkDiscountText: {
      color: "#4CAF50",
      fontSize: 12,
      fontWeight: "bold",
    },
    deleteButton: {
      padding: 8,
    },
  });

export default VendorProductManager;
