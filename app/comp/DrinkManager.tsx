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
  ScrollView
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import DraggableFlatList from "react-native-draggable-flatlist";
import { Trash2, UploadCloud, PlusCircle, ChevronDown, ChevronUp } from "lucide-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface Drink {
  _id: string;
  name: string;
  img: string;
  price: string;
  Dprice?: string;
  Off?: string;
}

const DrinkManager: React.FC = () => {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDrink, setNewDrink] = useState({
    name: "",
    img: "",
    price: "",
    Dprice: "",
    Off: "",
  });
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  useEffect(() => {
    const fetchDrinks = async () => {
      try {
        const res = await axios.get("https://backendforworld.onrender.com/api/drinks");
        setDrinks(res.data);
      } catch (error) {
        console.error("Error fetching drinks:", error);
        Alert.alert("Error", "Failed to fetch drinks");
      } finally {
        setLoading(false);
      }
    };
    fetchDrinks();
  }, []);

  const handleChange = (name: string, value: string) => {
    setNewDrink((prev) => ({ ...prev, [name]: value }));

    if (name === "Dprice") {
      const originalPrice = parseFloat(newDrink.price);
      const discountedPrice = parseFloat(value);
      if (!isNaN(originalPrice) && !isNaN(discountedPrice) && originalPrice > 0 && discountedPrice > 0) {
        const discount = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
        setNewDrink((prev) => ({ ...prev, Off: discount.toString() }));
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
      setNewDrink((prev) => ({ ...prev, img: result.assets[0].uri }));
    }
  };

  const handleAddDrink = async () => {
    if (!newDrink.name || !newDrink.img || !newDrink.price) {
      Alert.alert("Warning", "Please fill all required fields!");
      return;
    }

    const formData = new FormData();
    formData.append("name", newDrink.name);
    formData.append("price", newDrink.price);
    if (newDrink.Dprice) formData.append("Dprice", newDrink.Dprice);
    if (newDrink.Off) formData.append("Off", newDrink.Off);

    formData.append("img", {
      uri: newDrink.img,
      type: "image/jpeg",
      name: newDrink.img.split("/").pop(),
    });

    try {
      setLoading(true);
      const res = await axios.post("https://backendforworld.onrender.com/api/drinks", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDrinks([...drinks, res.data.drink]);
      setNewDrink({ name: "", img: "", price: "", Dprice: "", Off: "" });
      setIsFormExpanded(false);
      Alert.alert("Success", "Drink added successfully!");
    } catch (error) {
      console.error("Error adding drink:", error);
      Alert.alert("Error", "Failed to add drink");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDrink = async (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this drink?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await axios.delete(`https://backendforworld.onrender.com/api/drinks/${id}`);
            setDrinks(drinks.filter((drink) => drink._id !== id));
          } catch (error) {
            console.error("Error deleting drink:", error);
            Alert.alert("Error", "Failed to delete drink");
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
        <Text style={styles.headerText}>🍹 Drink Menu Manager</Text>
        
        {/* Add Drink Form */}
        <View style={styles.formContainer}>
          <TouchableOpacity onPress={toggleForm} style={styles.toggleFormButton}>
            <Text style={styles.toggleFormText}>{isFormExpanded ? "Hide Form" : "Add New Drink"}</Text>
            {isFormExpanded ? <ChevronUp size={20} color="#6C63FF" /> : <ChevronDown size={20} color="#6C63FF" />}
          </TouchableOpacity>
          
          {isFormExpanded && (
            <View style={styles.formContent}>
              <TextInput
                placeholder="Drink Name*"
                placeholderTextColor="#999"
                value={newDrink.name}
                onChangeText={(text) => handleChange("name", text)}
                style={styles.input}
              />
              
              <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
                {newDrink.img ? (
                  <Image source={{ uri: newDrink.img }} style={styles.selectedImage} />
                ) : (
                  <>
                    <UploadCloud size={24} color="#6C63FF" />
                    <Text style={styles.imagePickerText}>Select Drink Image*</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TextInput
                placeholder="Price (₹)*"
                placeholderTextColor="#999"
                value={newDrink.price}
                keyboardType="numeric"
                onChangeText={(text) => handleChange("price", text)}
                style={styles.input}
              />
              
              <TextInput
                placeholder="Discounted Price (₹)"
                placeholderTextColor="#999"
                value={newDrink.Dprice}
                keyboardType="numeric"
                onChangeText={(text) => handleChange("Dprice", text)}
                style={styles.input}
              />
              
              {newDrink.Off && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{newDrink.Off}% OFF</Text>
                </View>
              )}
              
              <TouchableOpacity 
                onPress={handleAddDrink} 
                style={styles.addButton}
                disabled={loading}
              >
                <PlusCircle size={24} color="white" />
                <Text style={styles.addButtonText}>Add Drink</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Drink List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
          </View>
        ) : drinks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No drinks found. Add your first drink!</Text>
          </View>
        ) : (
          <DraggableFlatList 
            data={drinks}
            keyExtractor={(item) => item._id}
            renderItem={({ item, drag }) => (
              <TouchableOpacity 
                onLongPress={drag}
                style={styles.drinkCard}
              >
                <Image
                  source={{
                    uri: item.img.startsWith("http")
                      ? item.img
                      : `https://backendforworld.onrender.com${item.img.startsWith("/") ? item.img : "/" + item.img}`,
                  }}
                  style={styles.drinkImage}
                />
                
                <View style={styles.drinkInfo}>
                  <Text style={styles.drinkName}>{item.name}</Text>
                  
                  <View style={styles.priceContainer}>
                    {item.Dprice ? (
                      <>
                        <Text style={styles.originalPrice}>₹{item.price}</Text>
                        <Text style={styles.discountedPrice}>₹{item.Dprice}</Text>
                        {item.Off && (
                          <View style={styles.drinkDiscountBadge}>
                            <Text style={styles.drinkDiscountText}>{item.Off}% OFF</Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <Text style={styles.regularPrice}>₹{item.price}</Text>
                    )}
                  </View>
                </View>
                
                <TouchableOpacity 
                  onPress={() => handleDeleteDrink(item._id)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={20} color="#FF5252" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            onDragEnd={({ data }) => setDrinks([...data])}
            contentContainerStyle={styles.listContent}
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

export default DrinkManager;