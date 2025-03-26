import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../app/context/AppContext";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const ProductDetails: React.FC = () => {
  const { addToCart } = useAppContext();
  const navigation = useNavigation();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<any>(null);
  const [cardSize, setCardSize] = useState(400);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const storedProduct = await AsyncStorage.getItem("selectedProduct");
        if (storedProduct) {
          setProduct(JSON.parse(storedProduct));
        } else {
          Alert.alert("Error", "No product data found!");
        }
      } catch (error) {
        console.error("❌ Error fetching product from storage:", error);
      }
    };

    fetchProduct();
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (!product) {
    return <Text style={styles.errorText}>⚠️ No product found!</Text>;
  }

  const imageUrl = product.img
    ? product.img.startsWith("http")
      ? product.img
      : `https://backendforworld.onrender.com${product.img.startsWith("/") ? product.img : "/" + product.img}`
    : "https://via.placeholder.com/300";

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
 Toast.show({
        type: "success",
        text1: "✅ Success",
        text2: ` added to cart!`,
        visibilityTime: 2000,
        position: "bottom",
      });  };

  const handleQuantityChange = (val: string) => {
    const num = Math.max(Number(val) || 1, 1);
    setQuantity(num);
    setCardSize(num > 1 ? 300 : 400);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flexContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>🔙</Text>
          </TouchableOpacity>

          <Image source={{ uri: imageUrl }} style={styles.image} />

          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{product.price}</Text>
            {product.Dprice && <Text style={styles.strikethrough}>₹{product.Dprice}</Text>}
          </View>

          {product.Dprice && (
            <Text style={styles.offerText}>🔥 Special Offer: Save ₹{product.Dprice - product.price}!</Text>
          )}

          <View style={styles.quantityContainer}>
            <TextInput
              value={String(quantity)}
              keyboardType="numeric"
              onChangeText={handleQuantityChange}
              style={styles.quantityInput}
            />
            <TouchableOpacity onPress={handleAddToCart} style={styles.addButton}>
              <Text style={styles.addText}>🛒 Add to Cart</Text>
            </TouchableOpacity>
          </View>
                <Toast />
          
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProductDetails;

const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, backgroundColor: "#fff", padding: 20, alignItems: "center" },
  backButton: { position: "absolute", top: 20, left: 20, backgroundColor: "#023e8a", padding: 8, borderRadius: 20 },
  backText: { fontSize: 20, color: "#fff" },
  image: { width: 300, height: 400, borderRadius: 8, marginTop: 50 },
  name: { fontSize: 22, fontWeight: "bold", marginTop: 10, textAlign: "center" },
  priceContainer: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  price: { fontSize: 24, fontWeight: "bold", color: "#f59e0b" },
  strikethrough: { fontSize: 18, color: "#777", textDecorationLine: "line-through", marginLeft: 10 },
  offerText: { fontSize: 18, color: "#d32f2f", fontWeight: "bold", marginVertical: 5 },
  quantityContainer: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  quantityInput: { width: 50, borderWidth: 1, borderColor: "#ccc", padding: 5, textAlign: "center", fontSize: 18, marginRight: 10, borderRadius: 5 },
  addButton: { backgroundColor: "#023e8a", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, alignItems: "center" },
  addText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  errorText: { fontSize: 16, color: "red", textAlign: "center", marginTop: 50 },
});
