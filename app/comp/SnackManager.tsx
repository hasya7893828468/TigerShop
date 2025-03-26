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
  Platform,
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import DraggableFlatList from "react-native-draggable-flatlist";
import { Trash2, UploadCloud, PlusCircle, Edit2, Move } from "lucide-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface Snack {
  _id: string;
  name: string;
  img: string;
  price: string;
  Dprice?: string;
  Off?: string;
}

const SnackManager: React.FC = () => {
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSnack, setNewSnack] = useState({
    name: "",
    img: "",
    price: "",
    Dprice: "",
    Off: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  // ✅ Fetch all snacks on mount
  useEffect(() => {
    const fetchSnacks = async () => {
      try {
        const res = await axios.get("https://backendforworld.onrender.com/api/snacks");
        console.log("✅ Fetched Snacks:", res.data);
        setSnacks(res.data);
      } catch (error) {
        console.error("❌ Error fetching snacks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSnacks();
  }, []);

  // ✅ Handle input changes
  const handleChange = (name: string, value: string) => {
    setNewSnack((prev) => ({ ...prev, [name]: value }));

    // ✅ Auto-calculate discount percentage
    if (name === "Dprice") {
      const originalPrice = parseFloat(newSnack.price);
      const discountedPrice = parseFloat(value);
      if (!isNaN(originalPrice) && !isNaN(discountedPrice) && originalPrice > 0 && discountedPrice > 0) {
        const discount = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
        setNewSnack((prev) => ({ ...prev, Off: discount.toString() }));
      }
    }
  };

  // ✅ Pick image from gallery
  const pickImage = async () => {
    setIsUploading(true);
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: undefined,
        quality: 1,
      });
    
      if (!result.canceled) {
        setNewSnack((prev) => ({ ...prev, img: result.assets[0].uri }));
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ Add new snack
  const handleAddSnack = async () => {
    if (!newSnack.name || !newSnack.img || !newSnack.price) {
      Alert.alert("⚠️ Warning", "Please fill all required fields!");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("name", newSnack.name);
    formData.append("price", newSnack.price);
    formData.append("Dprice", newSnack.Dprice || "");
    formData.append("Off", newSnack.Off || "");

    formData.append("img", {
      uri: newSnack.img,
      type: "image/jpeg",
      name: newSnack.img.split("/").pop(),
    });

    try {
      const res = await axios.post("https://backendforworld.onrender.com/api/snacks", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Snack Added:", res.data);
      setSnacks([...snacks, res.data.snack]);
      setNewSnack({ name: "", img: "", price: "", Dprice: "", Off: "" });
      Alert.alert("Success", "Snack added successfully!");
    } catch (error) {
      console.error("❌ Error adding snack:", error.response?.data || error.message);
      Alert.alert("❌ Error", "Failed to add snack. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ Delete a snack
  const handleDeleteSnack = async (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this snack?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`https://backendforworld.onrender.com/api/snacks/${id}`);
              setSnacks((prevSnacks) => prevSnacks.filter((snack) => snack._id !== id));
              Alert.alert("Success", "Snack deleted successfully!");
            } catch (error) {
              console.error("❌ Error deleting snack:", error.response?.data || error.message);
              Alert.alert("❌ Error", "Failed to delete snack. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.header}>Mojito Menu Manager 🍹</Text>
          <Text style={styles.subHeader}>Add and manage your drink items</Text>

          {/* ✅ Add Snack Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Add New Drink</Text>
            
            <TextInput
              placeholder="Drink Name*"
              placeholderTextColor="#999"
              value={newSnack.name}
              onChangeText={(text) => handleChange("name", text)}
              style={styles.input}
            />
            
            <TouchableOpacity 
              onPress={pickImage} 
              style={styles.imagePicker}
              disabled={isUploading}
            >
              {newSnack.img ? (
                <Image source={{ uri: newSnack.img }} style={styles.imagePreview} />
              ) : (
                <View style={styles.uploadArea}>
                  <UploadCloud size={24} color="#555" />
                  <Text style={styles.uploadText}>Select Drink Image*</Text>
                  {isUploading && <ActivityIndicator size="small" color="#007bff" style={{ marginLeft: 8 }} />}
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              placeholder="Original Price (₹)*"
              placeholderTextColor="#999"
              value={newSnack.price}
              keyboardType="numeric"
              onChangeText={(text) => handleChange("price", text)}
              style={styles.input}
            />
            
            <TextInput
              placeholder="Discounted Price (₹)"
              placeholderTextColor="#999"
              value={newSnack.Dprice}
              keyboardType="numeric"
              onChangeText={(text) => handleChange("Dprice", text)}
              style={styles.input}
            />
            
            {newSnack.Off && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{newSnack.Off}% OFF</Text>
              </View>
            )}

            <TouchableOpacity 
              onPress={handleAddSnack} 
              style={styles.addButton}
              disabled={isUploading}
            >
              <PlusCircle size={20} color="white" />
              <Text style={styles.addButtonText}>
                {isUploading ? "Adding..." : "Add Drink"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Snack List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Loading drinks...</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>Current Drinks ({snacks.length})</Text>
              {snacks.length === 0 ? (
                <Text style={styles.emptyText}>No drinks added yet</Text>
              ) : (
                <DraggableFlatList 
                  data={snacks} 
                  keyExtractor={(item) => item._id} 
                  renderItem={({ item, drag }) => (
                    <View style={styles.itemContainer}>
                      <Move size={20} color="#888" style={styles.dragHandle} />
                      <Image
                        source={{
                          uri: item.img.startsWith("http")
                            ? item.img
                            : `https://backendforworld.onrender.com${item.img.startsWith("/") ? item.img : "/" + item.img}`,
                        }}
                        style={styles.itemImage}
                      />
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.priceContainer}>
                          {item.Dprice ? (
                            <>
                              <Text style={styles.originalPrice}>₹{item.price}</Text>
                              <Text style={styles.discountedPrice}>₹{item.Dprice}</Text>
                              <Text style={styles.discountPercentage}>{item.Off}% OFF</Text>
                            </>
                          ) : (
                            <Text style={styles.regularPrice}>₹{item.price}</Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity 
                        onPress={() => handleDeleteSnack(item._id)}
                        style={styles.deleteButton}
                      >
                        <Trash2 size={20} color="#ff4444" />
                      </TouchableOpacity>
                    </View>
                  )} 
                  onDragEnd={({ data }) => setSnacks([...data])} 
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: "#333",
  },
  imagePicker: {
    marginBottom: 15,
  },
  uploadArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  uploadText: {
    marginLeft: 10,
    color: "#555",
  },
  imagePreview: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    resizeMode: "cover",
  },
  discountBadge: {
    backgroundColor: "#28a745",
    padding: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 15,
  },
  discountText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 10,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  listContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#444",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    padding: 20,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  dragHandle: {
    marginRight: 10,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  originalPrice: {
    fontSize: 14,
    color: "#888",
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#28a745",
    marginRight: 8,
  },
  discountPercentage: {
    fontSize: 12,
    color: "white",
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  regularPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  deleteButton: {
    padding: 8,
  },
});

export default SnackManager;