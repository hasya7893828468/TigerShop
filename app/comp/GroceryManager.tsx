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
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import DraggableFlatList from "react-native-draggable-flatlist";
import { Trash2, UploadCloud, PlusCircle } from "lucide-react-native";
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
  const [newGrocery, setNewGrocery] = useState({
    name: "",
    img: "",
    price: "",
    Dprice: "",
    Off: "",
  });

  // ✅ Fetch all groceries on mount
  useEffect(() => {
    const fetchGroceries = async () => {
      try {
        const res = await axios.get("https://backendforworld.onrender.com/api/groceries");
        console.log("✅ Fetched Groceries:", res.data);
        setGroceries(res.data);
      } catch (error) {
        console.error("❌ Error fetching groceries:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroceries();
  }, []);

  // ✅ Handle input changes
  const handleChange = (name: string, value: string) => {
    setNewGrocery((prev) => ({ ...prev, [name]: value }));

    // ✅ Auto-calculate discount percentage
    if (name === "Dprice") {
      const originalPrice = parseFloat(newGrocery.price);
      const discountedPrice = parseFloat(value);
      if (!isNaN(originalPrice) && !isNaN(discountedPrice) && originalPrice > 0 && discountedPrice > 0) {
        const discount = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
        setNewGrocery((prev) => ({ ...prev, Off: discount.toString() }));
      }
    }
  };

  // ✅ Pick image from gallery
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Disable cropping
      aspect: undefined, // Remove aspect ratio constraint
      quality: 1, // Keep full quality
    });
  
  
  

    if (!result.canceled) {
      setNewGrocery((prev) => ({ ...prev, img: result.assets[0].uri }));
    }
  };

  // ✅ Add new grocery item
  const handleAddGrocery = async () => {
    if (!newGrocery.name || !newGrocery.img || !newGrocery.price) {
      Alert.alert("⚠️ Warning", "Please fill all fields!");
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
      name: newGrocery.img.split("/").pop(),
    });

    try {
      const res = await axios.post("https://backendforworld.onrender.com/api/groceries", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Grocery Added:", res.data);
      setGroceries([...groceries, res.data.grocery]);
      setNewGrocery({ name: "", img: "", price: "", Dprice: "", Off: "" });
    } catch (error) {
      console.error("❌ Error adding grocery:", error.response?.data || error.message);
      Alert.alert("❌ Error", "Failed to add grocery. Check server logs.");
    }
  };

  // ✅ Delete a grocery item
  const handleDeleteGrocery = async (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this grocery item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`https://backendforworld.onrender.com/api/groceries/${id}`);
            setGroceries(groceries.filter((grocery) => grocery._id !== id));
          } catch (error) {
            console.error("❌ Error deleting grocery:", error.response?.data || error.message);
            Alert.alert("❌ Error", "Failed to delete grocery.");
          }
        },
      },
    ]);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: "#f8f8f8", padding: 30 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center" }}>🛒 Grocery Manager</Text>

        {/* ✅ Add Grocery Form */}
        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 10, marginTop: 20 }}>
          <TextInput placeholder="Grocery Name" value={newGrocery.name} onChangeText={(text) => handleChange("name", text)} style={{ borderBottomWidth: 1, marginBottom: 10, padding: 8 }} />

          <TouchableOpacity onPress={pickImage} style={{ backgroundColor: "#e0e0e0", padding: 10, borderRadius: 5, alignItems: "center", marginBottom: 10 }}>
            <UploadCloud size={24} />
            <Text>Pick Image</Text>
          </TouchableOpacity>

          <TextInput placeholder="Price" value={newGrocery.price} keyboardType="numeric" onChangeText={(text) => handleChange("price", text)} style={{ borderBottomWidth: 1, marginBottom: 10, padding: 8 }} />
          <TextInput placeholder="Discounted Price" value={newGrocery.Dprice} keyboardType="numeric" onChangeText={(text) => handleChange("Dprice", text)} style={{ borderBottomWidth: 1, marginBottom: 10, padding: 8 }} />

          <TouchableOpacity onPress={handleAddGrocery} style={{ backgroundColor: "#007bff", padding: 10, borderRadius: 5, alignItems: "center" }}>
            <PlusCircle size={24} color="white" />
            <Text style={{ color: "white" }}>Add Grocery</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ Grocery List */}
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <DraggableFlatList data={groceries} keyExtractor={(item) => item._id} renderItem={({ item, drag }) => (
            <TouchableOpacity onLongPress={drag} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", padding: 10, marginBottom: 10, borderRadius: 8 }}>
              <Image
                source={{
                  uri: item.img.startsWith("http")
                    ? item.img
                    : `https://backendforworld.onrender.com${item.img.startsWith("/") ? item.img : "/" + item.img}`,
                }}
                style={{ width: 60, height: 60, borderRadius: 8 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.name}</Text>
                <Text style={{ color: "gray" }}>₹{item.price} | ₹{item.Dprice} | {item.Off}% OFF</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteGrocery(item._id)}>
                <Trash2 size={24} color="red" />
              </TouchableOpacity>
            </TouchableOpacity>
          )} onDragEnd={({ data }) => setGroceries([...data])} style={{ marginTop: 20 }} />
        )}
      </View>
    </GestureHandlerRootView>
  );
};

export default GroceryManager;
