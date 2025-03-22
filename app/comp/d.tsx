import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Picker,
} from "react-native";
import axios from "axios";
import { Plus, Minus, ShoppingBag, Heart } from "lucide-react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../context/AppContext";
import NavBar from "../context/NavBar";
import SearchBar from "../context/SearchBar";
import Toast from "react-native-toast-message";
import HomeCard from "./HomeCard";

const Drinks: React.FC = () => {
  const { addToCart, searchValue } = useAppContext();
  const [productList, setProductList] = useState<any[]>([]);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("default");
  const [cartTotal, setCartTotal] = useState(0);
  const router = useRouter();
  const API_URL = "http://192.168.144.2:5001/api/drinks";

  // Fetch drinks data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        const allProducts = response.data.map((p: any) => ({
          ...p,
          img: p.img.startsWith("http")
            ? p.img
            : `http://192.168.144.2:5001/${p.img.replace(/^\/+/, "")}`,
        }));
        setProductList(allProducts);
        await AsyncStorage.setItem("cachedDrinks", JSON.stringify(allProducts));
      } catch (error) {
        const cachedData = await AsyncStorage.getItem("cachedDrinks");
        if (cachedData) {
          setProductList(JSON.parse(cachedData));
        }
      }
    };
    fetchData();
  }, []);

  // Persist cart data
  useEffect(() => {
    AsyncStorage.setItem("drinksQuantities", JSON.stringify(cartQuantities));
    const total = Object.values(cartQuantities).reduce((sum, qty) => sum + qty, 0);
    setCartTotal(total);
  }, [cartQuantities]);

  // Filter & sort products
  const filteredData = useMemo(() => {
    let filtered = productList.filter((val) =>
      val?.name?.toLowerCase().includes((searchValue ?? "").toLowerCase())
    );
    if (selectedCategory !== "All") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }
    if (sortOption === "priceLow") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOption === "priceHigh") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortOption === "discount") {
      filtered.sort((a, b) =>
        ((b.price - b.Dprice) / b.price) * 100 - ((a.price - a.Dprice) / a.price) * 100
      );
    }
    return filtered;
  }, [productList, searchValue, selectedCategory, sortOption]);

  const handleWishlistToggle = async (id: string) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
    await AsyncStorage.setItem("wishlist", JSON.stringify(wishlist));
  };

  return (
    <View style={styles.container}>
      <NavBar />
      <SearchBar />
      <Picker selectedValue={selectedCategory} onValueChange={setSelectedCategory}>
        <Picker.Item label="All" value="All" />
        <Picker.Item label="Soda" value="Soda" />
        <Picker.Item label="Juice" value="Juice" />
      </Picker>
      <Picker selectedValue={sortOption} onValueChange={setSortOption}>
        <Picker.Item label="Default" value="default" />
        <Picker.Item label="Price: Low to High" value="priceLow" />
        <Picker.Item label="Price: High to Low" value="priceHigh" />
        <Picker.Item label="Best Discount" value="discount" />
      </Picker>
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item._id}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => router.push(`/comp/DrinkDetails?id=${item._id}`)}>
              <Image source={{ uri: item.img }} style={styles.image} />
            </TouchableOpacity>
            <Text style={styles.name}>{item.name}</Text>
            <TouchableOpacity onPress={() => handleWishlistToggle(item._id)}>
              <Heart size={24} color={wishlist[item._id] ? "red" : "gray"} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => addToCart(item)}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>Add to Cart</Text>
              <ShoppingBag size={18} color="white" />
            </TouchableOpacity>
          </View>
        )}
      />
      {cartTotal > 0 && (
        <TouchableOpacity style={styles.cartButton}>
          <Text style={styles.cartText}>View Cart ({cartTotal} items)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  card: { backgroundColor: "white", padding: 10, margin: 5, borderRadius: 8 },
  image: { width: 100, height: 100 },
  name: { fontSize: 14, fontWeight: "bold" },
  addButton: { flexDirection: "row", backgroundColor: "blue", padding: 10, borderRadius: 8 },
  addButtonText: { color: "white", fontWeight: "bold", marginRight: 4 },
  cartButton: { position: "absolute", bottom: 10, left: 10, right: 10, backgroundColor: "green", padding: 10, borderRadius: 8 },
  cartText: { color: "white", textAlign: "center", fontWeight: "bold" },
});

export default Drinks;
