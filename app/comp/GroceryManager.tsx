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
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import DraggableFlatList from "react-native-draggable-flatlist";
import { Trash2, UploadCloud, PlusCircle, Edit2, X } from "lucide-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface Grocery {
  _id: string;
  name: string;
  img: string;
  price: string;
  Dprice?: string;
  Off?: string;
}

const GroceryManager: React.FC = () => {
  const [groceries, setGroceries] = useState<Grocery[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newGrocery, setNewGrocery] = useState({
    name: "",
    img: "",
    price: "",
    Dprice: "",
    Off: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch all groceries on mount
  useEffect(() => {
    const fetchGroceries = async () => {
      try {
        const res = await axios.get("https://backendforworld.onrender.com/api/groceries");
        setGroceries(res.data);
      } catch (error) {
        console.error("Error fetching groceries:", error);
        Alert.alert("Error", "Failed to load groceries. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchGroceries();
  }, []);

  // Handle input changes
  const handleChange = (name: string, value: string) => {
    setNewGrocery((prev) => ({ ...prev, [name]: value }));

    // Auto-calculate discount percentage
    if (name === "Dprice") {
      const originalPrice = parseFloat(newGrocery.price);
      const discountedPrice = parseFloat(value);
      if (!isNaN(originalPrice) && !isNaN(discountedPrice) && originalPrice > 0 && discountedPrice > 0) {
        const discount = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
        setNewGrocery((prev) => ({ ...prev, Off: discount.toString() }));
      }
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission required", "We need access to your photos to upload images.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewGrocery((prev) => ({ ...prev, img: result.assets[0].uri }));
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Add new grocery item
  const handleAddGrocery = async () => {
    if (!newGrocery.name || !newGrocery.img || !newGrocery.price) {
      Alert.alert("Missing Information", "Please fill all required fields!");
      return;
    }

    const formData = new FormData();
    formData.append("name", newGrocery.name);
    formData.append("price", newGrocery.price);
    formData.append("Dprice", newGrocery.Dprice || "");
    formData.append("Off", newGrocery.Off || "");

    formData.append("img", {
      uri: newGrocery.img,
      type: "image/jpeg",
      name: `grocery_${Date.now()}.jpg`,
    });

    try {
      setLoading(true);
      const res = await axios.post("https://backendforworld.onrender.com/api/groceries", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setGroceries([...groceries, res.data.grocery]);
      resetForm();
      Alert.alert("Success", "Grocery item added successfully!");
    } catch (error) {
      console.error("Error adding grocery:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to add grocery item.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a grocery item
  const handleDeleteGrocery = async (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await axios.delete(`https://backendforworld.onrender.com/api/groceries/${id}`);
            setGroceries(groceries.filter((grocery) => grocery._id !== id));
          } catch (error) {
            console.error("Error deleting grocery:", error);
            Alert.alert("Error", "Failed to delete grocery item.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setNewGrocery({ name: "", img: "", price: "", Dprice: "", Off: "" });
    setSelectedImage(null);
    setIsAdding(false);
  };

  const renderPriceInfo = (item: Grocery) => {
    if (item.Dprice && item.Off) {
      return (
        <View style={styles.priceContainer}>
          <Text style={styles.originalPrice}>₹{item.price}</Text>
          <Text style={styles.discountedPrice}>₹{item.Dprice}</Text>
          <Text style={styles.discountBadge}>{item.Off}% OFF</Text>
        </View>
      );
    }
    return <Text style={styles.regularPrice}>₹{item.price}</Text>;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🛍️ Grocery Manager</Text>
            <Text style={styles.subtitle}>Manage your grocery items</Text>
          </View>

          {!isAdding ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsAdding(true)}
            >
              <PlusCircle size={20} color="white" />
              <Text style={styles.addButtonText}>Add New Item</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Add New Grocery</Text>
                <TouchableOpacity onPress={resetForm}>
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScroll}>
                <Text style={styles.inputLabel}>Item Name*</Text>
                <TextInput
                  placeholder="e.g. Organic Apples"
                  value={newGrocery.name}
                  onChangeText={(text) => handleChange("name", text)}
                  style={styles.input}
                />

                <Text style={styles.inputLabel}>Image*</Text>
                {selectedImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: selectedImage }}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={styles.changeImageButton}
                      onPress={pickImage}
                    >
                      <Edit2 size={16} color="white" />
                      <Text style={styles.changeImageText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={pickImage}
                    style={styles.uploadButton}
                  >
                    <UploadCloud size={24} color="#4a6da7" />
                    <Text style={styles.uploadButtonText}>Select Image</Text>
                    <Text style={styles.uploadHint}>JPG or PNG, max 5MB</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.inputLabel}>Price (₹)*</Text>
                <TextInput
                  placeholder="e.g. 199"
                  value={newGrocery.price}
                  keyboardType="numeric"
                  onChangeText={(text) => handleChange("price", text)}
                  style={styles.input}
                />

                <Text style={styles.inputLabel}>Discounted Price (₹)</Text>
                <TextInput
                  placeholder="e.g. 149"
                  value={newGrocery.Dprice}
                  keyboardType="numeric"
                  onChangeText={(text) => handleChange("Dprice", text)}
                  style={styles.input}
                />

                {newGrocery.Off && (
                  <View style={styles.discountInfo}>
                    <Text style={styles.discountInfoText}>
                      Discount: {newGrocery.Off}%
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleAddGrocery}
                  style={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <PlusCircle size={20} color="white" />
                      <Text style={styles.submitButtonText}>Add Item</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Your Grocery Items</Text>
            <Text style={styles.itemCount}>{groceries.length} items</Text>
          </View>

          {loading && !isAdding ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4a6da7" />
            </View>
          ) : groceries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No grocery items found</Text>
              <Text style={styles.emptyStateSubtext}>
                Add your first item using the button above
              </Text>
            </View>
          ) : (
            <DraggableFlatList
              data={groceries}
              keyExtractor={(item) => item._id}
              renderItem={({ item, drag }) => (
                <TouchableOpacity
                  onLongPress={drag}
                  style={styles.itemContainer}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{
                      uri: item.img.startsWith("http")
                        ? item.img
                        : `https://backendforworld.onrender.com${
                            item.img.startsWith("/") ? item.img : "/" + item.img
                          }`,
                    }}
                    style={styles.itemImage}
                  />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {renderPriceInfo(item)}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteGrocery(item._id)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={20} color="#ff4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              onDragEnd={({ data }) => setGroceries([...data])}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2c3e50",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4a6da7",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  formScroll: {
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#34495e",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  uploadButtonText: {
    color: "#4a6da7",
    fontWeight: "500",
    marginTop: 8,
  },
  uploadHint: {
    fontSize: 12,
    color: "#95a5a6",
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 16,
  },
  imagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  changeImageButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  changeImageText: {
    color: "white",
    fontSize: 12,
    marginLeft: 4,
  },
  discountInfo: {
    backgroundColor: "#e3f2fd",
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  discountInfoText: {
    color: "#1976d2",
    fontSize: 14,
    textAlign: "center",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4a6da7",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  itemCount: {
    fontSize: 14,
    color: "#7f8c8d",
    backgroundColor: "#ecf0f1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#bdc3c7",
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2c3e50",
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  originalPrice: {
    fontSize: 14,
    color: "#7f8c8d",
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#27ae60",
    marginRight: 8,
  },
  discountBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
    backgroundColor: "#e74c3c",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  regularPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  deleteButton: {
    padding: 8,
  },
});

export default GroceryManager;