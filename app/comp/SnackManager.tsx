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
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Disable cropping
      aspect: undefined, // Remove aspect ratio constraint
      quality: 1, // Keep full quality
    });
  
    if (!result.canceled) {
      setNewSnack((prev) => ({ ...prev, img: result.assets[0].uri }));
    }
  };
  

  // ✅ Add new snack
  const handleAddSnack = async () => {
    if (!newSnack.name || !newSnack.img || !newSnack.price) {
      Alert.alert("⚠️ Warning", "Please fill all fields!");
      return;
    }

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
    } catch (error) {
      console.error("❌ Error adding snack:", error.response?.data || error.message);
      Alert.alert("❌ Error", "Failed to add snack. Check server logs.");
    }
  };

  // ✅ Delete a snack
 
  // ✅ Delete a snack
  const handleDeleteSnack = async (id: string) => {
    try {
      // Send delete request to backend first
      await axios.delete(`https://backendforworld.onrender.com/api/snacks/${id}`);
      
      // Remove item from the local state only if the backend deletion is successful
      setSnacks((prevSnacks) => prevSnacks.filter((snack) => snack._id !== id));
  
      console.log("✅ Snack deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting snack:", error.response?.data || error.message);
      Alert.alert("❌ Error", "Failed to delete snack. Please try again.");
    }
  };
  


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: "#f8f8f8", padding: 30 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center" }}>Mojito 🍹</Text>

        {/* ✅ Add Snack Form */}
        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 10, marginTop: 20 }}>
          <TextInput placeholder="Snack Name" value={newSnack.name} onChangeText={(text) => handleChange("name", text)} style={{ borderBottomWidth: 1, marginBottom: 10, padding: 8 }} />
          
            <TouchableOpacity onPress={pickImage} style={{ backgroundColor: "#e0e0e0", padding: 10, borderRadius: 5, alignItems: "center", marginBottom: 10 }}>
                      <UploadCloud size={24} />
                      <Text>Pick Image</Text>
                    </TouchableOpacity>

          <TextInput placeholder="Price" value={newSnack.price} keyboardType="numeric" onChangeText={(text) => handleChange("price", text)} style={{ borderBottomWidth: 1, marginBottom: 10, padding: 8 }} />
          <TextInput placeholder="Discounted Price" value={newSnack.Dprice} keyboardType="numeric" onChangeText={(text) => handleChange("Dprice", text)} style={{ borderBottomWidth: 1, marginBottom: 10, padding: 8 }} />
          
          <TouchableOpacity onPress={handleAddSnack} style={{ backgroundColor: "#007bff", padding: 10, borderRadius: 5, alignItems: "center" }}>
            <PlusCircle size={24} color="white" />
            <Text style={{ color: "white" }}>Add Snack</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ Snack List */}
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <DraggableFlatList data={snacks} keyExtractor={(item) => item._id} renderItem={({ item, drag }) => (
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
              <TouchableOpacity onPress={() => handleDeleteSnack(item._id)}>
                <Trash2 size={24} color="red" />
              </TouchableOpacity>
            </TouchableOpacity>
          )} onDragEnd={({ data }) => setSnacks([...data])} style={{ marginTop: 20 }} />
        )}
      </View>
    </GestureHandlerRootView>
  );
};

export default SnackManager;
