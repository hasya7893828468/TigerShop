import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator, // Added for loading states
} from "react-native";
import axios from "axios";
import { Plus, Minus, ShoppingBag } from "lucide-react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "./context/AppContext";
import NavBar from "./context/NavBar";
import SearchBar from "./context/SearchBar";
import HomeCard from "./comp/HomeCard";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

const IMAGE_WIDTH = width * 0.45;
const IMAGE_HEIGHT = IMAGE_WIDTH * 1.1;

interface Product {
  _id: string;
  name: string;
  price: number;
  Dprice: number;
  img?: string;
  category: string;
}

const Main: React.FC = () => {
  const { searchValue, addToCart } = useAppContext();
  const [productList, setProductList] = useState<Product[]>([]);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true); // Added loading state

  const router = useRouter();
  const apiUrl = "https://backendforworld.onrender.com/api";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Start loading
      try {
        console.log("📥 Fetching products from API...");

        const [groceriesRes, drinksRes, snacksRes] = await Promise.all([
          axios.get(`${apiUrl}/groceries`).catch(() => ({ data: [] })),
          axios.get(`${apiUrl}/drinks`).catch(() => ({ data: [] })),
          axios.get(`${apiUrl}/snacks`).catch(() => ({ data: [] })),
        ]);

        if (!groceriesRes.data || !drinksRes.data || !snacksRes.data) {
          throw new Error("Invalid data received");
        }

        const allProducts = [
          ...groceriesRes.data.map((p: Product) => ({ ...p, category: "grocery" })),
          ...drinksRes.data.map((p: Product) => ({ ...p, category: "drink" })),
          ...snacksRes.data.map((p: Product) => ({ ...p, category: "snacks" })),
        ];

        console.log("✅ Products fetched successfully:", allProducts.length);

        await AsyncStorage.setItem("allProductsData", JSON.stringify(allProducts));
        setProductList(allProducts);
      } catch (error) {
        console.error("❌ Error fetching products:", error);
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("cartData", JSON.stringify(cartQuantities));
  }, [cartQuantities]);

  const filteredData = useMemo(() => {
    return productList.filter((val) =>
      val?.name?.toLowerCase().includes((searchValue ?? "").toLowerCase())
    );
  }, [productList, searchValue]);
  

  const handleIncrement = (id: string) => {
    setCartQuantities((prev) => ({ ...prev, [id]: (prev[id] ?? 1) + 1 }));
  };

  const handleDecrement = (id: string) => {
    setCartQuantities((prev) => {
      const updatedQuantity = Math.max((prev[id] ?? 1) - 1, 1);
      return { ...prev, [id]: updatedQuantity };
    });
  };

  const handleAddToCart = async (item: Product) => {
    const quantityToAdd = cartQuantities[item._id] ?? 1;

    if (quantityToAdd > 0) {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          await axios.post(`${apiUrl}/cart`, {
            userId,
            productId: item._id,
            quantity: quantityToAdd,
          });
        }
      } catch (error) {
        console.error("❌ Error updating cart in backend:", error);
      }

      addToCart({
        ...item,
        quantity: quantityToAdd,
      });

      Toast.show({
        type: "success",
        text1: "✅ Success",
        text2: `${item.name} added to cart!`,
        visibilityTime: 2000,
        position: "bottom",
      });
    }
  };

  useEffect(() => {
    const loadCartData = async () => {
      try {
        const storedCart = await AsyncStorage.getItem("cartData");
        if (storedCart) {
          setCartQuantities(JSON.parse(storedCart));
        }

        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          const response = await axios.get(`${apiUrl}/cart/${userId}`);
          if (response.data && response.data.items) {
            const backendCart = response.data.items.reduce((acc, item) => {
              acc[item.productId] = item.quantity;
              return acc;
            }, {});
            setCartQuantities((prev) => ({ ...prev, ...backendCart }));
          }
        }
      } catch (error) {
        console.error("❌ Error loading cart data:", error);
      }
    };

    loadCartData();
  }, []);

  const calculateDiscount = (originalPrice: number, discountedPrice: number) => {
    if (originalPrice <= 0 || discountedPrice <= 0) return 0;

    // Ensure originalPrice is always the higher value
    const actualOriginal = Math.max(originalPrice, discountedPrice);
    const actualDiscounted = Math.min(originalPrice, discountedPrice);

    return Math.round(((actualOriginal - actualDiscounted) / actualOriginal) * 100);
};


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#023e8a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavBar />
      <SearchBar />
      
      <HomeCard />
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              onPress={async () => {
                await AsyncStorage.setItem("selectedProduct", JSON.stringify(item));
                router.push("Card");
              }}
            >
              <Image
                source={{
                  uri: item.img?.startsWith("http")
                    ? item.img
                    : `https://backendforworld.onrender.com/${item.img?.replace(/^\/+/, "")}`,
                }}
                style={styles.image}
                resizeMode="cover"
                onError={(e) => console.error("❌ Image Load Error:", item.img, e.nativeEvent.error)}
              />
            </TouchableOpacity>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{item.price}</Text>
              <Text style={styles.discount}>₹{item.Dprice}</Text>
            </View>
            <Text style={styles.discountBadge}>
              {calculateDiscount(item.price, item.Dprice)}% OFF
            </Text>
            <View style={styles.controls}>
              <TouchableOpacity onPress={() => handleDecrement(item._id)} style={styles.button}>
                <Minus size={18} color="white" />
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={String(cartQuantities[item._id] ?? 1)}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setCartQuantities((prev) => ({ ...prev, [item._id]: parseInt(text) || 1 }))
                }
              />
              <TouchableOpacity onPress={() => handleIncrement(item._id)} style={styles.button}>
                <Plus size={18} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => handleAddToCart(item)} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add</Text>
              <ShoppingBag size={18} color="white" />
            </TouchableOpacity>
          </View>
        )}
      />
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "Black" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "Black" },
  row: { justifyContent: "space-between" },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 1,
    marginBottom: 10,
    width: "49%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 8,
  },
  name: { fontSize: 14, fontWeight: "bold", textAlign: "center", width: "70%", marginTop:10 },
  priceContainer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  discountBadge: { fontSize: 12, color: "red", fontWeight: "bold" },
  price: { fontSize: 20, fontWeight: "bold", color: "green", marginRight: 6 },
  discount: { fontSize: 12, color: "gray", textDecorationLine: "line-through" },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  quantityInput: {
    width: 40,
    textAlign: "center",
    borderBottomWidth: 0,
    borderColor: "#ccc",
    marginHorizontal: 20,
  },
  button: {
    backgroundColor: "#023e8a",
    borderRadius: 4,
    padding: 4,
    marginHorizontal: 0,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#023e8a",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    margin: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    marginRight: 4,
  },
});

export default Main;